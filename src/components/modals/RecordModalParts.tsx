// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
// Pieces shared by CreateRecordModal and EditRecordModal
import React, { useEffect } from 'react';
import { Table2 } from 'lucide-react';
import { getFieldTypeIconWithMargin, getRelationTypeFromField } from '../../types/fieldTypes';
import { getStandardFieldType, getFieldDisplayName } from '../../utils/standardFieldUtils';
import { isEmptyKeyValue } from '../../utils/primaryKeyFields';
import UnsavedChangesDialog from './UnsavedChangesDialog';

const AUDIT_FIELD_TYPES = ['createdTime', 'lastModifiedTime', 'createdBy', 'lastModifiedBy'];

export const isAttachmentField = (field: any): boolean => field.type === 'attachment' || field.uidt === 'attachment';
export const isLinksField = (field: any): boolean => field.type === 'links' || field.uidt === 'links';

// System fields are hidden from the form, except Title (it is required for records, even after it is renamed)
export const isSystemField = (field: any): boolean => {
    const fieldName = field.name?.toLowerCase() || '';
    const fieldTitle = field.title?.toLowerCase() || '';
    const columnName = field.column_name?.toLowerCase() || '';
    if (columnName === 'title' || fieldName.includes('title') || fieldTitle.includes('title')) {
        return false;
    }
    // Audit fields are auto-assigned by the backend
    if (AUDIT_FIELD_TYPES.includes(field.uidt)) {
        return true;
    }
    return field.system;
};

// Names of required fields whose value is still empty
export const getMissingRequiredFields = (fields: any[], rowData: Record<string, any>): string[] =>
    (fields || [])
        .filter(f => f.required)
        .filter(f => {
            const v = rowData[f.id];
            if (Array.isArray(v)) return v.length === 0;
            if (v === null || v === undefined) return true;
            return String(v).trim() === '';
        })
        .map(f => f.name);

// Links cells must always be an array
export const normalizeLinksFieldValue = (field: any, value: any): any => {
    if (isLinksField(field) && (!value || (typeof value === 'object' && !Array.isArray(value)))) {
        return [];
    }
    return value;
};

type RecordContext = { table: any; isReadOnly: boolean; rowId?: number };

export const getLinksProps = (field: any, { table, isReadOnly, rowId }: RecordContext): Record<string, any> => {
    if (!isLinksField(field)) return {};
    return {
        field: {
            id: field.id,
            title: field.title || field.name,
            meta: field.meta || field.config || {}
        },
        currentRowId: rowId,
        currentTableId: String(table.id),
        persistImmediately: false,
        isBorder: true,
        disabled: isReadOnly
    };
};

export const getAttachmentProps = (field: any, { table, isReadOnly, rowId }: RecordContext, extra: Record<string, any> = {}): Record<string, any> => {
    if (!isAttachmentField(field)) return {};
    return {
        model_id: String(table.id),
        column_id: field.id,
        row_id: rowId,
        persistImmediately: false,
        readOnly: isReadOnly,
        allowEdit: !isReadOnly,
        ...extra
    };
};

// Closes the record menu when the user clicks outside it
export const useCloseOnOutsideClick = (
    open: boolean,
    ref: React.RefObject<HTMLElement | null>,
    onClose: () => void
) => {
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);
};

// An empty key field is outlined in red until it is filled in. The wrapper stays the same either way, so
// the input keeps focus while the user types.
export const KeyAwareField: React.FC<{ field: any; isKey: boolean; value: any; children: React.ReactNode }> = ({ field, isKey, value, children }) => {
    const missing = isKey && isEmptyKeyValue(value);
    return (
        <div data-testid={missing ? `key-field-missing-${field.id}` : undefined}>
            <div className={missing ? 'rounded-lg ring-1 ring-red-500 bg-red-50/40' : undefined}>{children}</div>
            {missing && <p className="mt-1 text-xs text-red-600">Required: part of the primary key</p>}
        </div>
    );
};

type FieldRowProps = {
    field: any;
    isKey: boolean;
    // Full Tailwind class (not built from a number) so the class is picked up at build time
    gridClassName: string;
    valueClassName?: string;
    children: React.ReactNode;
};

// One form row: field icon + name (+ required star) on the left, the field input on the right
export const FieldRow: React.FC<FieldRowProps> = ({ field, isKey, gridClassName, valueClassName = 'w-full', children }) => (
    <div className={`grid grid-cols-1 gap-4 items-center ${gridClassName}`}>
        <div className="text-gray-600 flex items-center gap-2">
            {getFieldTypeIconWithMargin(getStandardFieldType(field), getRelationTypeFromField(field))}
            <span className="text-sm">{getFieldDisplayName(field)}</span>
            {(field.required || isKey) && <span className="text-red-500 ml-1 field-component-required">*</span>}
        </div>
        <div className={valueClassName}>{children}</div>
    </div>
);

type HiddenFieldsToggleProps = {
    count: number;
    shown: boolean;
    onToggle: () => void;
};

