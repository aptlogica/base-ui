import { describe, it, expect } from 'vitest';
import type { GridColumn } from '../../../../../types/grid.types';
import {
  filterGridDataOperationColumns,
  getGridColumnFieldType,
  getGridColumnIdentity,
  getGridColumnValueKey,
  isGridDataOperationSelectableColumn,
} from '../gridColumnIdentity';

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

describe('getGridColumnValueKey', () => {
  it('prefers key over id for record value lookup', () => {
    const column: GridColumn = {
      id: 'col-1',
      key: 'email',
      column_name: 'email_api',
      title: 'Email',
      type: 'text',
    };

    expect(getGridColumnValueKey(column)).toBe('email');
  });

  it('falls back to column_name when key is absent', () => {
    const column = { id: 'col-1', column_name: 'email_api', type: 'text' } as unknown as GridColumn;

    expect(getGridColumnValueKey(column)).toBe('email_api');
  });
});

describe('getGridColumnFieldType', () => {
  it('normalizes uidt when present', () => {
    const column = { id: 'col-1', uidt: 'Attachment', type: 'text' } as unknown as GridColumn;

    expect(getGridColumnFieldType(column)).toBe('attachment');
  });

  it('defaults to text when uidt is absent', () => {
    const column = { id: 'col-1', type: 'Formula' } as unknown as GridColumn;

    expect(getGridColumnFieldType(column)).toBe('text');
  });
});

describe('isGridDataOperationSelectableColumn', () => {
  const excludedTypes = ['attachment', 'user', 'links', 'lookup', 'formula'] as const;

  it.each(excludedTypes)('returns false for %s columns based on uidt', (uidt) => {
    const column = { id: 'col-1', uidt, title: `${uidt} column` } as GridColumn;

    expect(isGridDataOperationSelectableColumn(column)).toBe(false);
  });

  it('returns true for supported text columns', () => {
    const column = { id: 'col-1', uidt: 'text', title: 'Name' } as GridColumn;

    expect(isGridDataOperationSelectableColumn(column)).toBe(true);
  });

  it('ignores type when uidt is absent', () => {
    const column = { id: 'col-1', type: 'formula', title: 'Total' } as GridColumn;

    expect(isGridDataOperationSelectableColumn(column)).toBe(true);
  });

  it('returns false when the column has no identity', () => {
    const column = { uidt: 'text' } as unknown as GridColumn;

    expect(isGridDataOperationSelectableColumn(column)).toBe(false);
  });
});

describe('filterGridDataOperationColumns', () => {
  it('removes excluded uidt field types from the column list', () => {
    const columns = [
      { id: 'col-1', uidt: 'text', title: 'Name' },
      { id: 'col-2', uidt: 'attachment', title: 'Files' },
      { id: 'col-3', uidt: 'formula', title: 'Total' },
      { id: 'col-4', uidt: 'email', title: 'Email' },
    ] as GridColumn[];

    expect(filterGridDataOperationColumns(columns).map((column) => column.id)).toEqual(['col-1', 'col-4']);
  });
});
