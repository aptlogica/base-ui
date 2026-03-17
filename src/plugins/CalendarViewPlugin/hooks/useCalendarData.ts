// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMemo } from 'react';
import { useTable, useAddRow, useDeleteRecord, useInsertRowData, useUpdateField, useUpdateView } from '../../../hooks/useApi';
import type { TableData } from '../../../types/api.types';
import { parseApiColumnMeta } from '../../../components/shared/table/tableUtils';
import { normalizeFieldType } from '../../../utils/fieldType';
import type { GridColumn, GridFieldType } from '../../GridViewPlugin/types/grid.types';
import { utcISOToZoned } from '../../../utils/dateUtils';

// Data layer for Calendar: fetch + CRUD orchestration; keeps UI components clean
export interface UseCalendarDataOptions {
  tableId: string;
  viewId?: string;
}

export interface CalendarEvent {
  id: string | number;
  title: string;
  date: string;
  dateTime: Date;
  data: any;
  color: string;
  isDateField?: boolean; // Flag to indicate if this event is from a date field (not datetime)
}

export interface UseCalendarDataReturn {
  // Data (consistent with other view patterns)
  tableData?: TableData;
  uiColumns: GridColumn[];
  uiData: any[]; // Calendar events as processed UI data
  uiTableId: string;
  uiBaseId: string;
  isLoading: boolean;
  error: unknown;

  // Calendar-specific data
  events: CalendarEvent[]; // Processed calendar events
  dateField?: GridColumn; // Current date field based on view config
  dateFields: GridColumn[]; // Available date fields for selection
  view: any; // Current view object

  // CRUD ops (thin wrappers around shared hooks)
  refresh: () => Promise<void>;
  addRow: ReturnType<typeof useAddRow>;
  insertRowData: ReturnType<typeof useInsertRowData>;
  deleteRecord: ReturnType<typeof useDeleteRecord>;
  updateField: ReturnType<typeof useUpdateField>;
  updateView: ReturnType<typeof useUpdateView>;

  // Calendar-specific business operations
  updateEvent: (eventId: string, updates: Record<string, any>) => Promise<void>;
  createEvent: (initialValues: Record<string, any>) => Promise<string>;
  deleteEvent: (eventId: string) => Promise<void>;
  changeDateField: (fieldId: string) => Promise<void>;
  updateViewConfig: (viewId: string, updates: any) => Promise<void>;
}