export const HiddenFieldsToggle: React.FC<HiddenFieldsToggleProps> = ({ count, shown, onToggle }) => {
    if (count === 0) return null;
    return (
        <div className="flex items-center gap-3 my-8">
            <div className="h-px bg-gray-200 flex-1" />
            <button
                type="button"
                className="px-4 py-2 rounded-full border text-sm text-primary bg-card hover:bg-gray-50"
                onClick={onToggle}
            >
                {shown ? `Hide ${count} hidden fields` : `Show ${count} hidden fields`}
            </button>
            <div className="h-px bg-gray-200 flex-1" />
        </div>
    );
};

// Dropdown panel of the record menu (Duplicate / Delete)
export const RecordMenuPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
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
        className="flex flex-col select-none border p-2 gap-y-1 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
    >
        {children}
    </div>
);

// Three-dots button that opens the record menu
export const RecordMenuButton: React.FC<{ onToggle: () => void; icon: React.ReactNode }> = ({ onToggle, icon }) => (
    <button
        type="button"
        className="p-2 rounded hover:bg-gray-100"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
        }}
        aria-label="Record menu"
    >
        {icon}
    </button>
);

// Table chip + title shown at the left of the record popup header
export const RecordTitle: React.FC<{ tableTitle?: string; title: string }> = ({ tableTitle, title }) => (
    <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex items-center gap-2 text-2xl font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg max-w-[200px] shrink-0">
            <Table2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{tableTitle}</span>
        </span>
        <h2 className="text-2xl font-semibold truncate">{title}</h2>
    </div>
);

// Save button in the record popup header
export const RecordHeaderSaveButton: React.FC<{ disabled: boolean; onClick: () => void; label: string }> = ({ disabled, onClick, label }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`px-3 py-1.5 text-sm rounded-lg btn-primary ${disabled ? 'btn-disabled' : ''}`}
    >
        {label}
    </button>
);

// Save / discard prompt shown when closing a record popup with unsaved edits
export const RecordUnsavedDialog: React.FC<{
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    onDiscard: () => void;
    onSave: () => void;
}> = ({ isOpen, setOpen, onDiscard, onSave }) => (
    <UnsavedChangesDialog
        isOpen={isOpen}
        onCancel={() => setOpen(false)}
        onDiscard={() => {
            setOpen(false);
            onDiscard();
        }}
        onSave={() => {
            setOpen(false);
            onSave();
        }}
    />
);

type RecordFieldsBodyProps = {
    visibleFields: any[];
    hiddenFields: any[];
    showHidden: boolean;
    onToggleHidden: () => void;
    renderFieldRow: (field: any) => React.ReactNode;
    formError: string | null;
    contentClassName?: string;
};

// Visible fields, the hidden-fields toggle, the hidden fields and the form error
export const RecordFieldsBody: React.FC<RecordFieldsBodyProps> = ({
    visibleFields,
    hiddenFields,
    showHidden,
    onToggleHidden,
    renderFieldRow,
    formError,
    contentClassName = 'px-6 py-6 mx-auto w-full max-w-[820px]',
}) => (
    <div className={contentClassName}>
        <div className="flex flex-col gap-y-4">{visibleFields.map(renderFieldRow)}</div>

        <HiddenFieldsToggle count={hiddenFields.length} shown={showHidden} onToggle={onToggleHidden} />

        {showHidden && hiddenFields.length > 0 && (
            <div className="flex flex-col gap-y-4">{hiddenFields.map(renderFieldRow)}</div>
        )}

        {formError && <div className="mt-4 text-red-600 text-sm">{formError}</div>}
    </div>
);

type RecordModalShellProps = {
    tableTitle?: string;
    title: string;
    // Buttons shown in the header before Cancel
    headerActions: React.ReactNode;
    onRequestClose: () => void;
    onInput: React.FormEventHandler<HTMLDivElement>;
    children: React.ReactNode;
    // Rendered inside the backdrop, after the modal
    footer?: React.ReactNode;
};

// The Edit record popup layout: backdrop, header with actions and Cancel, scrollable body
export const RecordModalShell: React.FC<RecordModalShellProps> = ({
    tableTitle,
    title,
    headerActions,
    onRequestClose,
    onInput,
    children,
    footer,
}) => (
    <div //NOSONAR
        className="bg-modal-backdrop"
        onClick={(e) => e.target === e.currentTarget && onRequestClose()}
        onKeyDown={(e) => e.stopPropagation()}
    >
        <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0"
            onClick={onRequestClose}
        />
        <div //NOSONAR
            className="bg-modal w-full h-full relative p-0! max-w-[99rem]! max-h-180! flex flex-col overflow-hidden rounded-3xl!"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <div className="min-h-7 h-20 flex items-center justify-between px-6 py-3 border-b shrink-0">
                <RecordTitle tableTitle={tableTitle} title={title} />
                <div className="flex items-center gap-2 relative shrink-0">
                    {headerActions}
                    <button
                        type="button"
                        className="px-3 py-1.5 text-sm rounded-lg border bg-card hover:bg-gray-50 text-gray-700 shrink-0"
                        onClick={onRequestClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" onInput={onInput}>
                {children}
            </div>
        </div>
        {footer}
    </div>
);
