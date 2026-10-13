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
  // Key column IDs a record must fill in (empty for tables keyed by Id alone)
  keyColumnIds: string[];
  // Insert (upsert): without a row id it creates the record with values by column ID, with one it updates it
  upsert: (args: { model_id: string; row_id?: number; values: Record<string, unknown> }) => Promise<unknown>;
  onSaved?: () => void;
  onError?: (message: string) => void;
}

export const useDraftRows = ({ tableId, columns, keyColumnIds, upsert, onSaved, onError }: UseDraftRowsOptions) => {
  const enabled = keyColumnIds.length > 0;
  const [drafts, setDraftsState] = useState<DraftRow[]>(() => draftCache.get(tableId) ?? []);
  const draftsRef = useRef(drafts);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Switching tables shows that table's drafts
  useEffect(() => {
    const cached = draftCache.get(tableId) ?? [];
    draftsRef.current = cached;
    setDraftsState(cached);
  }, [tableId]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  const setDrafts = useCallback((update: (prev: DraftRow[]) => DraftRow[]) => {
    const next = update(draftsRef.current);
    draftsRef.current = next;
    if (next.length > 0) draftCache.set(tableId, next);
    else draftCache.delete(tableId);
    setDraftsState(next);
  }, [tableId]);

  const keyColumns = useMemo(
    () => keyColumnIds.map(id => columns.find(c => String(c.id) === id)).filter(Boolean) as GridColumn[],
    [keyColumnIds, columns],
  );

  const missingKeyColumns = useCallback(
    (draft: DraftRow) => keyColumns.filter(c => isEmptyKeyValue(draft.values[c.key])),
    [keyColumns],
  );

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
    if (!draft || draft.saving || missingKeyColumns(draft).length > 0) return;

    const submitted = insertValues(draft);
    setDrafts(prev => prev.map(d => (d.id === draftId ? { ...d, saving: true, error: undefined, duplicate: false } : d)));
    try {
      const created = await upsert({ model_id: tableId, values: submitted });
      const current = draftsRef.current.find(d => d.id === draftId);
      removeTimer(draftId);
      setDrafts(prev => prev.filter(d => d.id !== draftId));
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
      setDrafts(prev => prev.map(d => (d.id === draftId ? { ...d, saving: false, error: message, duplicate } : d)));
      onError?.(message);
    }
  }, [missingKeyColumns, insertValues, setDrafts, upsert, tableId, onSaved, onError]);

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
    setDrafts(prev => [...prev, { id, values: {} }]);
    return id;
  }, [setDrafts]);

  const updateDraft = useCallback((draftId: string, columnKey: string, value: unknown) => {
    setDrafts(prev => prev.map(d => (d.id === draftId
      ? { ...d, values: { ...d.values, [columnKey]: value }, error: undefined, duplicate: false }
      : d)));
    const draft = draftsRef.current.find(d => d.id === draftId);
    if (draft && missingKeyColumns(draft).length === 0) {
      scheduleSave(draftId);
    }
  }, [setDrafts, missingKeyColumns, scheduleSave]);

  const removeDraft = useCallback((draftId: string) => {
    removeTimer(draftId);
    setDrafts(prev => prev.filter(d => d.id !== draftId));
  }, [setDrafts]);

  // Draft rows in the grid's row shape
  const draftRows = useMemo<GridRecord[]>(() => drafts.map(d => ({
    id: d.id,
    _meta: { id: d.id, created_at: '', updated_at: '', deleted_at: null, position: Number.MAX_SAFE_INTEGER },
    data: { ...d.values },
  })), [drafts]);

  // Cells to show in red, with the reason: rowId -> columnKey -> message
  const invalidCells = useMemo(() => {
    const cells: Record<string, Record<string, string>> = {};
    for (const draft of drafts) {
      const byColumn: Record<string, string> = {};
      if (draft.duplicate && draft.error) {
        keyColumns.forEach(c => { byColumn[c.key] = draft.error as string; });
      }
      missingKeyColumns(draft).forEach(c => { byColumn[c.key] = 'Required: part of the primary key'; });
      if (Object.keys(byColumn).length > 0) cells[draft.id] = byColumn;
    }
    return cells;
  }, [drafts, keyColumns, missingKeyColumns]);

  return { enabled, drafts, draftRows, invalidCells, addDraft, updateDraft, removeDraft };
};

// For tests: forget drafts kept between renders
export const clearDraftCache = () => {
  draftCache.clear();
};
