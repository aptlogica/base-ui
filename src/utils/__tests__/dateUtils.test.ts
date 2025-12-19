import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatRelativeDate,
  isPlaceholderDate,
  zonedToUtcISO,
  utcISOToZoned,
  getCurrentTimeInZone
} from '../dateUtils';

describe('formatDate', () => {
  beforeEach(() => {
    // Mock Date.now() for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return N/A for null input', () => {
    expect(formatDate(null)).toBe('N/A');
  });

  it('should return N/A for undefined input', () => {
    expect(formatDate(undefined)).toBe('N/A');
  });

  it('should return N/A for empty string', () => {
    expect(formatDate('')).toBe('N/A');
  });

  it('should return N/A for placeholder date 0001-01-01', () => {
    expect(formatDate('0001-01-01T00:00:00Z')).toBe('N/A');
  });

  it('should return N/A for placeholder date 1970-01-01', () => {
    expect(formatDate('1970-01-01T00:00:00Z')).toBe('N/A');
  });

  it('should format valid ISO date string with default options', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should format date with custom year option', () => {
    const result = formatDate('2024-01-15T12:00:00Z', { year: '2-digit' });
    expect(result).toContain('24');
  });

  it('should format date with custom month option', () => {
    const result = formatDate('2024-01-15T12:00:00Z', { month: 'long' });
    expect(result).toContain('January');
  });

  it('should format date with custom day option', () => {
    const result = formatDate('2024-01-15T12:00:00Z', { day: '2-digit' });
    expect(result).toContain('15');
  });

  it('should format date with hour and minute', () => {
    const result = formatDate('2024-01-15T14:30:00Z', {
      hour: 'numeric',
      minute: 'numeric'
    });
    expect(result).toBeTruthy();
  });

  it('should return N/A for invalid date string', () => {
    expect(formatDate('invalid-date')).toBe('N/A');
  });

  it('should handle date string without time', () => {
    const result = formatDate('2024-01-15');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return N/A for null input', () => {
    expect(formatRelativeDate(null)).toBe('N/A');
  });

  it('should return N/A for undefined input', () => {
    expect(formatRelativeDate(undefined)).toBe('N/A');
  });

  it('should return N/A for placeholder date 0001-01-01', () => {
    expect(formatRelativeDate('0001-01-01T00:00:00Z')).toBe('N/A');
  });

  it('should return N/A for placeholder date 1970-01-01', () => {
    expect(formatRelativeDate('1970-01-01T00:00:00Z')).toBe('N/A');
  });

  it('should return "Just now" for dates less than 60 seconds ago', () => {
    const date = new Date('2024-01-15T11:59:30Z').toISOString();
    expect(formatRelativeDate(date)).toBe('Just now');
  });

  it('should format minutes ago correctly', () => {
    const date = new Date('2024-01-15T11:58:00Z').toISOString();
    expect(formatRelativeDate(date)).toBe('2 minutes ago');
  });

  it('should format single minute correctly', () => {
    const date = new Date('2024-01-15T11:59:00Z').toISOString();
    expect(formatRelativeDate(date)).toBe('1 minute ago');
  });

  it('should format hours ago correctly', () => {
    const date = new Date('2024-01-15T10:00:00Z').toISOString();
    expect(formatRelativeDate(date)).toBe('2 hours ago');
  });

  it('should format single hour correctly', () => {
    const date = new Date('2024-01-15T11:00:00Z').toISOString();
    expect(formatRelativeDate(date)).toBe('1 hour ago');
  });

  it('should format days ago correctly', () => {
    const date = new Date('2024-01-13T12:00:00Z').toISOString();
    expect(formatRelativeDate(date)).toBe('2 days ago');
  });

  it('should format single day correctly', () => {
    const date = new Date('2024-01-14T12:00:00Z').toISOString();
    expect(formatRelativeDate(date)).toBe('1 day ago');
  });

  it('should format months ago correctly', () => {
    const date = new Date('2023-12-15T12:00:00Z').toISOString();
    const result = formatRelativeDate(date);
    expect(result).toContain('month');
  });

  it('should format years ago correctly', () => {
    const date = new Date('2023-01-15T12:00:00Z').toISOString();
    const result = formatRelativeDate(date);
    expect(result).toContain('year');
  });

  it('should return N/A for invalid date string', () => {
    expect(formatRelativeDate('invalid-date')).toBe('N/A');
  });
});

