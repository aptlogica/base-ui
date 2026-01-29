import React, { useMemo, Suspense, lazy } from 'react';
import { FormPreview } from './FormPreview';
import { RightPanel } from './RightPanel';
import { useToast } from '../../../../components/common/Toast';
const NewColumnModal = lazy(() => 
  import('../../../../components/modals/NewColumnModal').then(m => ({ default: m.NewColumnModal }))
);
import DeleteConfirmModal from '../../../../components/modals/DeleteConfirmModal';
import { normalizeFieldType } from '../../../../utils/fieldType';
import type { TableData } from '../../../../types/api.types';
import type { FormField } from '../../../../types/form';
import { Plus, PanelRight, PanelRightClose } from 'lucide-react';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews } from '../../../../utils/fieldUsageUtils';
import { useAllViews } from '../../../../hooks/useApi';
import UpdateFieldConfirmModal from '../../../../components/modals/UpdateFieldConfirmModal';
import { isFormulaField } from '../../../../utils/fieldUtils';
import { Loader } from '../../../../components/ui/Loader';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';
// Custom hooks
import { useFormDataState } from '../../hooks/useFormDataState';
import { useFormModals } from '../../hooks/useFormModals';
import { useFormViewConfig } from '../../hooks/useFormViewConfig';
import { useFormPanel } from '../../hooks/useFormPanel';

interface FormViewProps {
  tableData: TableData;
  viewId?: string;
  recordId?: string;
  onRefresh: () => void;
  actions: {
    addRow: any;
    insertRowData: any;
    deleteRecord: any;
    updateField: any;
    deleteColumn: any;
    createField: any;
    updateView: any;
    // Business logic methods
    submitForm: (formData: Record<string, any>, formFields: any[]) => Promise<void>;
    createNewField: (fieldConfig: any, allColumns: any[]) => Promise<void>;
    updateFieldData: (fieldId: string, updates: any, formFields: any[]) => Promise<void>;
    toggleFieldVisibility: (fieldId: string, view: any, formFields: any[]) => Promise<void>;
    setAllFieldsVisibility: (visible: boolean, view: any, formFields: any[]) => Promise<void>;
    updateFieldOrder: (newFields: any[], view: any) => Promise<void>;
    updateAppearance: (appearanceUpdates: any, view: any) => Promise<void>;
    deleteFieldData: (fieldId: string) => Promise<void>;
  };
}

// Extract field filtering logic
const shouldIncludeFieldInForm = (column: any): boolean => {
  // Always allow Title field even if marked as system
  if (column.column_name === 'title' || column.title === 'Title' || column.title?.toLowerCase().includes('title')) {
    return true;
  }
  
  // Exclude formula fields - they are calculated, not editable
  if (isFormulaField(column)) {
    return false;
  }
  
  // Exclude audit fields by type (uidt)
  const auditFieldTypesSet = new Set(['createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy']);
  if (auditFieldTypesSet.has(column.uidt)) {
    return false;
  }
  
  // Exclude system fields by name
  const systemFieldNamesSet = new Set(['id', 'created_at', 'updated_at']);
  const isSystemFieldToExclude = column.system && systemFieldNamesSet.has(column.column_name?.toLowerCase());
  if (isSystemFieldToExclude) {
    return false;
  }
  
  // Include all other fields (both system and non-system)
  return true;
};

// Extract field transformation logic
const transformColumnToFormField = (column: any): FormField => {
  return {
    id: String(column.id),
    key: String(column.column_name || column.title || column.id),
    name: column.title || column.column_name,
    title: column.title || column.column_name,
    label: column.title || column.column_name,
    type: normalizeFieldType(column.uidt || 'text'),
    uidt: column.uidt,
    position: column.position || column.order_index || 0,
    order_index: column.order_index || 0,
    required: Boolean(column.required),
    enabled: !column.isHidden && !column.is_hidden,
    description: column.description || '',
    config: column.meta || {},
    isSystem: Boolean(column.system),
    system: Boolean(column.system),
    hidden: Boolean(column.hidden),
    is_hidden: Boolean(column.isHidden || column.is_hidden),
    column_name: column.column_name,
    meta: column.meta || {},
    virtual: column.virtual
  };
};

