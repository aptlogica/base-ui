import { useMemo } from 'react';
import { GanttTask } from './useGanttData';
import type { TableResponse, Column } from '../types/api.types';

interface UseGanttTaskProcessingOptions {
  tableData?: TableResponse;
}

interface ProcessedData {
  tasks: GanttTask[];
  columns: Column[];
  currentView?: any;
  viewConfig: {
    filters: any[];
    sorts: any[];
    fieldConfig: any[];
  };
  startDateField?: Column;
  endDateField?: Column;
  titleField?: Column;
  progressField?: Column;
  completionField?: Column;
  groupByField?: Column;
}

export function useGanttTaskProcessing({ tableData }: UseGanttTaskProcessingOptions): ProcessedData {
  const processedData = useMemo(() => {
    if (!tableData?.data) {
      return {
        tasks: [],
        columns: [],
        currentView: undefined,
        viewConfig: { filters: [], sorts: [], fieldConfig: [] },
        startDateField: undefined,
        endDateField: undefined,
        titleField: undefined,
        progressField: undefined,
        completionField: undefined,
        groupByField: undefined
      };
    }

    const { model, columns, records, views } = tableData.data;
    const currentView = views?.find(v => v.type === 'ganttChart') || views?.[0];
    const viewMeta = currentView?.meta || {};

    // Create a Map for O(1) column lookups instead of O(n) find() calls
    const columnMap = new Map<string, Column>();
    const columnNameMap = new Map<string, Column>();
    columns.forEach(col => {
      columnMap.set(String(col.id), col);
      if (col.column_name) {
        columnNameMap.set(col.column_name.toLowerCase(), col);
      }
    });

    // Find field columns - use Map for O(1) lookups
    let startDateField = viewMeta.start_date_field_id ?
      columnMap.get(String(viewMeta.start_date_field_id)) : undefined;
    let endDateField = viewMeta.end_date_field_id ?
      columnMap.get(String(viewMeta.end_date_field_id)) : undefined;
    const titleField = columnNameMap.get('title');

    // Auto-detect date fields if not configured (using array filter for pattern matching)
    if (!startDateField) {
      startDateField = columns.find(c =>
        c.uidt === 'Date' ||
        c.uidt === 'DateTime' ||
        c.column_name?.toLowerCase().includes('start') ||
        c.column_name?.toLowerCase().includes('date')
      );
    }
    if (!endDateField) {
      endDateField = columns.find(c =>
        (c.uidt === 'Date' || c.uidt === 'DateTime') &&
        c.id !== startDateField?.id &&
        (c.column_name?.toLowerCase().includes('end') ||
          c.column_name?.toLowerCase().includes('finish'))
      );
    }
    // Use Map for O(1) lookups
    const progressField = viewMeta.progress_field_id ?
      columnMap.get(String(viewMeta.progress_field_id)) : undefined;
    const completionField = viewMeta.completion_field_id ?
      columnMap.get(String(viewMeta.completion_field_id)) : undefined;
    const groupByField = viewMeta.groupBy?.column ?
      columnMap.get(String(viewMeta.groupBy.column)) : undefined;

    // Process tasks
    const tasks: GanttTask[] = records.map((record: any, idx: number) => {
      // Extract rowData similar to Calendar view - handle both record.data and record directly
      const rowData = record?.data || record;
      const startDateValue = rowData?.[startDateField?.column_name || ''];
      const endDateValue = rowData?.[endDateField?.column_name || ''];
      const titleValue = rowData?.[titleField?.column_name || ''] || rowData?.title || `Task ${idx + 1}`;
      const progressValue = rowData?.[progressField?.column_name || ''] || 0;
      const completionValue = completionField ? rowData?.[completionField.column_name || ''] : null;

      // Parse dates properly, handle both string and Date objects
      const parseDate = (dateValue: any): Date => {
        if (!dateValue) return new Date();
        if (dateValue instanceof Date) return dateValue;
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        }
        return new Date();
      };

      const startDate = startDateValue ? parseDate(startDateValue) : new Date();
      const endDate = endDateValue ? parseDate(endDateValue) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Check if task is completed based on completion field (date only)
      let isCompleted = false;
      if (completionField && completionField.uidt === 'date') {
        // Date field: if completion date exists, task is completed
        isCompleted = !!completionValue;
      }
      
      // Determine status and color
      const now = new Date();
      let status: 'active' | 'completed' | 'overdue' | 'pending' = 'active';
      let statusColor = `hsl(${(idx * 137.5) % 360}, 70%, 50%)`;

      // Check completion first (completed tasks are never overdue)
      if (isCompleted || progressValue >= 100) {
        status = 'completed';
        statusColor = '#10b981'; // Green for completed
      } else if (endDate < now) {
        // Only mark as overdue if not completed
        status = 'overdue';
        statusColor = '#ef4444'; // Red for overdue
      } else if (!startDateValue && !endDateValue) {
        status = 'pending';
        statusColor = '#6b7280'; // Gray for pending
      }

      const finalProgress = Number(progressValue) || 0;

      return {
        id: record.id || record._meta?.id || idx,
        name: String(titleValue),
        startDate,
        endDate,
        color: statusColor,
        progress: finalProgress,
        status,
        rawData: record, // Store full record object (with id and data) for buildInitialValuesForEdit
        rowData: rowData // Also store extracted rowData for direct access
      };
    });

    return {
      tasks,
      columns,
      currentView,
      viewConfig: {
        filters: viewMeta.filters || [],
        sorts: viewMeta.sorts || [],
        fieldConfig: viewMeta.fieldConfig || []
      },
      startDateField,
      endDateField,
      titleField,
      progressField,
      completionField,
      groupByField
    };
  }, [tableData]);

  return processedData;
}

