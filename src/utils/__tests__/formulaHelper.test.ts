// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { describe, it, expect } from 'vitest';
import {
  parseFieldReference,
  getColumnIdentifier,
  getFieldType,
  getFieldValue,
  getTextFieldValue,
  getBooleanValue,
  getDateValue,
  getFieldValueByType,
  parseFunctionArguments,
  evaluateArgument,
  evaluateTextArgument,
  evaluateFormula,
  validateFormula,
  formatResult,
  formulaDependsOnRowData,
  formulaUsesToday,
  getFunctionSyntax,
  detectCurrentFunction,
  getFunctionAtCursor,
  getCompatibleFieldTypes,
  normalizeForComparison,
  convertResultToValue,
  evaluateComparison
} from '../formulaHelper';

const context = {
  columns: [
    { title: 'Price', key: 'price', type: 'number' },
    { title: 'Name', key: 'name', type: 'text' },
    { title: 'Active', key: 'active', type: 'boolean' },
    { title: 'Due', key: 'due', type: 'date' }
  ],
  allColumns: [],
  rowData: {
    price: '12.5',
    name: 'Alpha',
    active: 0,
    due: '2025-01-02'
  }
};

const getErrorText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value) {
    return String((value as { message: unknown }).message);
  }
  return JSON.stringify(value);
};

describe('formulaHelper core helpers', () => {
  it('parses field references and identifies columns', () => {
    expect(parseFieldReference('{Price}')).toBe('Price');
    expect(parseFieldReference('Price')).toBe('');
    expect(getColumnIdentifier('Price', context)).toBe('price');
    expect(getFieldType('Price', context)).toBe('number');
  });

  it('reads values by type from row data', () => {
    expect(getFieldValue('Price', context)).toBe(12.5);
    expect(getTextFieldValue('Name', context)).toBe('Alpha');
    expect(getBooleanValue('Active', context)).toBe(false);
    const dateValue = getDateValue('Due', context);
    expect(dateValue).toBeInstanceOf(Date);
    expect(dateValue?.getFullYear()).toBe(2025);
  });

  it('returns field value by inferred type', () => {
    expect(getFieldValueByType('Price', context)).toBe(12.5);
    expect(getFieldValueByType('Name', context)).toBe('Alpha');
    expect(getFieldValueByType('Active', context)).toBe(false);
    expect(getFieldValueByType('Due', context)).toBeInstanceOf(Date);
  });
});

describe('formulaHelper argument parsing', () => {
  it('parses function arguments with quotes and braces', () => {
    const args = parseFunctionArguments('1, {Price}, \"Hello, world\", CONCATENATE(\"a,b\", {Name})');
    expect(args).toHaveLength(4);
    expect(args[0]).toBe('1');
    expect(args[1]).toBe('{Price}');
    expect(args[2]).toBe('"Hello, world"');
    expect(args[3]).toBe('CONCATENATE(\"a,b\", {Name})');
  });

  it('evaluates numeric and text arguments', () => {
    expect(evaluateArgument('{Price}', context)).toBe(12.5);
    expect(evaluateArgument('3.5', context)).toBe(3.5);
    expect(evaluateArgument('SUM(1,2)', context)).toBeNull();
    expect(evaluateTextArgument('{Name}', context)).toBe('Alpha');
    expect(evaluateTextArgument('"Hi"', context)).toBe('Hi');
    expect(evaluateTextArgument('Plain', context)).toBe('Plain');
  });
});

