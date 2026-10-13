import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftRows, clearDraftCache, isDraftRowId } from '../useDraftRows';
import type { GridColumn } from '../../types/grid.types';

const columns: GridColumn[] = [
  { id: 'c-code', key: 'code', title: 'Code', type: 'text' },
  { id: 'c-year', key: 'yr', title: 'Year', type: 'number' },
  { id: 'c-notes', key: 'notes', title: 'Notes', type: 'text' },
  { id: 'c-links', key: 'emps', title: 'Employees', type: 'text' as any, uidt: 'links' },
];

const setup = (upsert = vi.fn().mockResolvedValue({ data: { record: { id: 9 } } }), keyColumnIds = ['c-code', 'c-year']) => {
  const onSaved = vi.fn();
  const onError = vi.fn();
  const hook = renderHook(() => useDraftRows({ tableId: 't1', columns, keyColumnIds, upsert, onSaved, onError }));
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
