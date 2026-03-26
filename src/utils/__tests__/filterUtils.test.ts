/**
 * LEARNING EXAMPLE: Testing array/collection functions
 * 
 * This demonstrates testing functions that work with arrays and objects.
 */

import { describe, it, expect } from 'vitest';
import {
  parseMultiSelectValue,
  matchesFilter,
  applyFilters,
  operatorRequiresValue,
  isFilterComplete,
  getDefaultOperator,
  formatDurationValue,
  normalizeFilterValue,
  getVisibleColumns,
} from '../filterUtils';

describe('parseMultiSelectValue', () => {
  // Test 1: Simple array of strings (happy path)
  it('should return array of strings as-is', () => {
    const input = ['apple', 'banana', 'cherry'];
    const result = parseMultiSelectValue(input);
    
    expect(result).toEqual(['apple', 'banana', 'cherry']);
    expect(result).toHaveLength(3);
  });

  // Test 2: Array of objects with 'option' property
  it('should extract option property from objects', () => {
    const input = [
      { option: 'red' },
      { option: 'blue' },
      { option: 'green' }
    ];
    const result = parseMultiSelectValue(input);
    
    expect(result).toEqual(['red', 'blue', 'green']);
  });

  // Test 3: Mixed array (strings, objects, numbers)
  it('should handle mixed array types', () => {
    const input = [
      'apple',
      { option: 'banana' },
      123, // number
      true // boolean
    ];
    const result = parseMultiSelectValue(input);
    
    expect(result).toEqual(['apple', 'banana', '123', 'true']);
  });

  // Test 4: JSON string input
  it('should parse JSON string to array', () => {
    const input = '["red", "blue", "green"]';
    const result = parseMultiSelectValue(input);
    
    expect(result).toEqual(['red', 'blue', 'green']);
  });

  // Test 5: JSON string with objects
  it('should parse JSON string with objects', () => {
    const input = '[{"option":"red"},{"option":"blue"}]';
    const result = parseMultiSelectValue(input);
    
    expect(result).toEqual(['red', 'blue']);
  });

  // Test 6: Empty array
  it('should return empty array for empty input', () => {
    expect(parseMultiSelectValue([])).toEqual([]);
    expect(parseMultiSelectValue('')).toEqual([]);
  });

  // Test 7: Invalid JSON string (should handle gracefully)
  it('should handle invalid JSON string', () => {
    const result = parseMultiSelectValue('not-json');
    // Should return array with the string itself
    expect(result).toEqual(['not-json']);
  });

  // Test 8: Single string value
  it('should convert single string to array', () => {
    const result = parseMultiSelectValue('single-value');
    expect(result).toEqual(['single-value']);
  });

  // Test 9: Array with nested objects (without 'option')
  it('should convert objects without option to string', () => {
    const input = [{ name: 'test' }, { id: 123 }];
    const result = parseMultiSelectValue(input);
    
    // Should convert to string representation
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('string');
  });
});

