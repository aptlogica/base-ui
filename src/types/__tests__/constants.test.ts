import { describe, it, expect } from 'vitest';
import { precisionOptions, currencyOptions, currencyLocaleOptions, fieldsToFilter, fieldsToExcludeInFilter } from '../constants';

describe('constants', () => {
  it('exposes precision options', () => {
    expect(precisionOptions.length).toBeGreaterThan(0);
    expect(precisionOptions[0]).toEqual({ label: '1.0', value: '1.0' });
  });

  it('includes common currency options', () => {
    const usd = currencyOptions.find(option => option.value === 'USD');
    expect(usd?.label).toContain('USD');
  });

  it('exposes currency locale options', () => {
    expect(currencyLocaleOptions.length).toBeGreaterThan(0);
    const enUs = currencyLocaleOptions.find(option => option.value === 'en-US');
    expect(enUs?.label).toContain('English');
  });

  it('defines filter inclusion/exclusion lists', () => {
    expect(fieldsToFilter).toContain('lookup');
    expect(fieldsToExcludeInFilter).toContain('links');
  });
});
