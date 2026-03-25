import { describe, it, expect, vi } from 'vitest';
import { getTodayISO, pad2 } from '../timeFormatUtils';

describe('timeFormatUtils', () => {
  it('pads numbers to 2 digits', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(5)).toBe('05');
    expect(pad2(12)).toBe('12');
  });

  it('returns today in YYYY-MM-DD format', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-13T12:34:56Z'));

    expect(getTodayISO()).toBe('2026-02-13');

    vi.useRealTimers();
  });
});