// Extract view filtering logic
const getCurrentTableViews = (tableId: string, allViews: any[]): any[] => {
  if (!tableId || !allViews) return [];
  return allViews.filter((view: any) => {
    const viewTableId = String(view.model_id || view.modelId || '');
    return viewTableId === String(tableId);
  });
};

const getViewsToUse = (tableData: TableData, allViews: any[]): any[] => {
  if (tableData?.views && Array.isArray(tableData.views) && tableData.views.length > 0) {
    return tableData.views;
  }
  return allViews;
};

// Extract field usage validation logic
const validateFieldUsageForDelete = (
  fieldId: string,
  tableId: string,
  allViews: any[],
  tableData: TableData,
  toast: any
): boolean => {
  const currentTableViews = getCurrentTableViews(tableId, allViews);
  const viewsToUse = getViewsToUse(tableData, allViews);
  
  const criticalFieldUsage = checkCriticalFieldUsageInViews(fieldId, viewsToUse, tableId);
  if (criticalFieldUsage.isUsedInViews) {
    const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
    toast.error(
      `Cannot delete field. It is used as a critical field in: ${viewNames}. Please change the view configuration first.`,
      { title: 'Field in Use' }
    );
    return false;
  }
  
  const fieldUsage = checkFieldUsageInViews(fieldId, currentTableViews);
  if (fieldUsage.isUsedInViews) {
    const viewNames = fieldUsage.usedInViews.map(v => v.viewName).join(', ');
    toast.error(
      `Cannot delete field. It is currently used in: ${viewNames}. Please remove the field from these views first.`,
      { title: 'Field in Use' }
    );
    return false;
  }
  
  return true;
};

const validateFieldUsageForTypeChange = (
  fieldId: string,
  tableId: string,
  allViews: any[],
  tableData: TableData,
  toast: any
): boolean => {
  const currentTableViews = getCurrentTableViews(tableId, allViews);
  const viewsToUse = getViewsToUse(tableData, allViews);
  
  const criticalFieldUsage = checkCriticalFieldUsageInViews(fieldId, viewsToUse, tableId);
  if (criticalFieldUsage.isUsedInViews) {
    const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
    toast.error(
      `Cannot change field type. This field is used as a critical field in: ${viewNames}. Please change the view configuration first.`,
      { title: 'Field in Use' }
    );
    return false;
  }
  
  const fieldUsage = checkFieldUsageInViews(fieldId, currentTableViews);
  if (fieldUsage.isUsedInViews) {
    const viewNames = fieldUsage.usedInViews.map(v => v.viewName).join(', ');
    toast.error(
      `Cannot change field type. This field is currently used in: ${viewNames}. Please remove the field from these views first, or change the field type in the view settings.`,
      { title: 'Field in Use' }
    );
    return false;
  }
  
  return true;
};

// Extract change detection logic
const detectFieldChanges = (editingField: FormField, updates: any): any => {
  const changes: any = {};
  const uidtChanged = String(editingField.uidt || '').toLowerCase() !== String(updates.type || '').toLowerCase();

  if (editingField.title !== updates.title) {
    changes.title = updates.title;
  }
  if ((editingField?.description ?? '') !== (updates.description ?? '')) {
    changes.description = updates.description;
  }
  if (uidtChanged) {
    changes.uidt = updates.type;
    changes.meta = updates.meta || {};
  } else if (JSON.stringify(editingField.meta ?? {}) !== JSON.stringify(updates.meta ?? {})) {
    changes.meta = updates.meta;
  }
  if (editingField.required !== updates.required) {
    changes.required = updates.required;
  }
  if (JSON.stringify(editingField.config ?? {}) !== JSON.stringify(updates.config ?? {})) {
    changes.config = updates.config;
  }

  return { changes, uidtChanged };
};

