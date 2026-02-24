import { useMemo } from 'react';
import { useTable, useAddRow, useDeleteRecord, useInsertRowData, useUpdateField, useUpdateView } from '../../../hooks/useApi';
import type { TableResponse, Column, View } from '../../../types/api.types';
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
  rawData: Record<string, unknown>;
}

export interface GanttViewConfig {
  startDateFieldId?: string;
  endDateFieldId?: string;
  titleFieldId?: string;
  progressFieldId?: string;
  groupByFieldId?: string;
  filters: Array<Record<string, unknown>>;
  sorts: Array<Record<string, unknown>>;
  fieldConfig: Array<Record<string, unknown>>;
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
  error: unknown;
  
  // Actions
  refresh: () => void;
  addRow: ReturnType<typeof useAddRow>;
  insertRowData: ReturnType<typeof useInsertRowData>;
  deleteRecord: ReturnType<typeof useDeleteRecord>;
  updateField: ReturnType<typeof useUpdateField>;
  updateView: (viewId: string, view: Record<string, unknown>) => Promise<unknown>;
  moveTask: (taskId: string, newStartDate: Date, newEndDate: Date) => Promise<void>;
  createTask: (taskData: Partial<GanttTask>) => Promise<string>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  updateViewConfig: (viewId: string, updates: Record<string, unknown>) => Promise<void>;
}

// Helper function to extract view configuration
const extractViewConfig = (viewMeta: Record<string, unknown>): GanttViewConfig => {
  const getStringField = (key: string): string | undefined => {
    const value = viewMeta[key];
    return typeof value === 'string' ? value : undefined;
  };

  const getGroupByFieldId = (): string | undefined => {
    const groupBy = viewMeta.groupBy;
    if (typeof groupBy === 'object' && groupBy !== null && 'column' in groupBy) {
      return String((groupBy as Record<string, unknown>).column);
    }
    return undefined;
  };

  const getArrayField = (key: string): Array<Record<string, unknown>> => {
    const value = viewMeta[key];
    return Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
  };

  return {
    startDateFieldId: getStringField('start_date_field_id'),
    endDateFieldId: getStringField('end_date_field_id'),
    titleFieldId: getStringField('title_field_id'),
    progressFieldId: getStringField('progress_field_id'),
    groupByFieldId: getGroupByFieldId(),
    filters: getArrayField('filters'),
    sorts: getArrayField('sorts'),
    fieldConfig: getArrayField('fieldConfig')
  };
};

// Helper function to create column maps
const createColumnMaps = (columns: Column[]): { columnMap: Map<string, Column>; columnNameMap: Map<string, Column> } => {
  const columnMap = new Map<string, Column>();
  const columnNameMap = new Map<string, Column>();
  
  columns.forEach((col: Column) => {
    columnMap.set(String(col.id), col);
    if (col.column_name) {
      columnNameMap.set(col.column_name.toLowerCase(), col);
    }
  });
  
  return { columnMap, columnNameMap };
};

