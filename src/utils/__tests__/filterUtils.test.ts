/**
 * LEARNING EXAMPLE: Testing array/collection functions
 * 
 * This demonstrates testing functions that work with arrays and objects.
 */

import { describe, it, expect } from 'vitest';
import { parseMultiSelectValue } from '../filterUtils';

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

