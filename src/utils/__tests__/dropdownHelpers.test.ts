import { describe, it, expect } from 'vitest';
import {
  normalizeValue,
  getDisplayLabel,
  filterOptions,
  getSelectedCount,
  isValueSelected
} from '../dropdownHelpers';
import type { DropdownOption } from '../../types/dropdown';

describe('normalizeValue', () => {
  it('should return empty array for undefined', () => {
    expect(normalizeValue(undefined)).toEqual([]);
  });

  it('should return empty array for null', () => {
    expect(normalizeValue(null)).toEqual([]);
  });

  it('should return array for single value', () => {
    expect(normalizeValue('value')).toEqual(['value']);
  });

  it('should return array as-is', () => {
    expect(normalizeValue(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('should handle number values', () => {
    expect(normalizeValue(5)).toEqual([5]);
  });

  it('should handle array of numbers', () => {
    expect(normalizeValue([1, 2, 3])).toEqual([1, 2, 3]);
  });
});

describe('getDisplayLabel', () => {
  const options: DropdownOption<string>[] = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' }
  ];

  it('should return placeholder for empty value', () => {
    expect(getDisplayLabel(undefined, options, 'Select...', false)).toBe('Select...');
  });

  it('should return label for single value', () => {
    expect(getDisplayLabel('a', options, 'Select...', false)).toBe('Option A');
  });

  it('should return placeholder if value not found', () => {
    expect(getDisplayLabel('x', options, 'Select...', false)).toBe('Select...');
  });

  it('should return joined labels for multiple values', () => {
    expect(getDisplayLabel(['a', 'b'], options, 'Select...', true)).toBe('Option A, Option B');
  });

  it('should return count for multiple values (>2)', () => {
    expect(getDisplayLabel(['a', 'b', 'c'], options, 'Select...', true)).toBe('3 items selected');
  });

  it('should return single label for multiple=false', () => {
    expect(getDisplayLabel(['a', 'b'], options, 'Select...', false)).toBe('Option A');
  });
});

describe('filterOptions', () => {
  const options: DropdownOption<string>[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry', description: 'Red fruit' }
  ];

  it('should return all options for empty query', () => {
    expect(filterOptions(options, '')).toEqual(options);
  });

  it('should return all options for whitespace-only query', () => {
    expect(filterOptions(options, '   ')).toEqual(options);
  });

  it('should filter by label (case-insensitive)', () => {
    expect(filterOptions(options, 'apple')).toEqual([options[0]]);
    expect(filterOptions(options, 'APPLE')).toEqual([options[0]]);
  });

  it('should filter by description', () => {
    expect(filterOptions(options, 'red')).toEqual([options[2]]);
  });

  it('should return empty array if no matches', () => {
    expect(filterOptions(options, 'xyz')).toEqual([]);
  });

  it('should handle partial matches', () => {
    expect(filterOptions(options, 'ban')).toEqual([options[1]]);
  });
});

describe('getSelectedCount', () => {
  it('should return 0 for undefined', () => {
    expect(getSelectedCount(undefined)).toBe(0);
  });

  it('should return 0 for null', () => {
    expect(getSelectedCount(null)).toBe(0);
  });

  it('should return 1 for single value', () => {
    expect(getSelectedCount('value')).toBe(1);
  });

  it('should return array length', () => {
    expect(getSelectedCount(['a', 'b', 'c'])).toBe(3);
  });

  it('should return 0 for empty array', () => {
    expect(getSelectedCount([])).toBe(0);
  });
});

describe('isValueSelected', () => {
  it('should return true for single match (multiple=false)', () => {
    expect(isValueSelected('a', 'a', false)).toBe(true);
  });

  it('should return false for single mismatch (multiple=false)', () => {
    expect(isValueSelected('a', 'b', false)).toBe(false);
  });

  it('should return true if value in array (multiple=true)', () => {
    expect(isValueSelected('a', ['a', 'b'], true)).toBe(true);
  });

  it('should return false if value not in array (multiple=true)', () => {
    expect(isValueSelected('c', ['a', 'b'], true)).toBe(false);
  });

  it('should handle null/undefined for multiple=true', () => {
    expect(isValueSelected('a', null, true)).toBe(false);
    expect(isValueSelected('a', undefined, true)).toBe(false);
  });

  it('should handle null/undefined for multiple=false', () => {
    expect(isValueSelected('a', null, false)).toBe(false);
    expect(isValueSelected('a', undefined, false)).toBe(false);
  });
});

