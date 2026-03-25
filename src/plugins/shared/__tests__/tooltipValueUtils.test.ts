import { describe, it, expect, vi } from 'vitest';
import { formatTooltipValue } from '../tooltipValueUtils';

vi.mock('../../../utils/dateUtils', async () => {
  const actual = await vi.importActual<typeof import('../../../utils/dateUtils')>('../../../utils/dateUtils');
  return {
    ...actual,
    utcISOToZoned: vi.fn().mockReturnValue('2026-03-25 13:30'),
  };
});

describe('formatTooltipValue', () => {
  const formatTime = (t: string) => `fmt:${t}`;

  it('returns dash for empty values', () => {
    expect(formatTooltipValue({ type: 'text' }, '', { formatTime })).toBe('-');
    expect(formatTooltipValue({ type: 'text' }, null, { formatTime })).toBe('-');
    expect(formatTooltipValue({ type: 'text' }, undefined, { formatTime })).toBe('-');
  });

  it('formats currency with meta or fallback', () => {
    const withMeta = formatTooltipValue(
      { type: 'currency', meta: { currencyType: 'EUR', currencyLocale: 'de-DE' } },
      1234.5,
      { formatTime, useMetaCurrency: true }
    );
    expect(withMeta).toContain('€');

    const fallback = formatTooltipValue(
      { type: 'currency' },
      10,
      { formatTime, currencyFallback: { locale: 'en-US', currency: 'USD' } }
    );
    expect(fallback).toContain('$');
  });

  it('formats percent and boolean yes/no', () => {
    expect(formatTooltipValue({ type: 'percent' }, 'abc', { formatTime })).toBe('-');
    expect(formatTooltipValue({ type: 'percent' }, 12, { formatTime })).toBe('12%');
    expect(formatTooltipValue({ type: 'boolean' }, true, { formatTime, booleanAsYesNo: true })).toBe('Yes');
    expect(formatTooltipValue({ type: 'checkbox' }, false, { formatTime, booleanAsYesNo: true })).toBe('No');
  });

  it('formats date, datetime and time values', () => {
    expect(
      formatTooltipValue({ type: 'date', meta: { dateFormat: 'MM/DD/YYYY' } }, '2026-03-25', { formatTime })
    ).toBe('03/25/2026');

    expect(
      formatTooltipValue(
        { type: 'datetime', meta: { dateFormat: 'DD/MM/YYYY', timeFormat: 'hh:mm' } },
        '2026-03-25T08:00:00',
        { formatTime }
      )
    ).toBe('25/03/2026 01:30 PM');

    expect(formatTooltipValue({ type: 'time' }, '09:05', { formatTime })).toBe('fmt:09:05');
    expect(formatTooltipValue({ type: 'time' }, 'not-time', { formatTime })).toBe('not-time');
  });

  it('formats multiselect, arrays, objects and truncates strings', () => {
    expect(
      formatTooltipValue({ type: 'multiselect' }, [{ label: 'A' }, { label: 'B' }], { formatTime })
    ).toBe('A, B');
    expect(
      formatTooltipValue({ type: 'multiselect' }, '["X","Y"]', { formatTime })
    ).toBe('X, Y');

    expect(formatTooltipValue({ type: 'text' }, [{ title: 'T1' }, { name: 'N1' }], { formatTime })).toBe('T1, N1');
    expect(formatTooltipValue({ type: 'text' }, { label: 'Lbl' }, { formatTime })).toBe('Lbl');

    const longText = 'a'.repeat(60);
    const truncated = formatTooltipValue({ type: 'text' }, longText, { formatTime });
    expect(truncated?.length).toBeLessThanOrEqual(53);
  });

  it('matches uidt when enabled and handles errors', () => {
    expect(
      formatTooltipValue({ uidt: 'longText', type: 'longtext' }, '<p>Hello</p>', { formatTime, matchUidt: true })
    ).toBe('Hello');

    const throwingFormatTime = () => {
      throw new Error('boom');
    };
    expect(formatTooltipValue({ type: 'time' }, '09:05', { formatTime: throwingFormatTime })).toBe('-');
  });
});
