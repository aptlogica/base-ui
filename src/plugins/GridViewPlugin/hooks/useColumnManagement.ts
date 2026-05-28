// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useState, useCallback } from 'react';
import { GridColumn as ColumnConfig } from '../types/grid.types';
import { parseApiColumnMeta } from '../../../components/shared/table/tableUtils';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews, checkFieldUsageInFormulas } from '../../../utils/fieldUsageUtils';
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

interface PendingEditColumnChanges {
  title?: string;
  description?: string;
  uidt?: string;
  meta?: any;
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
  const [pendingEditColumnChanges, setPendingEditColumnChanges] = useState<PendingEditColumnChanges | null>(null);
  const [dragColumnIndex, setDragColumnIndex] = useState<number | null>(null);
  const [hoverColumnIndex, setHoverColumnIndex] = useState<number | null>(null);
  const [formulaUsageWarning, setFormulaUsageWarning] = useState<string[] | null>(null);

  const createFieldMutation = actions?.createField;
  const deleteColumnMutation = actions?.deleteColumn;
  const updateFieldMutation = actions?.updateField;

  // Helper to safely call onRefresh
  const safeRefresh = useCallback(() => {
    try {
      onRefresh?.();
    } catch (err) {
      // Silently handle refresh errors - they're non-critical
      if (err instanceof Error) {
        console.warn('Refresh callback error:', err.message);
      }
    }
  }, [onRefresh]);

  // Helper to get current table views
  const getCurrentTableViews = useCallback(() => {
    if (!tableId || !allViews) return [];
    return allViews.filter((view: any) => 
      String(view.model_id || view.modelId || '') === String(tableId)
    );
  }, [tableId, allViews]);

  // Helper to get views to use (prefer fresh over cached)
  const getViewsToUse = useCallback(() => {
    if (tableData?.views && Array.isArray(tableData.views) && tableData.views.length > 0) {
      return tableData.views;
    }
    return allViews;
  }, [tableData, allViews]);

  // Helper to check critical field usage and show error
  const checkAndBlockCriticalFieldUsage = useCallback((
    fieldId: string,
    viewsToUse: any[],
    operation: 'change type' | 'delete'
  ): boolean => {
    const criticalFieldUsage = checkCriticalFieldUsageInViews(fieldId, viewsToUse, tableId);
    
    if (criticalFieldUsage.isUsedInViews) {
      const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
      const message = operation === 'change type'
        ? `Cannot change field type. This field is used as a critical field in: ${viewNames}. Please change the view configuration first.`
        : `Cannot delete field. It is used as a critical field in: ${viewNames}. Please change the view configuration first.`;
      toast?.error(message, { title: 'Field in Use' });
      return true; // Block the operation
    }
    return false; // Allow the operation
  }, [tableId, toast]);

  // Helper to check general field usage and show error
  const checkAndBlockGeneralFieldUsage = useCallback((
    fieldId: string,
    currentTableViews: any[],
    operation: 'change type' | 'delete'
  ): boolean => {
    const fieldUsage = checkFieldUsageInViews(fieldId, currentTableViews);
    
    if (fieldUsage.isUsedInViews) {
      const viewNames = fieldUsage.usedInViews.map(v => v.viewName).join(', ');
      const message = operation === 'change type'
        ? `Cannot change field type. This field is currently used in: ${viewNames}. Please remove the field from these views first, or change the field type in the view settings.`
        : `Cannot delete field. It is currently used in: ${viewNames}. Please remove the field from these views first.`;
      toast?.error(message, { title: 'Field in Use' });
      return true; // Block the operation
    }
    return false; // Allow the operation
  }, [toast]);

  // Helper to validate field type change
  const validateFieldTypeChange = useCallback((
    fieldId: string,
    currentTableViews: any[],
    viewsToUse: any[]
  ): boolean => {
    // Check critical field usage first
    if (checkAndBlockCriticalFieldUsage(fieldId, viewsToUse, 'change type')) {
      return false;
    }
    
    // Check general field usage
    if (checkAndBlockGeneralFieldUsage(fieldId, currentTableViews, 'change type')) {
      return false;
    }
    
    return true; // Allow type change
  }, [checkAndBlockCriticalFieldUsage, checkAndBlockGeneralFieldUsage]);

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

