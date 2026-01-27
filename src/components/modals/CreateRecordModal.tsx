import React, { useEffect, useMemo, useState } from 'react';
import { X, CirclePlus } from 'lucide-react';
import FieldRenderer from '../../plugins/FormViewPlugin/components/shared/FieldRenderer';
import { useAddRow, useInsertRowData, useAddAttachment } from '../../hooks/useApi';
import { getFieldTypeIconWithMargin } from '../../types/fieldTypes';
import { getStandardFieldType, getFieldDisplayName, getFieldDefaultValue, createFieldRendererProps } from '../../utils/standardFieldUtils';
import { isFormulaField } from '../../utils/fieldUtils';
import { useBaseAccess } from '../../hooks/useBaseAccess';
import { useToast } from '../common/Toast';

type CreateRecordModalProps = {
    isOpen: boolean;
    table: any;
    fields: any[];
    onClose: () => void;
    onSuccess?: (args: { recordId: string }) => void;
    title?: string;
    submitLabel?: string;
    initialValues?: Record<string, any>; // keyed by field.id or field.name
};

const CreateRecordModal: React.FC<CreateRecordModalProps> = ({
    isOpen,
    table,
    fields,
    onClose,
    onSuccess,
    title = 'New record',
    submitLabel = 'Save record',
    initialValues = {},
}) => {
    const [showHidden, setShowHidden] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [rowData, setRowData] = useState<Record<string, any>>({});
    const [createdRecordId, setCreatedRecordId] = useState<string | null>(null);

    // Get base_id from table (could be table.base_id or table.model.base_id)
    const baseId = table?.base_id || table?.model?.base_id;
    const { canCreateRecord, isBaseReadOnly } = useBaseAccess(baseId);
    const isReadOnly = isBaseReadOnly();

    const addRowMutation = useAddRow();
    const insertValueMutation = useInsertRowData();
    const addAttachmentMutation = useAddAttachment();
    const toast = useToast();

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
        return field.system;
    };

    // Find title field for validation
    const titleField = useMemo(() => {
        return (fields || []).find(f => {
            const fieldName = f.name?.toLowerCase() || '';
            const fieldTitle = f.title?.toLowerCase() || '';
            return (fieldName.includes('title') || fieldTitle.includes('title'));
        });
    }, [fields]);

    const visibleFields = useMemo(
        () => (fields || []).filter(f => !f.is_hidden && !f.hidden && !isSystemField(f) && !isFormulaField(f)),
        [fields]
    );

    const hiddenFields = useMemo(
        () => (fields || []).filter(f => (f.is_hidden || f.hidden) && !isSystemField(f)),
        [fields]
    );

    const getDefaultValueFromConfig = (field: any): any => {
        return getFieldDefaultValue(field);
    };

    // Initialize row data with defaults and initialValues
    useEffect(() => {
        if (!isOpen) return;
        const data: Record<string, any> = {};
        (fields || []).forEach(field => {
            const byId = initialValues[field.id as string];
            const byName = initialValues[field.name as string];
            let initial: any;
            if (byId !== undefined) {
                initial = byId;
            } else if (byName !== undefined) {
                initial = byName;
            }
            // initial remains undefined if both byId and byName are undefined
            data[field.id] = initial === undefined ? getDefaultValueFromConfig(field) : initial;
        });
        setRowData(data);
        setShowHidden(false);
        setFormError(null);
        setSubmitting(false);
        setCreatedRecordId(null); // Reset created record ID
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


    const handleSave = async () => {
        // Check permission before saving
        if (!canCreateRecord()) {
            setFormError('You do not have permission to create records.');
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
            const created = await addRowMutation.mutateAsync({ model_id: String(table.id) });
            const recordId = created?.data?.record?.id || created?.id || String(Date.now());
            setCreatedRecordId(recordId);
            await Promise.all((fields || []).map(async (f) => {
                // Skip attachment fields - they handle their own API calls
                if (f.type === 'attachment' || f.uidt === 'attachment') {
                    return;
                }

                const value = rowData[f.id];

                // Skip empty values (except audit fields which are handled by backend)
                if (value === undefined || value === null || value === '') return;
                if (Array.isArray(value) && value.length === 0) return;

                let processedValue = value;
                if (f.type === 'json' && typeof value === 'object' && value !== null) {
                    processedValue = JSON.stringify(value);
                } else if (f.type === 'user') {
                    // For user fields with allowMultiple, convert array to comma-separated string
                    const userConfig = (f.meta) || {};
                    if (userConfig.allowMultiple && Array.isArray(value)) {
                        processedValue = value.filter(id => id?.toString().trim()).join(',');
                    }
                } else if ((f.type === 'date' || f.uidt === 'date') && value instanceof Date) {
                    // Convert Date objects to ISO date string (YYYY-MM-DD)
                    processedValue = value.toISOString().split('T')[0];
                } else if ((f.type === 'datetime' || f.uidt === 'datetime') && value instanceof Date) {
                    // Convert Date objects to ISO datetime string
                    processedValue = value.toISOString();
                }

                try {
                    await insertValueMutation.mutateAsync({
                        model_id: String(table.id),
                        column_id: String(f.id),
                        row_id: Number(recordId),
                        value: processedValue,
                    });
                } catch (e) {
                    console.warn('Failed to set initial field value:', f.id, e);
                }
            }));

            // Handle attachment fields - upload files after record is created
            const attachmentPromises: Promise<any>[] = [];
            for (const field of (fields || [])) {
                if (field.type === 'attachment' || field.uidt === 'attachment') {
                    const attachmentValue = rowData[field.id];

                    if (!attachmentValue || !Array.isArray(attachmentValue) || attachmentValue.length === 0) {
                        continue;
                    }

                    // Upload each file that hasn't been uploaded yet (has a .file property)
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
            }

            // Execute all attachment uploads in parallel
            if (attachmentPromises.length > 0) {
                try {
                    await Promise.all(attachmentPromises);
                } catch (error) {
                    console.error('Some attachment uploads failed:', error);
                    // Don't block form submission if attachment uploads fail
                    setFormError('Record created, but some attachments may not have uploaded. Please check and retry.');
                }
            }

            setSubmitting(false);
            toast.success('Record created successfully');
            onSuccess?.({ recordId });
            onClose();
        } catch (err) {
            console.error('Failed to create record', err);
            setSubmitting(false);
            setFormError('Failed to save record. Please try again.');
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

    return (
        <div className="bg-modal-backdrop relative">
            <button
                type="button"
                aria-label="Close modal"
                className="absolute inset-0"
                onClick={onClose}
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
                    <button type="button" className="p-2 flex-shrink-0" onClick={onClose} aria-label="Close">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                    <div className="p-6">
                        {/* Visible fields */}
                        <div className="space-y-4">
                            {visibleFields.map((field) => {
                                const isTitleField = titleField && field.id === titleField.id;
                                return (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-center">
                                        <div className="text-gray-600 flex items-center gap-2">
                                            {getFieldTypeIconWithMargin(getStandardFieldType(field))}
                                            <span className="text-sm">{getFieldDisplayName(field)}</span>
                                            {field.required && <span className="text-red-500 ml-1 field-component-required">*</span>}
                                            {isTitleField && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    Title Field
                                                </span>
                                            )}
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
                                    className="px-4 py-2 rounded-full border text-sm text-gray-700 bg-white hover:bg-gray-50"
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
                {canCreateRecord() && (
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
                            disabled={submitting}
                            onClick={handleSave}
                            className={`px-16 py-2 rounded-xl btn-primary ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {submitLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateRecordModal;

