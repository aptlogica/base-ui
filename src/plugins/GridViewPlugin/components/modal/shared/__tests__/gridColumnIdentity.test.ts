import { describe, it, expect } from 'vitest';
import type { GridColumn } from '../../../../../types/grid.types';
import { getGridColumnIdentity } from '../gridColumnIdentity';

describe('getGridColumnIdentity', () => {
  it('returns id as string when id is a string', () => {
    const column: GridColumn = { id: 'col-1', type: 'text' } as GridColumn;
    const result = getGridColumnIdentity(column);
    expect(result).toBe('col-1');
  });

  it('returns id as string when id is a number', () => {
    const column = { id: 123 as unknown as string, type: 'text' } as GridColumn;
    const result = getGridColumnIdentity(column);
    expect(result).toBe('123');
  });

  it('returns key when id is absent', () => {
    const column: GridColumn = { key: 'key-abc', type: 'text' } as GridColumn;
    const result = getGridColumnIdentity(column);
    expect(result).toBe('key-abc');
  });

  it('returns column_name when id and key are absent', () => {
    const column = { column_name: 'col_name', type: 'text' } as unknown as GridColumn;
    const result = getGridColumnIdentity(column);
    expect(result).toBe('col_name');
  });

  it('returns title when id, key and column_name are absent', () => {
    const column = { title: 'Column Title', type: 'text' } as unknown as GridColumn;
    const result = getGridColumnIdentity(column);
    expect(result).toBe('Column Title');
  });

  it('returns empty string when no identity fields are present', () => {
    const column = { type: 'text' } as unknown as GridColumn;
    const result = getGridColumnIdentity(column);
    expect(result).toBe('');
  });

  it('skips falsy id (0) and returns key', () => {
    const column = { id: 0 as unknown as string, key: 'k1', type: 'text' } as unknown as GridColumn;
    const result = getGridColumnIdentity(column);
    expect(result).toBe('k1');
  });

  it('treats null/undefined identity properties as absent', () => {
    const column = { id: null, key: undefined, column_name: 'name', type: 'text' } as unknown as GridColumn;
    const result = getGridColumnIdentity(column);
    expect(result).toBe('name');
  });

  it('throws when passed undefined', () => {
    // @ts-expect-error testing runtime behavior for undefined input
    expect(() => getGridColumnIdentity(undefined)).toThrow();
  });

  it('throws when passed null', () => {
    // @ts-expect-error testing runtime behavior for null input
    expect(() => getGridColumnIdentity(null)).toThrow();
  });
});
