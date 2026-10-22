// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, CirclePlus, MoreVertical, Copy } from 'lucide-react';
import FieldRenderer from '../../plugins/FormViewPlugin/components/shared/FieldRenderer';
import { useUpsertRow, useAddAttachment, useInsertRelationData } from '../../hooks/useApi';
import { useRequiredKeyFields } from '../../hooks/useRequiredKeyFields';
import { missingKeyColumnIds, missingKeyMessage } from '../../utils/primaryKeyFields';
import { getFieldDisplayName, getFieldDefaultValue, createFieldRendererProps } from '../../utils/standardFieldUtils';
import { isFormulaField } from '../../utils/fieldUtils';
import { useBaseAccess } from '../../hooks/useBaseAccess';
import { useToast } from '../common/Toast';
import { apiErrorMessage } from '../../utils/apiErrors';
import { isAutoUuidColumn } from '../../utils/uuid';
import RecordNavButtons from './RecordNavButtons';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import {
    FieldRow,
    HiddenFieldsToggle,
    KeyAwareField,
    RecordMenuButton,
    RecordMenuPanel,
    RecordTitle,
    getAttachmentProps,
    getLinksProps,
    getMissingRequiredFields,
    isAttachmentField,
    isLinksField,
    isSystemField,
    normalizeLinksFieldValue,
    useCloseOnOutsideClick,
} from './RecordModalParts';

type CreateRecordModalProps = {
    isOpen: boolean;
    table: any;
    fields: any[];
    onClose: () => void;
    onSuccess?: (args: { recordId: string }) => void;
    title?: string;
    submitLabel?: string;
    initialValues?: Record<string, any>; // keyed by field.id or field.name
    // 'record' uses the Edit record popup layout, with the save button in the header
    layout?: 'default' | 'record';
    // Previous / Next buttons (record layout only), to step through the table's existing records
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
};

