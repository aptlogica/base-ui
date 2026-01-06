import { describe, it, expect } from 'vitest';
import { readViewConfig, writeViewConfig } from '../viewConfig';

describe('viewConfig', () => {
  it('readViewConfig should normalize filters/sorts/group and expose extra meta', () => {
    const view = {
      meta: JSON.stringify({
        filters: [{ fieldId: 'f1', op: 'eq', value: 1 }],
        sorts: [{ fieldId: 'f2', direction: 'asc' }],
        group: { fieldId: 'f3', order: ['a'] },
        custom: true,
      }),
    };

    const cfg = readViewConfig(view);
    expect(cfg.filters).toHaveLength(1);
    expect(cfg.sorts).toHaveLength(1);
    expect(cfg.group).toEqual({ fieldId: 'f3', order: ['a'] });
    expect(cfg.extra.custom).toBe(true);
  });

  it('readViewConfig should default to empty arrays when meta fields are invalid', () => {
    const cfg = readViewConfig({ meta: { filters: 'nope', sorts: null } });
    expect(cfg.filters).toEqual([]);
    expect(cfg.sorts).toEqual([]);
    expect(cfg.group).toBeNull();
  });

  it('writeViewConfig should merge patch into existing meta', () => {
    const view = { meta: { a: 1, filters: [] } };
    const next = writeViewConfig(view, { a: 2, group: { fieldId: 'g1' } });
    expect(next).toMatchObject({ a: 2, filters: [], group: { fieldId: 'g1' } });
  });
});
