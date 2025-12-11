import React, { useMemo } from 'react';
import { FormPreview } from './FormPreview';
import { RightPanel } from './RightPanel';
import { useToast } from '../../../../components/common/Toast';
import { NewColumnModal } from '../../../../components/modals/NewColumnModal';
import DeleteConfirmModal from '../../../../components/modals/DeleteConfirmModal';
import { normalizeFieldType } from '../../../../utils/fieldType';
import { parseApiColumnMeta } from '../../../../components/shared/table/tableUtils';
import type { TableData } from '../../types/api.types';
import { Plus, PanelRight, PanelRightClose } from 'lucide-react';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews } from '../../../../utils/fieldUsageUtils';
import { useAllViews } from '../../../../hooks/useApi';
import UpdateFieldConfirmModal from '../../../../components/modals/UpdateFieldConfirmModal';
import { isFormulaField } from '../../../../utils/fieldUtils';
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
  
  // Use actions passed from hook (no need to re-instantiate)
  const toast = useToast();

  const view = tableData.views?.find((v: any) => v.id === viewId) as any;
  if (!view) {
    return null; // Match GridView: don't render anything if view not found
  }

  // Form data state hook
  const {
    rowData,
    formError,
    submitting,
    submitSuccess,
    setFormError,
    setSubmitting,
    setSubmitSuccess,
    handleRowDataChange,
    clearFormData,
    resetSuccess,
  } = useFormDataState();

  // Form modals hook
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

  // Form panel hook
  const {
    sidebarOpen,
    selectedFieldId,
    setSelectedFieldId,
    toggleSidebar,
    handleBackToFieldsList,
  } = useFormPanel();

  // Get processed data from local transformation (consistent with GridView pattern)
  // Optimized with Map for O(1) fieldConfig lookups instead of O(n) find() calls
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
    // Transform columns to form fields format, excluding system fields and formula fields
    // Optimized with Set for O(1) lookups instead of O(n) includes() calls
    const auditFieldTypesSet = new Set(['createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy']);
    const systemFieldNamesSet = new Set(['id', 'created_at', 'updated_at']);
    
    return allColumns
      .filter((column: any) => {
        // Always allow Title field even if marked as system
        if (column.column_name === 'title' || column.title === 'Title' || column.title?.toLowerCase().includes('title')) {
          return true;
        }
        
        // Exclude formula fields - they are calculated, not editable
        if (isFormulaField(column)) {
          return false;
        }
        
        // Exclude audit fields by type (uidt) - O(1) lookup with Set
        if (auditFieldTypesSet.has(column.uidt)) {
          return false;
        }
        
        // Exclude system fields by name - O(1) lookup with Set
        const isSystemFieldToExclude = column.system && systemFieldNamesSet.has(column.column_name?.toLowerCase());
        if (isSystemFieldToExclude) {
          return false;
        }
        
        // Include all other fields (both system and non-system)
        return true;
      })
      .map((column: any) => ({
        id: String(column.id),
        key: String(column.column_name || column.title || column.id),
        name: column.title || column.column_name,
        title: column.title || column.column_name,
        label: column.title || column.column_name,
        // Normalize type using normalizeFieldType to match FIELD_TYPES keys (handles aliases and camelCase)
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
        // Additional API properties needed by FieldEditor
        column_name: column.column_name,
        meta: column.meta || {},
        virtual: column.virtual
      }));
  }, [allColumns]);

  // Create formFieldsMap for O(1) lookups in handler functions
  const formFieldsMap = useMemo(() => {
    return new Map(formFields.map(f => [f.id, f]));
  }, [formFields]);

  // Form view config hook (needs formFields to be defined first)
  const {
    formConfig,
    handleConfigChange,
  } = useFormViewConfig({
    view,
    formFields,
    updateAppearance: actions.updateAppearance,
  });

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
  // Optimized with Map for O(1) lookup instead of O(n) find()
  const handleDeleteField = (fieldId: string) => {
    const fieldToDelete = formFieldsMap.get(fieldId);
    
    // Check if it's a system field
    if (fieldToDelete?.isSystem || fieldToDelete?.system) {
      toast.error('System fields cannot be deleted', { title: 'Error' });
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
    
    // Check if field is used as a CRITICAL field
    const criticalFieldUsage = checkCriticalFieldUsageInViews(fieldId, viewsToUse, tableId);
    if (criticalFieldUsage.isUsedInViews) {
      const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
      toast.error(
        `Cannot delete field. It is used as a critical field in: ${viewNames}. Please change the view configuration first.`,
        { title: 'Field in Use' }
      );
      return;
    }
    
    // Check general field usage
    const fieldUsage = checkFieldUsageInViews(fieldId, currentTableViews);
    if (fieldUsage.isUsedInViews) {
      const viewNames = fieldUsage.usedInViews.map(v => v.viewName).join(', ');
      toast.error(
        `Cannot delete field. It is currently used in: ${viewNames}. Please remove the field from these views first.`,
        { title: 'Field in Use' }
      );
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

  const handleFieldOrderChange = async (newFields: any[]) => {
    try {
      await actions.updateFieldOrder(newFields, view);
      toast.success('Field order updated!');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update field order');
      console.error('Field order error:', err);
    }
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

const handleEditModalSave = async (updates: any) => {
  if (!editColumn) return;

  try {
    // Build the update object with all possible field properties
    const updateData = {
      title: updates.title,
      description: updates.description,
      type: updates.type,
      meta: updates.meta,
      required: updates.required,
      config: updates.config,
      // Add any additional field properties that need to be updated
      column_name: updates.column_name,
      order_index: updates.order_index
    };

    // Call handleFieldUpdate with complete update data
    await handleFieldUpdate(editColumn.id, updateData);
  } catch (err) {
    console.error('Failed to save field updates:', err);
    toast.error('Failed to update field');
  }
};

// Optimized with Map for O(1) lookup instead of O(n) find()
const handleFieldUpdate = async (fieldId: string, updates: any) => {
  const editingField = formFieldsMap.get(fieldId);
  if (!editingField) return;

  // Compare fields for changes
  const changes: any = {};
  // Normalize both sides for case-insensitive comparison (uidt might be uppercase, type from modal is lowercase)
  const uidtChanged = String(editingField.uidt || '').toLowerCase() !== String(updates.type || '').toLowerCase();

  // Build comprehensive changes object
  if (editingField.title !== updates.title) {
    changes.title = updates.title;
  }
  if ((editingField?.description ?? '') !== (updates.description ?? '')) {
    changes.description = updates.description;
  }
  if (uidtChanged) {
    changes.uidt = updates.type;
    // When type changes, use the new meta from the modal (which contains the new type's config)
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

  const hasChanges = Object.keys(changes).length > 0;

  if (!hasChanges) {
    setEditModalOpen(false);
    setEditColumn(null);
    return;
  }

  try {
    if (uidtChanged) {
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
      const criticalFieldUsage = checkCriticalFieldUsageInViews(fieldId, viewsToUse, tableId);
      
      if (criticalFieldUsage.isUsedInViews) {
        const viewNames = criticalFieldUsage.usedInViews.map(v => `${v.viewName} (${v.usageType})`).join(', ');
        toast.error(
          `Cannot change field type. This field is used as a critical field in: ${viewNames}. Please change the view configuration first.`,
          { title: 'Field in Use' }
        );
        return;
      }

      // Check general field usage
      const fieldUsage = checkFieldUsageInViews(fieldId, currentTableViews);
      if (fieldUsage.isUsedInViews) {
        const viewNames = fieldUsage.usedInViews.map(v => v.viewName).join(', ');
        toast.error(
          `Cannot change field type. This field is currently used in: ${viewNames}. Please remove the field from these views first, or change the field type in the view settings.`,
          { title: 'Field in Use' }
        );
        return;
      }

      // Store changes and show confirmation modal for type changes
      // Don't clear editColumn yet - we need it for the confirmation handler
      setPendingEditColumnChanges(changes);
      setUpdateFieldConfirmModalOpen(true);
      setEditModalOpen(false); // Only close the modal, don't clear editColumn
    } else {
      // Direct update for non-type changes
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

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: formConfig.appearance?.backgroundColor }}
    >
      {/* Header with Toggle and Add Field Button */}
      <div className="flex-shrink-0 bg-background border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">Form View</h1>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {formFields.length} field{formFields.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Inline Add Field Button */}
            <button
              ref={addFieldButtonRef}
              onClick={handleAddField}
              className="flex items-center gap-1 btn-primary p-2 rounded transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Field</span>
            </button>
            
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 border rounded-lg hover:bg-[var(--color-bg-brand-primary)] outline-none hover:text-black transition-all duration-200 hover:scale-105"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Form Preview */}
        <div className="flex-1 overflow-y-auto bg-background">
          <FormPreview
            config={formConfig}
            onClear={clearFormData}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
            rowData={rowData}
            onRowDataChange={handleRowDataChange}
            onFieldOrderChange={handleFieldOrderChange}
            onSubmit={(e) => {
              e.preventDefault(); // Prevent default form submission
              handleFormSubmit(e);
            }}
            onDeleteField={handleDeleteField}
            formError={formError}
            onResetSuccess={resetSuccess}
            // Pass attachment-specific props
            model_id={tableData?.model?.id}
            column_id={undefined} // Will be set per field in SortableFormField
            row_id={record?.id ? Number(record.id) : undefined}
            onEdit={handleFieldEdit}
            onConfigChange={handleConfigChange}
          />
        </div>

        {/* Right Panel - Fields List and Editor */}
        <div className={`bg-card border-l flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0 overflow-hidden'
        }`}>
          {sidebarOpen && (
            <RightPanel
              config={formConfig}
              selectedFieldId={selectedFieldId}
              editingFieldId={selectedFieldId}
              onFieldSelect={setSelectedFieldId}
              onFieldToggle={handleFieldToggle}
              onAddField={handleAddField}
              onConfigChange={handleConfigChange}
              onFieldUpdate={handleFieldUpdate}
              onBackToFieldsList={handleBackToFieldsList}
              onDeleteField={handleDeleteField}
              setVisibleAllFields={handleSetVisibleAllFields}
              onFieldOrderChange={handleFieldOrderChange}
            />
          )}
        </div>
      </div>

      {/* New Column Modal */}
      {isNewColumnModalOpen && modalPosition && (
        <div className="fixed inset-0 z-50 bg-modal-backdrop" onClick={handleCloseNewColumnModal} />
      )}
      {isNewColumnModalOpen && modalPosition && (
        <div className="fixed z-50" style={{ top: modalPosition.top, left: modalPosition.left }}>
          <NewColumnModal
            isOpen={isNewColumnModalOpen}
            onClose={handleCloseNewColumnModal}
            onSave={handleCreateNewField}
            isAddNewField={true}
            fields={formFields}
          />
        </div>
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
          <div
            className="fixed inset-0 z-50 bg-modal-backdrop"
            onClick={handleCloseEditModal}
          />
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