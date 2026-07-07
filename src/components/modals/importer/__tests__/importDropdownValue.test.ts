import { describe, it, expect } from 'vitest';
import { getSingleDropdownValue } from '../importDropdownValue';

describe('importDropdownValue', () => {
  it('should return string value when input is a string', () => {
    expect(getSingleDropdownValue('text')).toBe('text');
  });

  it('should return first value when input is a string array', () => {
    expect(getSingleDropdownValue(['email', 'text'])).toBe('email');
  });

  it('should return empty string when input is an empty array', () => {
    expect(getSingleDropdownValue([])).toBe('');
  });
});
