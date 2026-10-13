// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Lock, UserRound, UserRoundPen } from 'lucide-react';
import { usePrimaryKey, useUpdatePrimaryKey } from '../../../hooks/useApi';
import type { PrimaryKeyColumn, PrimaryKeyViolation } from '../../../service/clientService';
import { FIELD_TYPES, getFieldTypeIconComponent } from '../../../types/fieldTypes';

interface PrimaryKeyPanelProps {
  table: any;
}

// Error code returned when existing records don't satisfy the new key; samples are in error.details
const DATA_INVALID = 'PKY_1004';

// Audit types aren't in FIELD_TYPES, whose lookup would fall back to Links
const SYSTEM_TYPES: Record<string, { label: string; icon: React.ElementType }> = {
  createdBy: { label: 'Created by', icon: UserRound },
  lastModifiedBy: { label: 'Last modified by', icon: UserRoundPen },
};

const FieldType: React.FC<{ uidt: string }> = ({ uidt }) => {
  const system = SYSTEM_TYPES[uidt];
  if (system) {
    const Icon = system.icon;
    return <><Icon className="w-4 h-4 text-gray-500" /><span className="truncate">{system.label}</span></>;
  }
  const known = FIELD_TYPES.find(ft => ft.key === uidt);
  return (
    <>
      {known && getFieldTypeIconComponent(uidt)}
      <span className="truncate">{known ? known.label : uidt}</span>
    </>
  );
};

const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i]);

const parseViolation = (err: any): PrimaryKeyViolation | null => {
  if (err?.code !== DATA_INVALID || !err?.details) return null;
  try {
    return typeof err.details === 'string' ? JSON.parse(err.details) : err.details;
  } catch {
    return null;
  }
};

const formatValues = (values: Record<string, unknown>, titles: Record<string, string>) =>
  Object.entries(values)
    .map(([name, value]) => `${titles[name] ?? name} = ${value === null || value === '' ? '(empty)' : typeof value === 'string' ? `"${value}"` : String(value)}`)
    .join(', ');

