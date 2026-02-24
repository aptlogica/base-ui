import { describe, expect, it } from 'vitest';
import {
  parseFunctionArguments,
  parseFieldReference,
  getColumnIdentifier,
  getFieldType,
  isNumericType,
  isTextType,
  isDateType,
  isBooleanType,
  evaluateArgument,
  evaluateTextArgument,
  evaluateDateArgument,
  getFieldValue,
  getTextFieldValue,
  getBooleanValue,
  getDateValue,
  getFieldValueByType,
  normalizeForComparison,
  convertResultToValue,
  validateFormula,
  type FormulaContext
} from '../formulaHelper';

const context: FormulaContext = {
  columns: [
    { id: 'c1', title: 'Price', column_name: 'price', uidt: 'number', key: 'price' },
    { id: 'c2', title: 'Name', column_name: 'name', uidt: 'text', key: 'name' },
    { id: 'c3', title: 'Active', column_name: 'active', uidt: 'boolean', key: 'active' },
    { id: 'c4', title: 'Start', column_name: 'start', uidt: 'date', key: 'start' },
    { id: 'c5', title: 'Unknown', column_name: 'unknown', uidt: 'json', key: 'unknown' },
  ],
  allColumns: [],
  rowData: {
    price: '12.5',
    name: 'Alpha',
    active: true,
    start: '2026-02-13T10:30:00Z',
    data: {
      price: 20,
      name: 'Beta',
      active: false,
      start: '2026-02-14T11:00:00Z',
    }
  },
};

describe('formulaHelper runtime helpers', () => {
  it('parses function arguments with quotes and braces', () => {
    const args = parseFunctionArguments(`{Price}, "A,B", 'C', NOW()`);
    expect(args).toEqual(['{Price}', '"A,B"', "'C'", 'NOW()']);
  });

  it('parses field references and resolves identifiers/types', () => {
    const contextWithAllColumns: FormulaContext = {
      ...context,
      allColumns: [{ id: 'ac1', title: 'Total', column_name: 'total', uidt: 'number', key: 'total' }],
    };

    expect(parseFieldReference('{Price}')).toBe('Price');
    expect(parseFieldReference('Price')).toBe('');
    expect(getColumnIdentifier('Total', contextWithAllColumns)).toBe('total');
    expect(getFieldType('Name', context)).toBe('text');
  });

  it('classifies field types correctly', () => {
    expect(isNumericType('number')).toBe(true);
    expect(isTextType('text')).toBe(true);
    expect(isDateType('date')).toBe(true);
    expect(isBooleanType('boolean')).toBe(true);
    expect(isNumericType(null)).toBe(false);
  });

  it('evaluates numeric arguments and field references', () => {
    expect(evaluateArgument('12.5', context)).toBe(12.5);
    expect(evaluateArgument('{Price}', context)).toBe(12.5);
    expect(evaluateArgument('ADD(1,2)', context)).toBeNull();
  });

  it('evaluates text arguments and unescapes quotes', () => {
    expect(evaluateTextArgument('{Name}', context)).toBe('Alpha');
    expect(evaluateTextArgument('"He said \\"ok\\""', context)).toBe('He said "ok"');
    expect(evaluateTextArgument('LEN("a")', context)).toBeNull();
  });

  it('evaluates date arguments from fields and literals', () => {
    const dateFromField = evaluateDateArgument('{Start}', context);
    expect(dateFromField).toBeInstanceOf(Date);
    expect(evaluateDateArgument('2026-02-15', context)).toBeInstanceOf(Date);
    expect(evaluateDateArgument('DATE(2020,1,1)', context)).toBeNull();
  });

  it('resolves numeric and text field values with rowData', () => {
    expect(getFieldValue('Price', context)).toBe(12.5);
    expect(getTextFieldValue('Name', context)).toBe('Alpha');
  });

  it('resolves date values with rowData fallback and defaults', () => {
    const dateFromRow = getDateValue('Start', context);
    expect(dateFromRow).toBeInstanceOf(Date);
    const dateFromMissing = getDateValue('Missing', context);
    expect(dateFromMissing).toBeInstanceOf(Date);
  });

  it('resolves boolean values and handles unknowns', () => {
    expect(getBooleanValue('Active', context)).toBe(true);
    expect(getBooleanValue('Missing', context)).toBeNull();
  });

  it('resolves values by type with fallback', () => {
    expect(getFieldValueByType('Active', context)).toBe(true);
    expect(getFieldValueByType('Start', context)).toBeInstanceOf(Date);
    expect(getFieldValueByType('Price', context)).toBe(12.5);
    expect(getFieldValueByType('Name', context)).toBe('Alpha');
    expect(getFieldValueByType('Unknown', context)).toBeDefined();
  });

  it('normalizes values for comparison', () => {
    expect(normalizeForComparison(null)).toBeNull();
    expect(normalizeForComparison('12')).toBe(12);
    expect(normalizeForComparison('12.5')).toBe(12.5);
    expect(normalizeForComparison('foo')).toBe('foo');
    expect(normalizeForComparison(true)).toBe(true);
  });

  it('converts result values for onChange', () => {
    const date = new Date('2026-02-13T10:30:00Z');
    expect(convertResultToValue(3, 'number')).toBe(3);
    expect(convertResultToValue(true, 'boolean')).toBe(true);
    expect(convertResultToValue(date, 'date')).toBe('2026-02-13');
    expect(convertResultToValue(date, 'datetime')).toBe(date.toISOString());
    expect(convertResultToValue('abc', 'text')).toBe('abc');
  });

  it('validates formulas for unknown fields and operator issues', () => {
    expect(validateFormula('{Missing} + 1', context)).toBe('Unknown field: Missing');
    expect(validateFormula('{Price} ++ 1', context)).toBe('Invalid operator usage: operators cannot be consecutive');
  });

  it('validates logical functions with bad arguments', () => {
    expect(validateFormula('IF(,1,2)', context)).toBe('IF() first argument must be a condition (comparison, field reference, or boolean)');
    expect(validateFormula('NOT(1,2)', context)).toBe('NOT() accepts only 1 argument, but 2 provided');
  });
});