export const FormView: React.FC<FormViewProps> = ({ tableData, viewId, recordId, onRefresh, actions }) => {
  // Get all views for field usage validation
  const { data: allViews = [] } = useAllViews();

  const record = useMemo(() => {
    if (!tableData?.records || !Array.isArray(tableData.records)) return null;
    
    let targetRecord: any = null;
    
    if (recordId && tableData.records.length > 0) {
      const foundRecord = tableData.records.find((r: any) => String(r.id) === String(recordId));
      if (foundRecord) {
        targetRecord = {
          id: String(foundRecord.id),
          _meta: {
            id: String(foundRecord.id),
            created_at: String(foundRecord.created_at ?? ''),
            updated_at: String(foundRecord.updated_at ?? ''),
            deleted_at: null,
          },
          data: { ...foundRecord },
        };
      }
    } else if (tableData.records.length > 0) {
      // Use first record if no specific recordId
      const firstRecord = tableData.records[0];
      targetRecord = {
        id: String(firstRecord.id),
        _meta: {
          id: String(firstRecord.id),
          created_at: String(firstRecord.created_at ?? ''),
          updated_at: String(firstRecord.updated_at ?? ''),
          deleted_at: null,
        },
        data: { ...firstRecord },
      };
    }
    
    return targetRecord;
  }, [tableData?.records, recordId]);

  // Extract IDs from tableData.model
  const tableId = useMemo(() => String(tableData?.model?.id ?? ''), [tableData?.model?.id]);
  const baseId = useMemo(() => String(tableData?.model?.base_id ?? ''), [tableData?.model?.base_id]);
  
  // Check permissions for read-only access
  const { isBaseReadOnly, canCreateColumn } = useBaseAccess(baseId || undefined);
  const isReadOnly = isBaseReadOnly();
  
  // Use actions passed from hook (no need to re-instantiate)
  const toast = useToast();

  // Form data state hook - MUST be called before any early returns
  const {
    rowData,
    formError,
    setFormError,
    setSubmitting,
    setSubmitSuccess,
    handleRowDataChange,
    clearFormData,
  } = useFormDataState();

  // Form modals hook - MUST be called before any early returns
  const {
    isNewColumnModalOpen,
    deleteConfirmModalOpen,
    fieldToDelete,
    modalPosition,
    editColumn,
    editModalOpen,
    updateFieldConfirmModalOpen,
    pendingEditColumnChanges,
    addFieldButtonRef,
    handleAddField,
    handleCloseNewColumnModal,
    handleFieldEdit: handleFieldEditFromHook,
    handleCloseEditModal,
    handleDeleteField: handleDeleteFieldFromHook,
    handleCloseDeleteConfirmModal,
    handleCloseUpdateFieldConfirmModal,
    setPendingEditColumnChanges,
    setEditModalOpen,
    setEditColumn,
    setUpdateFieldConfirmModalOpen,
  } = useFormModals();

  // Form panel hook - MUST be called before any early returns
  const {
    sidebarOpen,
    selectedFieldId,
    setSelectedFieldId,
    toggleSidebar,
  } = useFormPanel();

  // Get view - compute before hooks that depend on it
  const view = useMemo(() => {
    return tableData.views?.find((v: any) => v.id === viewId) as any;
  }, [tableData?.views, viewId]);

  // Get processed data from local transformation (consistent with GridView pattern)
  // Optimized with Map for O(1) fieldConfig lookups instead of O(n) find() calls
  // MUST be called before early return
  const allColumns = useMemo(() => {
    if (!tableData?.columns) return [];
    
    const viewFieldConfig = view?.meta?.fieldConfig || [];
    
    // Create a Map for O(1) field config lookups instead of O(n) find() calls
    const fieldConfigMap = new Map(
      viewFieldConfig.map((fc: any) => [String(fc.id), fc])
    );
    
    // Map columns with view-specific configuration
    const mapped = tableData.columns.map((col: any, index: number) => {
      const config = fieldConfigMap.get(String(col.id)) as any;
      return {
        ...col,
        position: config?.position ?? index,
        isHidden: typeof config?.isHidden === 'boolean' ? config.isHidden : !!col.is_hidden || false
      };
    });

    // Sort by position for consistent ordering
    return mapped.sort((a: any, b: any) => (a.position ?? 999) - (b.position ?? 999));
  }, [tableData?.columns, view?.meta?.fieldConfig]);

  const formFields = useMemo(() => {
    return allColumns
      .filter(shouldIncludeFieldInForm)
      .map(transformColumnToFormField);
  }, [allColumns]);

  // Create formFieldsMap for O(1) lookups in handler functions
  // MUST be called before early return
  const formFieldsMap = useMemo(() => {
    return new Map(formFields.map(f => [f.id, f]));
  }, [formFields]);

  // Form view config hook (needs formFields to be defined first)
  // MUST be called before early return
  const {
    formConfig,
    handleConfigChange,
  } = useFormViewConfig({
    view: view || {} as any,
    formFields,
    updateAppearance: actions.updateAppearance,
  });

  // Extract sidebar class name - MUST be before early return
  const sidebarClassName = useMemo(() => {
    return sidebarOpen 
      ? 'bg-card border-l flex flex-col transition-all duration-300 ease-in-out w-[400px] opacity-100'
      : 'bg-card border-l flex flex-col transition-all duration-300 ease-in-out w-0 opacity-0 overflow-hidden';
  }, [sidebarOpen]);

  // Early return after all hooks
  if (!view) {
    return null; // Match GridView: don't render anything if view not found
  }

  // Handle form submit - delegate to data layer
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await actions.submitForm(rowData, formFields);
      
      // Show success toast notification first
      toast.success('Successfully submitted form data');
      
      // Reset form
      clearFormData();
      setSubmitSuccess(true);
      setSubmitting(false);
      
      // Refresh data after a short delay to ensure toast is shown
      setTimeout(() => {
        onRefresh?.();
      }, 100);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save form data.');
      setSubmitting(false);
      toast.error('Failed to submit form. Please try again.');
      console.error('Form submission error:', err);
    }
  };


  // Handle new field creation from modal - delegate to data layer
  const handleCreateNewField = async (fieldConfig: any) => {
    try {
      await actions.createNewField(fieldConfig, allColumns);
      toast.success('Field added successfully!');
      handleCloseNewColumnModal();
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to add field. Please try again.');
      console.error('Add field error:', err);
    }
  };

  // Handler functions for interactive features
  const handleFieldToggle = async (fieldId: string) => {
    try {
      await actions.toggleFieldVisibility(fieldId, view, formFields);
      toast.success('Field visibility updated!');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update field visibility');
      console.error('Field toggle error:', err);
    }
  };

  // Wrapper for handleDeleteField to add validation
  const handleDeleteField = (fieldId: string) => {
    const fieldToDelete = formFieldsMap.get(fieldId);
    
    if (fieldToDelete?.isSystem || fieldToDelete?.system) {
      toast.error('System fields cannot be deleted', { title: 'Error' });
      return;
    }
    
    if (!validateFieldUsageForDelete(fieldId, tableId, allViews, tableData, toast)) {
      return;
    }
    
    handleDeleteFieldFromHook(fieldId);
  };

  const handleConfirmDeleteField = async () => {
    if (!fieldToDelete) return;
    
    try {
      await actions.deleteFieldData(fieldToDelete);
      toast.success('Field deleted successfully!');
      onRefresh();
      // Clear selection if deleted field was selected
      if (selectedFieldId === fieldToDelete) {
        setSelectedFieldId(null);
      }
    } catch (err: any) {
      toast.error('Failed to delete field');
      console.error('Field deletion error:', err);
    } finally {
      handleCloseDeleteConfirmModal();
    }
  };

  const handleSetVisibleAllFields = async (visible: boolean) => {
    try {
      await actions.setAllFieldsVisibility(visible, view, formFields);
      toast.success(visible ? 'All fields shown' : 'All fields hidden');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update field visibility');
      console.error('Set all fields visibility error:', err);
    }
  };

  const handleFieldOrderChange = (newFields: FormField[]) => {
    actions.updateFieldOrder(newFields, view).then(() => {
      toast.success('Field order updated!');
      onRefresh();
    }).catch((err: any) => {
      toast.error('Failed to update field order');
      console.error('Field order error:', err);
    });
  };

  // Wrapper for handleFieldEdit to add validation
  // Optimized with Map for O(1) lookup instead of O(n) find()
  const handleFieldEdit = (fieldId: string) => {
    const field = formFieldsMap.get(fieldId);

    if (!field) return;

    if (field.isSystem) {
      toast.error('System fields cannot be edited', { title: 'Error' });
      return;
    }

    handleFieldEditFromHook(field);
  };

  // Wrapper for handleFieldUpdate that captures necessary context
  const handleFieldUpdate = async (fieldId: string, updates: any) => {
    const editingField = formFieldsMap.get(fieldId);
    if (!editingField) return;

    const { changes, uidtChanged } = detectFieldChanges(editingField, updates);

    if (Object.keys(changes).length === 0) {
      setEditModalOpen(false);
      setEditColumn(null);
      return;
    }

    try {
      if (uidtChanged) {
        if (!validateFieldUsageForTypeChange(fieldId, tableId, allViews, tableData, toast)) {
          return;
        }

        setPendingEditColumnChanges(changes);
        setUpdateFieldConfirmModalOpen(true);
        setEditModalOpen(false);
      } else {
        await actions.updateField.mutateAsync({
          fieldId: fieldId,
          updatedValue: changes
        });
        
        handleCloseEditModal();
        toast.success('Field updated successfully');
        onRefresh?.();
      }
    } catch (err) {
      console.error('Failed to update field:', err);
      toast.error('Failed to update field');
    }
  };

  const handleEditModalSave = async (updates: any) => {
    if (!editColumn) return;

    const updateData = {
      title: updates.title,
      description: updates.description,
      type: updates.type,
      meta: updates.meta,
      required: updates.required,
      config: updates.config,
      column_name: updates.column_name,
      order_index: updates.order_index
    };

    await handleFieldUpdate(editColumn.id, updateData);
  };

  const handleConfirmUpdateField = async () => {
    if (!pendingEditColumnChanges || !editColumn) return;

    try {
      await actions.updateField.mutateAsync({
        fieldId: editColumn.id,
        updatedValue: pendingEditColumnChanges
      });
      
      toast.success('Field updated successfully');
    } catch (err) {
      console.error('Failed to update field:', err);
      toast.error('Failed to update field');
    } finally {
      handleCloseUpdateFieldConfirmModal();
      setEditModalOpen(false);
      setEditColumn(null);
      onRefresh?.();
    }
  };

  // Extract header rendering
  const renderHeader = () => (
    <div className="flex-shrink-0 bg-background border-b border-border/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">Form View</h1>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formFields.length} field{formFields.length === 1 ? '' : 's'}
          </span>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {canCreateColumn() && !isReadOnly && (
            <button
              ref={addFieldButtonRef}
              onClick={handleAddField}
              className="flex items-center gap-1 btn-primary p-2 rounded transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Field</span>
            </button>
          )}
          
          {!isReadOnly && (
            <button
              onClick={toggleSidebar}
              className="p-2 border rounded-xl hover:bg-gray-200 outline-none hover:text-black transition-all duration-200 hover:scale-105"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRight className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Extract main content rendering - compute props inline to reduce complexity
  const renderFormPreview = () => {
    const previewHandlers = isReadOnly ? {
      onClear: undefined,
      onSubmit: undefined,
      onEdit: undefined,
      onConfigChange: undefined
    } : {
      onClear: clearFormData,
      onSubmit: (e: React.FormEvent) => {
        e.preventDefault();
        handleFormSubmit(e);
      },
      onEdit: handleFieldEdit,
      onConfigChange: handleConfigChange
    };

    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <FormPreview
          config={formConfig}
          onClear={previewHandlers.onClear}
          selectedFieldId={selectedFieldId}
          rowData={rowData}
          onRowDataChange={handleRowDataChange}
          onFieldOrderChange={handleFieldOrderChange}
          onSubmit={previewHandlers.onSubmit}
          onDeleteField={handleDeleteField}
          formError={formError}
          model_id={tableData?.model?.id}
          row_id={record?.id ? Number(record.id) : undefined}
          onEdit={previewHandlers.onEdit}
          onConfigChange={previewHandlers.onConfigChange}
          isReadOnly={isReadOnly}
        />
      </div>
    );
  };

  const renderRightPanel = () => {
    const panelHandlers = isReadOnly ? {
      onFieldToggle: undefined,
      onConfigChange: undefined,
      onFieldUpdate: undefined,
      onDeleteField: undefined,
      setVisibleAllFields: undefined,
      onFieldOrderChange: undefined
    } : {
      onFieldToggle: handleFieldToggle,
      onConfigChange: handleConfigChange,
      onFieldUpdate: handleFieldUpdate,
      onDeleteField: handleDeleteField,
      setVisibleAllFields: handleSetVisibleAllFields,
      onFieldOrderChange: handleFieldOrderChange
    };

    return (
      <div className={sidebarClassName}>
        {sidebarOpen && (
          <RightPanel
            config={formConfig}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
            onFieldToggle={panelHandlers.onFieldToggle}
            onConfigChange={panelHandlers.onConfigChange}
            onDeleteField={panelHandlers.onDeleteField}
            setVisibleAllFields={panelHandlers.setVisibleAllFields}
            onFieldOrderChange={panelHandlers.onFieldOrderChange}
            isReadOnly={isReadOnly}
          />
        )}
      </div>
    );
  };

  const renderMainContent = () => (
    <div className="flex-1 flex overflow-hidden">
      {renderFormPreview()}
      {renderRightPanel()}
    </div>
  );

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: formConfig.appearance?.backgroundColor }}
    >
      {renderHeader()}
      {renderMainContent()}

      {/* New Column Modal */}
      {isNewColumnModalOpen && modalPosition && (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-modal-backdrop border-0 p-0 cursor-pointer"
          onClick={handleCloseNewColumnModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleCloseNewColumnModal();
            }
          }}
          aria-label="Close modal"
        />
      )}
      {isNewColumnModalOpen && modalPosition && (
        <Suspense fallback={
          <div className="fixed z-50" style={{ top: modalPosition.top, left: modalPosition.left }}>
            <div className="bg-background border border-border rounded-xl shadow-lg p-8 min-w-[400px]">
              <Loader size={8} />
            </div>
          </div>
        }>
          <div className="fixed z-50" style={{ top: modalPosition.top, left: modalPosition.left }}>
            <NewColumnModal
              isOpen={isNewColumnModalOpen}
              onClose={handleCloseNewColumnModal}
              onSave={handleCreateNewField}
              isAddNewField={true}
              fields={formFields}
            />
          </div>
        </Suspense>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModalOpen && fieldToDelete && (
        <DeleteConfirmModal
          isOpen={deleteConfirmModalOpen}
          onClose={handleCloseDeleteConfirmModal}
          onConfirm={handleConfirmDeleteField}
          title="Delete Field"
          message={`Are you sure you want to delete the field "${formFieldsMap.get(fieldToDelete)?.title || 'Unknown Field'}"? This action cannot be undone.`}
        />
      )}

      {editModalOpen && editColumn && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-modal-backdrop border-0 p-0 cursor-pointer"
            onClick={handleCloseEditModal}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleCloseEditModal();
              }
            }}
            aria-label="Close modal"
            tabIndex={0}
          />
          <Suspense fallback={
            <div className="fixed z-50">
              <div className="bg-background border border-border rounded-xl shadow-lg p-8 min-w-[400px]">
                <Loader size={8} />
              </div>
            </div>
          }>
            <div
              className="fixed z-50"
            >
              <NewColumnModal
                isOpen={editModalOpen}
                onClose={handleCloseEditModal}
                onSave={handleEditModalSave}
                initialValues={editColumn}
                fields={formFields}
                isAddNewColumn={false}
                isAddNewField={true}
                currentTableId={tableId}
              />
            </div>
          </Suspense>
        </>
      )}

      {updateFieldConfirmModalOpen && (
        <UpdateFieldConfirmModal
          isOpen={updateFieldConfirmModalOpen}
          title="Field Type Change"
          message="This action cannot be undone. Converting data types may result in data loss; any incompatible filters will be removed. Proceed with caution!"
          onClose={handleCloseUpdateFieldConfirmModal}
          onConfirm={handleConfirmUpdateField}
        />
      )}
    </div>
  );
};