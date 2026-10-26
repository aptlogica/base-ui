import { describe, it, expect } from 'vitest';
import { customKeyColumnIds, isEmptyKeyValue, missingKeyColumnIds, missingKeyMessage, requiredKeyColumnIds } from '../primaryKeyFields';

const columns = [
  { id: 'c-id', column_name: 'id', title: 'Id' },
  { id: 'c-code', column_name: 'code', title: 'Code' },
  { id: 'c-year', column_name: 'yr', title: 'Year' },
];

describe('primaryKeyFields', () => {
  it('treats null, undefined, blank text and empty arrays as empty', () => {
    expect(isEmptyKeyValue(null)).toBe(true);
    expect(isEmptyKeyValue(undefined)).toBe(true);
    expect(isEmptyKeyValue('  ')).toBe(true);
    expect(isEmptyKeyValue([])).toBe(true);
    expect(isEmptyKeyValue(0)).toBe(false);
    expect(isEmptyKeyValue(false)).toBe(false);
    expect(isEmptyKeyValue('HR')).toBe(false);
  });

  it('only reports custom keys', () => {
    expect(customKeyColumnIds(['c-id'], columns)).toEqual([]);
    expect(customKeyColumnIds(undefined, columns)).toEqual([]);
    expect(customKeyColumnIds(['c-code', 'c-year'], columns)).toEqual(['c-code', 'c-year']);
    expect(customKeyColumnIds(['c-id', 'c-code'], columns)).toEqual(['c-id', 'c-code']);
  });

  it('leaves Id out of the fields a new record must fill in', () => {
    expect(requiredKeyColumnIds(['c-id', 'c-code'], columns)).toEqual(['c-code']);
    expect(requiredKeyColumnIds(['c-id'], columns)).toEqual([]);
    expect(requiredKeyColumnIds(['c-code', 'c-year'], columns)).toEqual(['c-code', 'c-year']);
  });

  it('finds empty key fields and names them', () => {
    const values: Record<string, unknown> = { 'c-code': 'HR', 'c-year': '' };
    expect(missingKeyColumnIds(['c-code', 'c-year'], id => values[id])).toEqual(['c-year']);
    expect(missingKeyMessage(['Year'])).toBe('Year is required: it is part of the primary key.');
    expect(missingKeyMessage(['Code', 'Dept', 'Year'])).toBe('Code, Dept and Year are required: they make up the primary key.');
    expect(missingKeyMessage([])).toBe('');
  });
});
