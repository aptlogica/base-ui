import { describe, it, expect } from 'vitest';
import { toShortTime, toShortTimeCondensed } from '../timeUtils';

describe('timeUtils', () => {
  describe('toShortTime', () => {
    it('should convert AM time to short format', () => {
      expect(toShortTime('10:45 AM')).toBe('10:45a');
    });

    it('should convert PM time to short format', () => {
      expect(toShortTime('03:30 PM')).toBe('3:30p');
    });

    it('should handle midnight correctly', () => {
      expect(toShortTime('12:00 AM')).toBe('12:00a');
    });

    it('should handle noon correctly', () => {
      expect(toShortTime('12:00 PM')).toBe('12:00p');
    });

    it('should remove leading zero from hours', () => {
      expect(toShortTime('09:15 AM')).toBe('9:15a');
      expect(toShortTime('01:45 PM')).toBe('1:45p');
    });

    it('should handle null input', () => {
      expect(toShortTime(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(toShortTime(undefined)).toBe('');
    });

    it('should handle empty string input', () => {
      expect(toShortTime('')).toBe('');
    });

    it('should return original string if format is unexpected', () => {
      expect(toShortTime('invalid')).toBe('invalid');
      expect(toShortTime('10:45')).toBe('10:45');
    });

    it('should handle missing parts gracefully', () => {
      expect(toShortTime('10:45 ')).toBe('10:45 ');
      expect(toShortTime(' AM')).toBe(' AM');
    });

    it('should handle zero hour', () => {
      expect(toShortTime('00:00 AM')).toBe('0:00a');
    });
  });

  describe('toShortTimeCondensed', () => {
    it('should return short time without condensing when option not set', () => {
      expect(toShortTimeCondensed('10:45 AM')).toBe('10:45a');
      expect(toShortTimeCondensed('03:00 PM')).toBe('3:00p');
    });

    it('should remove :00 minutes when hideMinutesIfZero is true', () => {
      expect(toShortTimeCondensed('03:00 PM', { hideMinutesIfZero: true })).toBe('3p');
      expect(toShortTimeCondensed('12:00 AM', { hideMinutesIfZero: true })).toBe('12a');
    });

    it('should not remove non-zero minutes', () => {
      expect(toShortTimeCondensed('03:30 PM', { hideMinutesIfZero: true })).toBe('3:30p');
      expect(toShortTimeCondensed('10:45 AM', { hideMinutesIfZero: true })).toBe('10:45a');
    });

    it('should handle null input', () => {
      expect(toShortTimeCondensed(null)).toBe('');
      expect(toShortTimeCondensed(null, { hideMinutesIfZero: true })).toBe('');
    });

    it('should handle undefined input', () => {
      expect(toShortTimeCondensed(undefined)).toBe('');
      expect(toShortTimeCondensed(undefined, { hideMinutesIfZero: true })).toBe('');
    });

    it('should handle empty string input', () => {
      expect(toShortTimeCondensed('')).toBe('');
      expect(toShortTimeCondensed('', { hideMinutesIfZero: true })).toBe('');
    });

    it('should handle irregular formats', () => {
      const result = toShortTimeCondensed('invalid', { hideMinutesIfZero: true });
      expect(result).toBe('invalid');
    });

    it('should not condense minutes with leading zeros that are non-zero', () => {
      expect(toShortTimeCondensed('10:01 AM', { hideMinutesIfZero: true })).toBe('10:01a');
      expect(toShortTimeCondensed('10:09 PM', { hideMinutesIfZero: true })).toBe('10:09p');
    });
  });
});