describe('formulaHelper evaluation and formatting', () => {
  it('evaluates formulas and reports errors', () => {
    const sum = evaluateFormula('SUM({Price}, 7)', context, validateFormula);
    expect(sum.error).toBeNull();
    expect(sum.result).toBe(19.5);

    const condition = evaluateFormula('IF(TRUE, \"no\", \"yes\")', context, validateFormula);
    expect(condition.error).toBeNull();
    expect(condition.result).toBe('no');

    const invalid = evaluateFormula('IF()', context, validateFormula);
    expect(invalid.error).toMatch(/requires at least 2 arguments/i);

    const datediff = evaluateFormula('DATEDIFF(\"2025-01-01\", \"2025-01-11\", \"day\")', context, validateFormula);
    expect(datediff.error).toBeNull();
    expect(datediff.result).toBe(10);

    const dateValue = evaluateFormula('DATE(2025, 3, 15)', context, validateFormula);
    expect(dateValue.error).toBeNull();
    expect(dateValue.result).toBeInstanceOf(Date);
    expect(dateValue.result.getFullYear()).toBe(2025);
  });

  it('evaluates common text and logical helpers', () => {
    const concat = evaluateFormula('CONCATENATE(\"A\", \"B\")', context, validateFormula);
    expect(concat.result).toBe('AB');
    const len = evaluateFormula('LEN(\"abc\")', context, validateFormula);
    expect(len.result).toBe(3);
    const left = evaluateFormula('LEFT(\"abcd\", 2)', context, validateFormula);
    expect(left.result).toBe('ab');
    const right = evaluateFormula('RIGHT(\"abcd\", 2)', context, validateFormula);
    expect(right.result).toBe('cd');
    const mid = evaluateFormula('MID(\"abcd\", 2, 2)', context, validateFormula);
    expect(mid.result).toBe('bc');
    const andResult = evaluateFormula('AND(TRUE, FALSE)', context, validateFormula);
    expect(andResult.result).toBe(false);
    const orResult = evaluateFormula('OR(FALSE, TRUE)', context, validateFormula);
    expect(orResult.result).toBe(true);
    const notResult = evaluateFormula('NOT(FALSE)', context, validateFormula);
    expect(notResult.result).toBe(true);
  });

  it('evaluates math helpers', () => {
    expect(evaluateFormula('ADD(1, 2)', context, validateFormula).result).toBe(3);
    expect(evaluateFormula('SUBTRACT(5, 2)', context, validateFormula).result).toBe(3);
    expect(evaluateFormula('MULTIPLY(2, 3)', context, validateFormula).result).toBe(6);
    expect(evaluateFormula('SUM(1, 2, 3)', context, validateFormula).result).toBe(6);
    expect(evaluateFormula('AVERAGE(1, 2, 3)', context, validateFormula).result).toBe(2);
    expect(evaluateFormula('MAX(1, 5, 3)', context, validateFormula).result).toBe(5);
    expect(evaluateFormula('MIN(1, 5, 3)', context, validateFormula).result).toBe(1);
    expect(evaluateFormula('ROUND(1.236, 2)', context, validateFormula).result).toBe(1.24);
    expect(evaluateFormula('CEILING(1.2)', context, validateFormula).result).toBe(2);
    expect(evaluateFormula('FLOOR(1.8)', context, validateFormula).result).toBe(1);
    expect(evaluateFormula('POWER(2, 3)', context, validateFormula).result).toBe(8);
    expect(evaluateFormula('SQRT(9)', context, validateFormula).result).toBe(3);
    expect(evaluateFormula('ABS(-5)', context, validateFormula).result).toBe(5);
    expect(evaluateFormula('MOD(10, 3)', context, validateFormula).result).toBe(1);
    expect(evaluateFormula('DIVIDE(10, 2)', context, validateFormula).result).toBe(5);
    expect(evaluateFormula('{Price} + 2', context, validateFormula).result).toBe(14.5);
  });

  it('evaluates date, comparison, and text helpers', () => {
    const dateAdd = evaluateFormula('DATEADD(\"2025-01-01\", 2, \"day\")', context, validateFormula);
    expect(dateAdd.result).toBeInstanceOf(Date);
    expect(dateAdd.result.getDate()).toBe(3);
    const dateAddMonth = evaluateFormula('DATEADD(\"2025-01-01\", 1, \"month\")', context, validateFormula);
    expect(dateAddMonth.result).toBeInstanceOf(Date);
    expect(dateAddMonth.result.getMonth()).toBe(1);

    expect(evaluateFormula('YEAR(\"2025-03-15\")', context, validateFormula).result).toBe(2025);
    expect(evaluateFormula('MONTH(\"2025-03-15\")', context, validateFormula).result).toBe(3);
    expect(evaluateFormula('DAY(\"2025-03-15\")', context, validateFormula).result).toBe(15);
    expect(evaluateFormula('WEEKDAY(\"2025-03-15\")', context, validateFormula).result).toBe(6);

    expect(evaluateFormula('{Price} > 10', context, validateFormula).result).toBe(true);
    expect(evaluateFormula('{Price} <= 10', context, validateFormula).result).toBe(false);
    expect(evaluateFormula('ISNUMBER({Price})', context, validateFormula).result).toBe(true);
    expect(evaluateFormula('ISTEXT({Name})', context, validateFormula).result).toBe(true);
    expect(evaluateFormula('ISDATE({Due})', context, validateFormula).result).toBe(true);
    expect(evaluateFormula('ISDATE(\"2025-01-01\")', context, validateFormula).result).toBe(true);
    expect(evaluateFormula('ISDATE(\"not-a-date\")', context, validateFormula).result).toBe(false);
    expect(evaluateFormula('ISBLANK(\"\")', context, validateFormula).result).toBe(false);

    expect(evaluateFormula('{Price} >= 12.5', context, validateFormula).result).toBe(true);
    expect(evaluateFormula('{Price} < 20', context, validateFormula).result).toBe(true);

    expect(evaluateFormula('UPPER(\"ab\")', context, validateFormula).result).toBe('AB');
    expect(evaluateFormula('LOWER(\"AB\")', context, validateFormula).result).toBe('ab');
    expect(evaluateFormula('TRIM(\"  a b  \")', context, validateFormula).result).toBe('a b');
    expect(evaluateFormula('REPLACE(\"abcd\", \"bc\", \"zz\")', context, validateFormula).result).toBe('azzd');
    expect(evaluateFormula('FIND(\"b\", \"abc\")', context, validateFormula).result).toBe(2);
    const today = evaluateFormula('TODAY()', context, validateFormula).result;
    expect(today).toBeInstanceOf(Date);
    expect(today.getHours()).toBe(0);
  });

  it('formats numeric results', () => {
    expect(formatResult(12.345, 'number', 2, {}, '')).toBe('12.35');
    expect(formatResult(12.345, 'percent', 2, {}, '')).toBe('12.35%');
    expect(formatResult(12.345, 'currency', 2, { formatting: { currency: 'USD' } }, '')).toBe('$12.35');
    const dateValue = new Date('2025-01-02T03:04:05.000Z');
    expect(formatResult(dateValue, 'date', 2, { formatting: { dateFormat: 'YYYY-MM-DD' } }, '')).not.toBe('');
    expect(formatResult(dateValue, 'date', 2, {}, 'NOW()')).toMatch(/\d/);
  });
});

