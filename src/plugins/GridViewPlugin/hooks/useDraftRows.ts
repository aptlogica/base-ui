// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridColumn, GridRecord } from '../types/grid.types';
import { isEmptyKeyValue } from '../../../utils/primaryKeyFields';
import { apiErrorMessage } from '../../../utils/apiErrors';

// On a table with a custom primary key, "Add row" makes a draft that lives only in the browser. Its empty key
// cells are shown in red; once every key cell has a value the draft is saved with one insert (upsert) call.
// If the key is already used by another record, the draft stays and its key cells show the error.

export const DRAFT_ID_PREFIX = 'draft-';
export const isDraftRowId = (rowId: string | undefined | null): boolean => String(rowId ?? '').startsWith(DRAFT_ID_PREFIX);

// Wait for typing to settle before saving a complete draft
const SAVE_DELAY_MS = 500;

// Field types a new record can't be given in the insert: they need an existing record or are computed
const NOT_INSERTABLE = new Set(['links', 'attachment', 'lookup', 'formula', 'rollup']);
export const isDraftEditableColumn = (column: Pick<GridColumn, 'uidt' | 'type'>): boolean =>
  !NOT_INSERTABLE.has(String(column.uidt || column.type || '').toLowerCase());

export interface DraftRow {
  id: string;
  // Cell values by column key
  values: Record<string, unknown>;
  saving?: boolean;
  // Why the last save was rejected; duplicate is true when the key is already used
  error?: string;
  duplicate?: boolean;
}

// Drafts per table, kept while the app is open so moving to another page and back doesn't lose them
const draftCache = new Map<string, DraftRow[]>();
let draftCounter = 0;

export interface UseDraftRowsOptions {
  tableId: string;
  columns: GridColumn[];
  // Saved records, to find empty or repeated keys
  savedRows?: GridRecord[];
  // Key column IDs a record must fill in (empty for tables keyed by Id alone)
  keyColumnIds: string[];
  // The key also includes Id, which makes every record's key unique: only empty cells are checked
  keyIncludesId?: boolean;
  // Insert (upsert): without a row id it creates the record with values by column ID, with one it updates it
  upsert: (args: { model_id: string; row_id?: number; values: Record<string, unknown> }) => Promise<unknown>;
  onSaved?: () => void;
  onError?: (message: string) => void;
}