const CreateRecordModal: React.FC<CreateRecordModalProps> = ({
    isOpen,
    table,
    fields,
    onClose,
    onSuccess,
    title = 'New record',
    submitLabel = 'Save Record',
    initialValues = {},
    layout = 'default',
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false,
}) => {
    const [showHidden, setShowHidden] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [rowData, setRowData] = useState<Record<string, any>>({});
    const [createdRecordId, setCreatedRecordId] = useState<string | null>(null);
    const [initialRowData, setInitialRowData] = useState<Record<string, any>>({});
    const [menuOpen, setMenuOpen] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useCloseOnOutsideClick(menuOpen, menuRef, () => setMenuOpen(false));

    // Get base_id from table (could be table.base_id or table.model.base_id)
    const baseId = table?.base_id || table?.model?.base_id;
    const { canCreateRecord, isBaseReadOnly } = useBaseAccess(baseId);
    const isReadOnly = isBaseReadOnly();

    const upsertRowMutation = useUpsertRow();
    // Primary key fields (without Id) must be filled in before the record can be saved
    const keyColumnIds = useRequiredKeyFields(table?.id, fields);
    const isKeyField = (field: any): boolean => keyColumnIds.includes(String(field.id));
    const addAttachmentMutation = useAddAttachment();
    const insertRelationMutation = useInsertRelationData();
    const toast = useToast();

    // Key fields are always shown, even when hidden in the view
    const visibleFields = useMemo(
        () => (fields || []).filter(f => (keyColumnIds.includes(String(f.id)) || (!f.is_hidden && !f.hidden && !isSystemField(f))) && !isFormulaField(f)),
        [fields, keyColumnIds]
    );

    const hiddenFields = useMemo(
        () => (fields || []).filter(f => (f.is_hidden || f.hidden) && !isSystemField(f) && !keyColumnIds.includes(String(f.id))),
        [fields, keyColumnIds]
    );

    const getDefaultValueFromConfig = (field: any): any => {
        return getFieldDefaultValue(field);
    };

    // Initialize row data with defaults and initialValues
    useEffect(() => {
        if (!isOpen) return;
        const data: Record<string, any> = {};
        const defaultData: Record<string, any> = {};
        (fields || []).forEach(field => {
            const fieldDefault = getDefaultValueFromConfig(field);
            defaultData[field.id] = fieldDefault;
            const byId = initialValues[field.id as string];
            const byName = initialValues[field.name as string];
            let initial: any;
            if (byId !== undefined) {
                initial = byId;
            } else if (byName !== undefined) {
                initial = byName;
            }
            // initial remains undefined if both byId and byName are undefined
            data[field.id] = initial === undefined ? fieldDefault : initial;
        });
        setRowData(data);
        setInitialRowData(defaultData);
        setShowHidden(false);
        setFormError(null);
        setSubmitting(false);
        setCreatedRecordId(null); // Reset created record ID
        setMenuOpen(false);
        setHasTyped(false);
        setShowUnsavedPrompt(false);
    }, [isOpen, fields, JSON.stringify(initialValues)]);

    const handleFieldChange = (field: any, value: unknown) => {
        setRowData(prev => ({ ...prev, [field.id]: value }));
    };

    const normalizeForCompare = (value: any): any => {
        if (value instanceof Date) return value.toISOString();
        if (Array.isArray(value)) return JSON.stringify(value.map(normalizeForCompare));
        if (value && typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (error) {
                console.warn('Failed to stringify value:', error);
                return String(value);
            }
        }
        return value;
    };

    const isValueEqual = (a: any, b: any): boolean => {
        return normalizeForCompare(a) === normalizeForCompare(b);
    };

    const hasChanges = useMemo(() => {
        return (fields || []).some(field => !isValueEqual(rowData[field.id], initialRowData[field.id]));
    }, [fields, rowData, initialRowData]);

    // hasTyped catches text that is still being typed and has not reached rowData yet, so Save
    // enables on the first keystroke instead of waiting for the field to blur.
    const isDirty = hasChanges || hasTyped;
    const isSaveDisabled = submitting || !isDirty;

    // Closing with unsaved edits asks whether to save or discard them first
    const requestClose = () => {
        if (canCreateRecord() && !submitting && isDirty) {
            setShowUnsavedPrompt(true);
            return;
        }
        onClose();
    };

    const unsavedChangesDialog = (
        <UnsavedChangesDialog
            isOpen={showUnsavedPrompt}
            onCancel={() => setShowUnsavedPrompt(false)}
            onDiscard={() => {
                setShowUnsavedPrompt(false);
                onClose();
            }}
            onSave={() => {
                setShowUnsavedPrompt(false);
                void handleSave();
            }}
        />
    );

    const isEmptyFieldValue = (value: any) => {
        if (value === undefined || value === null || value === '') return true;
        if (Array.isArray(value) && value.length === 0) return true;
        return false;
    };

    const processFieldValue = (field: any, value: any) => {
        let processedValue = value;
        if (field.type === 'json' && typeof value === 'object' && value !== null) {
            processedValue = JSON.stringify(value);
        } else if (field.type === 'user') {
            const userConfig = (field.meta) || {};
            if (userConfig.allowMultiple && Array.isArray(value)) {
                processedValue = value.filter(id => id?.toString().trim()).join(',');
            }
        } else if ((field.type === 'date' || field.uidt === 'date') && value instanceof Date) {
            processedValue = value.toISOString().split('T')[0];
        } else if ((field.type === 'datetime' || field.uidt === 'datetime') && value instanceof Date) {
            processedValue = value.toISOString();
        }

        return processedValue;
    };

    const buildRowPayload = (): Record<string, any> => {
        const payload: Record<string, any> = {};
        (fields || []).forEach((field) => {
            // Auto-generated UUID fields are filled in by the backend and can't be sent
            if (isAttachmentField(field) || isLinksField(field) || isFormulaField(field) || isAutoUuidColumn(field)) return;
            const value = rowData[field.id];
            if (isEmptyFieldValue(value)) return;
            payload[field.id] = processFieldValue(field, value);
        });
        return payload;
    };

    const extractCreatedRowId = (created: any): string => {
        const recordId =
            created?.id ??
            created?.row_id ??
            created?.data?.id ??
            created?.data?.row_id ??
            created?.data?.record?.id ??
            created?.data?.record_id ??
            created?.data?.rows?.[0]?.record?.id ??
            created?.data?.rows?.[0]?.id;

        if (!recordId) {
            throw new Error('Failed to create record - no ID returned');
        }
        return String(recordId);
    };

    const uploadAttachments = async (recordId: string) => {
        const attachmentPromises: Promise<any>[] = [];
        for (const field of (fields || [])) {
            if (!isAttachmentField(field)) continue;

            const attachmentValue = rowData[field.id];
            if (!attachmentValue || !Array.isArray(attachmentValue) || attachmentValue.length === 0) {
                continue;
            }

            const filesToUpload = attachmentValue
                .filter((file: any) => file.file instanceof File)
                .map((file: any) => file.file);

            if (filesToUpload.length > 0) {
                const uploadPromise = addAttachmentMutation.mutateAsync({
                    model_id: String(table.id),
                    column_id: field.id,
                    row_id: Number(recordId),
                    files: filesToUpload
                }).catch(err => {
                    console.error(`Failed to upload attachments for field ${field.title} (${field.id}):`, err);
                });

                attachmentPromises.push(uploadPromise);
            }
        }

        if (attachmentPromises.length > 0) {
            try {
                await Promise.all(attachmentPromises);
            } catch (error) {
                console.error('Some attachment uploads failed:', error);
                setFormError('Record created, but some attachments may not have uploaded. Please check and retry.');
            }
        }
    };

    const insertRelations = async (recordId: string) => {
        const relationPromises: Promise<any>[] = [];
        for (const field of (fields || [])) {
            if (!isLinksField(field)) {
                continue;
            }

            const linksValue = rowData[field.id];
            const relatedIds = (Array.isArray(linksValue) ? linksValue : [])
                .map((item: any) => item?.id ?? item)
                .map((id: any) => Number.parseInt(String(id), 10))
                .filter((id: number) => Number.isFinite(id));

            for (const targetRowId of relatedIds) {
                relationPromises.push(
                    insertRelationMutation.mutateAsync({
                        model_id: String(table.id),
                        column_id: String(field.id),
                        source_row_id: Number(recordId),
                        target_row_id: targetRowId,
                        action: 'link',
                        target_table_id: field?.meta?.relation?.with
                    }).catch((error) => {
                        console.error(`Failed to link relation for field ${field.title} (${field.id})`, error);
                    })
                );
            }
        }

        if (relationPromises.length > 0) {
            await Promise.all(relationPromises);
        }
    };

    // keepOpen (Duplicate record) saves the record and leaves the form filled in, ready to save a copy
    const handleSave = async ({ keepOpen = false }: { keepOpen?: boolean } = {}) => {
        // Check permission before saving
        if (!canCreateRecord()) {
            setFormError('You do not have permission to create records.');
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
            const rowPayload = buildRowPayload();
            // Insert as an upsert: no row id, so the record is created with all its values in one call
            const created = await upsertRowMutation.mutateAsync({
                model_id: String(table.id),
                values: rowPayload,
            });
            const recordId = extractCreatedRowId(created);
            setCreatedRecordId(recordId);
            await uploadAttachments(recordId);
            await insertRelations(recordId);

            setSubmitting(false);
            toast.success('Record created successfully');
            onSuccess?.({ recordId });
            if (keepOpen) {
                setCreatedRecordId(null);
                return;
            }
            onClose();
        } catch (err) {
            console.error('Failed to create record', err);
            setSubmitting(false);
            setFormError(apiErrorMessage(err, 'Failed to save record. Please try again.'));
        }
    };

    if (!isOpen) return null;

    // Helper function to get field change handler
    const getFieldChangeHandler = (field: any) => {
        if (isReadOnly) {
            return () => { };
        }
        return (v: any) => handleFieldChange(field, v);
    };

    const recordContext = { table, isReadOnly, rowId: createdRecordId ? Number(createdRecordId) : undefined };

    const renderField = (field: any) => {
        let value = rowData[field.id];
        value = normalizeLinksFieldValue(field, value);

        const rendererProps = createFieldRendererProps(
            field,
            value,
            getFieldChangeHandler(field),
            {
                isBorder: true,
                required: field.required,
                readOnly: isReadOnly,
                allowEdit: !isReadOnly,
            }
        );

        const attachmentProps = getAttachmentProps(field, recordContext);
        const linksProps = getLinksProps(field, recordContext);

        return <FieldRenderer key={field.id} {...rendererProps} {...attachmentProps} {...linksProps} />;
    };

    const renderKeyAwareField = (field: any) => (
        <KeyAwareField field={field} isKey={isKeyField(field)} value={rowData[field.id]}>{renderField(field)}</KeyAwareField>
    );

    const renderRecordLayoutField = (field: any) => (
        <FieldRow key={field.id} field={field} isKey={isKeyField(field)} gridClassName="md:grid-cols-[160px_minmax(0,1fr)]">
            {renderKeyAwareField(field)}
        </FieldRow>
    );

    const renderDefaultLayoutField = (field: any) => (
        <FieldRow key={field.id} field={field} isKey={isKeyField(field)} gridClassName="md:grid-cols-[220px_minmax(0,1fr)]" valueClassName="max-w-[560px] w-full">
            {renderKeyAwareField(field)}
        </FieldRow>
    );

    if (layout === 'record') {
        return (
            <div //NOSONAR
                className="bg-modal-backdrop relative"
                onClick={(e) => e.target === e.currentTarget && requestClose()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    aria-label="Close modal"
                    className="absolute inset-0"
                    onClick={requestClose}
                />
                <div //NOSONAR
                    className="bg-modal w-full h-full relative !p-0 !max-w-[99rem] !max-h-[45rem] flex flex-col overflow-hidden !rounded-[1.5rem]"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="min-h-7 h-20 flex items-center justify-between px-6 py-3 border-b flex-shrink-0">
                        <RecordTitle tableTitle={table?.title} title={title} />
                        <div className="flex items-center gap-2 relative flex-shrink-0">
                            <RecordNavButtons onPrevious={onPrevious} onNext={onNext} hasPrevious={hasPrevious} hasNext={hasNext} disabled={submitting} showSeparator={canCreateRecord()} />
                            {canCreateRecord() && (
                                <button
                                    type="button"
                                    disabled={isSaveDisabled}
                                    onClick={() => handleSave()}
                                    className={`px-3 py-1.5 text-sm rounded-lg btn-primary ${isSaveDisabled ? 'btn-disabled' : ''}`}
                                >
                                    {submitLabel}
                                </button>
                            )}
                            {canCreateRecord() && (
                                <div className="relative" ref={menuRef}>
                                    <RecordMenuButton onToggle={() => setMenuOpen(v => !v)} icon={<MoreVertical className="w-5 h-5 text-gray-500" />} />
                                    {menuOpen && (
                                        <RecordMenuPanel>
                                            <button
                                                type="button"
                                                disabled={isSaveDisabled}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setMenuOpen(false);
                                                    void handleSave({ keepOpen: true });
                                                }}
                                            >
                                                <Copy className="w-4 h-4" /> Duplicate record
                                            </button>
                                        </RecordMenuPanel>
                                    )}
                                </div>
                            )}
                            <button
                                type="button"
                                className="px-3 py-1.5 text-sm rounded-lg border bg-card hover:bg-gray-50 text-gray-700 flex-shrink-0"
                                onClick={requestClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" onInput={() => setHasTyped(true)}>
                        <div className="px-6 py-6 mx-auto w-full max-w-[820px]">
                            <div className="space-y-4">{visibleFields.map(renderRecordLayoutField)}</div>

                            <HiddenFieldsToggle count={hiddenFields.length} shown={showHidden} onToggle={() => setShowHidden(v => !v)} />

                            {showHidden && hiddenFields.length > 0 && (
                                <div className="space-y-4">{hiddenFields.map(renderRecordLayoutField)}</div>
                            )}

                            {formError && (
                                <div className="mt-4 text-red-600 text-sm">{formError}</div>
                            )}
                        </div>
                    </div>
                </div>
                {unsavedChangesDialog}
            </div>
        );
    }

    return (
        <div className="bg-modal-backdrop relative">
            <button
                type="button"
                aria-label="Close modal"
                className="absolute inset-0"
                onClick={requestClose}
            />
            <div className="bg-modal w-full relative max-w-4xl !p-0 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <CirclePlus className="w-5 h-5 icons-primary flex-shrink-0" />
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded truncate max-w-[150px] flex-shrink-0">{table?.title}</span>
                            <h2 className="text-2xl font-semibold truncate">{title}</h2>
                        </div>
                    </div>
                    <button type="button" className="p-2 flex-shrink-0" onClick={requestClose} aria-label="Close">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" onInput={() => setHasTyped(true)}>
                    <div className="p-6">
                        {/* Visible fields */}
                        <div className="space-y-4">
                            {visibleFields.map(renderDefaultLayoutField)}
                        </div>

                        {/* Hidden fields toggle */}
                        <HiddenFieldsToggle count={hiddenFields.length} shown={showHidden} onToggle={() => setShowHidden(v => !v)} />

                        {/* Hidden fields */}
                        {showHidden && hiddenFields.length > 0 && (
                            <div className="space-y-4">
                                {hiddenFields.map(renderDefaultLayoutField)}
                            </div>
                        )}

                        {formError && (
                            <div className="mt-4 text-red-600 text-sm">{formError}</div>
                        )}
                    </div>
                </div>

                {/* Footer - Fixed at Bottom */}
                {canCreateRecord() && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
                        <button
                            type="button"
                            onClick={requestClose}
                            disabled={submitting}
                            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isSaveDisabled}
                            onClick={() => handleSave()}
                            className={`px-16 py-2 rounded-xl btn-primary ${isSaveDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {submitLabel}
                        </button>
                    </div>
                )}
            </div>
            {unsavedChangesDialog}
        </div>
    );
};

export default CreateRecordModal;

