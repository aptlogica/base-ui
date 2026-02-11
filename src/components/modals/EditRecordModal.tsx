import React, { useEffect, useMemo, useState, useRef } from 'react';
import { X, Pencil, MoreHorizontal, Trash2 } from 'lucide-react';
import FieldRenderer from '../../plugins/FormViewPlugin/components/shared/FieldRenderer';
import { useInsertRowData } from '../../hooks/useApi';
import { getFieldTypeIconWithMargin } from '../../types/fieldTypes';
import {
  createFieldRendererProps,
  getFieldDisplayName,
  getFieldDefaultValue,
  getStandardFieldType
} from '../../utils/standardFieldUtils';
import { isFormulaField } from '../../utils/fieldUtils';
import { useBaseAccess } from '../../hooks/useBaseAccess';
import { useToast } from '../../components/common/Toast';

type EditRecordModalProps = {
  isOpen: boolean;
  table: any;
  fields: any[];
  recordId: string;
  onClose: () => void;
  onSuccess?: (args: { recordId: string }) => void;
  title?: string;
  submitLabel?: string;
  initialValues?: Record<string, any>; // keyed by field.id or field.name
  onDuplicate?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
};

const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  table,
  fields,
  recordId,
  onClose,
  onSuccess,
  title = 'Edit record',
  submitLabel = 'Save changes',
  initialValues = {},
  onDuplicate,
  onDelete,
}) => {
  const [showHidden, setShowHidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowData, setRowData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get base_id from table (could be table.base_id or table.model.base_id)
  const baseId = table?.base_id || table?.model?.base_id;
  const { canUpdateRecord, canDeleteRecord, isBaseReadOnly } = useBaseAccess(baseId);
  const isReadOnly = isBaseReadOnly();

  const insertValueMutation = useInsertRowData();
  const toast = useToast();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  // Check if field is an audit field (separate from system fields)
  const isAuditField = (field: any): boolean => {
    const auditFieldTypes = ['createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy'];
    return auditFieldTypes.includes(field.uidt);
  };

  // Filter out system fields except Title (audit fields are now completely hidden)
  const isSystemField = (field: any): boolean => {
    const fieldName = field.name?.toLowerCase() || '';
    const fieldTitle = field.title?.toLowerCase() || '';

    // Keep Title field visible (it's required for records) - check both name and title
    if (fieldName.includes('title') || fieldTitle.includes('title')) {
      return false;
    }

    // Hide audit fields completely - backend will auto-assign them
    if (isAuditField(field)) {
      return true;
    }

    // Hide other system fields
    return field.system;
  };



  const visibleFields = useMemo(
    () => (fields || []).filter(f => !f.is_hidden && !f.hidden && !isSystemField(f) && !isFormulaField(f)),
    [fields]
  );
  const hiddenFields = useMemo(
    () => (fields || []).filter(f => (f.is_hidden || f.hidden) && !isSystemField(f) && !isFormulaField(f)),
    [fields]
  );

  // Use standardized field default value utility
  const getDefaultValueFromConfig = (field: any): any => {
    return getFieldDefaultValue(field);
  };

  // Initialize row data with existing values and fallbacks
  useEffect(() => {
    if (!isOpen) return;
    const data: Record<string, any> = {};
    const original: Record<string, any> = {};
    (fields || []).forEach(field => {
      const byId = initialValues[field.id as string];
      const byName = initialValues[field.name as string];

      // Get initial value - extracted to avoid nested ternary
      const initial = byId ?? byName;

      const value = initial === undefined ? getDefaultValueFromConfig(field) : initial;
      data[field.id] = value;
      original[field.id] = value;
    });
    setRowData(data);
    setOriginalData(original);
    setShowHidden(false);
    setFormError(null);
    setSubmitting(false);
  }, [isOpen, fields, JSON.stringify(initialValues)]);

  const handleFieldChange = (field: any, value: unknown) => {
    setRowData(prev => ({ ...prev, [field.id]: value }));
  };

  const validateRequired = (): string[] => {
    const missing = (fields || [])
      .filter(f => f.required)
      .filter(f => {
        const v = rowData[f.id];
        if (Array.isArray(v)) return v.length === 0;
        if (v === null || v === undefined) return true;
        return String(v).trim() === '';
      })
      .map(f => f.name);
    return missing;
  };


  const normalizeValueForSave = (field: any, v: any) => {
    let value = v;
    if (value === undefined) value = '';
    const fieldType = getStandardFieldType(field);
    if (fieldType === 'json' && typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    } else if (fieldType === 'user') {
      // For user fields with allowMultiple, convert array to comma-separated string
      const userConfig = (field.meta) || {};
      if (userConfig.allowMultiple && Array.isArray(value)) {
        return value.filter(id => id?.toString().trim()).join(',');
      }
      return value;
    } else if ((fieldType === 'date' || field.uidt === 'date') && value instanceof Date) {
      // Convert Date objects to ISO date string (YYYY-MM-DD)
      return value.toISOString().split('T')[0];
    } else if ((fieldType === 'datetime' || field.uidt === 'datetime') && value instanceof Date) {
      // Convert Date objects to ISO datetime string
      return value.toISOString();
    }
    return value;
  };

  const valuesEqual = (field: any, a: any, b: any) => {
    const na = normalizeValueForSave(field, a);
    const nb = normalizeValueForSave(field, b);
    return String(na) === String(nb);
  };

  const hasChanges = useMemo(() => {
    return (fields || []).some(field => {
      if (field.type === 'attachment' || field.uidt === 'attachment') {
        return false;
      }
      return !valuesEqual(field, originalData[field.id], rowData[field.id]);
    });
  }, [fields, originalData, rowData]);

  const isSaveDisabled = submitting || !hasChanges;

  const handleSave = async () => {
    // Check permission before saving
    if (!canUpdateRecord()) {
      setFormError('You do not have permission to edit records.');
      return;
    }

    setFormError(null);
    const missing = validateRequired();
    if (missing.length) {
      setFormError('Required field(s) must not be left empty.');
      return;
    }

    try {
      setSubmitting(true);
      const updates = (fields || [])
        .filter(f => {
          // Skip attachment fields - they handle their own API calls
          if (f.type === 'attachment' || f.uidt === 'attachment') {
            return false;
          }
          return !valuesEqual(f, originalData[f.id], rowData[f.id]);
        })
        .map(f => ({
          fieldId: f.id,
          value: normalizeValueForSave(f, rowData[f.id])
        }));

      await Promise.all(
        updates.map(u =>
          insertValueMutation.mutateAsync({
            model_id: String(table.id),
            column_id: String(u.fieldId),
            row_id: Number(recordId),
            value: u.value,
          })
        )
      );

      toast.success('Record updated successfully');
      setSubmitting(false);
      onSuccess?.({ recordId });
      onClose();
    } catch (err) {
      console.error('Failed to save record', err);
      setSubmitting(false);
      setFormError('Failed to save changes. Please try again.');
    }
  };

  if (!isOpen) return null;

  const renderField = (field: any) => {
    let value = rowData[field.id];

    // Handle links fields - ensure value is always an array
    if (field.type === 'links' || field.uidt === 'links') {
      if (!value || (typeof value === 'object' && !Array.isArray(value))) {
        value = [];
      }
    }

    const fieldRendererProps = createFieldRendererProps(
      field,
      value,
      isReadOnly ? () => { } : (v: any) => handleFieldChange(field, v),
      {
        isBorder: true,
        readOnly: isReadOnly,
        allowEdit: !isReadOnly,
      }
    );

    // For attachment fields, pass model_id, column_id, and row_id
    const attachmentProps = (field.type === 'attachment' || field.uidt === 'attachment') ? {
      model_id: String(table.id),
      column_id: field.id,
      row_id: Number(recordId),
      showPreview: false,
      persistImmediately: true, // Edit modal has row_id, so upload immediately
      readOnly: isReadOnly,
      allowEdit: !isReadOnly
    } : {};

    // For links fields, pass the field object and context
    const linksProps = (field.type === 'links' || field.uidt === 'links') ? {
      field: {
        id: field.id,
        title: field.title || field.name,
        meta: field.meta || field.config || {}
      },
      currentRowId: Number(recordId),
      currentTableId: String(table.id),
      persistImmediately: false, // Don't persist immediately in modal
      isBorder: true,
      disabled: isReadOnly
    } : {};

    return (
      <FieldRenderer key={field.id} {...fieldRendererProps} {...attachmentProps} {...linksProps} />
    );
  };

  return (
    <div className="bg-modal-backdrop relative"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="bg-modal w-full relative !p-0 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Pencil className="w-5 h-5 icons-primary flex-shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded truncate max-w-[150px] flex-shrink-0">{table?.title}</span>
              <h2 className="text-2xl font-semibold truncate">{title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 relative flex-shrink-0">
            {/* Menu button for duplicate/delete */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="p-2 rounded hover:bg-gray-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(v => !v);
                }}
                aria-label="Record menu"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 10000,
                    minWidth: 180,
                    background: 'var(--color-alpha-white)',
                    borderRadius: 8,
                    boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
                    padding: 5,
                    overflow: 'hidden'
                  }}
                  className="select-none border p-2 space-y-1 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {canDeleteRecord() && onDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-400 hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onDelete && recordId) {
                          onDelete(recordId);
                        }
                        setMenuOpen(false);
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> Delete record
                    </button>
                  )}
                </div>
              )}
            </div>
            <button type="button" className="p-2 flex-shrink-0" onClick={onClose} aria-label="Close">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-6">
            {/* Visible fields */}
            <div className="space-y-4">
              {visibleFields.map((field) => {
                return (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-center">
                    <div className="text-gray-600 flex items-center gap-2">
                      {getFieldTypeIconWithMargin(getStandardFieldType(field))}
                      <span className="text-sm">{getFieldDisplayName(field)}</span>
                      {field.required && <span className="text-red-500 ml-1 field-component-required">*</span>}
                    </div>
                    <div className="max-w-[560px] w-full">
                      {renderField(field)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hidden fields toggle */}
            {hiddenFields.length > 0 && (
              <div className="flex items-center gap-3 my-8">
                <div className="h-px bg-gray-200 flex-1" />
                <button
                  type="button"
                  className="px-4 py-2 rounded-full border text-sm text-primary bg-card hover:bg-gray-50"
                  onClick={() => setShowHidden(v => !v)}
                >
                  {showHidden ? `Hide ${hiddenFields.length} hidden fields` : `Show ${hiddenFields.length} hidden fields`}
                </button>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
            )}

            {/* Hidden fields */}
            {showHidden && hiddenFields.length > 0 && (
              <div className="space-y-4">
                {hiddenFields.map((field) => {
                  return (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-center">
                      <div className="text-gray-600 flex items-center gap-2">
                        {getFieldTypeIconWithMargin(getStandardFieldType(field))}
                        <span className="text-sm">{getFieldDisplayName(field)}</span>
                        {field.required && <span className="text-red-500 ml-1 field-component-required">*</span>}
                      </div>
                      <div className="max-w-[560px] w-full">{renderField(field)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {formError && (
              <div className="mt-4 text-red-600 text-sm">{formError}</div>
            )}
          </div>
        </div>

        {/* Footer - Fixed at Bottom */}
        {canUpdateRecord() && (
          <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaveDisabled}
              onClick={handleSave}
              className={`px-16 py-2 rounded-xl btn-primary ${isSaveDisabled ? 'opacity-60 cursor-not-allowed' : ''
                }`}
            >
              {submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditRecordModal;
