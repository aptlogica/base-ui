import { describe, it, expect } from 'vitest';
import {
  cachedTableRecords, linkItemIdentity, linkItemLabel, linkItems, linkKeyMatches, linkRowIds, resolveLinkRowId,
} from '../linkValues';

const records = [
  { id: 1, code: 'IN', dept: 'HR', title: 'India HR' },
  { id: 2, code: 'US', dept: 'HR', title: 'US HR' },
  { id: 3, code: 'IN', dept: 'FIN', year: 2026, title: 'India Finance' },
];

describe('linkValues', () => {
  it('normalizes cell values to items', () => {
    expect(linkItems(null)).toEqual([]);
    expect(linkItems('')).toEqual([]);
    expect(linkItems({})).toEqual([]);
    expect(linkItems([])).toEqual([]);
    expect(linkItems([{ id: 1 }, null])).toEqual([{ id: 1 }]);
    expect(linkItems({ id: 1 })).toEqual([{ id: 1 }]);
    expect(linkItems(5)).toEqual([5]);
  });

  it('matches key objects on every key field', () => {
    expect(linkKeyMatches({ code: 'IN', dept: 'HR' }, records[0])).toBe(true);
    expect(linkKeyMatches({ code: 'IN', dept: 'HR' }, records[2])).toBe(false);
    expect(linkKeyMatches({ code: 'IN', year: '2026' }, records[2])).toBe(true);
    expect(linkKeyMatches({}, records[0])).toBe(false);
    expect(linkKeyMatches({ missing: 'x' }, records[0])).toBe(false);
  });

  it('resolves ids, records and composite keys to row ids', () => {
    expect(resolveLinkRowId(7)).toBe('7');
    expect(resolveLinkRowId({ id: 12 })).toBe('12');
    expect(resolveLinkRowId({ id: 2, title: 'US HR' })).toBe('2');
    expect(resolveLinkRowId({ code: 'IN', dept: 'FIN' }, records)).toBe('3');
    expect(resolveLinkRowId({ code: 'UK', dept: 'HR' }, records)).toBeUndefined();
    expect(resolveLinkRowId(null)).toBeUndefined();
  });

  it('labels and identifies unresolved keys', () => {
    expect(linkItemLabel({ code: 'IN', dept: 'HR' })).toBe('IN / HR');
    expect(linkItemLabel({ title: 'India HR', id: 1 })).toBe('India HR / 1');
    expect(linkItemLabel(4)).toBe('4');
    expect(linkItemIdentity({ code: 'IN', dept: 'HR' }, records)).toBe('1');
    expect(linkItemIdentity({ code: 'UK', dept: 'HR' }, records)).toBe('key:{"code":"UK","dept":"HR"}');
  });

  it('collects resolvable row ids of a cell', () => {
    expect(linkRowIds([{ code: 'US', dept: 'HR' }, { id: 1 }, { code: 'UK', dept: 'X' }, 'abc'], records)).toEqual([2, 1]);
  });

  it('reads records cached by useTable', () => {
    const queryClient = { getQueryData: (key: unknown[]) => (key[1] === 't2' ? { data: { records } } : undefined) };
    expect(cachedTableRecords(queryClient, 't2')).toBe(records);
    expect(cachedTableRecords(queryClient, 't9')).toEqual([]);
    expect(cachedTableRecords(undefined, 't2')).toEqual([]);
    expect(cachedTableRecords(queryClient, undefined)).toEqual([]);
  });
});