      const created: any = createdField?.data ?? createdField ?? {};
      const createdMeta = created?.meta ?? config ?? {};
      parseApiColumnMeta(createdMeta);

      toast?.success('Column created', { title: 'Success' });

      setIsColumnModalOpen(false);
      safeRefresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to create column:', errorMessage);
      toast?.error('Failed to create column', { title: 'Error' });
    }
  }, [tableId, baseId, columns, createFieldMutation, toast, safeRefresh]);

  // Open the column edit modal for the given column
  const handleEditColumn = useCallback((col: ColumnConfig, index: number, event?: { target: HTMLElement }) => {
    if (col.isSystem) {
      toast?.error('System fields cannot be edited', { title: 'Error' });
      return;
    }

    // Calculate position for the modal
    if (event?.target) {
      const rect = event.target.getBoundingClientRect();
      // Position against viewport because the modal is fixed.
      const top = rect.bottom + 8;
      const left = rect.left - 420; // modal width offset
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

  // Helper to detect changes in column edit
  const detectColumnChanges = useCallback((editColumn: ColumnConfig, newCol: any) => {
    const changes: PendingEditColumnChanges = {};
    const uidtChanged = editColumn.uidt !== newCol.type;

    if (editColumn.title !== newCol.title) {
      changes.title = newCol.title;
    }
    
    const newDescription = newCol.description ?? '';
    const currentDescription = editColumn.description ?? '';
    if (currentDescription !== newDescription) {
      changes.description = newDescription;
    }
    
    if (uidtChanged) {
      changes.uidt = newCol.type;
      changes.meta = newCol.meta || {};
    } else if (JSON.stringify(editColumn.meta ?? {}) !== JSON.stringify(newCol.meta ?? {})) {
      changes.meta = newCol.meta;
    }

    return { changes, uidtChanged };
  }, []);

  // Persist column edits; only calls API if actual changes exist.
  const handleSaveEditColumn = useCallback(async (newCol: any) => {
    if (editColumnIndex === null || !editColumn) return;
    
    const { changes, uidtChanged } = detectColumnChanges(editColumn, newCol);

    if (uidtChanged) {
      const currentTableViews = getCurrentTableViews();
      const viewsToUse = getViewsToUse();
      
      if (!validateFieldTypeChange(editColumn.id!, currentTableViews, viewsToUse)) {
        return; // Block the update
      }
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
        safeRefresh();
        setEditModalOpen(false);
        setEditColumn(null);
        setEditColumnIndex(null);
      }
    } else {
      setEditModalOpen(false);
      setEditColumn(null);
      setEditColumnIndex(null);
    }
  }, [editColumnIndex, editColumn, updateFieldMutation, safeRefresh, detectColumnChanges, getCurrentTableViews, getViewsToUse, validateFieldTypeChange]);

  // Confirm handler for UpdateFieldConfirmModal
  const handleConfirmUpdateField = useCallback(async () => {
    if (pendingEditColumnChanges && editColumn) {
      await updateFieldMutation.mutateAsync({
        fieldId: editColumn.id!,
        updatedValue: pendingEditColumnChanges,
      });
      safeRefresh();
    }    
    setUpdateFieldConfirmModalOpen(false);
    setPendingEditColumnChanges(null);
    setEditModalOpen(false);
    setEditColumn(null);
    setEditColumnIndex(null);
    toast?.success('Column type updated', { title: 'Success' });
  }, [pendingEditColumnChanges, editColumn, updateFieldMutation, safeRefresh]);

  // Ask for confirmation then delete a column
  const handleDeleteColumn = useCallback(async (columnId: string) => {
    const column = columns.find(col => String(col.id) === String(columnId));

    // Check if it's a system field
    if (column?.isSystem || column?.system) {
      toast?.error('System fields cannot be deleted', { title: 'Error' });
      return;
    }

    const currentTableViews = getCurrentTableViews();
    const viewsToUse = getViewsToUse();

    // Check if field is used as a CRITICAL field
    if (checkAndBlockCriticalFieldUsage(columnId, viewsToUse, 'delete')) {
      return;
    }
    
    // Check general field usage
    if (checkAndBlockGeneralFieldUsage(columnId, currentTableViews, 'delete')) {
      return;
    }

    // Check if field is used in formulas (warning, not blocking)
    const fieldTitle = column?.title || column?.key || '';
    const formulaUsage = checkFieldUsageInFormulas(fieldTitle, columns);
    
    if (formulaUsage.isUsedInFormulas) {
      const formulaNames = formulaUsage.usedInFormulas.map(f => `"${f.columnTitle}"`);
      setFormulaUsageWarning(formulaNames);
    } else {
      setFormulaUsageWarning(null);
    }

    setDeleteConfirmModalOpen(true);
    setColumnToDelete(columnId);
  }, [columns, toast, getCurrentTableViews, getViewsToUse, checkAndBlockCriticalFieldUsage, checkAndBlockGeneralFieldUsage]);

  // Finalize column deletion after confirmation
  const handleConfirmDeleteColumn = useCallback(async () => {
    if (!columnToDelete) return;
    
    const currentTableViews = getCurrentTableViews();
    const viewsToUse = getViewsToUse();
    
    // Double-check critical field usage before deletion
    if (checkAndBlockCriticalFieldUsage(columnToDelete, viewsToUse, 'delete')) {
      setDeleteConfirmModalOpen(false);
      setColumnToDelete(null);
      return;
    }
    
    // Double-check general field usage
    if (checkAndBlockGeneralFieldUsage(columnToDelete, currentTableViews, 'delete')) {
      setDeleteConfirmModalOpen(false);
      setColumnToDelete(null);
      return;
    }
    
    try {
      const deletedColumn = columns.find(col => col.id === columnToDelete);
      const columnWidthKeyById = deletedColumn?.id ? String(deletedColumn.id) : undefined;
      const columnWidthKeyByName = deletedColumn?.key;

      // Call the API to delete the column
      await deleteColumnMutation.mutateAsync({
        tableId,
        fieldId: columnToDelete
      });

      // Remove column width from view config only if it was saved (not default)
      if ((columnWidthKeyById || columnWidthKeyByName) && viewConfigState?.columnWidths && setViewConfigState) {
        const newConfigState = {
          ...viewConfigState,
          columnWidths: {
            ...viewConfigState.columnWidths
          }
        };
        if (columnWidthKeyById) {
          delete newConfigState.columnWidths[columnWidthKeyById];
        }
        if (columnWidthKeyByName) {
          delete newConfigState.columnWidths[columnWidthKeyByName];
        }
        setViewConfigState(newConfigState);
        if (updateViewConfigBackend) {
          await updateViewConfigBackend(newConfigState);
        }
      }

      setDeleteConfirmModalOpen(false);
      setColumnToDelete(null);
      toast?.success(`Successfully deleted column "${deletedColumn?.title || 'Unknown'}"`, { title: 'Success' });
      safeRefresh();
    } catch (err) {
      console.error('Failed to delete column:', err);
      const errorMessage = err instanceof Error ? err.message : '';
      toast?.error(`Failed to delete column. Please try again. ${errorMessage}`, { title: 'Error' });
    }
  }, [columnToDelete, columns, deleteColumnMutation, tableId, viewConfigState, setViewConfigState, updateViewConfigBackend, toast, safeRefresh, getCurrentTableViews, getViewsToUse, checkAndBlockCriticalFieldUsage, checkAndBlockGeneralFieldUsage]);

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
      } catch (error: unknown) {
        console.error('Failed to reorder column:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to reorder column';
        toast?.error(errorMessage, { title: 'Error' });
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
    formulaUsageWarning,
    setFormulaUsageWarning,
    
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
