import { describe, it, expect } from 'vitest';
import {
  extractFieldConfigFromMeta,
  generateDefaultFieldConfig,
  mergeFieldConfigWithColumns,
} from '../viewFieldConfigUtils';

describe('viewFieldConfigUtils', () => {
  describe('extractFieldConfigFromMeta', () => {
    it('should return [] for nullish or invalid JSON string', () => {
      expect(extractFieldConfigFromMeta(null)).toEqual([]);
      expect(extractFieldConfigFromMeta('{bad')).toEqual([]);
    });

    it('should read meta.fieldConfig array', () => {
      const meta = { fieldConfig: [{ id: 1, position: 0, isHidden: false }] };
      expect(extractFieldConfigFromMeta(meta)).toEqual([{ id: '1', position: 0, isHidden: false }]);
    });

    it('should read nested meta.meta.fieldConfig array', () => {
      const meta = { meta: { fieldConfig: [{ id: 'f1', position: 1, isHidden: true }] } };
      expect(extractFieldConfigFromMeta(meta)).toEqual([{ id: 'f1', position: 1, isHidden: true }]);
    });

    it('should parse JSON meta string', () => {
      const meta = JSON.stringify({ fieldConfig: [{ id: 'f1', position: 0, isHidden: false }] });
      expect(extractFieldConfigFromMeta(meta)).toEqual([{ id: 'f1', position: 0, isHidden: false }]);
    });

    it('should parse JSON string fieldConfig', () => {
      const meta = { fieldConfig: JSON.stringify([{ id: 7, position: 2, isHidden: true }]) };
      expect(extractFieldConfigFromMeta(meta)).toEqual([{ id: '7', position: 2, isHidden: true }]);
    });

    it('should return [] for non-array fieldConfig parsed from string', () => {
      const meta = { fieldConfig: JSON.stringify({ not: 'array' }) };
      expect(extractFieldConfigFromMeta(meta)).toEqual([]);
    });
  });

  describe('generateDefaultFieldConfig', () => {
    it('should make up to maxVisibleFields visible (non-system) and hide the rest', () => {
      const columns = [
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
        { id: 'd' },
        { id: 'e' },
      ];

      const out = generateDefaultFieldConfig(columns as any, 3);
      expect(out.filter(c => !c.isHidden).map(c => c.id)).toEqual(['a', 'b', 'c']);
      expect(out.filter(c => c.isHidden).map(c => c.id)).toEqual(['d', 'e']);
    });

    it('should hide system/hidden fields except Title', () => {
      const columns = [
        { id: 'sys1', system: true },
        { id: 'title1', system: true, title: 'Title' },
        { id: 'h1', hidden: true },
      ];

      const out = generateDefaultFieldConfig(columns as any, 4);
      expect(out.find(c => c.id === 'sys1')?.isHidden).toBe(true);
      expect(out.find(c => c.id === 'h1')?.isHidden).toBe(true);
      expect(out.find(c => c.id === 'title1')?.isHidden).toBe(false);
    });

    it('should apply excludeFields predicate', () => {
      const columns = [{ id: 'a' }, { id: 'b' }];
      const out = generateDefaultFieldConfig(columns as any, 4, c => c.id === 'a');
      expect(out.find(c => c.id === 'a')?.isHidden).toBe(true);
      expect(out.find(c => c.id === 'b')?.isHidden).toBe(false);
    });
  });

  describe('mergeFieldConfigWithColumns', () => {
    it('should add missing columns as hidden and sort by position', () => {
      const existing = [{ id: 'b', position: 1, isHidden: false }];
      const columns = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

      const out = mergeFieldConfigWithColumns(existing as any, columns as any);
      expect(out.map(c => c.id)).toEqual(['a', 'b', 'c']);
      expect(out.find(c => c.id === 'a')?.isHidden).toBe(true);
      expect(out.find(c => c.id === 'c')?.isHidden).toBe(true);
    });

    it('should not duplicate existing entries', () => {
      const existing = [{ id: 'a', position: 0, isHidden: false }];
      const out = mergeFieldConfigWithColumns(existing as any, [{ id: 'a' }] as any);
      expect(out).toHaveLength(1);
    });
  });
});