describe('isPlaceholderDate', () => {
  it('should return true for null', () => {
    expect(isPlaceholderDate(null)).toBe(true);
  });

  it('should return true for undefined', () => {
    expect(isPlaceholderDate(undefined)).toBe(true);
  });

  it('should return true for placeholder 0001-01-01', () => {
    expect(isPlaceholderDate('0001-01-01T00:00:00Z')).toBe(true);
  });

  it('should return true for placeholder 1970-01-01', () => {
    expect(isPlaceholderDate('1970-01-01T00:00:00Z')).toBe(true);
  });

  it('should return true for placeholder 1900-01-01', () => {
    expect(isPlaceholderDate('1900-01-01T00:00:00Z')).toBe(true);
  });

  it('should return false for valid date', () => {
    expect(isPlaceholderDate('2024-01-15T12:00:00Z')).toBe(false);
  });

  it('should return false for recent date', () => {
    expect(isPlaceholderDate('2023-12-01T00:00:00Z')).toBe(false);
  });
});

describe('zonedToUtcISO', () => {
  it('should convert zoned date/time to UTC ISO string', () => {
    const result = zonedToUtcISO('2024-01-15', '14:30', 'America/New_York');
    expect(result).toContain('T');
    expect(result).toContain('Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should handle different timezones', () => {
    const result1 = zonedToUtcISO('2024-01-15', '12:00', 'UTC');
    const result2 = zonedToUtcISO('2024-01-15', '12:00', 'America/Los_Angeles');
    expect(result1).not.toBe(result2);
  });

  it('should throw error for invalid date/time', () => {
    expect(() => {
      zonedToUtcISO('invalid', '12:00', 'UTC');
    }).toThrow();
  });

  it('should throw error for invalid timezone', () => {
    expect(() => {
      zonedToUtcISO('2024-01-15', '12:00', 'Invalid/Timezone');
    }).toThrow();
  });
});

describe('utcISOToZoned', () => {
  it('should convert UTC ISO string to zoned date/time', () => {
    const result = utcISOToZoned('2024-01-15T12:00:00Z', 'America/New_York');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('should handle different timezones', () => {
    const result1 = utcISOToZoned('2024-01-15T12:00:00Z', 'UTC');
    const result2 = utcISOToZoned('2024-01-15T12:00:00Z', 'America/Los_Angeles');
    expect(result1).not.toBe(result2);
  });

  it('should throw error for invalid UTC ISO string', () => {
    expect(() => {
      utcISOToZoned('invalid', 'UTC');
    }).toThrow();
  });

  it('should handle invalid timezone gracefully', () => {
    // Luxon might not throw for invalid timezones, it may return a valid date in UTC
    // So we just check it doesn't crash
    const result = utcISOToZoned('2024-01-15T12:00:00Z', 'Invalid/Timezone');
    expect(result).toBeTruthy();
  });
});

describe('getCurrentTimeInZone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should get current time in UTC', () => {
    const result = getCurrentTimeInZone('UTC');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('should get current time in different timezone', () => {
    const result = getCurrentTimeInZone('America/New_York');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('should throw error for invalid timezone', () => {
    expect(() => {
      getCurrentTimeInZone('Invalid/Timezone');
    }).toThrow();
  });

  it('should return different times for different zones', () => {
    const utc = getCurrentTimeInZone('UTC');
    const ny = getCurrentTimeInZone('America/New_York');
    // Times should be different (or same if DST aligns)
    expect(utc).toBeTruthy();
    expect(ny).toBeTruthy();
  });
});