export const useDraftRows = ({ tableId, columns, savedRows = [], keyColumnIds, keyIncludesId = false, upsert, onSaved, onError }: UseDraftRowsOptions) => {
  const enabled = keyColumnIds.length > 0;
  const [drafts, setDrafts] = useState<DraftRow[]>(() => draftCache.get(tableId) ?? []);
  const draftsRef = useRef(drafts);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Switching tables shows that table's drafts
  useEffect(() => {
    const cached = draftCache.get(tableId) ?? [];
    draftsRef.current = cached;
    setDrafts(cached);
  }, [tableId]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  const updateDrafts = useCallback((update: (prev: DraftRow[]) => DraftRow[]) => {
    const next = update(draftsRef.current);
    draftsRef.current = next;
    if (next.length > 0) draftCache.set(tableId, next);
    else draftCache.delete(tableId);
    setDrafts(next);
  }, [tableId]);

  const keyColumns = useMemo(
    () => keyColumnIds.map(id => columns.find(c => String(c.id) === id)).filter(Boolean) as GridColumn[],
    [keyColumnIds, columns],
  );

  const missingKeyColumns = useCallback(
    (draft: DraftRow) => keyColumns.filter(c => isEmptyKeyValue(draft.values[c.key])),
    [keyColumns],
  );

  // A row's key as one comparable string; null while a key cell is empty
  const keyOf = useCallback((value: (key: string) => unknown): string | null => {
    const parts: string[] = [];
    for (const column of keyColumns) {
      const v = value(column.key);
      if (isEmptyKeyValue(v)) return null;
      parts.push(String(v).trim());
    }
    return JSON.stringify(parts);
  }, [keyColumns]);

  const savedValue = (row: GridRecord, key: string) => (row.data && key in row.data ? row.data[key] : row[key]);

  // Saved record ids by key, to tell a draft which record already has its key
  const savedKeys = useMemo(() => {
    const byKey = new Map<string, string[]>();
    if (keyColumns.length === 0) return byKey;
    for (const row of savedRows) {
      const key = keyOf(k => savedValue(row, k));
      if (key === null) continue;
      const id = String(row._meta?.id ?? row.id);
      byKey.set(key, [...(byKey.get(key) ?? []), id]);
    }
    return byKey;
  }, [savedRows, keyColumns, keyOf]);

  // Why a draft's key can't be saved: already used by a saved record or by another draft
  const duplicateReason = useCallback((draft: DraftRow, all: DraftRow[]): string | null => {
    if (keyIncludesId) return null;
    const key = keyOf(k => draft.values[k]);
    if (key === null) return null;
    const holders = savedKeys.get(key);
    if (holders?.length) return `Already used by record #${holders[0]}`;
    if (all.some(d => d.id !== draft.id && keyOf(k => d.values[k]) === key)) return 'Same key as another new row';
    return null;
  }, [keyOf, savedKeys, keyIncludesId]);

  // Checks a key cell edit on a saved record before it is sent: the record's key with the new value must not
  // be empty or used by another row. Returns the reason, or null when the value is fine.
  const savedKeyProblem = useCallback((rowId: string, columnKey: string, value: unknown): string | null => {
    const column = keyColumns.find(c => c.key === columnKey);
    if (!column) return null;
    if (isEmptyKeyValue(value)) return `${column.title} is required: it is part of the primary key.`;
    if (keyIncludesId) return null;
    const row = savedRows.find(r => String(r._meta?.id ?? r.id) === rowId);
    if (!row) return null;
    const valueOf = (k: string) => (k === columnKey ? value : savedValue(row, k));
    const key = keyOf(valueOf);
    if (key === null) return null;
    const other = (savedKeys.get(key) ?? []).find(id => id !== rowId);
    const usedByDraft = drafts.some(d => keyOf(k => d.values[k]) === key);
    if (!other && !usedByDraft) return null;
    const pairs = keyColumns.map(c => {
      const v = valueOf(c.key);
      const text = String(v as string | number).trim();
      const shown = typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(text) ? text : '"' + text + '"';
      return `${c.title} = ${shown}`;
    });
    const subject = keyColumns.length > 1 ? `The combination ${pairs.join(', ')}` : pairs[0];
    return `${subject} is already used by ${other ? `record #${other}` : 'a new row'}.`;
  }, [keyColumns, keyIncludesId, savedRows, keyOf, savedKeys, drafts]);

  // Values by column ID for the insert; only fields a new record can be given
  const insertValues = useCallback((draft: DraftRow) => {
    const values: Record<string, unknown> = {};
    for (const column of columns) {
      if (!column.id || column.isSystem || !isDraftEditableColumn(column)) continue;
      const value = draft.values[column.key];
      if (value === undefined || value === null || value === '') continue;
      values[String(column.id)] = value;
    }
    return values;
  }, [columns]);

  const removeTimer = (draftId: string) => {
    const timer = timers.current.get(draftId);
    if (timer) clearTimeout(timer);
    timers.current.delete(draftId);
  };

  const save = useCallback(async (draftId: string) => {
    const draft = draftsRef.current.find(d => d.id === draftId);
    if (!draft || draft.saving || missingKeyColumns(draft).length > 0 || duplicateReason(draft, draftsRef.current)) return;

    const submitted = insertValues(draft);
    updateDrafts(prev => prev.map(d => (d.id === draftId ? { ...d, saving: true, error: undefined, duplicate: false } : d)));
    try {
      const created = await upsert({ model_id: tableId, values: submitted });
      const current = draftsRef.current.find(d => d.id === draftId);
      removeTimer(draftId);
      updateDrafts(prev => prev.filter(d => d.id !== draftId));
      // Values typed while the insert was running go to the new record as an update
      const rowId = Number((created as { data?: { record?: { id?: unknown } } } | null)?.data?.record?.id);
      if (current && Number.isFinite(rowId)) {
        const latest = insertValues(current);
        const changed = Object.fromEntries(Object.entries(latest).filter(([id, v]) => submitted[id] !== v));
        if (Object.keys(changed).length > 0) {
          await upsert({ model_id: tableId, row_id: rowId, values: changed }).catch(err => {
            onError?.(apiErrorMessage(err, 'Failed to save the record'));
          });
        }
      }
      onSaved?.();
    } catch (err) {
      const message = apiErrorMessage(err, 'Failed to save the record');
      const duplicate = (err as { code?: string } | null)?.code === 'PKY_1008';
      updateDrafts(prev => prev.map(d => (d.id === draftId ? { ...d, saving: false, error: message, duplicate } : d)));
      onError?.(message);
    }
  }, [missingKeyColumns, duplicateReason, insertValues, updateDrafts, upsert, tableId, onSaved, onError]);

  const scheduleSave = useCallback((draftId: string) => {
    const existing = timers.current.get(draftId);
    if (existing) clearTimeout(existing);
    timers.current.set(draftId, setTimeout(() => {
      timers.current.delete(draftId);
      void save(draftId);
    }, SAVE_DELAY_MS));
  }, [save]);

  const addDraft = useCallback((): string => {
    draftCounter += 1;
    const id = `${DRAFT_ID_PREFIX}${Date.now()}-${draftCounter}`;
    updateDrafts(prev => [...prev, { id, values: {} }]);
    return id;
  }, [updateDrafts]);

  const updateDraft = useCallback((draftId: string, columnKey: string, value: unknown) => {
    updateDrafts(prev => prev.map(d => (d.id === draftId
      ? { ...d, values: { ...d.values, [columnKey]: value }, error: undefined, duplicate: false }
      : d)));
    // Saved once the key is complete and unique; other drafts waiting on this key may now be free too
    for (const draft of draftsRef.current) {
      if (missingKeyColumns(draft).length === 0 && !duplicateReason(draft, draftsRef.current)) {
        scheduleSave(draft.id);
      }
    }
  }, [updateDrafts, missingKeyColumns, duplicateReason, scheduleSave]);

  const removeDraft = useCallback((draftId: string) => {
    removeTimer(draftId);
    updateDrafts(prev => prev.filter(d => d.id !== draftId));
  }, [updateDrafts]);

  // Draft rows in the grid's row shape
  const draftRows = useMemo<GridRecord[]>(() => drafts.map(d => ({
    id: d.id,
    _meta: { id: d.id, created_at: '', updated_at: '', deleted_at: null, position: Number.MAX_SAFE_INTEGER },
    data: { ...d.values },
  })), [drafts]);

  // Key cells to show in red, with the reason: rowId -> columnKey -> message. Empty key cells and keys used by
  // more than one row, on drafts and saved rows alike.
  const invalidCells = useMemo(() => {
    const cells: Record<string, Record<string, string>> = {};
    if (keyColumns.length === 0) return cells;
    const markKey = (rowId: string, message: string) => {
      cells[rowId] = { ...cells[rowId] };
      keyColumns.forEach(c => { cells[rowId][c.key] = message; });
    };

    for (const draft of drafts) {
      const duplicate = duplicateReason(draft, drafts);
      if (duplicate) markKey(draft.id, duplicate);
      else if (draft.duplicate && draft.error) markKey(draft.id, draft.error);
      const missing = missingKeyColumns(draft);
      if (missing.length) {
        cells[draft.id] = { ...cells[draft.id] };
        missing.forEach(c => { cells[draft.id][c.key] = 'Required: part of the primary key'; });
      }
    }

    for (const row of savedRows) {
      const rowId = String(row._meta?.id ?? row.id);
      const key = keyOf(k => savedValue(row, k));
      if (key === null) {
        cells[rowId] = {};
        keyColumns.filter(c => isEmptyKeyValue(savedValue(row, c.key)))
          .forEach(c => { cells[rowId][c.key] = 'Required: part of the primary key'; });
        continue;
      }
      if (keyIncludesId) continue;
      const holders = savedKeys.get(key) ?? [];
      const draftHolder = drafts.some(d => keyOf(k => d.values[k]) === key);
      if (holders.length > 1) {
        markKey(rowId, `Same key as record #${holders.find(id => id !== rowId)}`);
      } else if (draftHolder) {
        markKey(rowId, 'Same key as a new row');
      }
    }
    return cells;
  }, [drafts, savedRows, keyColumns, keyOf, savedKeys, duplicateReason, missingKeyColumns, keyIncludesId]);

  return { enabled, drafts, draftRows, invalidCells, addDraft, updateDraft, removeDraft, savedKeyProblem };
};

// For tests: forget drafts kept between renders
export const clearDraftCache = () => {
  draftCache.clear();
};
