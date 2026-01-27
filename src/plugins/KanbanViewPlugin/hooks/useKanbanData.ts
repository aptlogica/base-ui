import { useMemo } from 'react';
import { useTable, useAddRow, useDeleteRecord, useInsertRowData, useUpdateField, useUpdateView, useUpdateViewMeta } from '../../../hooks/useApi';
import type { TableData } from '../types/api.types';
import type { GridColumn } from '../../GridViewPlugin/types/grid.types';
import { fieldsToFilter } from '../../../types/constants';

// Data layer for Kanban: fetch + CRUD orchestration; keeps UI components clean

export interface UseKanbanDataOptions {
  tableId: string;
  viewId?: string;
}

export interface UseKanbanDataReturn {
  // Data (simplified like GridView and FormView)
  tableData?: TableData;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;

  // CRUD operations
  addRow: ReturnType<typeof useAddRow>;
  insertRowData: ReturnType<typeof useInsertRowData>;
  deleteRecord: ReturnType<typeof useDeleteRecord>;
  updateField: ReturnType<typeof useUpdateField>;
  updateView: ReturnType<typeof useUpdateView>;
  updateViewMeta: ReturnType<typeof useUpdateViewMeta>;

  // Kanban-specific business operations
  moveCard: (cardId: string, targetStackId: string) => Promise<void>;
  createCard: (initialValues: Record<string, any>) => Promise<string>;
  duplicateCard: (cardId: string) => Promise<string>;
  deleteCard: (cardId: string) => Promise<void>;
  updateFieldOptions: (fieldId: string, options: string[] | Array<{ option: string; color: string }>) => Promise<void>;
  persistStackOrder: (newOrder: string[]) => Promise<void>;
  changeGroupByColumn: (col: GridColumn) => Promise<void>;
  updateViewConfig: (viewId: string, updates: any) => Promise<void>;
}