describe('matchesFilter and applyFilters', () => {
  const columns = [
    { key: 'name', uidt: 'text' },
    { key: 'status', uidt: 'select' },
    { key: 'tags', uidt: 'multiSelect' },
    { key: 'score', uidt: 'number' },
    { key: 'done', uidt: 'boolean' },
    { key: 'due', uidt: 'date' },
  ];

  const card = {
    data: {
      name: 'Alpha Task',
      status: 'Open',
      tags: ['red', 'blue'],
      score: 10,
      done: true,
      due: '2026-01-10',
    },
  };

  it('handles text/select/multiselect comparisons', () => {
    expect(matchesFilter(card, { column: 'name', operator: 'contains', value: 'alpha' }, columns)).toBe(true);
    expect(matchesFilter(card, { column: 'status', operator: 'is equal', value: 'Open' }, columns)).toBe(true);
    expect(matchesFilter(card, { column: 'tags', operator: 'contains any of', value: ['green', 'red'] }, columns)).toBe(true);
    expect(matchesFilter(card, { column: 'tags', operator: 'does not contain any of', value: ['yellow'] }, columns)).toBe(true);
  });

  it('handles numeric/boolean/date operators', () => {
    expect(matchesFilter(card, { column: 'score', operator: 'greater than', value: 9 }, columns)).toBe(true);
    expect(matchesFilter(card, { column: 'done', operator: 'is checked', value: '' }, columns)).toBe(true);
    expect(matchesFilter(card, { column: 'due', operator: 'after', value: '2026-01-01' }, columns)).toBe(true);
  });

  it('handles empty checks and not-equal comparisons', () => {
    const localCard = { data: { name: '', score: null, status: 'Open', tags: ['red'] } };
    expect(matchesFilter(localCard, { column: 'name', operator: 'is empty', value: '' }, columns)).toBe(true);
    expect(matchesFilter(localCard, { column: 'score', operator: 'is empty', value: '' }, columns)).toBe(true);
    expect(matchesFilter(localCard, { column: 'status', operator: 'is not equal', value: 'Closed' }, columns)).toBe(true);
    expect(matchesFilter(localCard, { column: 'tags', operator: 'is not equal', value: ['blue'] }, columns)).toBe(true);
  });

  it('handles select contains any of with array and string', () => {
    expect(matchesFilter(card, { column: 'status', operator: 'contains any of', value: ['Open', 'Closed'] }, columns)).toBe(true);
    expect(matchesFilter(card, { column: 'status', operator: 'contains any of', value: 'Closed,Open' }, columns)).toBe(true);
    expect(matchesFilter(card, { column: 'status', operator: 'does not contain any of', value: ['Done'] }, columns)).toBe(true);
  });

  it('handles boolean normalization and invalid numeric/date values', () => {
    const localColumns = [
      { key: 'done', uidt: 'boolean' },
      { key: 'score', uidt: 'number' },
      { key: 'due', uidt: 'date' },
    ];
    const localCard = { data: { done: '1', score: 'not-a-number', due: 'invalid' } };
    expect(matchesFilter(localCard, { column: 'done', operator: 'is checked', value: '' }, localColumns)).toBe(true);
    expect(matchesFilter(localCard, { column: 'score', operator: 'greater than', value: 1 }, localColumns)).toBe(false);
    expect(matchesFilter(localCard, { column: 'due', operator: 'before', value: '2026-01-01' }, localColumns)).toBe(false);
  });

  it('returns true when referenced column is missing', () => {
    expect(matchesFilter(card, { column: 'missing', operator: 'is equal', value: 'x' }, columns)).toBe(true);
  });

  it('handles select contains any of with non-array value', () => {
    expect(matchesFilter(card, { column: 'status', operator: 'contains any of', value: 123 }, columns)).toBe(false);
  });

  it('handles boolean not checked', () => {
    const localColumns = [{ key: 'done', uidt: 'boolean' }];
    const localCard = { data: { done: false } };
    expect(matchesFilter(localCard, { column: 'done', operator: 'is not checked', value: '' }, localColumns)).toBe(true);
  });

  it('handles date equality and inequality', () => {
    const localColumns = [{ key: 'due', uidt: 'date' }];
    const localCard = { data: { due: '2026-01-10' } };
    expect(matchesFilter(localCard, { column: 'due', operator: 'is equal', value: '2026-01-10' }, localColumns)).toBe(true);
    expect(matchesFilter(localCard, { column: 'due', operator: 'is not equal', value: '2026-01-11' }, localColumns)).toBe(true);
  });

  it('falls back to string comparison for unknown types', () => {
    const localColumns = [{ key: 'misc', uidt: 'unknown' }];
    const localCard = { data: { misc: 'Alpha' } };
    expect(matchesFilter(localCard, { column: 'misc', operator: 'contains', value: 'alp' }, localColumns)).toBe(true);
  });

  it('applies filters with AND/OR logic correctly', () => {
    const cards = [
      { data: { name: 'Alpha', score: 10 } },
      { data: { name: 'Beta', score: 2 } },
      { data: { name: 'Gamma', score: 20 } },
    ];

    const filtered = applyFilters(cards, [
      { column: 'name', operator: 'contains', value: 'a', logic: 'AND' },
      { column: 'score', operator: 'greater than', value: 15, logic: 'OR' },
    ], [{ key: 'name', uidt: 'text' }, { key: 'score', uidt: 'number' }]);

    expect(filtered).toHaveLength(3);

    const andFiltered = applyFilters(cards, [
      { column: 'name', operator: 'contains', value: 'a', logic: 'AND' },
      { column: 'score', operator: 'greater than', value: 15, logic: 'AND' },
    ], [{ key: 'name', uidt: 'text' }, { key: 'score', uidt: 'number' }]);

    expect(andFiltered.map((c: any) => c.data.name)).toEqual(['Gamma']);
  });
});

describe('filter helper utilities', () => {
  it('checks operator value requirements and filter completeness', () => {
    expect(operatorRequiresValue('is empty')).toBe(false);
    expect(operatorRequiresValue('is equal')).toBe(true);
    expect(operatorRequiresValue('is not checked')).toBe(false);

    expect(isFilterComplete({ column: 'name', operator: 'is equal', value: 'x' })).toBe(true);
    expect(isFilterComplete({ column: 'name', operator: 'is empty', value: '' })).toBe(true);
    expect(isFilterComplete({ column: '', operator: 'is equal', value: 'x' })).toBe(false);
  });

  it('resolves default operator and normalizes values', () => {
    expect(getDefaultOperator('number')).toBe('is equal');
    expect(getDefaultOperator('unknown-type')).toBe('is equal');

    expect(normalizeFilterValue({ operator: 'is empty', value: 'abc' }, 'abc')).toBe('');
    expect(normalizeFilterValue({ operator: 'is equal', value: ' abc ' }, undefined)).toBe('abc');
    expect(normalizeFilterValue({ operator: 'is equal', value: 'abc' }, '   ')).toBe('');
  });

  it('handles incomplete filters and input overrides', () => {
    expect(isFilterComplete({ column: 'name', operator: 'is equal', value: '' })).toBe(false);
    expect(isFilterComplete({ column: 'name', operator: 'is equal', value: '' }, 'x')).toBe(true);
  });

  it('formats duration values across supported formats', () => {
    expect(formatDurationValue(90, 'h:mm')).toBe('1:30');
    expect(formatDurationValue(90, 'h:mm:ss')).toBe('1:30:00');
    expect(formatDurationValue(1500, 'd:h:mm')).toBe('1:01:00');
    expect(formatDurationValue(5, 'custom')).toBe('5');
  });

  it('filters visible columns by id and excluded types', () => {
    const cols = [
      { key: 'id', uidt: 'number' },
      { key: 'name', uidt: 'text' },
      { column_name: 'status', uidt: 'select' },
      { key: 'meta', uidt: 'json' },
    ];

    const visible = getVisibleColumns(cols, ['json', 'select']);
    expect(visible.map((c) => c.key || c.column_name)).toEqual(['name']);
  });
});

