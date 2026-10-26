// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FuzzyWorkerInput } from '../fuzzyDeduplicationWorker';

const postMessage = vi.fn();

const run = async (input: Partial<FuzzyWorkerInput>) => {
  (self as any).postMessage = postMessage;
  await import('../fuzzyDeduplicationWorker');
  postMessage.mockClear();
  (self as any).onmessage({
    data: { records: [], selectedColumnKeys: ['name'], threshold: 0.8, keepRule: 'keep_first', ...input },
  });
  const calls = postMessage.mock.calls.map((c) => c[0]);
  return {
    progress: calls.filter((m) => m.type === 'progress'),
    result: calls.find((m) => m.type === 'result'),
  };
};

describe('fuzzyDeduplicationWorker', () => {
  beforeEach(() => postMessage.mockReset());

  it('returns an empty result when there are no records', async () => {
    const { result } = await run({ records: [] });
    expect(result.previewRows).toEqual([]);
    expect(result.affectedRows).toBe(0);
  });

  it('returns unchanged rows when no columns are selected, with id fallbacks', async () => {
    const { result } = await run({
      selectedColumnKeys: [],
      records: [{ id: 'a', name: 'x' }, { name: 'y' }, null as any],
    });
    expect(result.previewRows.map((r: any) => r.id)).toEqual(['a', 'row_1', 'row_2']);
    expect(result.previewRows[2].original).toEqual({});
    expect(result.previewRows.every((r: any) => r.rowState === 'unchanged')).toBe(true);
  });

  it('groups similar rows and removes the later ones with keep_first', async () => {
    const { result, progress } = await run({
      records: [
        { id: '1', name: 'John Smith' },
        { id: '2', name: 'john smith' },
        { id: '3', name: 'Completely Different' },
        { id: '4', name: '' },
        { id: '5', name: '  ' },
      ],
    });
    expect(progress.length).toBeGreaterThan(0);
    expect(result.changedRowIds).toEqual(['2']);
    expect(result.affectedCells).toBe(1);
    expect(result.previewRows.map((r: any) => [r.id, r.rowState])).toEqual([
      ['1', 'kept'],
      ['2', 'removed'],
    ]);
  });

  it('matches near-miss spellings but not dissimilar values of similar length', async () => {
    const { result } = await run({
      records: [
        { id: '1', name: 'Jonathan Smith' },
        { id: '2', name: 'Jonathon Smith' },
        { id: '3', name: 'Zzzzzzzzz Qqqqq' },
        { id: '4', name: '' },
      ],
    });
    expect(result.changedRowIds).toEqual(['2']);
  });

  it('keeps the last row with keep_last', async () => {
    const { result } = await run({
      keepRule: 'keep_last',
      records: [{ id: '1', name: 'abc' }, { id: '2', name: 'abc' }],
    });
    expect(result.changedRowIds).toEqual(['1']);
  });

  it('keeps the most recently updated row with keep_latest_updated', async () => {
    const { result } = await run({
      keepRule: 'keep_latest_updated',
      records: [
        { id: '1', name: 'abc', updated_at: '2024-01-01' },
        { id: '2', name: 'abc', updatedAt: '2025-01-01' },
        { id: '3', name: 'abc', created_at: '2023-01-01' },
        { id: '4', name: 'abc' },
      ],
    });
    expect(result.changedRowIds).toEqual(['1', '3', '4']);
  });

  it('does not match when a column is empty on one side or lengths differ greatly', async () => {
    const { result } = await run({
      selectedColumnKeys: ['name', 'city'],
      records: [
        { id: '1', name: 'abc', city: 'Pune' },
        { id: '2', name: 'abc', city: '' },
        { id: '3', name: 'abc', city: 'Pune' },
        { id: '4', name: 'a', city: 'Pune' },
      ],
    });
    expect(result.changedRowIds).toEqual(['3']);
  });

  it('matches rows where both optional columns are empty', async () => {
    const { result } = await run({
      selectedColumnKeys: ['name', 'city'],
      records: [{ id: '1', name: 'abc' }, { id: '2', name: 'abc', city: null }],
    });
    expect(result.changedRowIds).toEqual(['2']);
  });

  it('applies manual row action overrides', async () => {
    const { result } = await run({
      deduplicationMode: 'manual',
      rowActions: { '1': 'delete', '2': 'clear', '3': 'keep', '4': 'none' },
      records: [
        { id: '1', name: 'abc' },
        { id: '2', name: 'abc' },
        { id: '3', name: 'abc' },
        { id: '4', name: 'abc' },
      ],
    });
    const byId = Object.fromEntries(result.previewRows.map((r: any) => [r.id, r]));
    expect(byId['1'].rowState).toBe('removed');
    expect(byId['2'].rowState).toBe('changed');
    expect(byId['2'].values.name).toBe('');
    expect(byId['2'].changedColumns).toEqual(['name']);
    expect(byId['3'].rowState).toBe('kept');
    expect(byId['4'].rowState).toBe('removed');
    expect(result.affectedRows).toBe(3);
  });

  it('ignores row actions in automatic mode', async () => {
    const { result } = await run({
      rowActions: { '1': 'delete' },
      records: [{ id: '1', name: 'abc' }, { id: '2', name: 'abc' }],
    });
    expect(result.changedRowIds).toEqual(['2']);
  });
});
