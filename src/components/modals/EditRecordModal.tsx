// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { X, Table2, MoreVertical, Trash2, Copy } from 'lucide-react';
import FieldRenderer from '../../plugins/FormViewPlugin/components/shared/FieldRenderer';
import { useUpdateRowData, useAddAttachment, useRemoveAttachments, useInsertRelationData } from '../../hooks/useApi';
import { getFieldTypeIconWithMargin, getRelationTypeFromField } from '../../types/fieldTypes';
import {
  createFieldRendererProps,
  getFieldDisplayName,
  getFieldDefaultValue,
  getStandardFieldType
} from '../../utils/standardFieldUtils';
import { isFormulaField } from '../../utils/fieldUtils';
import { apiErrorMessage } from '../../utils/apiErrors';
import { useRequiredKeyFields } from '../../hooks/useRequiredKeyFields';
import { isEmptyKeyValue, missingKeyColumnIds, missingKeyMessage } from '../../utils/primaryKeyFields';
import { cachedTableRecords, linkItemIdentity, linkItems, linkRowIds } from '../../utils/linkValues';
import { useQueryClient } from '@tanstack/react-query';
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
  // Most inputs only commit their value on blur, so typing anywhere in the form counts as an edit right away
  const [hasTyped, setHasTyped] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get base_id from table (could be table.base_id or table.model.base_id)
  const baseId = table?.base_id || table?.model?.base_id;
  const { canUpdateRecord, canDeleteRecord, isBaseReadOnly } = useBaseAccess(baseId);
  const isReadOnly = isBaseReadOnly();

  const updateRowDataMutation = useUpdateRowData();
  const addAttachmentMutation = useAddAttachment();
  const removeAttachmentsMutation = useRemoveAttachments();
  const insertRelationMutation = useInsertRelationData();
  const toast = useToast();
  // Primary key fields (without Id) can't be left empty
  const keyColumnIds = useRequiredKeyFields(table?.id, fields);
  const isKeyField = (field: any): boolean => keyColumnIds.includes(String(field.id));
  const queryClient = useQueryClient();

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



  // Key fields are always shown, even when hidden in the view
  const visibleFields = useMemo(
    () => (fields || []).filter(f => (keyColumnIds.includes(String(f.id)) || (!f.is_hidden && !f.hidden && !isSystemField(f))) && !isFormulaField(f)),
    [fields, keyColumnIds]
  );
  const hiddenFields = useMemo(
    () => (fields || []).filter(f => (f.is_hidden || f.hidden) && !isSystemField(f) && !isFormulaField(f) && !keyColumnIds.includes(String(f.id))),
    [fields, keyColumnIds]
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
    setHasTyped(false);
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
    } else if (fieldType === 'links' || field.uidt === 'links') {
      const records = cachedTableRecords(queryClient, field?.meta?.relation?.with);
      const ids = linkItems(value)
        .map(item => linkItemIdentity(item, records))
        .filter((id: string) => id.trim() !== '')
        .sort((a, b) => a.localeCompare(b));
      return ids.join(',');
    }
    return value;
  };

  const valuesEqual = (field: any, a: any, b: any) => {
    const na = normalizeValueForSave(field, a);
    const nb = normalizeValueForSave(field, b);
    return String(na) === String(nb);
  };

  const getAttachmentKey = (file: any): string => {
    return String(file?.id ?? file?.url ?? file?.name ?? '');
  };

  const hasAttachmentChanges = (field: any): boolean => {
    const currentFiles = Array.isArray(rowData[field.id]) ? rowData[field.id] : [];
    const originalFiles = Array.isArray(originalData[field.id]) ? originalData[field.id] : [];

    if (currentFiles.some((file: any) => file?.file instanceof File)) {
      return true;
    }

    const currentKeys = new Set(currentFiles.map(getAttachmentKey).filter(Boolean));
    const originalKeys = new Set(originalFiles.map(getAttachmentKey).filter(Boolean));

    if (currentKeys.size !== originalKeys.size) {
      return true;
    }

    for (const key of originalKeys) {
      if (!currentKeys.has(key)) {
        return true;
      }
    }

    return false;
  };

  const hasChanges = useMemo(() => {
    return (fields || []).some(field => {
      if (field.type === 'attachment' || field.uidt === 'attachment') {
        return hasAttachmentChanges(field);
      }
      return !valuesEqual(field, originalData[field.id], rowData[field.id]);
    });
  }, [fields, originalData, rowData]);

  const isSaveDisabled = submitting || !(hasChanges || hasTyped);

  const handleSave = async () => {
    // Check permission before saving
    if (!canUpdateRecord()) {
      setFormError('You do not have permission to edit records.');
      return;
    }

    setFormError(null);
    const missingKey = missingKeyColumnIds(keyColumnIds, id => rowData[id]);
    if (missingKey.length) {
      const titles = missingKey.map(id => getFieldDisplayName((fields || []).find(f => String(f.id) === id) ?? { title: id }));
      setFormError(missingKeyMessage(titles));
      return;
    }
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
          if (f.type === 'attachment' || f.uidt === 'attachment' || f.type === 'links' || f.uidt === 'links') {
            return false;
          }
          return !valuesEqual(f, originalData[f.id], rowData[f.id]);
        })
        .map(f => ({
          fieldId: f.id,
          value: normalizeValueForSave(f, rowData[f.id])
        }));

      if (updates.length > 0) {
        const values = updates.reduce((acc: Record<string, any>, update) => {
          acc[String(update.fieldId)] = update.value;
          return acc;
        }, {});

        await updateRowDataMutation.mutateAsync({
          model_id: String(table.id),
          row_id: Number(recordId),
          values,
        });
      }

      await Promise.all(
        (fields || [])
          .filter(f => f.type === 'attachment' || f.uidt === 'attachment')
          .map(async (field) => {
            const currentFiles = Array.isArray(rowData[field.id]) ? rowData[field.id] : [];
            const originalFiles = Array.isArray(originalData[field.id]) ? originalData[field.id] : [];

            const filesToUpload = currentFiles
              .filter((file: any) => file?.file instanceof File)
              .map((file: any) => file.file);

            const currentKeys = new Set(currentFiles.map(getAttachmentKey).filter(Boolean));
            const attachmentsToRemove = originalFiles
              .filter((file: any) => {
                const key = getAttachmentKey(file);
                return Boolean(key) && !currentKeys.has(key);
              })
              .map((file: any) => file?.id)
              .filter(Boolean);

            const operations: Promise<any>[] = [];

            if (filesToUpload.length > 0) {
              operations.push(
                addAttachmentMutation.mutateAsync({
                  model_id: String(table.id),
                  column_id: field.id,
                  row_id: Number(recordId),
                  files: filesToUpload
                })
              );
            }

            if (attachmentsToRemove.length > 0) {
              operations.push(
                removeAttachmentsMutation.mutateAsync({
                  model_id: String(table.id),
                  column_id: field.id,
                  row_id: Number(recordId),
                  attachments: attachmentsToRemove
                })
              );
            }

            if (operations.length > 0) {
              await Promise.all(operations);
            }
          })
      );

      await Promise.all(
        (fields || [])
          .filter(f => f.type === 'links' || f.uidt === 'links')
          .map(async (field) => {
            // Cells hold the linked records' key values; the linked table's records resolve them to row ids
            const targetRecords = cachedTableRecords(queryClient, field?.meta?.relation?.with);
            const originalIds = new Set<number>(linkRowIds(originalData[field.id], targetRecords));
            const currentIds = new Set<number>(linkRowIds(rowData[field.id], targetRecords));

            const toLink: number[] = Array.from(currentIds).filter((id) => !originalIds.has(id));
            const toUnlink: number[] = Array.from(originalIds).filter((id) => !currentIds.has(id));

            const operations: Promise<any>[] = [];
            for (const targetRowId of toLink) {
              operations.push(
                insertRelationMutation.mutateAsync({
                  model_id: String(table.id),
                  column_id: String(field.id),
                  source_row_id: Number(recordId),
                  target_row_id: targetRowId,
                  action: 'link',
                  target_table_id: field?.meta?.relation?.with
                })
              );
            }

            for (const targetRowId of toUnlink) {
              operations.push(
                insertRelationMutation.mutateAsync({
                  model_id: String(table.id),
                  column_id: String(field.id),
                  source_row_id: Number(recordId),
                  target_row_id: targetRowId,
                  action: 'unlink',
                  target_table_id: field?.meta?.relation?.with
                })
              );
            }

            if (operations.length > 0) {
              await Promise.all(operations);
            }
          })
      );

      toast.success('Record updated successfully');
      setSubmitting(false);
      onSuccess?.({ recordId });
      onClose();
    } catch (err) {
      console.error('Failed to save record', err);
      setSubmitting(false);
      setFormError(apiErrorMessage(err, 'Failed to save changes. Please try again.'));
    }
  };

  if (!isOpen) return null;

  // A cleared key field is outlined in red; the wrapper stays the same so the input keeps focus
  const renderKeyAwareField = (field: any) => {
    const missing = isKeyField(field) && isEmptyKeyValue(rowData[field.id]);
    return (
      <div data-testid={missing ? `key-field-missing-${field.id}` : undefined}>
        <div className={missing ? 'rounded-lg ring-1 ring-red-500 bg-red-50/40' : undefined}>{renderField(field)}</div>
        {missing && <p className="mt-1 text-xs text-red-600">Required: part of the primary key</p>}
      </div>
    );
  };

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
      persistImmediately: false,
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
    <div //NOSONAR
      className="bg-modal-backdrop relative"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div //NOSONAR 
        className="bg-modal w-full h-full relative !p-0 !max-w-[99rem] !max-h-[45rem] flex flex-col overflow-hidden !rounded-[1.5rem]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="min-h-7 h-24 flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-2 text-2xl font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg max-w-[200px] flex-shrink-0">
              <Table2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{table?.title}</span>
            </span>
            <h2 className="text-3xl font-semibold truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-2 relative flex-shrink-0">
            {canUpdateRecord() && (
              <button
                type="button"
                disabled={isSaveDisabled}
                onClick={handleSave}
                className={`px-3 py-1.5 text-sm rounded-lg btn-primary ${isSaveDisabled ? 'btn-disabled' : ''}`}
              >
                {submitLabel}
              </button>
            )}
            {(onDuplicate || (canDeleteRecord() && onDelete)) && (
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
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
                {menuOpen && (
                  <div //NOSONAR
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
                    {onDuplicate && canUpdateRecord() && (
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (recordId) onDuplicate(recordId);
                          setMenuOpen(false);
                        }}
                      >
                        <Copy className="w-4 h-4" /> Duplicate record
                      </button>
                    )}
                    {canDeleteRecord() && onDelete && (
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (recordId) onDelete(recordId);
                          setMenuOpen(false);
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Delete record
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <button type="button" className="p-2 flex-shrink-0" onClick={onClose} aria-label="Close">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" onInput={() => setHasTyped(true)}>
          <div className="px-6 py-6 mx-auto w-full max-w-[820px]">
            {/* Visible fields */}
            <div className="space-y-4">
              {visibleFields.map((field) => {
                return (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] gap-4 items-center">
                    <div className="text-gray-600 flex items-center gap-2">
                      {getFieldTypeIconWithMargin(
                        getStandardFieldType(field),
                        getRelationTypeFromField(field)
                      )}
                      <span className="text-sm">{getFieldDisplayName(field)}</span>
                      {(field.required || isKeyField(field)) && <span className="text-red-500 ml-1 field-component-required">*</span>}
                    </div>
                    <div className="w-full">
                      {renderKeyAwareField(field)}
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
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] gap-4 items-center">
                      <div className="text-gray-600 flex items-center gap-2">
                        {getFieldTypeIconWithMargin(
                          getStandardFieldType(field),
                          getRelationTypeFromField(field)
                        )}
                        <span className="text-sm">{getFieldDisplayName(field)}</span>
                        {(field.required || isKeyField(field)) && <span className="text-red-500 ml-1 field-component-required">*</span>}
                      </div>
                      <div className="w-full">{renderKeyAwareField(field)}</div>
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
      </div>
    </div>
  );
};

export default EditRecordModal;