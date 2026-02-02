import React, { useMemo, useCallback } from "react";
import CreateRecordModal from "../../../components/modals/CreateRecordModal";
import EditRecordModal from "../../../components/modals/EditRecordModal";
import CalendarHeader from "./CalendarHeader";
import EventsSidebar from "./EventsSidebar";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import YearView from "./YearView";
import ExportModal from "./ExportModal";
import { CalendarEvent } from "../hooks/useCalendarData";
import { GridColumn } from "../../GridViewPlugin/types/grid.types";
import { applyFilters } from "../../../utils/filterUtils";
import { buildInitialValuesForEdit } from "../../../utils/initialValues";
import { utcISOToZoned } from '../../../utils/dateUtils';
import { useBaseAccess } from '../../../hooks/useBaseAccess';
// Custom hooks
import { useCalendarViewConfig } from "../hooks/useCalendarViewConfig";
import { useCalendarModals } from "../hooks/useCalendarModals";
import { useCalendarDateNavigation } from "../hooks/useCalendarDateNavigation";

interface CalendarViewProps {
  tableData: {
    model: any;
    columns: any[];
    records: any[];
    views?: any[];
  };
  viewId?: string;
  onRefresh: () => void;
  actions: {
    addRow: any;
    insertRowData: any;
    deleteRecord: any;
    updateField: any;
    updateView: any;
    updateEvent: any;
    createEvent: any;
    deleteEvent: any;
    changeDateField: any;
    updateViewConfig: any;
  };
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tableData,
  viewId,
  onRefresh,
  actions,
}) => {
  // Extract base ID for permission checks
  const baseId = useMemo(() => String(tableData?.model?.base_id ?? ''), [tableData?.model?.base_id]);

  // Check permissions for read-only access
  const { isBaseReadOnly, canCreateRecord, canDeleteRecord, canUpdateRecord } = useBaseAccess(baseId || undefined);

  // Safe handlers pattern: Check read-only once at top level
  const isReadOnly = isBaseReadOnly();

  // Process raw tableData into calendar-specific data
  const { uiColumns, uiData, uiTableId, events, dateField, dateFields, view } = useMemo(() => {
    const model = tableData.model || ({} as any);
    const rawColumns = Array.isArray(tableData.columns) ? tableData.columns : [];
    const rawRecords = Array.isArray(tableData.records) ? tableData.records : [];
    const views = Array.isArray(tableData.views) ? tableData.views : [];
    // Optimized with Map for O(1) lookup instead of O(n) find()
    const viewsMap = new Map(views.map(v => [String(v?.id), v]));
    const currentView = viewId ? viewsMap.get(String(viewId)) || null : null;

    // Process columns (simplified version of useCalendarData logic)
    let cols = rawColumns
      .slice()
      .sort((a: any, b: any) => (a?.order_index ?? 0) - (b?.order_index ?? 0))
      .map((apiColumn: any) => ({
        id: apiColumn.id ? String(apiColumn.id) : undefined,
        key: String(apiColumn.column_name ?? apiColumn.title ?? apiColumn.id ?? ''),
        column_name: apiColumn.column_name,
        title: String(apiColumn.title ?? apiColumn.column_name ?? ''),
        type: apiColumn.uidt || 'text',
        uidt: apiColumn.uidt,
        width: 175,
        position: apiColumn.order_index ?? 0,
        order_index: apiColumn.order_index ?? 0,
        isSystem: Boolean(apiColumn.system) && String(apiColumn.column_name ?? '').toLowerCase() !== 'title',
        system: Boolean(apiColumn.system) && String(apiColumn.column_name ?? '').toLowerCase() !== 'title',
        hidden: Boolean(apiColumn.hidden),
        is_hidden: Boolean(apiColumn.is_hidden),
        meta: apiColumn.meta,
      }));

    // Apply view-specific field configuration if available
    // Optimized with Map for O(1) field config lookups instead of O(n) find() calls
    if (currentView?.meta?.fieldConfig && Array.isArray(currentView.meta.fieldConfig)) {
      const fieldConfigMap = new Map(
        currentView.meta.fieldConfig.map((fc: any) => [String(fc.id), fc])
      );

      cols = cols.map(col => {
        const fieldConfig = fieldConfigMap.get(String(col.id)) as any;
        if (fieldConfig) {
          return {
            ...col,
            hidden: Boolean(fieldConfig.isHidden),
            is_hidden: Boolean(fieldConfig.isHidden),
            position: fieldConfig.position ?? col.position
          };
        }
        return col;
      }).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }

    // Find date fields
    // Optimized with Set for O(1) lookups instead of O(n) includes() calls
    const dateFieldTypesSet = new Set(['datetime', 'date', 'createdtime', 'lastmodifiedtime']);
    const availableDateFields = cols.filter(col => {
      const colType = col.type?.toLowerCase() || '';
      const colUidt = col.uidt?.toLowerCase() || '';
      return dateFieldTypesSet.has(colType) || dateFieldTypesSet.has(colUidt);
    });

    // Create Map for O(1) lookups
    const availableDateFieldsMap = new Map(availableDateFields.map(f => [String(f.id), f]));

    // Determine current date field
    const selectedDateFieldId = currentView?.meta?.date_field_id;
    let currentDateField = selectedDateFieldId
      ? availableDateFieldsMap.get(String(selectedDateFieldId))
      : null;

    if (!currentDateField && availableDateFields.length > 0) {
      currentDateField = availableDateFields.find(f =>
        f.key?.toLowerCase().includes('start_date') ||
        f.key?.toLowerCase().includes('created_at')
      ) || availableDateFields[0];
    }

    // Ensure currentDateField is exactly the same object as in availableDateFields
    if (currentDateField) {
      currentDateField = availableDateFieldsMap.get(String(currentDateField.id)) || currentDateField;
    }

    // Process events from raw records (filtering and sorting will be applied later)
    const processedEvents: CalendarEvent[] = currentDateField ? rawRecords.map((record: any, idx: number): CalendarEvent | null => {
      const rowData = record?.data || record;
      const dateValue = rowData?.[currentDateField.key || ''] || record?.[currentDateField.key || ''];

      if (!dateValue) return null;

      // Check if this is a datetime field (not just date)
      const isDateTimeField = currentDateField.type === 'datetime' ||
        currentDateField.uidt === 'datetime' ||
        currentDateField.type === 'createdtime' ||
        currentDateField.uidt === 'createdtime' ||
        currentDateField.type === 'lastmodifiedtime' ||
        currentDateField.uidt === 'lastmodifiedtime';

      // Check if this is a date field (not datetime)
      const isDateField = currentDateField.type === 'date' || currentDateField.uidt === 'date';

      // Parse date value - handle both UTC (with Z) and local time
      const dateStr = String(dateValue);

      let eventDate: string;
      let eventDateTime: Date;

      if (dateStr.endsWith('Z')) {
        // UTC format
        if (isDateTimeField) {
          // For datetime fields, convert UTC to configured timezone (like DateTime component)
          try {
            // Get timezone from field meta/config (same logic as DateTime component)
            const fieldMeta = currentDateField.meta || {};
            const tz = fieldMeta.timeZoneLabel || fieldMeta.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Convert UTC ISO to configured timezone (returns "yyyy-MM-dd HH:mm" format)
            const zonedDateTime = utcISOToZoned(dateStr, tz);
            const [datePart, timePart = '00:00'] = zonedDateTime.split(' ');

            eventDate = datePart; // Use the timezone-converted date

            // Parse the timezone-converted datetime
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours = 0, minutes = 0] = timePart.split(':').map(Number);
            eventDateTime = new Date(year, month - 1, day, hours, minutes);
          } catch (error) {
            console.warn(error);
            // Fallback to original logic if conversion fails
            const isoStr = dateStr.replace('Z', '');
            const [datePart, timePart = '00:00'] = isoStr.split('T');
            eventDate = datePart;
            const [year, month, day] = datePart.split('-').map(Number);
            const [hours = 0, minutes = 0] = timePart.split(':').map(Number);
            eventDateTime = new Date(year, month - 1, day, hours, minutes);
          }
        } else {
          // For date fields, use UTC date directly (no time conversion needed)
          const isoStr = dateStr.replace('Z', '');
          const [datePart] = isoStr.split('T');
          eventDate = datePart;
          const [year, month, day] = datePart.split('-').map(Number);
          eventDateTime = new Date(year, month - 1, day, 0, 0);
        }
      } else {
        // Local time format - extract date part and parse as local
        const [datePart, timePart = ''] = dateStr.split('T');
        eventDate = datePart;

        // Parse as local datetime
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return null;

        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const hours = timePart ? Number.parseInt(timePart.split(':')[0]) : 0;
        const minutes = timePart ? Number.parseInt(timePart.split(':')[1]) : 0;

        eventDateTime = new Date(year, month, day, hours, minutes);
      }

      if (Number.isNaN(eventDateTime.getTime())) return null;

      return {
        id: record?.id ?? idx,
        title: rowData?.title || rowData?.Title || rowData?.name || '-',
        date: eventDate,
        dateTime: eventDateTime,
        data: rowData,
        color: '#3b82f6',
        isDateField: Boolean(isDateField), // Add this flag to help components decide how to display time
      };
    }).filter((event): event is CalendarEvent => event !== null) : [];



    return {
      uiColumns: cols,
      uiData: rawRecords,
      uiTableId: String(model?.id ?? ''),
      view: currentView,
      dateField: currentDateField,
      dateFields: availableDateFields,
      events: processedEvents,
    };
  }, [tableData, viewId]);

  const {
    updateView,
    deleteEvent,
    changeDateField,
    updateViewConfig,
  } = actions;

  // Date navigation hook
  const {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    currentView,
    setCurrentView,
    sidebarCollapsed,
    toggleSidebar,
  } = useCalendarDateNavigation();

  // Wrapper to convert string to CalendarViewType for onViewChange
  const handleViewChange = useCallback((view: string) => {
    setCurrentView(view as 'month' | 'week' | 'day' | 'year');
  }, [setCurrentView]);

  // View configuration hook
  const {
    filters,
    sorts,
    draftFilter,
    localFieldConfig,
    visibleColumns,
    handleRealTimeFilter,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
    handleFieldToggle,
  } = useCalendarViewConfig({
    view,
    columns: uiColumns,
    updateView,
    updateViewConfig,
    isReadOnly,
  });

  // Modal management hook
  const {
    modalState,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenExportModal,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseExportModal,
    handleCreateSuccess,
    handleEditSuccess,
    handleDeleteRecordFromModal,
  } = useCalendarModals();


  // Apply filters to events
  // Includes both saved filters and draft/real-time filter for preview
  const filteredEvents = useMemo(() => {
    const hasFilters = Array.isArray(filters) && filters.length > 0;
    const hasDraftFilter = draftFilter !== null;

    if (!hasFilters && !hasDraftFilter) return events;

    // Combine saved filters with draft filter (if any) for real-time preview
    const allFilters = hasDraftFilter
      ? [...filters, draftFilter]
      : filters;

    // Convert events to records format for filtering
    const records = events.map(event => ({
      data: event.data,
      id: event.id
    }));

    // Apply filters using the standard filter utility (includes both saved and draft)
    const filteredRecords = applyFilters(records, allFilters, visibleColumns);

    // Convert back to events
    // Optimized with Set for O(1) lookups instead of O(n) some() calls
    const filteredRecordIdsSet = new Set(filteredRecords.map(r => String(r.id)));
    return events.filter(event =>
      filteredRecordIdsSet.has(String(event.id))
    );
  }, [events, filters, draftFilter, visibleColumns]);

  // Don't apply sorting here - let EventsSidebar handle it for sidebar events
  // Calendar views display events in their natural order
  const sortedEvents = filteredEvents;

  // Wrapper for handleDeleteRecordFromModal to pass required params
  const handleDeleteFromModal = useCallback(async (recordId: string) => {
    await handleDeleteRecordFromModal(recordId, deleteEvent, tableData, onRefresh);
  }, [handleDeleteRecordFromModal, deleteEvent, tableData, onRefresh]);

  const onDuplicateCard = useCallback(() => {
    // Duplicate functionality - can be implemented later
  }, []);

  const getEditInitialValues = useCallback((): Record<string, any> => {
    if (!modalState.edit.selectedEvent) return {};

    // Find the original record from uiData
    // Optimized with Map for O(1) lookup instead of O(n) find()
    const uiDataMap = new Map(
      uiData.map(record => [String(record.id || record._meta?.id), record])
    );
    const matchedRecord = uiDataMap.get(String(modalState.edit?.selectedEvent?.id));

    if (!matchedRecord) return modalState.edit.selectedEvent.data || {};

    const initialValues = buildInitialValuesForEdit({
      record: matchedRecord,
      recordId: String(modalState.edit.selectedEvent.id),
      columns: uiColumns as any,
    });

    // Filter out empty string values to prevent unnecessary API calls
    const filteredValues: Record<string, any> = {};
    Object.entries(initialValues).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        filteredValues[key] = value;
      }
    });

    return filteredValues;
  }, [modalState.edit.selectedEvent, uiData, uiColumns]);

  // Handle date field change (similar to Kanban's group by change)
  const handleGroupByChange = useCallback(async (column: GridColumn | undefined) => {
    if (!column) return;

    try {
      // Update the date field in the view meta
      await changeDateField(column.id || column.key);
      // Force refresh to update the UI immediately
      onRefresh();
    } catch (error) {
      console.error('Failed to change date field:', error);
    }
  }, [changeDateField, onRefresh]);

  const getCreateInitialValues = useCallback(() => {
    const initialValues: any = {};

    // Include default values from field meta
    visibleColumns.forEach(col => {
      if (col.meta?.defaultValue !== undefined) {
        initialValues[col.key] = col.meta.defaultValue;
      }
    });

    if (modalState.create.selectedDate && dateField) {
      // Fix timezone issue by creating a local date string
      const date = modalState.create.selectedDate;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      // For date fields, use YYYY-MM-DD format
      // For datetime fields, send without timezone to store as local time in database
      // The backend will handle timezone conversion
      const dateValue = (dateField.type === 'date' || dateField.uidt === 'Date')
        ? `${year}-${month}-${day}`
        : `${year}-${month}-${day}T${hours}:${minutes}:00`;

      // Set initial value using both field.id and field.name for compatibility
      if (dateField.id) {
        initialValues[dateField.id] = dateValue;
      }
      if (dateField.key) {
        initialValues[dateField.key] = dateValue;
      }
      if (dateField.column_name) {
        initialValues[dateField.column_name] = dateValue;
      }
    }

    return initialValues;
  }, [modalState.create.selectedDate, dateField, visibleColumns]);


  const onCreateRecordHandler =
    !isReadOnly && canCreateRecord()
      ? () => handleOpenCreateModal(currentDate)
      : undefined;

  const onEventClickHandler =
    !isReadOnly && canUpdateRecord()
      ? handleOpenEditModal
      : undefined;

  const onDateClickHandler =
    !isReadOnly && canCreateRecord()
      ? handleOpenCreateModal
      : undefined;

  const onDeleteHandler =
    !isReadOnly && canDeleteRecord()
      ? handleDeleteFromModal
      : undefined;


  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        currentView={currentView}
        onViewChange={handleViewChange}
        dateField={dateField}
        onExport={handleOpenExportModal}
        onCreateRecord={onCreateRecordHandler}
        onToggleSidebar={toggleSidebar}
        columns={visibleColumns}
        fieldConfig={localFieldConfig}
        filters={filters}
        onFieldToggle={isReadOnly ? undefined : handleFieldToggle}
        onAddFilter={handleAddFilter}
        onRemoveFilter={handleRemoveFilter}
        onUpdateFilter={handleUpdateFilter}
        onRealTimeFilter={handleRealTimeFilter}
        onGroupByChange={isReadOnly ? undefined : handleGroupByChange}
        tableId={uiTableId}
        events={sortedEvents.map(e => ({ ...e, id: String(e.id) }))}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Views - Full Width */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentView === "month" && (
            <MonthView
              currentDate={currentDate}
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              onDateClick={onDateClickHandler}
              onDateSelect={setSelectedDate}
              columns={visibleColumns}
              fieldConfig={localFieldConfig}
            />
          )}
          {currentView === "week" && (
            <WeekView
              currentDate={currentDate}
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              onDateClick={onDateClickHandler}
              onDateSelect={setSelectedDate}
              dateField={dateField}
              columns={visibleColumns}
              fieldConfig={localFieldConfig}
            />
          )}
          {currentView === "day" && (
            <DayView
              currentDate={currentDate}
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              onDateClick={onDateClickHandler }
              onDateSelect={setSelectedDate}
              dateField={dateField}
              columns={visibleColumns}
              fieldConfig={localFieldConfig}
            />
          )}
          {currentView === "year" && (
            <YearView
              currentDate={currentDate}
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              onDateClick={onDateClickHandler}
              onDateSelect={setSelectedDate}
              onViewChange={handleViewChange}
            />
          )}
        </div>

        {/* Right Sidebar - Events List */}
        {!sidebarCollapsed && (
          <div className="w-80 border-l flex flex-col bg-card">
            <EventsSidebar
              events={sortedEvents}
              onEventClick={onEventClickHandler}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
              currentView={currentView}
              currentDate={currentDate}
              columns={visibleColumns}
              sorts={sorts}
              onCreateRecord={onCreateRecordHandler}
              onSortChange={handleSortChange}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {modalState.create.isOpen && (
        <CreateRecordModal
          isOpen={modalState.create.isOpen}
          onClose={handleCloseCreateModal}
          table={{ id: uiTableId, title: tableData?.model?.title || 'Calendar' } as any}
          fields={uiColumns as any}
          title="New Record"
          submitLabel="Save Record"
          initialValues={getCreateInitialValues()}
          onSuccess={() => handleCreateSuccess(onRefresh)}
        />
      )}

      {modalState.edit.isOpen && modalState.edit.selectedEvent && (
        <EditRecordModal
          isOpen={modalState.edit.isOpen}
          onClose={handleCloseEditModal}
          table={{ id: uiTableId, title: tableData?.model?.title || 'Calendar' } as any}
          fields={uiColumns as any}
          recordId={String(modalState.edit.selectedEvent.id)}
          title="Edit Record"
          submitLabel="Update record"
          onSuccess={() => handleEditSuccess(onRefresh)}
          onDelete={onDeleteHandler}
          onDuplicate={isReadOnly ? undefined : onDuplicateCard}
          initialValues={getEditInitialValues()}
        />
      )}

      {modalState.export.isOpen && (
        <ExportModal
          isOpen={modalState.export.isOpen}
          onClose={handleCloseExportModal}
          events={events}
          dateField={dateField}
        />
      )}
    </div>
  );
};

export default CalendarView;