describe('formulaHelper comparison evaluation', () => {
  it('evaluates comparisons for strings, booleans, numbers, and dates', () => {
    expect(evaluateComparison('"A" != "B"', context)).toBe(true);
    expect(evaluateComparison('true != false', context)).toBe(true);
    expect(evaluateComparison('10 < 12', context)).toBe(true);
    expect(evaluateComparison('2025-01-02 > 2025-01-01', context)).toBe(true);
  });
});

describe('formulaHelper dependencies', () => {
  it('detects row dependencies and TODAY usage', () => {
    expect(formulaDependsOnRowData('{Price}')).toBe(true);
    expect(formulaDependsOnRowData('SUM(1,2)')).toBe(false);
    expect(formulaUsesToday('TODAY()')).toBe(true);
    expect(formulaUsesToday('NOW()')).toBe(false);
  });
});

describe('formulaHelper validation', () => {
  it('flags invalid operator usage and unknown fields', () => {
    expect(validateFormula('{Price} ++ {Price}', context)).toMatch(/invalid operator usage/i);
    expect(validateFormula('* {Price}', context)).toMatch(/cannot start with/i);
    expect(validateFormula('{Price} +', context)).toMatch(/cannot end with/i);
    expect(validateFormula('{Missing} + 1', context)).toMatch(/unknown field/i);
    expect(validateFormula('SUM({Name})', context)).toMatch(/numeric/i);
    expect(validateFormula('DATEADD(\"2025-01-01\", 1, \"century\")', context)).toMatch(/valid time unit/i);
    expect(validateFormula('DATE(2025, 13, 10)', context)).toMatch(/between 1 and 12/i);
    expect(validateFormula('{Name} + 1', context)).toMatch(/numeric fields/i);
    expect(validateFormula('IF(1)', context)).toMatch(/requires at least 2 arguments/i);
    expect(validateFormula('IF(1,2,3,4)', context)).toMatch(/at most 3 arguments/i);
    expect(validateFormula('NOT(1,2)', context)).toMatch(/only 1 argument/i);
    expect(validateFormula('AND()', context)).toMatch(/requires at least 1 argument/i);
    expect(validateFormula('ISBLANK(1,2)', context)).toMatch(/accepts only 1 argument/i);
    expect(validateFormula('CONCATENATE()', context)).toMatch(/requires at least 1 argument/i);
    expect(validateFormula('LEN(\"a\", \"b\")', context)).toMatch(/accepts only 1 argument/i);
    expect(validateFormula('FIND(\"a\")', context)).toMatch(/requires 2 arguments/i);
    expect(validateFormula('REPLACE(\"a\", \"b\", \"c\", \"d\")', context)).toMatch(/accepts only 3 arguments/i);
    expect(validateFormula('REPLACE(\"a\", \"b\")', context)).toMatch(/requires 3 arguments/i);
    expect(validateFormula('LEFT(\"abc\", \"x\")', context)).toMatch(/second argument must be a number/i);
    expect(validateFormula('LEFT(\"abc\", {Name})', context)).toMatch(/second argument must be numeric or numeric field reference/i);
    expect(validateFormula('RIGHT(\"abc\")', context)).toMatch(/requires 2 arguments/i);
    expect(validateFormula('MID(\"abc\", \"x\", 2)', context)).toMatch(/second argument \(start\) must be numeric/i);
    expect(validateFormula('MID(\"abc\", 1, {Name})', context)).toMatch(/third argument \(length\) must be numeric/i);
    expect(validateFormula('MID(\"abc\", 1, 2, 3)', context)).toMatch(/accepts only 3 arguments/i);
    expect(validateFormula('LEN()', context)).toMatch(/requires 1 argument/i);
    expect(validateFormula('UPPER(\"a\", \"b\")', context)).toMatch(/accepts only 1 argument/i);
    expect(validateFormula('FIND(\"a\", \"b\", \"c\")', context)).toMatch(/accepts only 2 arguments/i);
    expect(validateFormula('TODAY(1)', context)).toMatch(/accepts no arguments/i);
    expect(validateFormula('NOW(1)', context)).toMatch(/accepts no arguments/i);
    expect(validateFormula('YEAR({Name})', context)).toMatch(/requires a date field/i);
    expect(validateFormula('YEAR({5})', context)).toMatch(/numeric literal/i);
    expect(validateFormula('MONTH({Due}, {Price})', context)).toMatch(/accepts only 1 argument/i);
    expect(validateFormula('WEEKDAY(\"not-a-date\")', context)).toMatch(/valid date string/i);
    expect(validateFormula('DATEADD({Due}, {Name}, \"day\")', context)).toMatch(/second argument must be numeric/i);
    expect(validateFormula('DATEADD({Due}, 1, day)', context)).toMatch(/third argument must be a quoted string/i);
    expect(validateFormula('DATEDIFF({Due}, {Due})', context)).toMatch(/requires 3 arguments/i);
    expect(validateFormula('DATEDIFF({Due}, {Due}, day)', context)).toMatch(/third argument must be a quoted string/i);
    expect(validateFormula('DATE({Name}, 1, 1)', context)).toMatch(/argument 1 must be numeric/i);
    expect(getErrorText(validateFormula('foo == 1', context))).toMatch(/invalid left side/i);
    expect(getErrorText(validateFormula('{Missing} == 1', context))).toMatch(/unknown field/i);
    expect(getErrorText(validateFormula('{Price} == foo', context))).toMatch(/invalid right side/i);
    expect(getErrorText(validateFormula('IF(abc, 1)', context))).toMatch(/first argument must be a condition/i);
    expect(getErrorText(validateFormula('AND(foo)', context))).toMatch(/argument 1 must be a condition/i);
    expect(getErrorText(validateFormula('NOT(foo)', context))).toMatch(/argument must be a condition/i);
    expect(getErrorText(validateFormula('ISNUMBER(foo)', context))).toMatch(/argument must be a field reference/i);
  });
});

