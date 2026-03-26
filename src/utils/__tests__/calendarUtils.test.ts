import { describe, it, expect } from 'vitest';
import { buildCalendarWeeks, MONTH_LABELS } from '../calendarUtils';

describe('calendarUtils', () => {
  it('exposes month labels', () => {
    expect(MONTH_LABELS).toHaveLength(12);
    expect(MONTH_LABELS[0]).toBe('Jan');
    expect(MONTH_LABELS[11]).toBe('Dec');
  });

  it('builds weeks for a month starting on Monday', () => {
    // February 2026 starts on Sunday; with Monday start we should see leading nulls.
    const weeks = buildCalendarWeeks(2026, 1, true);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks.flat().filter((d) => d).length).toBe(28);
  });

  it('builds weeks for a month starting on Sunday', () => {
    const weeks = buildCalendarWeeks(2026, 1, false);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks.flat().filter((d) => d).length).toBe(28);
  });

  it('includes last day of the month', () => {
    const weeks = buildCalendarWeeks(2026, 0, true);
    const flat = weeks.flat();
    expect(flat).toContain('2026-01-31');
  });
});
