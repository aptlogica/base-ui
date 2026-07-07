import { describe, it, expect } from 'vitest';
import {
  buildImportRowKey,
  normalizeImportCellValue,
  stringifyImportCellValue,
} from '../importCellValue';

describe('importCellValue', () => {
  describe('stringifyImportCellValue', () => {
    it('should return empty string for null values', () => {
      expect(stringifyImportCellValue(null)).toBe('');
    });

    it('should return iso string for date values', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');

      expect(stringifyImportCellValue(date)).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should return symbol description when available', () => {
      expect(stringifyImportCellValue(Symbol('test'))).toBe('Symbol(test)');
    });

    it('should return bare symbol label when description is missing', () => {
      expect(stringifyImportCellValue(Symbol())).toBe('Symbol()');
    });

    it('should return named function label when function has a name', () => {
      function namedFn() {
        return 'ok';
      }

      expect(stringifyImportCellValue(namedFn)).toBe('[Function namedFn]');
    });

    it('should return generic function label when function has no name', () => {
      expect(stringifyImportCellValue(() => undefined)).toBe('[Function]');
    });

    it('should return object placeholder when json serialization fails', () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;

      expect(stringifyImportCellValue(circular)).toBe('[Object]');
    });

    it('should return empty string for unsupported primitive types', () => {
      expect(stringifyImportCellValue(undefined)).toBe('');
    });
  });

  describe('normalizeImportCellValue', () => {
    it('should trim stringified values', () => {
      expect(normalizeImportCellValue('  hello  ')).toBe('hello');
    });
  });

  describe('buildImportRowKey', () => {
    it('should build a stable key from row values and index', () => {
      const key = buildImportRowKey(
        { name: 'Alice', email: 'alice@example.com' },
        [{ key: 'name' }, { key: 'email' }],
        0
      );

      expect(key).toBe('0:Alice\u001falice@example.com');
    });
  });
});