export function useCalendarData({ tableId, viewId }: UseCalendarDataOptions): UseCalendarDataReturn {
  const tableQuery = useTable(String(tableId));

  const getTimeZone = (fieldMeta: Record<string, any> | undefined) =>
    fieldMeta?.timeZoneLabel ||
    fieldMeta?.timeZone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const buildLocalDate = (datePart: string, timePart: string) => {
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours = 0, minutes = 0] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  const convertDateValue = (
    dateValue: unknown,
    fieldMeta: Record<string, any> | undefined,
    isDateTimeField: boolean,
    isDateField: boolean
  ): { eventDate: string; eventDateTime: Date } | null => {
    if (!dateValue) return null;
    const toDateString = (value: unknown) => {
      if (typeof value === 'string') return value;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'number') return new Date(value).toISOString();
      return null;
    };
    const dateStr = toDateString(dateValue);
    if (!dateStr) return null;
    const tz = getTimeZone(fieldMeta);

    const parseZoned = (utcIso: string) => {
      const zonedDateTime = utcISOToZoned(utcIso, tz);
      const [datePart, timePart = '00:00'] = zonedDateTime.split(' ');
      return { datePart, timePart };
    };

    if (dateStr.endsWith('Z')) {
      if (isDateTimeField) {
        try {
          const { datePart, timePart } = parseZoned(dateStr);
          return { eventDate: datePart, eventDateTime: buildLocalDate(datePart, timePart) };
        } catch (error) {
          console.warn(error);
        }
      }

      const [datePart] = dateStr.replace('Z', '').split('T');
      return { eventDate: datePart, eventDateTime: buildLocalDate(datePart, '00:00') };
    }

    const [datePart, timePart = '00:00'] = dateStr.split('T');
    if (isDateTimeField) {
      try {
        const { datePart: zonedDate, timePart: zonedTime } = parseZoned(`${datePart}T${timePart}Z`);
        return { eventDate: zonedDate, eventDateTime: buildLocalDate(zonedDate, zonedTime) };
      } catch (error) {
        console.warn(error);
      }
    }

    if (isDateField) {
      return { eventDate: datePart, eventDateTime: buildLocalDate(datePart, '00:00') };
    }

    return { eventDate: datePart, eventDateTime: buildLocalDate(datePart, timePart) };
  };

  // SDK returns a StandardResponse with `data`; unwrap it to our canonical TableData
  const tableData = useMemo(() => {
    const raw = tableQuery.data as any;
    if (!raw) return undefined;
    return (raw.data ?? raw) as TableData;
  }, [tableQuery.data]);

  // Process raw table data for Calendar consumption
  const processedData = useMemo(() => {
    if (!tableData) {
      return {
        uiColumns: [],
        uiData: [],
        uiTableId: '',
        uiBaseId: '',
        view: null,
        events: [],
        dateField: undefined,
        dateFields: []
      };
    }

    const model = tableData.model || {};
    const columns = tableData.columns || [];
    const records = tableData.records || [];
    const views = tableData.views || [];

    // Find current view - optimized with Map for O(1) lookup
    const viewsMap = new Map(views.map((v: any) => [String(v?.id), v]));
    const currentView = viewId ? viewsMap.get(String(viewId)) || null : null;
    const viewMeta = currentView?.meta || {};

    // Process columns with GridView compatibility
    const uiColumns: GridColumn[] = columns.map((col: any, index: number) => ({
      id: col.id,
      key: col.column_name || col.key,
      title: col.title,
      type: normalizeFieldType(col.uidt || col.type) as GridFieldType,
      uidt: col.uidt,
      position: col.order_index ?? index,
      hidden: col.hidden || col.deleted || false,
      isHidden: col.hidden || col.deleted || false,
      system: col.system || col.virtual || false,
      meta: parseApiColumnMeta(col.meta || {}),
      config: col.meta || {},
      options: (col.meta?.options || []).map((opt: string) => ({ label: opt, value: opt }))
    }));

    // Find date fields
    // Optimized with Set for O(1) lookups instead of O(n) includes() calls
    const dateFieldTypesSet = new Set(['datetime', 'date', 'createdtime', 'lastmodifiedtime']);
    const availableDateFields = uiColumns.filter(col => {
      const colType = col.type?.toLowerCase() || '';
      const colUidt = col.uidt?.toLowerCase() || '';
      return dateFieldTypesSet.has(colType) || dateFieldTypesSet.has(colUidt);
    });

    // Create Maps for O(1) lookups
    const uiColumnsMap = new Map(uiColumns.map(col => [String(col.id), col]));

    // Determine current date field
    const selectedDateFieldId = viewMeta.date_field_id;
    let currentDateField: GridColumn | undefined = selectedDateFieldId
      ? uiColumnsMap.get(String(selectedDateFieldId))
      : undefined;

    if (!currentDateField && availableDateFields.length > 0) {
      currentDateField = availableDateFields.find(f =>
        f.key?.toLowerCase().includes('start_date') ||
        f.key?.toLowerCase().includes('created_at')
      ) || availableDateFields[0];
    }

    // Process events
    const processedEvents: CalendarEvent[] = currentDateField ? records.reduce((acc: CalendarEvent[], record: any, idx: number) => {
      const rowData = record?.data || record;
      const dateValue = rowData?.[currentDateField.key || ''] || record?.[currentDateField.key || ''];

      if (!dateValue) return acc;

      const isDateTimeField = currentDateField.type === 'datetime' ||
        currentDateField.uidt === 'datetime' ||
        currentDateField.uidt === 'createdtime' ||
        currentDateField.uidt === 'lastmodifiedtime';

      const isDateField = currentDateField.type === 'date' || currentDateField.uidt === 'date';

      const converted = convertDateValue(
        dateValue,
        currentDateField.meta || {},
        isDateTimeField,
        isDateField
      );

      if (!converted) return acc;
      const { eventDate, eventDateTime } = converted;

      if (Number.isNaN(eventDateTime.getTime())) return acc;

      // Generate a consistent color based on the record ID
      const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
      ];
      const colorIndex = (record?.id ?? idx) % colors.length;

      acc.push({
        id: record?.id ?? idx,
        title: rowData?.title || rowData?.Title || rowData?.name || `Record ${record?.id || idx}`,
        date: eventDate,
        dateTime: eventDateTime,
        data: rowData,
        color: colors[colorIndex],
        isDateField: Boolean(isDateField),
      });

      return acc;
    }, []) : [];

    return {
      uiColumns,
      uiData: records,
      uiTableId: String(model?.id ?? ''),
      uiBaseId: String(model?.base_id ?? ''),
      view: currentView,
      dateField: currentDateField,
      dateFields: availableDateFields,
      events: processedEvents,
    };
  }, [tableData, viewId]);

  // CRUD operations
  const addRow = useAddRow();
  const insertRowData = useInsertRowData();
  const deleteRecord = useDeleteRecord();
  const updateField = useUpdateField();
  const updateView = useUpdateView();

  // Calendar-specific business operations
  const updateEvent = async (_eventId: string, updates: Record<string, any>) => {
    // Update event using the standard updateField hook
    await Promise.all(
      Object.entries(updates).map(([fieldKey, value]) =>
        updateField.mutateAsync({
          fieldId: fieldKey,
          updatedValue: value
        })
      )
    );
  };

  const createEvent = async (_initialValues: Record<string, any>) => {
    // Create event using the standard addRow hook
    const result = await addRow.mutateAsync({
      model_id: String(tableId)
    });
    return String(result?.id || result);
  };

  const deleteEvent = async (eventId: string) => {
    // Delete event using the standard deleteRecord hook
    await deleteRecord.mutateAsync({
      model_id: String(tableId),
      row_id: Number(eventId)
    });
  };

  const changeDateField = async (fieldId: string) => {
    if (!viewId) return;

    // Optimized with Map for O(1) lookup instead of O(n) find()
    const viewsMap = new Map((tableData?.views || []).map((v: any) => [String(v?.id), v]));
    const currentView = viewsMap.get(String(viewId));
    const currentMeta = currentView?.meta ?? {};

    try {
      await updateView.mutateAsync({
        viewId: String(viewId),
        view: {
          meta: {
            ...currentMeta,
            date_field_id: fieldId
          }
        }
      });

      // Force refresh the table data to get updated view information
      await tableQuery.refetch();
    } catch (error) {
      console.error('Failed to update date field:', error);
      throw error;
    }
  };

  const updateViewConfig = async (viewId: string, updates: any) => {
    // Get current view to merge updates properly
    // Optimized with Map for O(1) lookup instead of O(n) find()
    const viewsMap = new Map((tableData?.views || []).map((v: any) => [String(v?.id), v]));
    const currentView = viewsMap.get(String(viewId));
    if (!currentView) {
      throw new Error('View not found');
    }

    // Merge updates into meta (handles fieldConfig, filters, sorts, etc.)
    const finalMeta = {
      ...currentView.meta,
      ...updates
    };

    await updateView.mutateAsync({
      viewId: String(viewId),
      view: {
        meta: finalMeta
      }
    });
  };

  return {
    // Data
    tableData,
    ...processedData,
    isLoading: tableQuery.isLoading,
    error: tableQuery.error,
    // CRUD operations
    refresh: async () => { await tableQuery.refetch(); },
    addRow,
    insertRowData,
    deleteRecord,
    updateField,
    updateView,

    // Calendar-specific operations
    updateEvent,
    createEvent,
    deleteEvent,
    changeDateField,
    updateViewConfig,
  };
}
