import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  getAvatarColor,
  formatCreatedDate,
  formatRelativeLastActive,
  getRolePillStyle
} from '../userTableUtils';

describe('userTableUtils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getAvatarColor', () => {
    it('returns a deterministic color for the same user id', () => {
      const color1 = getAvatarColor('user-123');
      const color2 = getAvatarColor('user-123');
      expect(color1).toBe(color2);
    });

    it('returns one of the known color classes', () => {
      const color = getAvatarColor('abc');
      const allowed = new Set([
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-indigo-500',
        'bg-cyan-500'
      ]);
      expect(allowed.has(color)).toBe(true);
    });
  });

  describe('formatCreatedDate', () => {
    it('returns dash for empty input', () => {
      expect(formatCreatedDate()).toBe('-');
      expect(formatCreatedDate('')).toBe('-');
    });

    it('formats valid date string with short month', () => {
      const result = formatCreatedDate('2024-02-05T10:00:00.000Z');
      expect(result).toContain('Feb');
      expect(result).toContain('2024');
    });
  });

  describe('formatRelativeLastActive', () => {
    it('returns dash when no dates provided', () => {
      expect(formatRelativeLastActive()).toBe('-');
    });

    it('returns dash for placeholder zero date', () => {
      expect(formatRelativeLastActive(undefined, undefined, '0001-01-01T00:00:00Z')).toBe('-');
    });

    it('returns "Just now" for very recent activity', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:30Z'));
      const result = formatRelativeLastActive('2024-01-01T00:00:10Z');
      expect(result).toBe('Just now');
    });

    it('returns minutes for recent activity', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:10:00Z'));
      const result = formatRelativeLastActive('2024-01-01T00:05:00Z');
      expect(result).toBe('5 minutes ago');
    });

    it('returns hours for same-day activity', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
      const result = formatRelativeLastActive('2024-01-01T07:00:00Z');
      expect(result).toBe('3 hours ago');
    });

    it('returns days for recent activity within a week', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-08T00:00:00Z'));
      const result = formatRelativeLastActive('2024-01-06T00:00:00Z');
      expect(result).toBe('2 days ago');
    });
  });

  describe('getRolePillStyle', () => {
    it('returns owner style for owner roles', () => {
      expect(getRolePillStyle('Owner')).toContain('bg-green-100');
    });

  it('returns co-owner style for co-owner roles', () => {
      expect(getRolePillStyle('Co-Owner')).toContain('bg-green-100');
  });

    it('returns workspace maintainer style', () => {
      expect(getRolePillStyle('Workspace Maintainer')).toContain('bg-purple-100');
    });

    it('returns workspace read only style', () => {
      expect(getRolePillStyle('Workspace Read Only')).toContain('bg-orange-100');
    });

    it('returns base member style', () => {
      expect(getRolePillStyle('Base Member')).toContain('bg-red-100');
    });

    it('returns base read only style', () => {
      expect(getRolePillStyle('Base Read Only')).toContain('bg-gray-100');
    });

    it('falls back to gray style for unknown roles', () => {
      expect(getRolePillStyle('Custom Role')).toContain('bg-gray-100');
    });
  });
});
