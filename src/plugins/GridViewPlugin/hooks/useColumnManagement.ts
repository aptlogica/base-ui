import { useState, useCallback } from 'react';
import { GridColumn as ColumnConfig } from '../types/grid.types';
import { normalizeFieldType } from '../../../utils/fieldType';
import { parseApiColumnMeta } from '../../../components/shared/table/tableUtils';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews } from '../../../utils/fieldUsageUtils';
import type { FieldType as FieldTypeUnion } from '../../../types/interfaces/field.interface';

interface UseColumnManagementOptions {
  tableId?: string;
  baseId?: string;
  columns: ColumnConfig[];
  allViews: any[];
  tableData?: any;
  actions?: {
    createField?: any;
    deleteColumn?: any;
    updateField?: any;
  };
  onRefresh?: () => void;
  toast?: any;
  updateViewConfigBackend?: (config: any) => Promise<void>;
  viewConfigState?: any;
  setViewConfigState?: (config: any) => void;
}

export function useColumnManagement({
  tableId,
  baseId,
  columns,
  allViews,
  tableData,
  actions,
  onRefresh,
  toast,
  updateViewConfigBackend,
  viewConfigState,
  setViewConfigState,
}: UseColumnManagementOptions) {
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editColumn, setEditColumn] = useState<ColumnConfig | null>(null);
  const [editColumnIndex, setEditColumnIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalPosition, setEditModalPosition] = useState<{ top: number; left: number } | null>(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
  const [updateFieldConfirmModalOpen, setUpdateFieldConfirmModalOpen] = useState(false);
  const [pendingEditColumnChanges, setPendingEditColumnChanges] = useState<any | null>(null);
  const [dragColumnIndex, setDragColumnIndex] = useState<number | null>(null);
  const [hoverColumnIndex, setHoverColumnIndex] = useState<number | null>(null);

  const createFieldMutation = actions?.createField;
  const deleteColumnMutation = actions?.deleteColumn;
  const updateFieldMutation = actions?.updateField;

  // Create a new column (field) using the column creation modal output
  const handleAddColumn = useCallback(async (newCol: any) => {
    if (!tableId) {
      toast?.error('Table ID not found', { title: 'Error' });
      return;
    }
    try {
      let config: any = {};
      if (newCol && typeof newCol.meta === 'object' && newCol.meta !== null) {
        config = { ...newCol.meta };
      } else if (newCol && typeof newCol.config === 'object' && newCol.config !== null) {
        config = { ...newCol.config };
      }
      const maxPosition = columns.length > 0 ? Math.max(...columns.map(col => col.position || 0)) : 0;

      const fieldConfig = {
        title: String(newCol.key || newCol.name),
        uidt: newCol.type as FieldTypeUnion,
        meta: config,
        order_index: maxPosition + 1,
        description: newCol.description ?? ''
      };
      
      const createdField = await createFieldMutation.mutateAsync({
        tableId,
        baseId,
        config: fieldConfig
      });

      const created: any = (createdField as any)?.data ?? createdField ?? {};
      const createdMeta = created?.meta ?? config ?? {};
      const parsedMeta = parseApiColumnMeta(createdMeta);

      const newColumn: ColumnConfig = {
        id: created.id,
        key: String(newCol.key || created.column_name || created.title || created.name || ''),
        title: String(created.title || newCol.title || newCol.key || ''),
        type: normalizeFieldType(String(created.uidt || newCol.type || 'text')) as any,
        uidt: String(created.uidt || newCol.type || 'text') as any,
        width: 220,
        position: typeof created.order_index === 'number' ? created.order_index : (maxPosition + 1),
        order_index: typeof created.order_index === 'number' ? created.order_index : (maxPosition + 1),
        isSystem: Boolean(created.system),
        system: Boolean(created.system),
        hidden: false,
        is_hidden: false,
        config: parsedMeta,
      } as unknown as ColumnConfig;

      toast?.success('Column created', { title: 'Success' });

      setIsColumnModalOpen(false);
      try { onRefresh?.(); } catch { }
    } catch (err) {
      toast?.error('Failed to create column', { title: 'Error' });
    }
  }, [tableId, baseId, columns, createFieldMutation, toast, onRefresh]);

  // Open the column edit modal for the given column
  const handleEditColumn = useCallback((col: ColumnConfig, index: number, event?: { target: HTMLElement }) => {
    if (col.isSystem) {
      toast?.error('System fields cannot be edited', { title: 'Error' });
      return;
    }

    // Calculate position for the modal
    if (event?.target) {
      const rect = event.target.getBoundingClientRect();
      const top = rect.bottom + window.scrollY + 8;
      const left = rect.left + window.scrollX - 420; // modal width offset
      setEditModalPosition({ top, left: Math.max(8, left) });
    } else {
      // Fallback to center positioning
      setEditModalPosition({
        top: window.innerHeight / 2 - 200,
        left: window.innerWidth / 2 - 210
      });
    }

    setEditColumn(col);
    setEditColumnIndex(index);
    setEditModalOpen(true);
  }, [toast]);

  // Persist column edits; only calls API if actual changes exist.
  const handleSaveEditColumn = useCallback(async (newCol: any) => {
    if (editColumnIndex === null || !editColumn) return;
    
    // Compare fields for changes
    const changes: any = {};
    const uidtChanged = editColumn.uidt !== newCol.type;

    if (editColumn.title !== newCol.title) changes.title = newCol.title;
    if ((editColumn?.description ?? '') !== ((newCol as any)?.description ?? '')) changes.description = (newCol as any).description;
    if (uidtChanged) {
      // Check if field is used in any views before allowing type change
      // Filter views to only current table
      const currentTableViews = tableId && allViews
        ? allViews.filter((view: any) => 
            String(view.model_id || view.modelId || '') === String(tableId)
          )
        : [];

      // Prefer tableData.views (fresh) over allViews (cached)
      const viewsToUse = tableData?.views && Array.isArray(tableData.views) && tableData.views.length > 0
        ? tableData.views
        : allViews;
      
      // Check if field is used as a CRITICAL field - block type change
      const criticalFieldUsage = checkCriticalFieldUsageInViews(editColumn.id!, viewsToUse, tableId);
      
      if (criticalFieldUsage.isUsedInViews) {
        const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
        toast?.error(
          `Cannot change field type. This field is used as a critical field in: ${viewNames}. Please change the view configuration first.`,
          { title: 'Field in Use' }
        );
        return; // Block the update
      }
      
      // Check general field usage
      const fieldUsage = checkFieldUsageInViews(editColumn.id!, currentTableViews);
      
      if (fieldUsage.isUsedInViews) {
        const viewNames = fieldUsage.usedInViews.map(v => v.viewName).join(', ');
        toast?.error(
          `Cannot change field type. This field is currently used in: ${viewNames}. Please remove the field from these views first, or change the field type in the view settings.`,
          { title: 'Field in Use' }
        );
        return; // Block the update
      }
      
      changes.uidt = newCol.type;
      // When type changes, include the new meta config (icon, color, defaultValue, etc.)
      // Don't reset to empty - the new type needs its config
      changes.meta = newCol.meta || {};
    } else if (JSON.stringify(editColumn.meta ?? {}) !== JSON.stringify(newCol.meta ?? {})) {
      changes.meta = newCol.meta;
    }

    const hasChanges = Object.keys(changes).length > 0;

    if (hasChanges) {
      if (uidtChanged) {
        setPendingEditColumnChanges(changes);
        setUpdateFieldConfirmModalOpen(true);
        setEditModalOpen(false);
      } else {
        // Directly update if type is not changed
        await updateFieldMutation.mutateAsync({
          fieldId: editColumn.id!,
          updatedValue: changes,
        });
        try { onRefresh?.(); } catch { }
        setEditModalOpen(false);
        setEditColumn(null);
        setEditColumnIndex(null);
      }
    } else {
      setEditModalOpen(false);
      setEditColumn(null);
      setEditColumnIndex(null);
    }
  }, [editColumnIndex, editColumn, updateFieldMutation, onRefresh, allViews, toast]);

  // Confirm handler for UpdateFieldConfirmModal
  const handleConfirmUpdateField = useCallback(async () => {
    if (pendingEditColumnChanges && editColumn) {
      await updateFieldMutation.mutateAsync({
        fieldId: editColumn.id!,
        updatedValue: pendingEditColumnChanges,
      });
      try { onRefresh?.(); } catch { }
    }
    setUpdateFieldConfirmModalOpen(false);
    setPendingEditColumnChanges(null);
    setEditModalOpen(false);
    setEditColumn(null);
    setEditColumnIndex(null);
  }, [pendingEditColumnChanges, editColumn, updateFieldMutation, onRefresh]);

  // Ask for confirmation then delete a column
  const handleDeleteColumn = useCallback(async (columnId: string) => {
    const column = columns.find(col => String(col.id) === String(columnId));

    // Check if it's a system field
    if (column?.isSystem || column?.system) {
      toast?.error('System fields cannot be deleted', { title: 'Error' });
      return;
    }

    // Filter views to only current table
    const currentTableViews = tableId && allViews
      ? allViews.filter((view: any) => {
          const viewTableId = String(view.model_id || view.modelId || '');
          return viewTableId === String(tableId);
        })
      : [];

    // Prefer tableData.views (fresh) over allViews (cached)
    const viewsToUse = tableData?.views && Array.isArray(tableData.views) && tableData.views.length > 0
      ? tableData.views
      : allViews;

    // Check if field is used as a CRITICAL field in kanban, gantt, gallery, or calendar views
    const criticalFieldUsage = checkCriticalFieldUsageInViews(columnId, viewsToUse, tableId);
    
    if (criticalFieldUsage.isUsedInViews) {
      const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
      toast?.error(
        `Cannot delete field. It is used as a critical field in: ${viewNames}. Please change the view configuration first.`,
        { title: 'Field in Use' }
      );
      return;
    }
    
    // Also check general field usage in current table views
    const fieldUsage = checkFieldUsageInViews(columnId, currentTableViews);
    
    if (fieldUsage.isUsedInViews) {
      const viewNames = fieldUsage.usedInViews.map(v => v.viewName).join(', ');
      toast?.error(
        `Cannot delete field. It is currently used in: ${viewNames}. Please remove the field from these views first.`,
        { title: 'Field in Use' }
      );
      return;
    }

    setDeleteConfirmModalOpen(true);
    setColumnToDelete(columnId);
  }, [columns, allViews, tableId, toast]);

  // Finalize column deletion after confirmation
  const handleConfirmDeleteColumn = useCallback(async () => {
    if (!columnToDelete) return;
    
    // Filter views to only current table
    const currentTableViews = tableId && allViews
      ? allViews.filter((view: any) => 
          String(view.model_id || view.modelId || '') === String(tableId)
        )
      : [];

    // Prefer tableData.views (fresh) over allViews (cached)
    const viewsToUse = tableData?.views && Array.isArray(tableData.views) && tableData.views.length > 0
      ? tableData.views
      : allViews;
    
    // Double-check critical field usage before deletion
    const criticalFieldUsage = checkCriticalFieldUsageInViews(columnToDelete, viewsToUse, tableId);
    
    if (criticalFieldUsage.isUsedInViews) {
      const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
      toast?.error(
        `Cannot delete field. It is used as a critical field in: ${viewNames}. Please change the view configuration first.`,
        { title: 'Field in Use' }
      );
      setDeleteConfirmModalOpen(false);
      setColumnToDelete(null);
      return;
    }
    
    // Double-check general field usage
    const fieldUsage = checkFieldUsageInViews(columnToDelete, currentTableViews);
    
    if (fieldUsage.isUsedInViews) {
      const viewNames = fieldUsage.usedInViews.map(v => v.viewName).join(', ');
      toast?.error(
        `Cannot delete field. It is currently used in: ${viewNames}. Please remove the field from these views first.`,
        { title: 'Field in Use' }
      );
      setDeleteConfirmModalOpen(false);
      setColumnToDelete(null);
      return;
    }
    
    try {
      const deletedColumn = columns.find(col => col.id === columnToDelete);
      const columnKey = deletedColumn?.key;

      // Call the API to delete the column
      await deleteColumnMutation.mutateAsync({
        tableId,
        fieldId: columnToDelete
      });

      // Remove column width from view config only if it was saved (not default)
      if (columnKey && viewConfigState?.columnWidths?.[columnKey] && setViewConfigState) {
        const newConfigState = {
          ...viewConfigState,
          columnWidths: {
            ...viewConfigState.columnWidths
          }
        };
        delete newConfigState.columnWidths[columnKey];
        setViewConfigState(newConfigState);
        if (updateViewConfigBackend) {
          await updateViewConfigBackend(newConfigState);
        }
      }

      setDeleteConfirmModalOpen(false);
      setColumnToDelete(null);
      toast?.success(`Successfully deleted column "${deletedColumn?.title || 'Unknown'}"`, { title: 'Success' });
      try { onRefresh?.(); } catch { }
    } catch (err) {
      console.error('Failed to delete column:', err);
      toast?.error(`Failed to delete column. Please try again. ${err instanceof Error ? err.message : ''}`, { title: 'Error' });
    }
  }, [columnToDelete, columns, deleteColumnMutation, tableId, viewConfigState, setViewConfigState, updateViewConfigBackend, toast, onRefresh, allViews]);

  // Duplicate a column
  const handleDuplicateColumn = useCallback(async (column: any) => {
    if (!actions?.createField) return;

    try {
      const duplicateData = {
        model_id: tableData?.model?.id,
        column_name: `${column.title}_copy`,
        column_type: column.type,
      };

      await actions.createField(duplicateData);
      onRefresh?.();
      toast?.success('Column duplicated successfully', { title: 'Success' });
    } catch (error) {
      console.error('Failed to duplicate column:', error);
      toast?.error('Failed to duplicate column', { title: 'Error' });
    }
  }, [actions, tableData, onRefresh, toast]);

  // Column drag and drop handlers
  const handleColumnDragStart = useCallback((index: number, visibleColumns: ColumnConfig[]) => {
    const column = visibleColumns[index];
    if (column?.isSystem) return; // Prevent dragging system fields
    setDragColumnIndex(index);
  }, []);

  const handleColumnDragEnter = useCallback((index: number) => {
    setHoverColumnIndex(index);
  }, []);

  const handleColumnDragEnd = useCallback(async (
    visibleColumns: ColumnConfig[],
    localFieldConfig: any[],
    effectiveViewId?: string,
    baseMeta?: any,
    updateViewMutation?: any,
    handleFieldOrderChange?: (newColumns: ColumnConfig[]) => Promise<void>
  ) => {
    if (dragColumnIndex !== null && hoverColumnIndex !== null && dragColumnIndex !== hoverColumnIndex) {
      try {
        // Reorder the visible columns array to match drag operation
        const newVisibleColumns = [...visibleColumns];
        const [draggedColumn] = newVisibleColumns.splice(dragColumnIndex, 1);
        newVisibleColumns.splice(hoverColumnIndex, 0, draggedColumn);

        // Use handleFieldOrderChange if provided, otherwise update directly
        if (handleFieldOrderChange) {
          await handleFieldOrderChange(newVisibleColumns);
        } else {
          // Fallback: Update field configuration with new positions
          const newFieldConfig = localFieldConfig.map(fc => {
            const columnIndex = newVisibleColumns.findIndex(col => String(col.id) === String(fc.id));
            if (columnIndex !== -1) {
              return { ...fc, position: columnIndex };
            }
            return fc;
          });

          newFieldConfig.sort((a, b) => (a.position || 0) - (b.position || 0));
          const finalFieldConfig = newFieldConfig.map((fc, idx) => ({
            ...fc,
            position: idx
          }));

          // Persist to backend
          if (effectiveViewId && updateViewMutation) {
            await updateViewMutation.mutateAsync({
              viewId: effectiveViewId,
              view: {
                meta: {
                  ...baseMeta,
                  fieldConfig: finalFieldConfig
                }
              }
            });
            toast?.success('Column order updated for this view', { title: 'Success' });
          }
        }
      } catch (error: any) {
        console.error('Failed to reorder column:', error);
        toast?.error(error?.message || 'Failed to reorder column', { title: 'Error' });
      }
    }

    setDragColumnIndex(null);
    setHoverColumnIndex(null);
  }, [dragColumnIndex, hoverColumnIndex, toast]);

  return {
    // State
    isColumnModalOpen,
    setIsColumnModalOpen,
    editColumn,
    editColumnIndex,
    editModalOpen,
    setEditModalOpen,
    editModalPosition,
    deleteConfirmModalOpen,
    setDeleteConfirmModalOpen,
    columnToDelete,
    updateFieldConfirmModalOpen,
    setUpdateFieldConfirmModalOpen,
    pendingEditColumnChanges,
    setPendingEditColumnChanges,
    dragColumnIndex,
    hoverColumnIndex,
    
    // Handlers
    handleAddColumn,
    handleEditColumn,
    handleSaveEditColumn,
    handleConfirmUpdateField,
    handleDeleteColumn,
    handleConfirmDeleteColumn,
    handleDuplicateColumn,
    handleColumnDragStart,
    handleColumnDragEnter,
    handleColumnDragEnd,
    
    // Setters
    setEditColumn,
    setEditColumnIndex,
  };
}