describe('formulaHelper helper utilities', () => {
  it('describes functions and cursor detection', () => {
    const syntax = getFunctionSyntax('SUM', 'SUM({Price}, {Tax})');
    expect(syntax).toMatch(/^SUM\(/);
    expect(syntax).toContain('number1');
    const detected = detectCurrentFunction('SUM({Price}, {Tax})');
    expect(detected?.name).toMatch(/^SUM/);
    expect(detected?.example).toContain('SUM');
    expect(getFunctionAtCursor('SUM({Price}, {Tax})', 2)).toBeNull();
    expect(getFunctionAtCursor('SUM({Price}, {Tax})', 6)).toBe('SUM');
    expect(getFunctionAtCursor('{Price} + 2', 10)).toBe('MATH_OPERATOR');
    expect(getCompatibleFieldTypes('SUM')).toContain('number');
    expect(getCompatibleFieldTypes('MATH_OPERATOR')).toContain('number');
    expect(getCompatibleFieldTypes('YEAR')).toContain('date');
    expect(getFunctionSyntax('UNKNOWN()', '')).toBe('UNKNOWN(...)');
  });

  it('normalizes comparison values and converts results', () => {
    expect(normalizeForComparison('')).toBeNull();
    expect(normalizeForComparison('12')).toBe(12);
    expect(normalizeForComparison('12.5')).toBe(12.5);
    expect(normalizeForComparison(true)).toBe(true);
    expect(convertResultToValue(5, 'number')).toBe(5);
    expect(convertResultToValue(false, 'boolean')).toBe(false);
    const dateValue = new Date('2025-01-02T00:00:00.000Z');
    expect(convertResultToValue(dateValue, 'date')).toBe('2025-01-02');
  });
});
