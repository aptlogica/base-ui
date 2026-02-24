import { describe, it, expect } from 'vitest';
import {
  FORMULA_FUNCTIONS,
  CURRENCY_SYMBOLS,
  FUNCTION_SYNTAX_MAP,
  VALID_DATE_UNITS,
  MATH_FUNCTION_NAMES,
  TEXT_FUNCTION_NAMES,
  DATE_FUNCTION_NAMES,
  LOGICAL_FUNCTION_NAMES,
  ALL_FUNCTION_NAMES,
  FREQUENTLY_USED_FUNCTION_NAMES,
  MATH_OPERATORS,
  COMPARISON_OPERATORS,
  NUMERIC_TYPES,
  TEXT_TYPES,
  DATE_TYPES,
  BOOLEAN_TYPES,
} from '../formulaConstants';

describe('formulaConstants', () => {
  it('exposes all expected function categories with valid entries', () => {
    const categories = Object.keys(FORMULA_FUNCTIONS);
    expect(categories).toEqual(
      expect.arrayContaining([
        'Math Functions',
        'Text Functions',
        'Date Functions',
        'Logical Functions',
        'Comparison Operators',
      ])
    );

    categories.forEach((category) => {
      const entries = (FORMULA_FUNCTIONS as any)[category];
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((item: any) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('example');
      });
    });
  });

  it('contains stable currency and syntax maps', () => {
    expect(CURRENCY_SYMBOLS.USD).toBe('$');
    expect(CURRENCY_SYMBOLS).toHaveProperty('EUR');
    expect(CURRENCY_SYMBOLS).toHaveProperty('INR');

    expect(FUNCTION_SYNTAX_MAP.ADD).toContain('ADD(');
    expect(FUNCTION_SYNTAX_MAP.CONCAT).toContain('CONCAT(');
    expect(FUNCTION_SYNTAX_MAP.TODAY).toBe('TODAY()');
    expect(FUNCTION_SYNTAX_MAP.IF).toContain('IF(');
  });

  it('contains valid unit and operator definitions', () => {
    expect(VALID_DATE_UNITS).toEqual(expect.arrayContaining(['day', 'days', 'month', 'months', 'year', 'years']));
    expect(MATH_OPERATORS).toEqual(expect.arrayContaining(['+', '-', '*', '/', '^', '%']));

    const ops = COMPARISON_OPERATORS.map((item) => item.op);
    expect(ops).toEqual(['>=', '<=', '!=', '==', '>', '<']);
    COMPARISON_OPERATORS.forEach((item) => {
      expect(item.regex).toBeInstanceOf(RegExp);
    });
  });

  it('maintains function-name sets and aggregate list consistency', () => {
    expect(MATH_FUNCTION_NAMES).toEqual(expect.arrayContaining(['ADD', 'SUBTRACT', 'SUM']));
    expect(TEXT_FUNCTION_NAMES).toEqual(expect.arrayContaining(['CONCAT', 'LEN', 'REPLACE']));
    expect(DATE_FUNCTION_NAMES).toEqual(expect.arrayContaining(['TODAY', 'NOW', 'DATEADD', 'DATEDIFF']));
    expect(LOGICAL_FUNCTION_NAMES).toEqual(expect.arrayContaining(['IF', 'AND', 'OR', 'NOT']));

    const expectedAll = [
      ...MATH_FUNCTION_NAMES,
      ...TEXT_FUNCTION_NAMES,
      ...DATE_FUNCTION_NAMES,
      ...LOGICAL_FUNCTION_NAMES,
    ];
    expect(ALL_FUNCTION_NAMES).toEqual(expectedAll);

    FREQUENTLY_USED_FUNCTION_NAMES.forEach((name) => {
      expect(ALL_FUNCTION_NAMES).toContain(name);
    });
  });

  it('contains core field-type groups for formula compatibility', () => {
    expect(NUMERIC_TYPES).toEqual(expect.arrayContaining(['number', 'decimal', 'currency', 'percent']));
    expect(TEXT_TYPES).toEqual(expect.arrayContaining(['text', 'email', 'url', 'formula']));
    expect(DATE_TYPES).toEqual(expect.arrayContaining(['date', 'datetime', 'time']));
    expect(BOOLEAN_TYPES).toEqual(expect.arrayContaining(['boolean', 'checkbox']));
  });
});
