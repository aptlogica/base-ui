import { describe, it, expect } from 'vitest';
import { getOptionColorClass, getReadableTextColor } from '../optionColorUtils';

describe('optionColorUtils', () => {
  it('returns a color class for an index', () => {
    expect(getOptionColorClass(0)).toBe('bg-blue-100 text-blue-800');
  });

  it('wraps indexes beyond the list length', () => {
    const first = getOptionColorClass(0);
    const wrapped = getOptionColorClass(10);
    expect(wrapped).toBe(first);
  });

  it('returns fallback text color for empty or invalid hex', () => {
    expect(getReadableTextColor()).toBe('#1f2937');
    expect(getReadableTextColor('#fff')).toBe('#1f2937');
    expect(getReadableTextColor('not-a-color')).toBe('#1f2937');
  });

  it('returns dark text for light backgrounds', () => {
    expect(getReadableTextColor('#ffffff')).toBe('#111827');
  });

  it('returns white text for dark backgrounds', () => {
    expect(getReadableTextColor('#000000')).toBe('#ffffff');
  });
});
