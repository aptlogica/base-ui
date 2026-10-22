// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, CirclePlus, Table2, MoreVertical, Copy } from 'lucide-react';
import FieldRenderer from '../../plugins/FormViewPlugin/components/shared/FieldRenderer';
import { useUpsertRow, useAddAttachment, useInsertRelationData } from '../../hooks/useApi';
import { useRequiredKeyFields } from '../../hooks/useRequiredKeyFields';
import { isEmptyKeyValue, missingKeyColumnIds, missingKeyMessage } from '../../utils/primaryKeyFields';
import { getFieldTypeIconWithMargin, getRelationTypeFromField } from '../../types/fieldTypes';
import { getStandardFieldType, getFieldDisplayName, getFieldDefaultValue, createFieldRendererProps } from '../../utils/standardFieldUtils';
import { isFormulaField } from '../../utils/fieldUtils';
import { useBaseAccess } from '../../hooks/useBaseAccess';
import { useToast } from '../common/Toast';
import { apiErrorMessage } from '../../utils/apiErrors';
import RecordNavButtons from './RecordNavButtons';
import UnsavedChangesDialog from './UnsavedChangesDialog';

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

    // Close the record menu when clicking outside it
    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

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

    const isAuditField = (field: any): boolean => {
        const auditFieldTypes = ['createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy'];
        return auditFieldTypes.includes(field.uidt);
    };

    // Filter out system fields except Title (audit fields are now completely hidden)
    const isSystemField = (field: any): boolean => {
        const fieldName = field.name?.toLowerCase() || '';
        const fieldTitle = field.title?.toLowerCase() || '';
        const columnName = field.column_name?.toLowerCase() || '';
        // Keep Title field visible (it's required for records), even after it is renamed - check column_name, name and title
        if (columnName === 'title' || fieldName.includes('title') || fieldTitle.includes('title')) {
            return false;
        }
        // Hide audit fields completely - backend will auto-assign them
        if (isAuditField(field)) {
            return true;
        }
        return field.system;
    };



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

    const isAttachmentField = (field: any) => field.type === 'attachment' || field.uidt === 'attachment';
    const isLinksField = (field: any) => field.type === 'links' || field.uidt === 'links';

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
            if (isAttachmentField(field) || isLinksField(field) || isFormulaField(field)) return;
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
        const missing = validateRequired();
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

    // Helper function to normalize links field value
    const normalizeLinksFieldValue = (field: any, value: any): any => {
        const isLinksField = field.type === 'links' || field.uidt === 'links';
        if (isLinksField && (!value || (typeof value === 'object' && !Array.isArray(value)))) {
            return [];
        }
        return value;
    };

    // Helper function to get field change handler
    const getFieldChangeHandler = (field: any) => {
        if (isReadOnly) {
            return () => { };
        }
        return (v: any) => handleFieldChange(field, v);
    };

    // Helper function to get attachment props
    const getAttachmentProps = (field: any): Record<string, any> => {
        const isAttachmentField = field.type === 'attachment' || field.uidt === 'attachment';
        if (!isAttachmentField) {
            return {};
        }
        return {
            model_id: String(table.id),
            column_id: field.id,
            row_id: createdRecordId ? Number(createdRecordId) : undefined,
            persistImmediately: false,
            readOnly: isReadOnly,
            allowEdit: !isReadOnly
        };
    };

    // Helper function to get links props
    const getLinksProps = (field: any): Record<string, any> => {
        const isLinksField = field.type === 'links' || field.uidt === 'links';
        if (!isLinksField) {
            return {};
        }
        return {
            field: {
                id: field.id,
                title: field.title || field.name,
                meta: field.meta || field.config || {}
            },
            currentRowId: createdRecordId ? Number(createdRecordId) : undefined,
            currentTableId: String(table.id),
            persistImmediately: false,
            isBorder: true,
            disabled: isReadOnly
        };
    };

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

        const attachmentProps = getAttachmentProps(field);
        const linksProps = getLinksProps(field);

        return <FieldRenderer key={field.id} {...rendererProps} {...attachmentProps} {...linksProps} />;
    };

    // An empty key field is outlined in red until it is filled in. The wrapper stays the same either way, so
    // the input keeps focus while the user types.
    const renderKeyAwareField = (field: any) => {
        const missing = isKeyField(field) && isEmptyKeyValue(rowData[field.id]);
        return (
            <div data-testid={missing ? `key-field-missing-${field.id}` : undefined}>
                <div className={missing ? 'rounded-lg ring-1 ring-red-500 bg-red-50/40' : undefined}>{renderField(field)}</div>
                {missing && <p className="mt-1 text-xs text-red-600">Required: part of the primary key</p>}
            </div>
        );
    };

    const renderRecordLayoutField = (field: any) => (
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
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="inline-flex items-center gap-2 text-2xl font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg max-w-[200px] flex-shrink-0">
                                <Table2 className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{table?.title}</span>
                            </span>
                            <h2 className="text-2xl font-semibold truncate">{title}</h2>
                        </div>
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
                                        </div>
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
                            {visibleFields.map((field) => {
                                return (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-center">
                                        <div className="text-gray-600 flex items-center gap-2">
                                            {getFieldTypeIconWithMargin(
                                              getStandardFieldType(field),
                                              getRelationTypeFromField(field)
                                            )}
                                            <span className="text-sm">{getFieldDisplayName(field)}</span>
                                            {(field.required || isKeyField(field)) && <span className="text-red-500 ml-1 field-component-required">*</span>}
                                        </div>
                                        <div className="max-w-[560px] w-full">
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
                                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-center">
                                            <div className="text-gray-600 flex items-center gap-2">
                                                {getFieldTypeIconWithMargin(
                                                  getStandardFieldType(field),
                                                  getRelationTypeFromField(field)
                                                )}
                                                <span className="text-sm">{getFieldDisplayName(field)}</span>
                                                {(field.required || isKeyField(field)) && <span className="text-red-500 ml-1 field-component-required">*</span>}
                                            </div>
                                            <div className="max-w-[560px] w-full">{renderKeyAwareField(field)}</div>
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