// Primary key settings: pick one or more fields; the order they are picked in is the key order
const PrimaryKeyPanel: React.FC<PrimaryKeyPanelProps> = ({ table }) => {
  const tableId: string = table?.id;
  const { data: primaryKey, isLoading, error: loadError } = usePrimaryKey(tableId);
  const updatePrimaryKey = useUpdatePrimaryKey();

  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [violation, setViolation] = useState<PrimaryKeyViolation | null>(null);

  const saved = primaryKey?.column_ids ?? [];
  useEffect(() => {
    setSelected(primaryKey?.column_ids ?? []);
  }, [primaryKey]);

  const columns: PrimaryKeyColumn[] = primaryKey?.columns ?? [];
  const locked = !!primaryKey?.locked;
  const changed = !sameOrder(selected, saved);
  const titleByName = useMemo(
    () => Object.fromEntries(columns.map(c => [c.column_name, c.title || c.column_name])),
    [columns],
  );
  const keyTitles = selected.map(id => columns.find(c => c.id === id)?.title).filter(Boolean);
  // Rows are added empty, so key fields other than id get a starting value (see key_fill_defaults)
  const selectedColumns = selected.map(id => columns.find(c => c.id === id)).filter(Boolean) as PrimaryKeyColumn[];
  const customKey = selectedColumns.some(c => c.column_name !== 'id');
  const sampleColumn = selectedColumns.find(c => c.column_name !== 'id')?.column_name ?? 'code';

  const toggle = (column: PrimaryKeyColumn) => {
    setMessage(null);
    setViolation(null);
    setSelected(current => (current.includes(column.id)
      ? current.filter(id => id !== column.id)
      : [...current, column.id]));
  };

  const save = async () => {
    setMessage(null);
    setViolation(null);
    try {
      await updatePrimaryKey.mutateAsync({ tableId, columnIds: selected });
      setMessage({ ok: true, text: 'Primary key updated' });
    } catch (err: any) {
      const details = parseViolation(err);
      if (details) {
        setViolation({ ...details, message: details.message || err?.message });
        return;
      }
      // Postgres and other failures carry their exact message
      setMessage({ ok: false, text: err?.message || 'Failed to update the primary key' });
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }
  if (loadError || !primaryKey) {
    return (
      <div className="p-6 text-sm text-red-600 flex items-center gap-1">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{(loadError as any)?.message || 'Failed to load the primary key'}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-4 flex-shrink-0">
        <h3 className="text-base font-semibold text-primary">Primary Key</h3>
        <p className="text-sm text-secondary">
          The fields that identify each record. Select several fields for a composite key; their combined values must be filled in and unique.
        </p>
      </div>

      {locked && (
        <div role="note" className="mx-4 mt-3 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900 flex gap-2 flex-shrink-0">
          <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">The primary key can't be changed while this table has link fields</p>
            <p className="mt-0.5">
              Link fields store the primary key values of the records they link to, so changing the key would break those links.
              To change it, first remove {primaryKey.link_columns.length === 1 ? 'the link field' : 'these link fields'}:{' '}
              <span className="font-medium">{primaryKey.link_columns.join(', ')}</span>.
            </p>
          </div>
        </div>
      )}

      <div className="mx-4 mt-3 flex items-center gap-2 text-sm flex-shrink-0">
        <KeyRound className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="text-gray-600">Key:</span>
        {keyTitles.length > 0 ? (
          <span className="font-medium text-primary truncate" data-testid="primary-key-summary">{keyTitles.join(' + ')}</span>
        ) : (
          <span className="text-red-600">Select at least one field</span>
        )}
      </div>

      {customKey && (
        <p className="mx-4 mt-1 text-xs text-secondary flex-shrink-0" data-testid="primary-key-new-rows">
          New records get a starting value in empty key fields, which you then replace: text fields get the field name with a
          timestamp and record id (e.g. <span className="font-mono">{sampleColumn}_20261013101523123456_42</span>), numbers the
          record id, dates today and checkboxes unchecked.
        </p>
      )}

      <div className="flex-1 min-h-0 flex flex-col mx-4 mt-3 border rounded-xl overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="w-14 px-4 py-3" aria-label="In key" />
                <th className="px-4 py-3 text-xs text-gray-700 font-semibold text-left">Field</th>
                <th className="w-[30%] px-4 py-3 text-xs text-gray-700 font-semibold text-left">Type</th>
                <th className="w-[30%] px-4 py-3 text-xs text-gray-700 font-semibold text-left">Key order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {columns.map(column => {
                const position = selected.indexOf(column.id);
                const checked = position >= 0;
                // The last key field can't be unchecked: a table always has a primary key
                const lastOne = checked && selected.length === 1;
                const disabled = locked || !column.eligible || lastOne;
                const hint = locked ? 'Locked by link fields' : !column.eligible ? column.reason : lastOne ? 'At least one key field is required' : undefined;
                return (
                  <tr key={column.id} className={`bg-card ${disabled ? '' : 'hover:bg-gray-50'} transition-colors`} title={hint}>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-green-600 cursor-pointer disabled:cursor-not-allowed"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(column)}
                        aria-label={`Use ${column.title} in the primary key`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm truncate block ${column.eligible ? 'text-primary font-medium' : 'text-gray-400'}`}>{column.title}</span>
                      {!column.eligible && column.reason && <span className="text-xs text-gray-400 block truncate">{column.reason}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-2 text-sm ${column.eligible ? 'text-gray-600' : 'text-gray-400'}`}>
                        <FieldType uidt={column.uidt} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {checked && (
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium whitespace-nowrap">
                          {selected.length > 1 ? `Key field ${position + 1}` : 'Key field'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {violation && (
        <div
          role="alert"
          className="mx-4 mt-3 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 max-h-64 overflow-y-auto flex-shrink-0"
          data-testid="primary-key-violation"
        >
          <p className="font-medium flex items-center gap-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Primary key not saved
          </p>
          <p className="mt-1" data-testid="primary-key-violation-message">{violation.message}</p>

          {violation.null_count > 0 && (
            <div className="mt-3">
              <p className="font-medium">Empty key values</p>
              <ul className="mt-1 list-disc pl-5">
                {(violation.empty_fields ?? []).map(f => (
                  <li key={f.column}>{f.title} is empty in {f.count} {f.count === 1 ? 'record' : 'records'}</li>
                ))}
              </ul>
              <ul className="mt-1 pl-5 space-y-0.5">
                {violation.null_records.map(r => (
                  <li key={r.id}>
                    Record #{r.id}{r.title ? ` (${r.title})` : ''}
                    {r.missing?.length ? <span className="text-red-700"> — empty: {r.missing.join(', ')}</span> : null}
                  </li>
                ))}
              </ul>
              {violation.null_count > violation.null_records.length && (
                <p className="mt-1 pl-5 text-red-700">and {violation.null_count - violation.null_records.length} more records</p>
              )}
            </div>
          )}

          {violation.duplicate_groups > 0 && (
            <div className="mt-3">
              <p className="font-medium">Duplicate key values</p>
              <ul className="mt-1 list-disc pl-5">
                {violation.duplicates.map(d => {
                  const ids = d.record_ids ?? [];
                  return (
                    <li key={JSON.stringify(d.values)}>
                      {formatValues(d.values, titleByName)} — used by {d.count} records
                      {ids.length > 0 && `: ${ids.map(id => `#${id}`).join(', ')}${d.count > ids.length ? ` and ${d.count - ids.length} more` : ''}`}
                    </li>
                  );
                })}
              </ul>
              {violation.duplicate_groups > violation.duplicates.length && (
                <p className="mt-1 pl-5 text-red-700">and {violation.duplicate_groups - violation.duplicates.length} more duplicated values</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 p-4 flex-shrink-0">
        <div className="min-w-0">
          {message && (
            <div className={`text-sm flex items-center gap-1 ${message.ok ? 'text-green-600' : 'text-red-600'}`}>
              {message.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>
        {!locked && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelected(saved);
                setMessage(null);
                setViolation(null);
              }}
              disabled={!changed || updatePrimaryKey.isPending}
              className="px-4 h-10 rounded-xl border text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!changed || selected.length === 0 || updatePrimaryKey.isPending}
              className="px-4 h-10 rounded-xl btn-primary text-primary text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatePrimaryKey.isPending ? 'Saving…' : 'Save primary key'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrimaryKeyPanel;