export function useKanbanData({ tableId, viewId }: UseKanbanDataOptions): UseKanbanDataReturn {
  const tableQuery = useTable(String(tableId));

  // SDK returns a StandardResponse with `data`; unwrap it to our canonical TableData
  const tableData = useMemo(() => {
    const raw = tableQuery.data as any;
    if (!raw) return undefined;
    const filteredColumns = raw.data.columns.filter((col: any) => !fieldsToFilter.includes(col.uidt));
    raw.data = { ...raw.data, columns: filteredColumns } as TableData;
    // Prefer nested data if present; otherwise assume raw is already TableData
    return (raw.data ?? raw) as TableData;
  }, [tableQuery.data]);

  // CRUD operations - thin wrappers around shared hooks
  const addRow = useAddRow();
  const insertRowData = useInsertRowData();
  const deleteRecord = useDeleteRecord();
  const updateField = useUpdateField();
  const updateView = useUpdateView();
  const updateViewMeta = useUpdateViewMeta(); // Optimized hook for meta-only updates (cardOrder, etc.)

  // Business logic operations (simplified to work with tableData)
  const moveCard = async (cardId: string, targetStackId: string): Promise<void> => {
    // This will be implemented in the UI component where we have access to the group column
  };

  const createCard = async (initialValues: Record<string, any>): Promise<string> => {
    const created = await addRow.mutateAsync({ model_id: String(tableId) });
    const recordId = created?.data?.id || created?.id || String(Date.now());

    // Set initial values for each field
    if (tableData?.columns) {
      await Promise.all(tableData.columns.map(async (field: any) => {
        // Skip attachment fields - they handle their own API calls
        if (field.type === 'attachment' || field.uidt === 'attachment') {
          return;
        }

        const value = initialValues[field.id] ?? initialValues[field.column_name];
        if (value === undefined || value === null || value === '') return;

        try {
          await insertRowData.mutateAsync({
            model_id: String(tableId),
            column_id: String(field.id),
            row_id: Number(recordId),
            value,
          });
        } catch (e) {
          console.warn('Failed to set initial field value:', field.id, e);
        }
      }));
    }

    return recordId;
  };

  const duplicateCard = async (cardId: string): Promise<string> => {
    // This will be implemented in the UI component where we have access to the record data
    return cardId;
  };

  const deleteCard = async (cardId: string): Promise<void> => {
    await deleteRecord.mutateAsync({
      model_id: String(tableId),
      row_id: Number(cardId)
    });
  };

  // Create column Map for O(1) lookups
  const columnMap = useMemo(() => {
    const map = new Map<string, any>();
    tableData?.columns?.forEach((col: any) => {
      map.set(String(col.id), col);
    });
    return map;
  }, [tableData?.columns]);

  const updateFieldOptions = async (fieldId: string, options: string[] | Array<{ option: string; color: string }>): Promise<void> => {
    const field = columnMap.get(String(fieldId));
    if (!field) {
      return;
    }

    // Update the field's meta options
    await updateField.mutateAsync({
      fieldId: String(fieldId),
      updatedValue: {
        meta: {
          ...field.meta,
          options: options
        }
      }
    });
  };

  // Create views Map for O(1) lookups
  const viewsMap = useMemo(() => {
    const map = new Map<string, any>();
    tableData?.views?.forEach((v: any) => {
      map.set(String(v.id), v);
    });
    return map;
  }, [tableData?.views]);

  const persistStackOrder = async (newOrder: string[]): Promise<void> => {
    const viewIdToUpdate = viewId;
    if (!viewIdToUpdate) return;

    const currentView = viewsMap.get(String(viewIdToUpdate));
    const currentMeta = currentView?.meta ?? currentView?.config ?? {};
    await updateView.mutateAsync({
      viewId: viewIdToUpdate,
      view: {
        meta: {
          ...currentMeta,
          stackOrder: newOrder
        }
      }
    });
  };

  const changeGroupByColumn = async (col: GridColumn): Promise<void> => {
    const viewIdToUpdate = viewId;
    if (!viewIdToUpdate || !col.id) return;

    const currentView = viewsMap.get(String(viewIdToUpdate));
    const currentMeta = currentView?.meta ?? currentView?.config ?? {};
    // Use updateView (not updateViewMeta) to ensure table query is invalidated
    // The table query contains the views array, and we need it to refetch with updated view meta
    await updateView.mutateAsync({
      viewId: viewIdToUpdate,
      view: {
        model_id: tableId,
        meta: {
          ...currentMeta,
          view_target_field: col.id
        }
      }
    });
  };

  const updateViewConfig = async (viewId: string, updates: any): Promise<void> => {
    // Get current view to merge with updates and clean up nested meta structure
    const currentView = viewsMap.get(String(viewId));
    if (!currentView) {
      await updateView.mutateAsync({ viewId, view: updates });
      return;
    }

    // If updates contains meta, we need to merge it properly
    if (updates.meta) {
      const currentMeta = currentView.meta ?? {};
      // Remove any nested meta.meta structure to prevent double nesting
      const { meta: nestedMeta, ...cleanMeta } = currentMeta ?? {};

      // Merge clean meta with updates.meta
      const newMeta = { ...cleanMeta, ...updates.meta };

      await updateView.mutateAsync({
        viewId,
        view: {
          ...updates,
          meta: newMeta
        }
      });
    } else {
      // If updates doesn't contain meta, but we need to add properties to meta, do so
      const currentMeta = currentView.meta ?? {};
      const { meta: nestedMeta, ...cleanMeta } = currentMeta ?? {};

      // Merge updates into clean meta
      const newMeta = { ...cleanMeta, ...updates };

      await updateView.mutateAsync({
        viewId,
        view: { meta: newMeta }
      });
    }
  };

  return {
    tableData,
    isLoading: tableQuery.isLoading,
    error: tableQuery.error,
    refresh: () => { void tableQuery.refetch(); },
    addRow,
    insertRowData,
    deleteRecord,
    updateField,
    updateView,
    updateViewMeta,
    moveCard,
    createCard,
    duplicateCard,
    deleteCard,
    updateFieldOptions,
    persistStackOrder,
    changeGroupByColumn,
    updateViewConfig
  }
}
