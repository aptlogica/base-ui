import { useMemo } from 'react';
import { useTable, useAddRow, useDeleteRecord, useInsertRowData, useUpdateField, useUpdateView } from '../../../hooks/useApi';
import type { TableResponse, TableData, Column, View } from '../types/api.types';
import { fieldsToFilter } from '../../../types/constants';

// Gantt-specific types
export interface GanttTask {
  id: string | number;
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
  progress: number;
  status: 'active' | 'completed' | 'overdue' | 'pending';
  rawData: any;
}

export interface GanttViewConfig {
  startDateFieldId?: string;
  endDateFieldId?: string;
  titleFieldId?: string;
  progressFieldId?: string;
  groupByFieldId?: string;
  filters: any[];
  sorts: any[];
  fieldConfig: any[];
}

export interface UseGanttDataOptions {
  tableId: string;
  viewId?: string;
}

export interface UseGanttDataReturn {
  // Data
  tableData?: TableResponse;
  tasks: GanttTask[];
  columns: Column[];
  viewConfig: GanttViewConfig;
  currentView?: View;
  
  // Field mappings
  startDateField?: Column;
  endDateField?: Column;
  titleField?: Column;
  progressField?: Column;
  groupByField?: Column;
  
  // State
  isLoading: boolean;
  error: any;
  
  // Actions
  refresh: () => void;
  addRow: any;
  insertRowData: any;
  deleteRecord: any;
  updateField: any;
  updateView: any;
  moveTask: (taskId: string, newStartDate: Date, newEndDate: Date) => Promise<void>;
  createTask: (taskData: Partial<GanttTask>) => Promise<string>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  updateViewConfig: (viewId: string, updates: any) => Promise<void>;
}

