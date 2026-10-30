// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MoreVertical, Trash2, Copy } from 'lucide-react';
import FieldRenderer from '../../plugins/FormViewPlugin/components/shared/FieldRenderer';
import { useUpdateRowData, useAddAttachment, useRemoveAttachments, useInsertRelationData } from '../../hooks/useApi';
import {
  createFieldRendererProps,
  getFieldDisplayName,
  getFieldDefaultValue,
  getStandardFieldType
} from '../../utils/standardFieldUtils';
import { isFormulaField } from '../../utils/fieldUtils';
import { apiErrorMessage } from '../../utils/apiErrors';
import { useRequiredKeyFields } from '../../hooks/useRequiredKeyFields';
import { missingKeyColumnIds, missingKeyMessage } from '../../utils/primaryKeyFields';
import { cachedTableRecords, linkItemIdentity, linkItems, linkRowIds } from '../../utils/linkValues';
import { useQueryClient } from '@tanstack/react-query';
import { useBaseAccess } from '../../hooks/useBaseAccess';
import { useToast } from '../../components/common/Toast';
import RecordNavButtons from './RecordNavButtons';
import {
  FieldRow,
  KeyAwareField,
  RecordFieldsBody,
  RecordHeaderSaveButton,
  RecordMenuButton,
  RecordModalShell,
  RecordMenuPanel,
  RecordUnsavedDialog,
  getAttachmentProps,
  getLinksProps,
  getMissingRequiredFields,
  isAttachmentField,
  isLinksField,
  isSystemField,
  normalizeLinksFieldValue,
  useCloseOnOutsideClick,
} from './RecordModalParts';

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
  // Previous / Next buttons, to step through the table's records
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  table,
  fields,
  recordId,
  onClose,
  onSuccess,
  title = 'Edit record',
  submitLabel = 'Save Changes',
  initialValues = {},
  onDuplicate,
  onDelete,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) => {
  const [showHidden, setShowHidden] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [rowData, setRowData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  // Most inputs only commit their value on blur, so typing anywhere in the form counts as an edit right away
  const [hasTyped, setHasTyped] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
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

  useCloseOnOutsideClick(menuOpen, menuRef, () => setMenuOpen(false));

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
    setShowUnsavedPrompt(false);
  // recordId resets the form when stepping to another record, even one with identical values
  }, [isOpen, recordId, fields, JSON.stringify(initialValues)]);

  const handleFieldChange = (field: any, value: unknown) => {
    setRowData(prev => ({ ...prev, [field.id]: value }));
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
      if (isAttachmentField(field)) {
        return hasAttachmentChanges(field);
      }
      return !valuesEqual(field, originalData[field.id], rowData[field.id]);
    });
  }, [fields, originalData, rowData]);

  const isSaveDisabled = submitting || !(hasChanges || hasTyped);

  // Closing with unsaved edits asks whether to save or discard them first
  const requestClose = () => {
    if (canUpdateRecord() && !isSaveDisabled) {
      setShowUnsavedPrompt(true);
      return;
    }
    onClose();
  };

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
    const missing = getMissingRequiredFields(fields, rowData);
    if (missing.length) {
      setFormError('Required field(s) must not be left empty.');
      return;
    }

    try {
      setSubmitting(true);
      const updates = (fields || [])
        .filter(f => {
          // Skip attachment fields - they handle their own API calls
          if (isAttachmentField(f) || isLinksField(f)) {
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
          .filter(isAttachmentField)
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
          .filter(isLinksField)
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

  const renderKeyAwareField = (field: any) => (
    <KeyAwareField field={field} isKey={isKeyField(field)} value={rowData[field.id]}>{renderField(field)}</KeyAwareField>
  );

  const renderFieldRow = (field: any) => (
    <FieldRow key={field.id} field={field} isKey={isKeyField(field)} gridClassName="md:grid-cols-[160px_minmax(0,1fr)]">
      {renderKeyAwareField(field)}
    </FieldRow>
  );

  const renderField = (field: any) => {
    const value = normalizeLinksFieldValue(field, rowData[field.id]);

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

    const recordContext = { table, isReadOnly, rowId: Number(recordId) };
    const attachmentProps = getAttachmentProps(field, recordContext, { showPreview: false });
    const linksProps = getLinksProps(field, recordContext);

    return (
      <FieldRenderer key={field.id} {...fieldRendererProps} {...attachmentProps} {...linksProps} />
    );
  };

  return (
    <RecordModalShell
      tableTitle={table?.title}
      title={title}
      onRequestClose={requestClose}
      onInput={() => setHasTyped(true)}
      headerActions={(
        <>
          <RecordNavButtons onPrevious={onPrevious} onNext={onNext} hasPrevious={hasPrevious} hasNext={hasNext} disabled={submitting} showSeparator={canUpdateRecord()} />
          {canUpdateRecord() && (
            <RecordHeaderSaveButton disabled={isSaveDisabled} onClick={() => void handleSave()} label={submitLabel} />
          )}
          {(onDuplicate || (canDeleteRecord() && onDelete)) && (
            <div className="relative" ref={menuRef}>
              <RecordMenuButton onToggle={() => setMenuOpen(v => !v)} icon={<MoreVertical className="w-5 h-5 text-gray-500" />} />
              {menuOpen && (
                <RecordMenuPanel>
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
                </RecordMenuPanel>
              )}
            </div>
          )}
        </>
      )}
      footer={(
        <RecordUnsavedDialog
          isOpen={showUnsavedPrompt}
          setOpen={setShowUnsavedPrompt}
          onDiscard={onClose}
          onSave={() => void handleSave()}
        />
      )}
    >
      <RecordFieldsBody
        visibleFields={visibleFields}
        hiddenFields={hiddenFields}
        showHidden={showHidden}
        onToggleHidden={() => setShowHidden(v => !v)}
        renderFieldRow={renderFieldRow}
        formError={formError}
      />
    </RecordModalShell>
  );
};

export default EditRecordModal;
