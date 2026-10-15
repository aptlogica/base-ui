// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useRef, useState } from 'react';
import { AlertCircle, Key, X } from 'lucide-react';
import ColumnPicker from './ColumnPicker';
import { useCheckTableConstraint, useCreateTableConstraint, useUpdateTableConstraint } from '../../../hooks/useApi';
import type { TableConstraint } from '../../../service/clientService';
import type { Column } from '../../../types/api.types';
import { UNIQUE_DEFAULT_CONFLICT_MESSAGE, keyHasDefaultConflict } from './constraintUtils';

interface UniqueKeyFormModalProps {
  table: any;
  // All columns of the table
  columns: Column[];
  // Set when editing; adds a new unique key otherwise
  item?: TableConstraint;
  onClose: () => void;
}

const MAX_NAME_LENGTH = 50;

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

// Name used when none is typed, e.g. "Unique EMAIL + EMPLOYEE_ID"
export const defaultKeyName = (titles: string[]): string =>
  titles.length ? `Unique ${titles.join(' + ')}`.slice(0, MAX_NAME_LENGTH) : '';

// Popup to add or edit a unique key, laid out like the trigger popup. Save checks the records first.
const UniqueKeyFormModal: React.FC<UniqueKeyFormModalProps> = ({ table, columns, item, onClose }) => {
  const tableId: string = table?.id;
  const titleOf = new Map(columns.map(c => [c.id, c.title]));

  const savedColumnIds = item?.columns.map(c => c.id) || [];
  const [columnIds, setColumnIds] = useState<string[]>(savedColumnIds);
  const [name, setName] = useState(item?.title || '');
  // The name follows the columns until the user types one; an existing key keeps its name
  const [nameEdited, setNameEdited] = useState(!!item);
  const [error, setError] = useState('');
  // Set when Save is clicked with no name, so the field is highlighted in red
  const [nameError, setNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const checkConstraint = useCheckTableConstraint();
  const createConstraint = useCreateTableConstraint();
  const updateConstraint = useUpdateTableConstraint();
  const isBusy = checkConstraint.isPending || createConstraint.isPending || updateConstraint.isPending;

  const title = name.trim();
  // Records only need checking when the key itself changes, not its name
  const keyChanged = !item || !sameList(columnIds, savedColumnIds);
  const canSave = !isBusy && (keyChanged || title !== item?.title);

  // Shown as soon as the chosen columns all have a default; the server rejects it too
  const defaultConflict = keyHasDefaultConflict(columnIds, columns);

  const changeColumns = (ids: string[]) => {
    setColumnIds(ids);
    if (!nameEdited) {
      setName(defaultKeyName(ids.map(id => titleOf.get(id) || 'column')));
      if (ids.length) setNameError(false);
    }
    setError('');
  };

  const handleSave = async () => {
    setError('');
    if (title === '') {
      setNameError(true);
      nameInputRef.current?.focus();
      setError('Name is required');
      return;
    }
    if (columnIds.length === 0) {
      setError('Select at least one column');
      return;
    }
    if (keyChanged && defaultConflict) {
      setError(UNIQUE_DEFAULT_CONFLICT_MESSAGE);
      return;
    }
    try {
      if (keyChanged) {
        const check = await checkConstraint.mutateAsync({ model_id: tableId, column_ids: columnIds });
        if (!check.data?.valid) {
          setError(check.data?.message || 'Duplicate data in these columns. Remove the duplicates and try again.');
          return;
        }
      }
      const input = { title, column_ids: columnIds };
      if (item) {
        await updateConstraint.mutateAsync({ id: item.id, tableId, ...input });
      } else {
        await createConstraint.mutateAsync({ model_id: tableId, type: 'unique', ...input });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    }
  };

  let busyLabel = '';
  if (checkConstraint.isPending) busyLabel = 'Checking...';
  else if (isBusy) busyLabel = 'Saving...';

  return (
    <div //NOSONAR
      className="bg-modal-backdrop relative"
      // Escape closes this popup without closing the settings popup
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <button type="button" aria-label="Close modal" className="absolute inset-0" onClick={onClose} />
      <dialog
        open
        aria-modal="true"
        aria-labelledby="unique-key-form-title"
        className="bg-modal !p-0 flex flex-col relative overflow-hidden !max-w-2xl !max-h-[90vh] min-h-[420px] text-inherit"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Key className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="unique-key-form-title" className="text-xl font-semibold text-primary truncate">
                {item ? 'Edit' : 'Add'} unique key
              </h2>
              <p className="text-sm text-secondary truncate">
                {table?.title || table?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-5 space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="unique-key-name" className={`field-component-label ${nameError ? '!text-red-600' : '!text-primary'}`}>
                Name <span className="field-component-required">*</span>
              </label>
              <input
                id="unique-key-name"
                type="text"
                value={name}
                maxLength={MAX_NAME_LENGTH}
                ref={nameInputRef}
                aria-invalid={nameError}
                placeholder="e.g. Unique email"
                onChange={e => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setNameError(false);
                  setNameEdited(true);
                }}
                className={`field-component field-component-focus border ${nameError ? '!border-red-500 focus:!border-red-500 bg-red-50' : 'field-component-border'}`}
              />
              <p className="text-xs text-gray-500">{name.length}/{MAX_NAME_LENGTH} characters</p>
            </div>

            <div className="space-y-1.5">
              <p className="field-component-label !text-primary">
                Columns <span className="field-component-required">*</span>
              </p>
              <ColumnPicker columns={columns} value={columnIds} onChange={changeColumns} />
              <p className="text-xs text-gray-500">
                No two records can have the same value in these columns. With several columns, the combination must be unique.
              </p>
            </div>

            {defaultConflict && !error && (
              <div className="text-sm flex items-center gap-1 text-amber-600" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{UNIQUE_DEFAULT_CONFLICT_MESSAGE}</span>
              </div>
            )}

            {error && (
              <div className="text-sm flex items-center gap-1 text-red-600" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-10 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-10 py-2 rounded-xl btn-primary text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {busyLabel ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {busyLabel}
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default UniqueKeyFormModal;
