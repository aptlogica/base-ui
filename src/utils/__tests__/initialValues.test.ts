import { describe, it, expect } from 'vitest';
import { buildInitialValuesForEdit } from '../initialValues';

describe('initialValues', () => {
  describe('buildInitialValuesForEdit', () => {
    it('should return empty object when no columns provided', () => {
      const result = buildInitialValuesForEdit({ columns: [] });
      expect(result).toEqual({});
    });

    it('should build initial values from record data', () => {
      const columns = [
        { id: 'field1', name: 'Field 1' },
        { id: 'field2', name: 'Field 2' },
      ];
      const record = {
        id: 'rec1',
        data: {
          field1: 'value1',
          field2: 'value2',
        },
      };

      const result = buildInitialValuesForEdit({ columns, record });
      
      expect(result.field1).toBe('value1');
      expect(result.field2).toBe('value2');
    });

    it('should resolve record by recordId from rawRecords', () => {
      const columns = [{ id: 'field1', name: 'Field 1' }];
      const rawRecords = [
        { id: 'rec1', data: { field1: 'value1' } },
        { id: 'rec2', data: { field1: 'value2' } },
      ];

      const result = buildInitialValuesForEdit({
        columns,
        recordId: 'rec2',
        rawRecords,
      });
      
      expect(result.field1).toBe('value2');
    });

    it('should handle record with _meta.id', () => {
      const columns = [{ id: 'field1' }];
      const record = {
        _meta: { id: 'rec1' },
        data: { field1: 'value1' },
      };

      const result = buildInitialValuesForEdit({ columns, record });
      expect(result.field1).toBe('value1');
    });

    it('should use normalized columns for data key mapping', () => {
      const columns = [{ id: 'field1' }];
      const normalizedColumns = [{ id: 'field1', columnName: 'custom_key' }];
      const record = {
        data: { custom_key: 'value1' },
      };

      const result = buildInitialValuesForEdit({
        columns,
        normalizedColumns,
        record,
      });
      
      expect(result.field1).toBe('value1');
    });

    it('should fallback to different key formats', () => {
      const columns = [{ id: 'field1', key: 'fieldKey' }];
      const record = {
        data: { fieldKey: 'value1' },
      };

      const result = buildInitialValuesForEdit({ columns, record });
      expect(result.field1).toBe('value1');
    });

    it('should handle missing fields gracefully', () => {
      const columns = [
        { id: 'field1' },
        { id: 'field2' },
      ];
      const record = {
        data: { field1: 'value1' },
      };

      const result = buildInitialValuesForEdit({ columns, record });
      
      expect(result.field1).toBe('value1');
      expect(result.field2).toBeUndefined();
    });

    it('should handle flat record structure (no data property)', () => {
      const columns = [{ id: 'field1' }];
      const record = {
        field1: 'value1',
      };

      const result = buildInitialValuesForEdit({ columns, record });
      expect(result.field1).toBe('value1');
    });

    it('should skip columns without id', () => {
      const columns = [
        { name: 'Field without ID' },
        { id: 'field1', name: 'Field 1' },
      ];
      const record = {
        data: { field1: 'value1' },
      };

      const result = buildInitialValuesForEdit({ columns, record });
      
      expect(result.field1).toBe('value1');
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('should handle null or undefined record', () => {
      const columns = [{ id: 'field1' }];
      
      const result1 = buildInitialValuesForEdit({ columns, record: null });
      expect(result1).toEqual({});
      
      const result2 = buildInitialValuesForEdit({ columns, record: undefined });
      expect(result2).toEqual({});
    });

    it('should handle empty rawRecords array', () => {
      const columns = [{ id: 'field1' }];
      
      const result = buildInitialValuesForEdit({
        columns,
        recordId: 'rec1',
        rawRecords: [],
      });
      
      expect(result).toEqual({});
    });
  });
});