export const useGanttData = ({ tableId, viewId }: UseGanttDataOptions): UseGanttDataReturn => {
  // Fetch table data
  const { data: tableData, isLoading, error, refetch } = useTable(tableId);
  
  // CRUD operations
  const addRow = useAddRow();
  const insertRowData = useInsertRowData();
  const deleteRecord = useDeleteRecord();
  const updateField = useUpdateField();
  const updateViewMutation = useUpdateView();

  // Process data into Gantt-ready format
  const processedData = useMemo(() => {
    if (!tableData?.data) {
      return {
        tasks: [],
        columns: [],
        viewConfig: {
          filters: [],
          sorts: [],
          fieldConfig: []
        },
        currentView: undefined,
        startDateField: undefined,
        endDateField: undefined,
        titleField: undefined,
        progressField: undefined,
        groupByField: undefined
      };
    }

    const { model, columns, records, views } = tableData.data;

    // Filter out unwanted columns
    const filteredColumns = columns.filter(
      (col: any) => !fieldsToFilter.includes(col.uidt)
    );
    // Find current view
    const currentView = views?.find(v => v.id === viewId) || views?.find(v => v.type === 'ganttChart') || views?.[0];
    const viewMeta = currentView?.meta || {};

    // Extract view configuration
    const viewConfig: GanttViewConfig = {
      startDateFieldId: viewMeta.start_date_field_id,
      endDateFieldId: viewMeta.end_date_field_id,
      titleFieldId: viewMeta.title_field_id,
      progressFieldId: viewMeta.progress_field_id,
      groupByFieldId: viewMeta.groupBy?.column,
      filters: viewMeta.filters || [],
      sorts: viewMeta.sorts || [],
      fieldConfig: viewMeta.fieldConfig || []
    };

    // Create a Map for O(1) column lookups instead of O(n) find() calls
    const columnMap = new Map<string, any>();
    const columnNameMap = new Map<string, any>();
    filteredColumns.forEach(col => {
      columnMap.set(String(col.id), col);
      if (col.column_name) {
        columnNameMap.set(col.column_name.toLowerCase(), col);
      }
    });

    // Find field columns using Map for O(1) lookups
    const startDateField = viewConfig.startDateFieldId ? 
      columnMap.get(String(viewConfig.startDateFieldId)) : undefined;
    const endDateField = viewConfig.endDateFieldId ? 
      columnMap.get(String(viewConfig.endDateFieldId)) : undefined;
    const titleField = viewConfig.titleFieldId ? 
      columnMap.get(String(viewConfig.titleFieldId)) : 
      columnNameMap.get('title');
    const progressField = viewConfig.progressFieldId ? 
      columnMap.get(String(viewConfig.progressFieldId)) : undefined;
    const groupByField = viewConfig.groupByFieldId ? 
      columnMap.get(String(viewConfig.groupByFieldId)) : undefined;


    // Process tasks from records
    const tasks: GanttTask[] = records.map((record: any, idx: number) => {
      const startDateValue = record?.[startDateField?.column_name || ''];
      const endDateValue = record?.[endDateField?.column_name || ''];
      const titleValue = record?.[titleField?.column_name || ''] || record?.title || `Task ${idx + 1}`;
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
        name: String(titleValue),
        startDate,
        endDate,
        color: `hsl(${(idx * 137.5) % 360}, 70%, 50%)`,
        progress: Number(progressValue) || 0,
        status,
        rawData: record
      };
    });

    return {
      tasks,
      columns: filteredColumns,
      viewConfig,
      currentView,
      startDateField,
      endDateField,
      titleField,
      progressField,
      groupByField
    };
  }, [tableData, viewId]);

  // Task operations
  const moveTask = async (taskId: string, newStartDate: Date, newEndDate: Date) => {
    // Implementation for moving tasks
  };

  const createTask = async (taskData: Partial<GanttTask>) => {
    if (!tableData?.data?.model?.id) return String(Date.now());
    
    const { startDateField, endDateField, titleField, progressField } = processedData;
    
    // Create a new row first
    const result = await addRow.mutateAsync({
      model_id: String(tableData.data.model.id)
    });
    
    const recordId = String(result?.id || result);
    
    // Update the row with task data
    if (taskData.name && titleField) {
      await insertRowData.mutateAsync({
        model_id: String(tableData.data.model.id),
        column_id: String(titleField.id),
        row_id: Number(recordId),
        value: taskData.name
      });
    }
    
    if (taskData.startDate && startDateField) {
      await insertRowData.mutateAsync({
        model_id: String(tableData.data.model.id),
        column_id: String(startDateField.id),
        row_id: Number(recordId),
        value: taskData.startDate.toISOString().split('T')[0]
      });
    }
    
    if (taskData.endDate && endDateField) {
      await insertRowData.mutateAsync({
        model_id: String(tableData.data.model.id),
        column_id: String(endDateField.id),
        row_id: Number(recordId),
        value: taskData.endDate.toISOString().split('T')[0]
      });
    }
    
    if (taskData.progress !== undefined && progressField) {
      await insertRowData.mutateAsync({
        model_id: String(tableData.data.model.id),
        column_id: String(progressField.id),
        row_id: Number(recordId),
        value: taskData.progress
      });
    }
    
    return recordId;
  };

  const deleteTask = async (taskId: string) => {
    if (!tableData?.data?.model?.id) return;
    
    await deleteRecord.mutateAsync({
      model_id: String(tableData.data.model.id),
      row_id: Number(taskId)
    });
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    if (!tableData?.data?.model?.id) return;
    
    const { progressField } = processedData;
    if (!progressField) return;
    
    await insertRowData.mutateAsync({
      model_id: String(tableData.data.model.id),
      column_id: String(progressField.id),
      row_id: Number(taskId),
      value: progress
    });
  };

  const updateViewConfig = async (viewId: string, updates: any) => {
    await updateViewMutation.mutateAsync({
      viewId: String(viewId),
      view: updates
    });
  };

  // Wrapper function for updateView mutation
  const updateView = async (viewId: string, view: any) => {
    return await updateViewMutation.mutateAsync({ viewId, view });
  };

  return {
    // Data
    tableData,
    ...processedData,
    
    // State
    isLoading,
    error,
    
    // Actions
    refresh: refetch,
    addRow,
    insertRowData,
    deleteRecord,
    updateField,
    updateView,
    moveTask,
    createTask,
    deleteTask,
    updateTaskProgress,
    updateViewConfig
  };
};
