import { describe, it, expect } from 'vitest';
import { parseApiColumnMeta, getDefaultValueFromConfig } from '../tableUtils';

describe('tableUtils', () => {

  describe('parseApiColumnMeta', () => {
    it('should return object when meta is object', () => {
      const meta = { options: ['A', 'B'] };
      const result = parseApiColumnMeta(meta);
      expect(result).toEqual(meta);
    });

    it('should return parsed object when meta is valid JSON string', () => {
      const meta = '{"options":["A","B"]}';
      const result = parseApiColumnMeta(meta);
      expect(result).toEqual({ options: ['A', 'B'] });
    });

    it('should return empty object when meta is empty string', () => {
      const result = parseApiColumnMeta('');
      expect(result).toEqual({});
    });

    it('should return empty object when meta is whitespace string', () => {
      const result = parseApiColumnMeta('   ');
      expect(result).toEqual({});
    });

    it('should return empty object when meta is null', () => {
      const result = parseApiColumnMeta(null);
      expect(result).toEqual({});
    });

    it('should return empty object when meta is invalid JSON string', () => {
      const result = parseApiColumnMeta('not json {');
      expect(result).toEqual({});
    });

    it('should return same reference when meta is object', () => {
      const meta = { key: 'value' };
      const result = parseApiColumnMeta(meta);
      expect(result).toBe(meta);
    });
  });

  describe('getDefaultValueFromConfig', () => {
    it('should return empty string when fieldConfig is null', () => {
      const result = getDefaultValueFromConfig(null, 'text');
      expect(result).toBe('');
    });

    it('should return empty string when fieldConfig is not object', () => {
      const result = getDefaultValueFromConfig('string', 'text');
      expect(result).toBe('');
    });

    it('should return defaultValue when defined and not null', () => {
      const config = { defaultValue: 'hello' };
      const result = getDefaultValueFromConfig(config, 'text');
      expect(result).toBe('hello');
    });

    it('should return checkboxDefault for boolean type when no defaultValue', () => {
      const config = { checkboxDefault: true };
      const result = getDefaultValueFromConfig(config, 'boolean');
      expect(result).toBe(true);
    });

    it('should return ratingDefault for rating type when no defaultValue', () => {
      const config = { ratingDefault: 3 };
      const result = getDefaultValueFromConfig(config, 'rating');
      expect(result).toBe(3);
    });

    it('should return singleDefault for select type when no defaultValue', () => {
      const config = { singleDefault: 'Option A' };
      const result = getDefaultValueFromConfig(config, 'select');
      expect(result).toBe('Option A');
    });

    it('should return multiDefault for multiSelect type when no defaultValue', () => {
      const config = { multiDefault: ['A', 'B'] };
      const result = getDefaultValueFromConfig(config, 'multiSelect');
      expect(result).toEqual(['A', 'B']);
    });

    it('should return dateTimeDefault for datetime type when no defaultValue', () => {
      const config = { dateTimeDefault: '2024-01-01T00:00:00Z' };
      const result = getDefaultValueFromConfig(config, 'datetime');
      expect(result).toBe('2024-01-01T00:00:00Z');
    });

    it('should return dateDefault for date type when no defaultValue', () => {
      const config = { dateDefault: '2024-01-01' };
      const result = getDefaultValueFromConfig(config, 'date');
      expect(result).toBe('2024-01-01');
    });

    it('should return timeDefault for time type when no defaultValue', () => {
      const config = { timeDefault: '12:00' };
      const result = getDefaultValueFromConfig(config, 'time');
      expect(result).toBe('12:00');
    });

    it('should return yearDefault for year type when no defaultValue', () => {
      const config = { yearDefault: 2024 };
      const result = getDefaultValueFromConfig(config, 'year');
      expect(result).toBe(2024);
    });

    it('should return empty string for number type when no defaultValue', () => {
      const config = {};
      const result = getDefaultValueFromConfig(config, 'number');
      expect(result).toBe('');
    });

    it('should return empty string for unknown type when no defaultValue', () => {
      const config = {};
      const result = getDefaultValueFromConfig(config, 'unknown');
      expect(result).toBe('');
    });
  });
});
