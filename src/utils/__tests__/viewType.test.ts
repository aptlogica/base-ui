import { describe, it, expect } from 'vitest';
import { normalizeViewType, matchesViewType } from '../viewType';

describe('viewType', () => {
  describe('normalizeViewType', () => {
    it('should normalize valid view types', () => {
      expect(normalizeViewType('grid')).toBe('grid');
      expect(normalizeViewType('form')).toBe('form');
      expect(normalizeViewType('calendar')).toBe('calendar');
      expect(normalizeViewType('kanban')).toBe('kanban');
    });

    it('should trim whitespace', () => {
      expect(normalizeViewType('  grid  ')).toBe('grid');
      expect(normalizeViewType('\tform\n')).toBe('form');
    });

    it('should convert to lowercase', () => {
      expect(normalizeViewType('GRID')).toBe('grid');
      expect(normalizeViewType('Form')).toBe('form');
      expect(normalizeViewType('CaLeNdAr')).toBe('calendar');
    });

    it('should return undefined for empty strings', () => {
      expect(normalizeViewType('')).toBeUndefined();
      expect(normalizeViewType('   ')).toBeUndefined();
      expect(normalizeViewType('\t\n')).toBeUndefined();
    });

    it('should return undefined for non-string values', () => {
      expect(normalizeViewType(null)).toBeUndefined();
      expect(normalizeViewType(undefined)).toBeUndefined();
      expect(normalizeViewType(123)).toBeUndefined();
      expect(normalizeViewType({})).toBeUndefined();
      expect(normalizeViewType([])).toBeUndefined();
    });
  });

  describe('matchesViewType', () => {
    const validTypes = ['grid', 'form', 'calendar', 'kanban'];

    it('should match valid view types', () => {
      expect(matchesViewType('grid', validTypes)).toBe(true);
      expect(matchesViewType('form', validTypes)).toBe(true);
      expect(matchesViewType('calendar', validTypes)).toBe(true);
      expect(matchesViewType('kanban', validTypes)).toBe(true);
    });

    it('should match case-insensitively', () => {
      expect(matchesViewType('GRID', validTypes)).toBe(true);
      expect(matchesViewType('Form', validTypes)).toBe(true);
      expect(matchesViewType('CaLeNdAr', validTypes)).toBe(true);
    });

    it('should handle whitespace', () => {
      expect(matchesViewType('  grid  ', validTypes)).toBe(true);
      expect(matchesViewType('\tform\n', validTypes)).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(matchesViewType('invalid', validTypes)).toBe(false);
      expect(matchesViewType('table', validTypes)).toBe(false);
      expect(matchesViewType('unknown', validTypes)).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(matchesViewType('', validTypes)).toBe(false);
      expect(matchesViewType('   ', validTypes)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(matchesViewType(null, validTypes)).toBe(false);
      expect(matchesViewType(undefined, validTypes)).toBe(false);
      expect(matchesViewType(123, validTypes)).toBe(false);
      expect(matchesViewType({}, validTypes)).toBe(false);
    });

    it('should work with empty valid types array', () => {
      expect(matchesViewType('grid', [])).toBe(false);
      expect(matchesViewType('form', [])).toBe(false);
    });

    it('should work with custom valid types', () => {
      const customTypes = ['custom1', 'custom2'];
      expect(matchesViewType('custom1', customTypes)).toBe(true);
      expect(matchesViewType('custom2', customTypes)).toBe(true);
      expect(matchesViewType('grid', customTypes)).toBe(false);
    });
  });
});
