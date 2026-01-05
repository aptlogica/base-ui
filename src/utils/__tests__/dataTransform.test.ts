import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

vi.mock('../fieldUtils', () => ({
  processFieldValue: (_field: any, value: any) => `pv:${String(value)}`,
  processFieldForBackend: (_field: any, value: any) => `to:${String(value)}`,
  processFieldFromBackend: (_field: any, value: any) => `from:${String(value)}`,
}));

let dataTransform: typeof import('../dataTransform');

describe('dataTransform', () => {
  const fields = [{ id: 'f1', type: 'text' } as any, { id: 'f2', type: 'text' } as any];

  beforeAll(async () => {
    // Ensure our fieldUtils mock is applied before this module loads.
    vi.resetModules();
    dataTransform = await import('../dataTransform');
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  describe('transformRecordFromBackend', () => {
    it('should return empty structure when record is falsy', () => {
      expect(dataTransform.transformRecordFromBackend(null as any, fields)).toEqual({
        id: '',
        data: {},
        _meta: { id: '', created_at: '', updated_at: '' },
      });
    });

    it('should handle structured record with data/_meta', () => {
      const record = {
        id: 'r1',
        data: { f1: 'a', f2: 'b', extra: 'x' },
        _meta: { id: 'r1', created_at: 'c', updated_at: 'u' },
      };

      const out = dataTransform.transformRecordFromBackend(record, fields);
      // Only fields listed are processed
      expect(out.data).toEqual({ f1: 'from:a', f2: 'from:b' });
      expect(out._meta).toEqual(record._meta);
    });

    it('should handle legacy flat record', () => {
      const record = {
        id: 'r1',
        created_at: 'c',
        updated_at: 'u',
        f1: 'a',
        f2: 'b',
      };

      const out = dataTransform.transformRecordFromBackend(record, fields);
      expect(out.id).toBe('r1');
      expect(out.data).toEqual({ f1: 'from:a', f2: 'from:b' });
      expect(out._meta).toMatchObject({ id: 'r1', created_at: 'c', updated_at: 'u' });
    });
  });

  describe('transformRecordToBackend', () => {
    it('should convert record.data via processFieldForBackend', () => {
      const record = {
        id: 'r1',
        data: { f1: 'a', f2: 'b' },
        _meta: { created_at: 'c', updated_at: 'u', id: 'r1' },
      } as any;

      const out = dataTransform.transformRecordToBackend(record, fields);
      expect(out).toEqual({
        id: 'r1',
        created_at: 'c',
        updated_at: 'u',
        f1: 'to:a',
        f2: 'to:b',
      });
    });
  });

  describe('convertToTableStructure', () => {
    it('should provide safe defaults', () => {
      expect(dataTransform.convertToTableStructure(null as any)).toEqual({ columns: [], records: [], totalCount: 0 });
    });

    it('should normalize properties', () => {
      const out = dataTransform.convertToTableStructure({ table: { id: 't1' }, columns: [1], records: [2, 3] });
      expect(out.totalCount).toBe(2);
      expect(out.hasMore).toBe(false);
    });
  });

  describe('flattenRecord', () => {
    it('should merge _meta and data into a flat object', () => {
      const record = { id: 'r1', data: { f1: 1 }, _meta: { created_at: 'c', updated_at: 'u' } } as any;
      expect(dataTransform.flattenRecord(record)).toEqual({ id: 'r1', created_at: 'c', updated_at: 'u', f1: 1 });
    });
  });

  describe('createNewRecord', () => {
    it('should create record with processed empty values and timestamps', () => {
      const out = dataTransform.createNewRecord(fields, 7);
      expect(out.id).toBe('');
      expect(out.data).toEqual({ f1: 'pv:', f2: 'pv:' });
      expect(out._meta?.position).toBe(7);
      expect(out._meta?.created_at).toBe('2025-01-01T00:00:00.000Z');
      expect(out._meta?.updated_at).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('updateRecordField', () => {
    it('should update data value and bump updated_at', () => {
      const record = {
        id: 'r1',
        data: { f1: 'old' },
        _meta: { id: 'r1', created_at: 'c', updated_at: 'u' },
      } as any;

      const out = dataTransform.updateRecordField(record, 'f1', 'new', { id: 'f1', type: 'text' } as any);
      expect(out.data.f1).toBe('pv:new');
      expect(out._meta.updated_at).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('filterRecordsBySearch', () => {
    it('should return all records for empty query', () => {
      const records = [{ id: 'r1', data: { f1: 'A' } } as any];
      expect(dataTransform.filterRecordsBySearch(records, fields, '  ')).toBe(records);
    });

    it('should filter by matching any field value (structured data)', () => {
      const records = [
        { id: 'r1', data: { f1: 'Hello', f2: 'World' } },
        { id: 'r2', data: { f1: 'Nope', f2: 'Match' } },
      ] as any;

      expect(dataTransform.filterRecordsBySearch(records, fields, 'world').map(r => r.id)).toEqual(['r1']);
    });
  });

  describe('sortRecords', () => {
    it('should sort records ascending and descending', () => {
      const records = [
        { id: 'r1', data: { f1: '2' } },
        { id: 'r2', data: { f1: '10' } },
        { id: 'r3', data: { f1: '1' } },
      ] as any;

      expect(dataTransform.sortRecords(records, 'f1', 'asc').map(r => r.id)).toEqual(['r3', 'r1', 'r2']);
      expect(dataTransform.sortRecords(records, 'f1', 'desc').map(r => r.id)).toEqual(['r2', 'r1', 'r3']);
    });
  });

  describe('groupRecordsByField', () => {
    it('should group by value with Uncategorized fallback', () => {
      const records = [
        { id: 'r1', data: { f1: 'A' } },
        { id: 'r2', data: { f1: 'A' } },
        { id: 'r3', data: { } },
      ] as any;

      const groups = dataTransform.groupRecordsByField(records, 'f1');
      expect(Object.keys(groups).sort()).toEqual(['A', 'Uncategorized']);
      expect(groups.A.map(r => r.id)).toEqual(['r1', 'r2']);
      expect(groups.Uncategorized.map(r => r.id)).toEqual(['r3']);
    });
  });

  describe('calculateAggregates', () => {
    it('should calculate sum/average/count/min/max', () => {
      const records = [
        { id: 'r1', data: { f1: 2 } },
        { id: 'r2', data: { f1: '3' } },
        { id: 'r3', data: { f1: 'bad' } },
      ] as any;

      // Note: implementation coerces non-numeric to 0 and counts it.
      expect(dataTransform.calculateAggregates(records, 'f1', 'sum')).toBe(5);
      expect(dataTransform.calculateAggregates(records, 'f1', 'average')).toBeCloseTo(5 / 3);
      expect(dataTransform.calculateAggregates(records, 'f1', 'count')).toBe(3);
      expect(dataTransform.calculateAggregates(records, 'f1', 'min')).toBe(0);
      expect(dataTransform.calculateAggregates(records, 'f1', 'max')).toBe(3);
    });

    it('should return 0 for empty inputs and unknown operation', () => {
      expect(dataTransform.calculateAggregates([], 'f1', 'sum')).toBe(0);
      expect(dataTransform.calculateAggregates([], 'f1', 'average')).toBe(0);
      expect(dataTransform.calculateAggregates([], 'f1', 'count')).toBe(0);
      expect(dataTransform.calculateAggregates([], 'f1', 'min')).toBe(0);
      expect(dataTransform.calculateAggregates([], 'f1', 'max')).toBe(0);
      expect(dataTransform.calculateAggregates([{ id: 'r1', data: { f1: 1 } } as any], 'f1', 'sum' as any)).toBe(1);
      expect(dataTransform.calculateAggregates([{ id: 'r1', data: { f1: 1 } } as any], 'f1', 'unknown' as any)).toBe(0);
    });
  });
});
