import { useMemo } from 'react';
import type { TableData, Column, View } from '../../../types/api.types';
import { fieldsToFilter } from '../../../types/constants';
import type { GanttTask } from './useGanttData';

interface UseGanttTaskProcessingReturn {
  tasks: GanttTask[];
  columns: Column[];
  currentView?: View;
  startDateField?: Column;
  endDateField?: Column;
  titleField?: Column;
  progressField?: Column;
  completionField?: Column;
}

export function useGanttTaskProcessing({
  tableData,
  viewId,
}: {
  tableData?: TableData;
  viewId?: string;
}): UseGanttTaskProcessingReturn {
  return useMemo(() => {
    if (!tableData) {
      return {
        tasks: [],
        columns: [],
        currentView: undefined,
        startDateField: undefined,
        endDateField: undefined,
        titleField: undefined,
        progressField: undefined,
        completionField: undefined,
      };
    }

    const { columns, records, views } = tableData;

    // Filter out unwanted columns
    const filteredColumns = columns.filter(
      (col: any) => !fieldsToFilter.includes(col.uidt)
    );

    // Find current view
    const currentView = viewId
      ? (views?.find((v: any) => String(v?.id) === String(viewId)) || undefined)
      : (views?.find((v: any) => v.type === 'ganttChart') || views?.[0]);
    const viewMeta = currentView?.meta || {};

    // Create a Map for O(1) column lookups instead of O(n) find() calls
    const columnMap = new Map<string, any>();
    const columnNameMap = new Map<string, any>();
    filteredColumns.forEach((col: any) => {
      columnMap.set(String(col.id), col);
      if (col.column_name) {
        columnNameMap.set(col.column_name.toLowerCase(), col);
      }
    });

    // Helper to get field by ID from meta (field IDs are always strings per API contract)
    const getFieldById = (fieldId: unknown): any => {
      return typeof fieldId === 'string' && fieldId ? columnMap.get(fieldId) : undefined;
    };

    // Find field columns using Map for O(1) lookups
    const startDateField = getFieldById(viewMeta.start_date_field_id);
    const endDateField = getFieldById(viewMeta.end_date_field_id);
    const titleField = getFieldById(viewMeta.title_field_id) || columnNameMap.get('title');
    const progressField = getFieldById(viewMeta.progress_field_id);
    const completionField = getFieldById(viewMeta.completion_field_id);

    // Process tasks from records
    const tasks: GanttTask[] = records.map((record: any, idx: number) => {
      const startDateValue = record?.[startDateField?.column_name || ''];
      const endDateValue = record?.[endDateField?.column_name || ''];
      const titleValue = record?.[titleField?.column_name || ''] || record?.title;
      const progressValue = record?.[progressField?.column_name || ''] || 0;

      // Parse dates
      const startDate = startDateValue ? new Date(startDateValue) : new Date();
      const endDate = endDateValue ? new Date(endDateValue) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Determine status
      const now = new Date();
      let status: 'active' | 'completed' | 'overdue' | 'pending' = 'active';
      if (endDate < now) {
        status = 'overdue';
      } else if (progressValue >= 100) {
        status = 'completed';
      } else if (!startDateValue && !endDateValue) {
        status = 'pending';
      }

      return {
        id: record?.id || idx,
        name: titleValue === undefined || titleValue === null || String(titleValue).trim() === '' ? '-' : String(titleValue),
        startDate,
        endDate,
        color: `hsl(${(idx * 137.5) % 360}, 70%, 50%)`,
        progress: Number(progressValue) || 0,
        status,
        rawData: record,
      };
    });

    return {
      tasks,
      columns: filteredColumns,
      currentView,
      startDateField,
      endDateField,
      titleField,
      progressField,
      completionField,
    };
  }, [tableData, viewId]);
}