// Helper function to find field columns
const findFieldColumns = (
  viewConfig: GanttViewConfig,
  columnMap: Map<string, Column>,
  columnNameMap: Map<string, Column>
) => {
  const getFieldById = (fieldId: string | undefined): Column | undefined => {
    return fieldId ? columnMap.get(String(fieldId)) : undefined;
  };

  return {
    startDateField: getFieldById(viewConfig.startDateFieldId),
    endDateField: getFieldById(viewConfig.endDateFieldId),
    titleField: getFieldById(viewConfig.titleFieldId) || columnNameMap.get('title'),
    progressField: getFieldById(viewConfig.progressFieldId),
    groupByField: getFieldById(viewConfig.groupByFieldId)
  };
};

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
    const tableDataTyped = tableData as TableResponse | undefined;
    if (!tableDataTyped?.data) {
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

    const { columns, records, views } = tableDataTyped.data;

    // Filter out unwanted columns
    const filteredColumns = columns.filter(
      (col: Column) => !fieldsToFilter.includes(col.uidt)
    );
    
    // Find current view
    const currentView = viewId
      ? (views?.find((v: View) => String(v.id) === String(viewId)) || null)
      : (views?.find((v: View) => v.type === 'ganttChart') || views?.[0]);
    const viewMeta = currentView?.meta ?? ({} as Record<string, unknown>);

    // Extract view configuration
    const viewConfig = extractViewConfig(viewMeta);

    // Create column maps for O(1) lookups
    const { columnMap, columnNameMap } = createColumnMaps(filteredColumns);

    // Find field columns using Map for O(1) lookups
    const { startDateField, endDateField, titleField, progressField, groupByField } = 
      findFieldColumns(viewConfig, columnMap, columnNameMap);


    // Helper functions to reduce cognitive complexity
    const parseDate = (value: unknown, defaultValue: Date): Date => {
      if (value && (typeof value === 'string' || value instanceof Date)) {
        return new Date(value);
      }
      return defaultValue;
    };

    const getTaskName = (titleValue: unknown): string => {
      if (typeof titleValue === 'string') {
        return titleValue.trim() === '' ? '-' : titleValue;
      }
      if (titleValue === null || titleValue === undefined) {
        return '-';
      }
      if (typeof titleValue === 'object') {
        return '-';
      }
      if (typeof titleValue === 'number' || typeof titleValue === 'boolean' || typeof titleValue === 'symbol' || typeof titleValue === 'bigint') {
        return String(titleValue);
      }
      return '-';
    };

    const getTaskId = (recordId: unknown, idx: number): string | number => {
      if (recordId === undefined || recordId === null) {
        return idx;
      }
      if (typeof recordId === 'string' || typeof recordId === 'number') {
        return recordId;
      }
      // Handle objects and other types safely - avoid stringifying objects
      if (typeof recordId === 'object') {
        return idx;
      }
      // Only stringify primitive types (boolean, symbol, bigint)
      if (typeof recordId === 'boolean' || typeof recordId === 'symbol' || typeof recordId === 'bigint') {
        return String(recordId);
      }
      // For any other unknown type, return index as fallback
      return idx;
    };

    const determineStatus = (
      endDate: Date,
      progressValue: unknown,
      startDateValue: unknown,
      endDateValue: unknown
    ): 'active' | 'completed' | 'overdue' | 'pending' => {
      const now = new Date();
      if (endDate < now) {
        return 'overdue';
      }
      const progressNum = typeof progressValue === 'number' ? progressValue : Number(progressValue) || 0;
      if (progressNum >= 100) {
        return 'completed';
      }
      if (!startDateValue && !endDateValue) {
        return 'pending';
      }
      return 'active';
    };

    // Process tasks from records
    const tasks: GanttTask[] = records.map((record: Record<string, unknown>, idx: number) => {
      const startDateFieldName = startDateField?.column_name || '';
      const endDateFieldName = endDateField?.column_name || '';
      const titleFieldName = titleField?.column_name || '';
      const progressFieldName = progressField?.column_name || '';
      
      const startDateValue = startDateFieldName ? record[startDateFieldName] : undefined;
      const endDateValue = endDateFieldName ? record[endDateFieldName] : undefined;
      const titleValue = titleFieldName ? record[titleFieldName] : record.title;
      const progressValue = progressFieldName ? record[progressFieldName] : 0;

      // Parse dates with proper type checking
      const startDate = parseDate(startDateValue, new Date());
      const endDate = parseDate(endDateValue, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      // Determine status
      const status = determineStatus(endDate, progressValue, startDateValue, endDateValue);

      // Ensure title is a string
      const taskName = getTaskName(titleValue);

      // Ensure id is string or number
      const taskId = getTaskId(record.id, idx);

      return {
        id: taskId,
        name: taskName,
        startDate,
        endDate,
        color: `hsl(${(idx * 137.5) % 360}, 70%, 50%)`,
        progress: typeof progressValue === 'number' ? progressValue : Number(progressValue) || 0,
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


  const createTask = async (taskData: Partial<GanttTask>) => {
    const tableDataTyped = tableData as TableResponse | undefined;
    if (!tableDataTyped?.data?.model?.id) return String(Date.now());
    
    const { startDateField, endDateField, titleField, progressField } = processedData;
    const modelId = String(tableDataTyped.data.model.id);
    
    // Create a new row first
    const result = await addRow.mutateAsync({
      model_id: modelId
    });
    
    const recordId = String(result?.id || result);
    
    // Update the row with task data
    if (taskData.name && titleField) {
      await insertRowData.mutateAsync({
        model_id: modelId,
        column_id: String(titleField.id),
        row_id: Number(recordId),
        value: taskData.name
      });
    }
    
    if (taskData.startDate && startDateField) {
      await insertRowData.mutateAsync({
        model_id: modelId,
        column_id: String(startDateField.id),
        row_id: Number(recordId),
        value: taskData.startDate.toISOString().split('T')[0]
      });
    }
    
    if (taskData.endDate && endDateField) {
      await insertRowData.mutateAsync({
        model_id: modelId,
        column_id: String(endDateField.id),
        row_id: Number(recordId),
        value: taskData.endDate.toISOString().split('T')[0]
      });
    }
    
    if (taskData.progress !== undefined && progressField) {
      await insertRowData.mutateAsync({
        model_id: modelId,
        column_id: String(progressField.id),
        row_id: Number(recordId),
        value: taskData.progress
      });
    }
    
    return recordId;
  };

  const deleteTask = async (taskId: string) => {
    const tableDataTyped = tableData as TableResponse | undefined;
    if (!tableDataTyped?.data?.model?.id) return;
    
    await deleteRecord.mutateAsync({
      model_id: String(tableDataTyped.data.model.id),
      row_id: Number(taskId)
    });
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    const tableDataTyped = tableData as TableResponse | undefined;
    if (!tableDataTyped?.data?.model?.id) return;
    
    const { progressField } = processedData;
    if (!progressField) return;
    
    await insertRowData.mutateAsync({
      model_id: String(tableDataTyped.data.model.id),
      column_id: String(progressField.id),
      row_id: Number(taskId),
      value: progress
    });
  };

  const moveTask = async (taskId: string, newStartDate: Date, newEndDate: Date) => {
    const tableDataTyped = tableData as TableResponse | undefined;
    if (!tableDataTyped?.data?.model?.id) return;
    
    const { startDateField, endDateField } = processedData;
    
    if (startDateField) {
      await insertRowData.mutateAsync({
        model_id: String(tableDataTyped.data.model.id),
        column_id: String(startDateField.id),
        row_id: Number(taskId),
        value: newStartDate.toISOString().split('T')[0]
      });
    }
    
    if (endDateField) {
      await insertRowData.mutateAsync({
        model_id: String(tableDataTyped.data.model.id),
        column_id: String(endDateField.id),
        row_id: Number(taskId),
        value: newEndDate.toISOString().split('T')[0]
      });
    }
  };

  const updateViewConfig = async (viewId: string, updates: Record<string, unknown>) => {
    await updateViewMutation.mutateAsync({
      viewId: String(viewId),
      view: updates
    });
  };

  // Wrapper function for updateView mutation
  const updateView = async (viewId: string, view: Record<string, unknown>) => {
    return await updateViewMutation.mutateAsync({ viewId, view });
  };

  return {
    // Data
    tableData: tableData as TableResponse | undefined,
    ...processedData,
    
    // State
    isLoading,
    error,
    
    // Actions
    refresh: () => {
      void refetch();
    },
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
