import { describe, it, expect } from 'vitest';
import { precisionOptions, currencyOptions } from '../constants';

describe('constants', () => {
  it('exposes precision options', () => {
    expect(precisionOptions.length).toBeGreaterThan(0);
    expect(precisionOptions[0]).toEqual({ label: '1.0', value: '1.0' });
  });

  it('includes common currency options', () => {
    const usd = currencyOptions.find(option => option.value === 'USD');
    expect(usd?.label).toContain('USD');
  });
});
