import { describe, it, expect } from 'vitest';
import { getFieldDefaultValue, getTypeDefaultValue, processFieldValue } from '../fieldUtils';

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
  });
});
