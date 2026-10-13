import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftRows, clearDraftCache, isDraftRowId } from '../useDraftRows';
import type { GridColumn, GridRecord } from '../../types/grid.types';

const columns: GridColumn[] = [
  { id: 'c-code', key: 'code', title: 'Code', type: 'text' },
  { id: 'c-year', key: 'yr', title: 'Year', type: 'number' },
  { id: 'c-notes', key: 'notes', title: 'Notes', type: 'text' },
  { id: 'c-links', key: 'emps', title: 'Employees', type: 'text' as any, uidt: 'links' },
];

const saved = (id: string, data: Record<string, unknown>): GridRecord => ({
  id, _meta: { id, created_at: '', updated_at: '', deleted_at: null, position: 1 }, data,
});

const setup = (
  upsert = vi.fn().mockResolvedValue({ data: { record: { id: 9 } } }),
  keyColumnIds = ['c-code', 'c-year'],
  savedRows: GridRecord[] = [],
) => {
  const onSaved = vi.fn();
  const onError = vi.fn();
  const hook = renderHook(() => useDraftRows({ tableId: 't1', columns, savedRows, keyColumnIds, upsert, onSaved, onError }));
  return { ...hook, upsert, onSaved, onError };
};

describe('useDraftRows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearDraftCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is only enabled for tables with a custom key', () => {
    expect(setup(undefined, ['c-code']).result.current.enabled).toBe(true);
    expect(setup(undefined, []).result.current.enabled).toBe(false);
  });

  it('adds a draft whose empty key cells are shown in red', () => {
    const { result } = setup();
    let id = '';
    act(() => { id = result.current.addDraft(); });

    expect(isDraftRowId(id)).toBe(true);
    expect(result.current.draftRows).toHaveLength(1);
    expect(result.current.invalidCells[id]).toEqual({
      code: 'Required: part of the primary key',
      yr: 'Required: part of the primary key',
    });
  });

  it('keeps the draft local until every key cell is filled, then inserts it once', async () => {
    const { result, upsert, onSaved } = setup();
    let id = '';
    act(() => { id = result.current.addDraft(); });

    act(() => { result.current.updateDraft(id, 'notes', 'n'); });
    act(() => { result.current.updateDraft(id, 'code', 'HR'); });
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(upsert).not.toHaveBeenCalled();
    expect(Object.keys(result.current.invalidCells[id])).toEqual(['yr']);

    act(() => { result.current.updateDraft(id, 'yr', 2026); });
    await act(async () => { vi.advanceTimersByTime(600); });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith({ model_id: 't1', values: { 'c-code': 'HR', 'c-year': 2026, 'c-notes': 'n' } });
    expect(result.current.draftRows).toHaveLength(0);
    expect(onSaved).toHaveBeenCalled();
  });

  it('keeps the draft and marks its key cells when the key is already used', async () => {
    const message = 'The combination Code = "HR", Year = 2026 is already used by record #4 (Acme).';
    const upsert = vi.fn().mockRejectedValue(Object.assign(new Error(message), { code: 'PKY_1008' }));
    const { result, onError } = setup(upsert);
    let id = '';
    act(() => { id = result.current.addDraft(); });
    act(() => {
      result.current.updateDraft(id, 'code', 'HR');
      result.current.updateDraft(id, 'yr', 2026);
    });
    await act(async () => { vi.advanceTimersByTime(600); });

    expect(result.current.draftRows).toHaveLength(1);
    expect(result.current.invalidCells[id]).toEqual({ code: message, yr: message });
    expect(onError).toHaveBeenCalledWith(message);

    // Fixing a key cell clears the error and saves again
    upsert.mockResolvedValueOnce({});
    act(() => { result.current.updateDraft(id, 'code', 'OPS'); });
    expect(result.current.invalidCells[id]).toBeUndefined();
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(result.current.draftRows).toHaveLength(0);
  });

  it('sends values typed during the insert to the new record', async () => {
    let finishInsert: (value: unknown) => void = () => undefined;
    const upsert = vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { finishInsert = resolve; }))
      .mockResolvedValue({});
    const { result } = setup(upsert);
    let id = '';
    act(() => { id = result.current.addDraft(); });
    act(() => {
      result.current.updateDraft(id, 'code', 'HR');
      result.current.updateDraft(id, 'yr', 2026);
    });
    await act(async () => { vi.advanceTimersByTime(600); });
    act(() => { result.current.updateDraft(id, 'notes', 'typed while saving'); });
    await act(async () => { finishInsert({ data: { record: { id: 42 } } }); });
    await act(async () => { vi.advanceTimersByTime(600); });

    expect(upsert).toHaveBeenNthCalledWith(2, { model_id: 't1', row_id: 42, values: { 'c-notes': 'typed while saving' } });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(result.current.draftRows).toHaveLength(0);
  });

  it('does not send a draft whose key is already used by a saved record', async () => {
    const { result, upsert } = setup(undefined, undefined, [saved('4', { code: 'HR', yr: 2026 })]);
    let id = '';
    act(() => { id = result.current.addDraft(); });
    act(() => {
      result.current.updateDraft(id, 'code', 'HR');
      result.current.updateDraft(id, 'yr', '2026');
    });
    await act(async () => { vi.advanceTimersByTime(600); });

    expect(upsert).not.toHaveBeenCalled();
    expect(result.current.invalidCells[id]).toEqual({ code: 'Already used by record #4', yr: 'Already used by record #4' });
    // The saved record holding the key is highlighted too
    expect(result.current.invalidCells['4']).toEqual({ code: 'Same key as a new row', yr: 'Same key as a new row' });

    // A different key is saved
    act(() => { result.current.updateDraft(id, 'yr', '2027'); });
    expect(result.current.invalidCells[id]).toBeUndefined();
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('holds back two drafts with the same key until one changes', async () => {
    const { result, upsert } = setup();
    let a = '';
    let b = '';
    act(() => { a = result.current.addDraft(); b = result.current.addDraft(); });
    act(() => {
      result.current.updateDraft(a, 'code', 'HR');
      result.current.updateDraft(a, 'yr', 2026);
      result.current.updateDraft(b, 'code', 'HR');
      result.current.updateDraft(b, 'yr', 2026);
    });
    await act(async () => { vi.advanceTimersByTime(600); });

    expect(upsert).not.toHaveBeenCalled();
    expect(result.current.invalidCells[a].code).toBe('Same key as another new row');
    expect(result.current.invalidCells[b].code).toBe('Same key as another new row');

    act(() => { result.current.updateDraft(b, 'code', 'FIN'); });
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it('highlights saved records with an empty or repeated key', () => {
    const { result } = setup(undefined, undefined, [
      saved('1', { code: 'HR', yr: 2026 }),
      saved('2', { code: 'HR', yr: 2026 }),
      saved('3', { code: '', yr: 2026 }),
      saved('4', { code: 'FIN', yr: 2026 }),
    ]);

    expect(result.current.invalidCells['1']).toEqual({ code: 'Same key as record #2', yr: 'Same key as record #2' });
    expect(result.current.invalidCells['2']).toEqual({ code: 'Same key as record #1', yr: 'Same key as record #1' });
    expect(result.current.invalidCells['3']).toEqual({ code: 'Required: part of the primary key' });
    expect(result.current.invalidCells['4']).toBeUndefined();
  });

  it('with Id in the key only empty cells are flagged', () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useDraftRows({
      tableId: 't1', columns, keyColumnIds: ['c-code'], keyIncludesId: true, upsert: vi.fn(), onSaved,
      savedRows: [saved('1', { code: 'HR' }), saved('2', { code: 'HR' }), saved('3', { code: '' })],
    }));

    expect(result.current.invalidCells['1']).toBeUndefined();
    expect(result.current.invalidCells['2']).toBeUndefined();
    expect(result.current.invalidCells['3']).toEqual({ code: 'Required: part of the primary key' });
  });

  it('checks key edits on saved records before they are sent', () => {
    const { result } = setup(undefined, undefined, [
      saved('1', { code: 'HR', yr: 2026 }),
      saved('2', { code: 'FIN', yr: 2026 }),
    ]);

    // Changing record 2's Code to HR repeats record 1's key (HR, 2026)
    expect(result.current.savedKeyProblem('2', 'code', 'HR'))
      .toBe('The combination Code = "HR", Year = 2026 is already used by record #1.');
    expect(result.current.savedKeyProblem('2', 'code', ' ')).toBe('Code is required: it is part of the primary key.');
    // A free combination, its own value, and fields outside the key are fine
    expect(result.current.savedKeyProblem('2', 'yr', 2027)).toBeNull();
    expect(result.current.savedKeyProblem('1', 'code', 'HR')).toBeNull();
    expect(result.current.savedKeyProblem('2', 'notes', '')).toBeNull();
  });

  it('names the value for a single-field key and checks new rows too', () => {
    const { result } = setup(undefined, ['c-code'], [saved('1', { code: 'HR' }), saved('2', { code: 'FIN' })]);
    expect(result.current.savedKeyProblem('2', 'code', 'HR')).toBe('Code = "HR" is already used by record #1.');

    let id = '';
    act(() => { id = result.current.addDraft(); });
    act(() => { result.current.updateDraft(id, 'code', 'OPS'); });
    expect(result.current.savedKeyProblem('2', 'code', 'OPS')).toBe('Code = "OPS" is already used by a new row.');
  });

  it('removes a draft without saving it', async () => {
    const { result, upsert } = setup();
    let id = '';
    act(() => { id = result.current.addDraft(); });
    act(() => {
      result.current.updateDraft(id, 'code', 'HR');
      result.current.updateDraft(id, 'yr', 2026);
      result.current.removeDraft(id);
    });
    await act(async () => { vi.advanceTimersByTime(600); });

    expect(upsert).not.toHaveBeenCalled();
    expect(result.current.draftRows).toHaveLength(0);
  });

  it('keeps drafts when the grid is shown again', () => {
    const first = setup();
    act(() => { first.result.current.addDraft(); });
    first.unmount();

    expect(setup().result.current.draftRows).toHaveLength(1);
  });
});
