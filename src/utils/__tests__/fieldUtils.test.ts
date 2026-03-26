import { describe, it, expect } from 'vitest';
import {
  getFieldDefaultValue,
  getTypeDefaultValue,
  processFieldValue,
  isSystemField,
  mapFieldConfig,
  validateRequiredFields,
  isFormulaField,
} from '../fieldUtils';

describe('fieldUtils', () => {
  describe('getTypeDefaultValue', () => {
    it('should return false for boolean types', () => {
      expect(getTypeDefaultValue('checkbox')).toBe(false);
      expect(getTypeDefaultValue('boolean')).toBe(false);
    });

    it('should return 0 for rating', () => {
      expect(getTypeDefaultValue('rating')).toBe(0);
    });

    it('should return empty string for number types', () => {
      expect(getTypeDefaultValue('number')).toBe('');
      expect(getTypeDefaultValue('decimal')).toBe('');
      expect(getTypeDefaultValue('currency')).toBe('');
      expect(getTypeDefaultValue('percent')).toBe('');
      expect(getTypeDefaultValue('year')).toBe('');
    });

    it('should return empty array for multi-value types', () => {
      expect(getTypeDefaultValue('multiSelect')).toEqual([]);
      expect(getTypeDefaultValue('links')).toEqual([]);
    });

    it('should return empty object for json', () => {
      expect(getTypeDefaultValue('json')).toEqual({});
    });

    it('should return empty string for text types', () => {
      expect(getTypeDefaultValue('text')).toBe('');
      expect(getTypeDefaultValue('longText')).toBe('');
      expect(getTypeDefaultValue('email')).toBe('');
      expect(getTypeDefaultValue('url')).toBe('');
    });

    it('should return empty string for unknown types', () => {
      expect(getTypeDefaultValue('unknown')).toBe('');
    });
  });

  describe('getFieldDefaultValue', () => {
    it('should return type default when no meta provided', () => {
      const field = { type: 'text' };
      expect(getFieldDefaultValue(field)).toBe('');
    });

    it('should use defaultValue from meta when provided', () => {
      const field = {
        type: 'text',
        meta: { defaultValue: 'Default Text' },
      };
      expect(getFieldDefaultValue(field)).toBe('Default Text');
    });

    it('should handle boolean defaults', () => {
      const field = {
        type: 'checkbox',
        meta: { checkboxDefault: true },
      };
      expect(getFieldDefaultValue(field)).toBe(true);
    });

    it('should handle rating defaults', () => {
      const field = {
        type: 'rating',
        meta: { ratingDefault: 3 },
      };
      expect(getFieldDefaultValue(field)).toBe(3);
    });

    it('should handle select defaults', () => {
      const field = {
        type: 'select',
        meta: { singleDefault: 'option1' },
      };
      expect(getFieldDefaultValue(field)).toBe('option1');
    });

    it('should handle multiSelect defaults', () => {
      const field = {
        type: 'multiSelect',
        meta: { multiDefault: ['opt1', 'opt2'] },
      };
      expect(getFieldDefaultValue(field)).toEqual(['opt1', 'opt2']);
    });

    it('should handle datetime defaults', () => {
      const field = {
        type: 'datetime',
        meta: { dateTimeDefault: '2024-01-01T10:00:00' },
      };
      expect(getFieldDefaultValue(field)).toBe('2024-01-01T10:00:00');
    });

    it('should handle date defaults', () => {
      const field = {
        type: 'date',
        meta: { dateDefault: '2024-01-01' },
      };
      expect(getFieldDefaultValue(field)).toBe('2024-01-01');
    });

    it('should handle time defaults', () => {
      const field = {
        type: 'time',
        meta: { timeDefault: '10:00' },
      };
      expect(getFieldDefaultValue(field)).toBe('10:00');
    });

    it('should handle year defaults', () => {
      const field = {
        type: 'year',
        meta: { yearDefault: '2024' },
      };
      expect(getFieldDefaultValue(field)).toBe('2024');
    });

    it('should handle email defaults', () => {
      const field = {
        type: 'email',
        meta: { emailDefault: 'test@example.com' },
      };
      expect(getFieldDefaultValue(field)).toBe('test@example.com');
    });

    it('should handle phone defaults', () => {
      const field = {
        type: 'phoneNumber',
        meta: { phoneDefault: '+1234567890' },
      };
      expect(getFieldDefaultValue(field)).toBe('+1234567890');
    });

    it('should handle url defaults', () => {
      const field = {
        type: 'url',
        meta: { urlDefault: 'https://example.com' },
      };
      expect(getFieldDefaultValue(field)).toBe('https://example.com');
    });

    it('should handle duration defaults', () => {
      const field = {
        type: 'duration',
        meta: { durationDefault: '01:30:00' },
      };
      expect(getFieldDefaultValue(field)).toBe('01:30:00');
    });

    it('should handle links defaults', () => {
      const field = {
        type: 'links',
        meta: { linksDefault: ['link1', 'link2'] },
      };
      expect(getFieldDefaultValue(field)).toEqual(['link1', 'link2']);
    });

    it('should return type default when meta exists but no default value', () => {
      const field = {
        type: 'boolean',
        meta: {},
      };
      expect(getFieldDefaultValue(field)).toBe(false);
    });

    it('should handle null defaultValue', () => {
      const field = {
        type: 'text',
        meta: { defaultValue: null },
      };
      // null defaultValue should fallback to type default
      expect(getFieldDefaultValue(field)).toBe('');
    });

    it('should return zero defaultValue when explicitly provided', () => {
      const field = {
        type: 'number',
        meta: { defaultValue: 0 },
      };
      expect(getFieldDefaultValue(field)).toBe(0);
    });

    it('should prioritize defaultValue over type-specific defaults', () => {
      const field = {
        type: 'checkbox',
        meta: {
          checkboxDefault: true,
          defaultValue: false,
        },
      };
      expect(getFieldDefaultValue(field)).toBe(false);
    });

    it('should handle empty meta object', () => {
      const field = {
        type: 'number',
        meta: {},
      };
      expect(getFieldDefaultValue(field)).toBe('');
    });

    it('should handle field without type', () => {
      const field: any = {
        meta: { defaultValue: 'test' },
      };
      expect(getFieldDefaultValue(field)).toBe('test');
    });
  });

  describe('processFieldValue', () => {
    it('should process string values', () => {
      const field = { type: 'text' };
      const result = processFieldValue(field, 'test value');
      expect(result).toBeDefined();
    });

    it('should handle null field', () => {
      const result = processFieldValue(null as any, 'value');
      expect(result).toBe('value');
    });

    it('should handle undefined value', () => {
      const field = { type: 'text' };
      const result = processFieldValue(field, undefined);
      expect(result).toBeDefined();
    });

    it('should handle number values', () => {
      const field = { type: 'number' };
      const result = processFieldValue(field, 123);
      expect(result).toBeDefined();
    });

    it('should handle boolean values', () => {
      const field = { type: 'boolean' };
      const result = processFieldValue(field, true);
      expect(result).toBeDefined();
    });

    it('should handle array values', () => {
      const field = { type: 'multiSelect' };
      const result = processFieldValue(field, ['opt1', 'opt2']);
      expect(result).toBeDefined();
    });

    it('should handle object values', () => {
      const field = { type: 'json' };
      const result = processFieldValue(field, { key: 'value' });
      expect(result).toBeDefined();
    });

    it('should process formula and non-array multiselect safely', () => {
      expect(processFieldValue({ type: 'formula' }, 'anything')).toBe('');
      expect(processFieldValue({ type: 'multiSelect' }, 'not-array')).toEqual([]);
    });

    it('should normalize numeric and null-ish values', () => {
      expect(processFieldValue({ type: 'number' }, '12')).toBe(12);
      expect(processFieldValue({ type: 'number' }, 'abc')).toBe(0);
      expect(processFieldValue({ type: 'text' }, null)).toBe('null');
      expect(processFieldValue({ type: 'text' }, undefined)).toBe('undefined');
    });

    it('should handle additional numeric field types', () => {
      expect(processFieldValue({ type: 'decimal' }, '45.67')).toBe(45.67);
      expect(processFieldValue({ type: 'currency' }, '100.50')).toBe(100.5);
      expect(processFieldValue({ type: 'percent' }, '75')).toBe(75);
      expect(processFieldValue({ type: 'year' }, '2024')).toBe(2024);
    });

    it('should handle edge cases for boolean fields', () => {
      expect(processFieldValue({ type: 'checkbox' }, 'false')).toBe(true); // truthy string
      expect(processFieldValue({ type: 'boolean' }, 0)).toBe(false);
      expect(processFieldValue({ type: 'boolean' }, '')).toBe(false);
      expect(processFieldValue({ type: 'boolean' }, [])).toBe(true); // empty array is truthy
    });

    it('should handle non-array values for multiSelect', () => {
      expect(processFieldValue({ type: 'multiSelect' }, 'string')).toEqual([]);
      expect(processFieldValue({ type: 'multiSelect' }, 123)).toEqual([]);
      expect(processFieldValue({ type: 'multiSelect' }, null)).toEqual([]);
      expect(processFieldValue({ type: 'multiSelect' }, undefined)).toEqual([]);
      expect(processFieldValue({ type: 'multiSelect' }, {})).toEqual([]);
    });

    it('should handle various types for json field', () => {
      const objValue = { key: 'value', nested: { prop: 123 } };
      expect(processFieldValue({ type: 'json' }, objValue)).toEqual(objValue);
      expect(processFieldValue({ type: 'json' }, [1, 2, 3])).toEqual([1, 2, 3]);
      expect(processFieldValue({ type: 'json' }, 'string')).toBe('string');
      expect(processFieldValue({ type: 'json' }, null)).toBeNull();
    });

    it('should handle unknown field types', () => {
      expect(processFieldValue({ type: 'unknown' }, 123)).toBe('123');
      expect(processFieldValue({ type: 'custom' }, { obj: 'value' })).toBe('[object Object]');
      expect(processFieldValue({ type: 'datetime' }, '2024-01-01')).toBe('2024-01-01');
    });
  });

  describe('isSystemField', () => {
    it('should detect system flags and known system names', () => {
      expect(isSystemField({ type: 'text', isSystem: true })).toBe(true);
      expect(isSystemField({ type: 'text', name: 'created_at' })).toBe(true);
      expect(isSystemField({ type: 'text', name: 'title' })).toBe(false);
      expect(isSystemField({ type: 'text', name: 'lastModifiedBy' })).toBe(true);
    });
  });

  describe('mapFieldConfig', () => {
    it('should map boolean config with field priority', () => {
      const meta = mapFieldConfig({
        type: 'boolean',
        checkboxIcon: 'x',
        checkboxColor: 'red',
        checkboxDefault: true,
        meta: { checkboxIcon: 'check', checkboxColor: 'green', defaultValue: false },
      });
      expect(meta).toMatchObject({
        icon: 'x',
        color: 'red',
        defaultValue: true,
      });
    });

    it('should fall back to meta checkbox defaults when field values are missing', () => {
      const meta = mapFieldConfig({
        type: 'checkbox',
        meta: { checkboxIcon: 'check', checkboxColor: 'green', checkboxDefault: true },
      });
      expect(meta).toMatchObject({
        icon: 'check',
        color: 'green',
        defaultValue: true,
      });
    });

    it('should map rating/multi/select defaults', () => {
      expect(mapFieldConfig({ type: 'rating', ratingMax: 7, ratingDefault: 2 })).toMatchObject({
        ratingIcon: 'star',
        ratingColor: 'yellow',
        ratingMax: 7,
        ratingDefault: 2,
      });

      expect(
        mapFieldConfig({ type: 'multiSelect', options: ['a'], multiDefault: ['a'], meta: { defaultValue: [] } })
      ).toMatchObject({
        options: ['a'],
        defaultValue: ['a'],
      });

      expect(
        mapFieldConfig({ type: 'select', options: ['x'], singleDefault: 'x', meta: { defaultValue: '' } })
      ).toMatchObject({
        options: ['x'],
        defaultValue: 'x',
      });
    });

    it('should map fallback defaults for other types', () => {
      expect(mapFieldConfig({ type: 'phoneNumber', phoneDefault: '+1', meta: {} })).toMatchObject({
        defaultValue: '+1',
      });
      expect(mapFieldConfig({ type: 'duration', durationDefault: '01:00:00', meta: {} })).toMatchObject({
        defaultValue: '01:00:00',
      });
    });

    it('should map text defaults using field.defaultValue', () => {
      const meta = mapFieldConfig({
        type: 'text',
        defaultValue: 'hello',
        meta: { defaultValue: 'fallback' },
      });
      expect(meta).toMatchObject({ defaultValue: 'hello' });
    });

    it('should preserve meta defaultValue when field default is empty', () => {
      const meta = mapFieldConfig({
        type: 'text',
        defaultValue: '',
        meta: { defaultValue: 'fallback' },
      });
      expect(meta).toMatchObject({ defaultValue: 'fallback' });
    });

    it('should map all field type defaults in default case', () => {
      // Test text field
      expect(mapFieldConfig({
        type: 'text',
        defaultValue: 'hello',
        meta: { defaultValue: 'fallback' },
      })).toMatchObject({ defaultValue: 'hello' });

      // Test longText field  
      expect(mapFieldConfig({
        type: 'longText',
        defaultValue: 'long text value',
        meta: {},
      })).toMatchObject({ defaultValue: 'long text value' });

      // Test number field
      expect(mapFieldConfig({
        type: 'number',
        defaultValue: '123',
        meta: {},
      })).toMatchObject({ defaultValue: '123' });

      // Test decimal field
      expect(mapFieldConfig({
        type: 'decimal', 
        defaultValue: '45.67',
        meta: {},
      })).toMatchObject({ defaultValue: '45.67' });

      // Test year field
      expect(mapFieldConfig({
        type: 'year',
        yearDefault: '2024',
        meta: {},
      })).toMatchObject({ defaultValue: '2024' });

      // Test time field
      expect(mapFieldConfig({
        type: 'time',
        timeDefault: '14:30',
        meta: {},
      })).toMatchObject({ defaultValue: '14:30' });

      // Test date field
      expect(mapFieldConfig({
        type: 'date',
        defaultValue: '2024-01-01',
        meta: {},
      })).toMatchObject({ defaultValue: '2024-01-01' });

      // Test datetime field
      expect(mapFieldConfig({
        type: 'datetime',
        dateTimeDefault: '2024-01-01T10:00:00',
        meta: {},
      })).toMatchObject({ defaultValue: '2024-01-01T10:00:00' });

      // Test email field
      expect(mapFieldConfig({
        type: 'email',
        emailDefault: 'test@example.com',
        meta: {},
      })).toMatchObject({ defaultValue: 'test@example.com' });

      // Test phoneNumber field
      expect(mapFieldConfig({
        type: 'phoneNumber',
        phoneDefault: '+1234567890',
        meta: {},
      })).toMatchObject({ defaultValue: '+1234567890' });

      // Test url field
      expect(mapFieldConfig({
        type: 'url',
        urlDefault: 'https://example.com',
        meta: {},
      })).toMatchObject({ defaultValue: 'https://example.com' });

      // Test percent field
      expect(mapFieldConfig({
        type: 'percent',
        percentDefault: '75',
        meta: {},
      })).toMatchObject({ defaultValue: '75' });

      // Test duration field
      expect(mapFieldConfig({
        type: 'duration',
        durationDefault: '02:30:00',
        meta: {},
      })).toMatchObject({ defaultValue: '02:30:00' });

      // Test currency field
      expect(mapFieldConfig({
        type: 'currency',
        defaultValue: '100.50',
        meta: {},
      })).toMatchObject({ defaultValue: '100.50' });
    });

    it('should fallback to meta defaultValue when field defaults are undefined', () => {
      // Test with undefined field defaults falling back to meta
      expect(mapFieldConfig({
        type: 'text',
        defaultValue: undefined,
        meta: { defaultValue: 'meta-fallback' },
      })).toMatchObject({ defaultValue: 'meta-fallback' });

      expect(mapFieldConfig({
        type: 'year',
        yearDefault: undefined,
        meta: { defaultValue: '2023' },
      })).toMatchObject({ defaultValue: '2023' });

      expect(mapFieldConfig({
        type: 'datetime',
        dateTimeDefault: undefined,
        meta: { defaultValue: '2023-12-31T23:59:59' },
      })).toMatchObject({ defaultValue: '2023-12-31T23:59:59' });
    });

    it('should handle field types not in mapping', () => {
      // Test unknown field type should still work
      const meta = mapFieldConfig({
        type: 'unknown-type',
        meta: { existingProp: 'value' },
      });
      expect(meta).toMatchObject({ existingProp: 'value' });
    });

    it('should handle determineDefaultValue helper conditions', () => {
      // Test field.checkboxDefault takes priority
      expect(mapFieldConfig({
        type: 'boolean',
        checkboxDefault: true,
        meta: { checkboxDefault: false, defaultValue: false },
      })).toMatchObject({ defaultValue: true });

      // Test meta.checkboxDefault as fallback
      expect(mapFieldConfig({
        type: 'checkbox',
        meta: { checkboxDefault: true, defaultValue: false },
      })).toMatchObject({ defaultValue: true });

      // Test meta.defaultValue as final fallback
      expect(mapFieldConfig({
        type: 'boolean',
        meta: { defaultValue: true },
      })).toMatchObject({ defaultValue: true });

      // Test final fallback to false
      expect(mapFieldConfig({
        type: 'checkbox',
        meta: {},
      })).toMatchObject({ defaultValue: false });
    });
  });

  describe('validateRequiredFields', () => {
    it('should return only required fields with empty values', () => {
      const fields = [
        { id: 'a', type: 'text', required: true },
        { id: 'b', type: 'text', required: true },
        { id: 'c', type: 'text', required: false },
      ];
      const data = { a: '  ', b: 'value', c: '' };
      expect(validateRequiredFields(fields, data)).toEqual([{ id: 'a', type: 'text', required: true }]);
    });

    it('should handle missing field ids', () => {
      const fields = [
        { type: 'text', required: true }, // no id
        { id: 'b', type: 'text', required: true },
      ];
      const data = { b: 'value' };
      expect(validateRequiredFields(fields, data)).toEqual([{ type: 'text', required: true }]);
    });

    it('should handle null and undefined values', () => {
      const fields = [
        { id: 'a', type: 'text', required: true },
        { id: 'b', type: 'text', required: true },
        { id: 'c', type: 'text', required: true },
      ];
      const data = { a: null, b: undefined, c: 0 };
      expect(validateRequiredFields(fields, data)).toEqual([
        { id: 'a', type: 'text', required: true },
        { id: 'b', type: 'text', required: true },
        // c: 0 is not empty (String(0).trim() === '0')
      ]);
    });

    it('should handle empty data object', () => {
      const fields = [
        { id: 'a', type: 'text', required: true },
      ];
      const data = {};
      expect(validateRequiredFields(fields, data)).toEqual([{ id: 'a', type: 'text', required: true }]);
    });
  });

  describe('isFormulaField', () => {
    it('should detect formula by type or uidt', () => {
      expect(isFormulaField({ type: 'formula' } as any)).toBe(true);
      expect(isFormulaField({ type: 'text', uidt: 'formula' } as any)).toBe(true);
      expect(isFormulaField({ type: 'text' } as any)).toBe(false);
    });

    it('should handle undefined or null fields', () => {
      // These will throw errors because the function accesses field.type directly
      expect(() => isFormulaField(undefined as any)).toThrow();
      expect(() => isFormulaField(null as any)).toThrow();
    });

    it('should handle fields without type or uidt', () => {
      expect(isFormulaField({} as any)).toBe(false);
      expect(isFormulaField({ name: 'test' } as any)).toBe(false);
    });

    it('should handle fields with only uidt', () => {
      expect(isFormulaField({ uidt: 'formula' } as any)).toBe(true);
      expect(isFormulaField({ uidt: 'text' } as any)).toBe(false);
    });
  });
});
