import { describe, it, expect } from 'vitest';
import { contextToTableData } from '../tableDataAdapter';

describe('tableDataAdapter', () => {
  it('contextToTableData should map model/columns/records and include view when withViews=true', () => {
    const ctx: any = {
      tableId: 123,
      baseId: 'b1',
      workspaceId: 'w1',
      tableTitle: 'My Table',
      tableAlias: 'alias',
      tableMeta: { x: 1 },
      fields: [
        { id: 'f1', title: 'Field 1', uidt: 'text', meta: { a: 1 }, position: 2 },
        { id: 2, column_name: 'col2', uidt: 'number' },
      ],
      rows: [{ data: { f1: 'a' } }, { data: { f1: 'b' } }],
      viewId: 'v1',
      viewType: 'grid',
      meta: { extra: { filters: [] } },
    };

    const out = contextToTableData(ctx, true);
    expect(out.model).toMatchObject({
      id: '123',
      base_id: 'b1',
      workspace_id: 'w1',
      title: 'My Table',
      alias: 'alias',
      meta: { x: 1 },
    });

    expect(out.columns[0]).toMatchObject({
      id: 'f1',
      column_name: 'Field 1',
      title: 'Field 1',
      uidt: 'text',
      meta: { a: 1 },
      order_index: 2,
    });

    expect(out.columns[1]).toMatchObject({
      id: '2',
      column_name: 'col2',
      title: 'col2',
      uidt: 'number',
    });

    expect(out.records).toEqual([{ f1: 'a' }, { f1: 'b' }]);
    expect(out.views).toEqual([{ id: 'v1', type: 'grid', meta: { filters: [] } }]);
  });

  it('contextToTableData should omit views when withViews=false', () => {
    const ctx: any = {
      tableId: 't1',
      baseId: 'b1',
      workspaceId: 'w1',
      tableTitle: 'T',
      fields: [],
      rows: [],
      viewId: 'v1',
      viewType: 'grid',
      meta: { extra: { filters: [] } },
    };

    const out = contextToTableData(ctx, false);
    expect((out as any).views).toBeUndefined();
  });

  it('contextToTableData should default order_index to index when no position', () => {
    const ctx: any = {
      tableId: 't1',
      baseId: 'b1',
      workspaceId: 'w1',
      tableTitle: 'T',
      fields: [{ id: 'f1' }, { id: 'f2' }],
      rows: [],
      viewId: 'v1',
      viewType: 'grid',
    };

    const out = contextToTableData(ctx, true);
    expect(out.columns[0].order_index).toBe(0);
    expect(out.columns[1].order_index).toBe(1);
  });
});
