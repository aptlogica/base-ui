import { useMemo } from 'react';
import { useTable, useAddRow, useDeleteRecord, useBulkDeleteRecords, useInsertRowData, useUpdateField, useDeleteColumn, useCreateField, useUpdateView } from '../../../hooks/useApi';
import type { TableData } from '../../../types/api.types';

// Data layer for Grid: fetch + CRUD orchestration; keeps UI components clean
export interface UseGridDataOptions {
  tableId: string;
  viewId?: string; // reserved for view-specific updates
}

export interface UseGridDataReturn {
  // Data
  tableData?: TableData;
  isLoading: boolean;
  error: unknown;

  // CRUD ops (thin wrappers around shared hooks)
  refresh: () => void;
  addRow: ReturnType<typeof useAddRow>;
  insertRowData: ReturnType<typeof useInsertRowData>;
  deleteRecord: ReturnType<typeof useDeleteRecord>;
  bulkDeleteRecords: ReturnType<typeof useBulkDeleteRecords>;
  updateField: ReturnType<typeof useUpdateField>;
  deleteColumn: ReturnType<typeof useDeleteColumn>;
  createField: ReturnType<typeof useCreateField>;
  updateView: ReturnType<typeof useUpdateView>;
  updateRowOrder: (orderedRecordIds: number[]) => Promise<void>;
}

export function useGridData({ tableId}: UseGridDataOptions): UseGridDataReturn {
  const tableQuery = useTable(String(tableId));

  const tableData = useMemo(() => {
    const raw = tableQuery.data as any;
    if (!raw) return undefined;
    
    // Handle both direct TableData and wrapped TableResponse
    const data = raw.data ?? raw;
    
    // Ensure we have the expected structure
    if (data?.model && data?.columns) {
      return data as TableData;
    }
    
    return undefined;
  }, [tableQuery.data, tableQuery.dataUpdatedAt]); // dataUpdatedAt changes on every refetch

  // Determine loading state
  const isLoading = tableQuery.isLoading;

  // Expose mutations as-is; UI decides how/when to call
  const addRow = useAddRow();
  const insertRowData = useInsertRowData();
  const deleteRecord = useDeleteRecord();
  const bulkDeleteRecords = useBulkDeleteRecords();
  const updateField = useUpdateField();
  const deleteColumn = useDeleteColumn();
  const createField = useCreateField();
  const updateView = useUpdateView();

  // Row reordering by updating record IDs sequentially using existing SDK
  const updateRowOrder = async (orderedRecordIds: number[]) => {
    try {
      if (!tableData?.columns) {
        throw new Error('Table data not available');
      }

      // Find the ID column from columns 
      const idColumn = tableData.columns.find(col => col.column_name === 'id');
      if (!idColumn?.id) {
        throw new Error('ID column not found');
      }

      // Update each record's ID to its new sequential position (1, 2, 3, ...)
      const updatePromises = orderedRecordIds.map(async (currentId, newPosition) => {
        const newId = newPosition + 1; // Start IDs from 1
        
        if (currentId !== newId) {
          // Use existing insertRowData to update the ID field
          await insertRowData.mutateAsync({
            model_id: tableId,
            column_id: idColumn.id,
            row_id: currentId,
            value: newId
          });
        }
      });
      
      // Execute all updates
      await Promise.all(updatePromises);
      
      // Refresh data to get updated records
      tableQuery.refetch();
    } catch (error) {
      console.error('Failed to reorder rows:', error);
      throw error;
    }
  };

  return {
    tableData,
    isLoading,
    error: tableQuery.error,
    refresh: (): void => {
      tableQuery.refetch().catch(() => {
        // Silently handle refetch errors - they're non-critical
      });
    },
    addRow,
    insertRowData,
    deleteRecord,
    bulkDeleteRecords,
    updateField,
    deleteColumn,
    createField,
    updateView,
    updateRowOrder,
  };
}
