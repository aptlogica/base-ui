import { describe, it, expect } from 'vitest';
import {
  parseFieldReference,
  getColumnIdentifier,
  getFieldType,
  isNumericType,
  isTextType,
  isDateType,
  isBooleanType,
  getFieldValue,
  getTextFieldValue,
  getBooleanValue,
  getDateValue,
  getFieldValueByType,
  parseFunctionArguments,
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
  type FormulaContext,
} from '../formulaHelper';

const context: FormulaContext = {
  columns: [
    { id: 'c1', title: 'Price', column_name: 'price', uidt: 'number', key: 'price' },
    { id: 'c2', title: 'Qty', column_name: 'qty', uidt: 'number', key: 'qty' },
    { id: 'c3', title: 'Name', column_name: 'name', uidt: 'text', key: 'name' },
    { id: 'c4', title: 'Date', column_name: 'date', uidt: 'date', key: 'date' },
    { id: 'c5', title: 'Flag', column_name: 'flag', uidt: 'boolean', key: 'flag' },
    { id: 'c6', title: 'Empty', column_name: 'empty', uidt: 'text', key: 'empty' },
  ],
  allColumns: [],
  rowData: {
    price: 8,
    qty: 2,
    name: 'Alice',
    date: '2024-01-02',
    flag: false,
    empty: '',
    data: {
      nested: 4,
    },
  },
};

const validateNone = () => null;

describe('formulaHelper basics', () => {
  it('parses field references and resolves types', () => {
    expect(parseFieldReference('{Price}')).toBe('Price');
    expect(parseFieldReference('Price')).toBe('');
    expect(getColumnIdentifier('Price', context)).toBe('price');
    expect(getFieldType('Price', context)).toBe('number');
    expect(isNumericType('Number')).toBe(true);
    expect(isTextType('TEXT')).toBe(true);
    expect(isDateType('date')).toBe(true);
    expect(isBooleanType('boolean')).toBe(true);
  });

  it('gets field values by type', () => {
    expect(getFieldValue('Price', context)).toBe(8);
    expect(getTextFieldValue('Name', context)).toBe('Alice');
    expect(getBooleanValue('Flag', context)).toBe(false);
    expect(getDateValue('Date', context)).toBeInstanceOf(Date);
    expect(getFieldValueByType('Price', context)).toBe(8);
    expect(getFieldValueByType('Name', context)).toBe('Alice');
    expect(getFieldValueByType('Date', context)).toBeInstanceOf(Date);
  });

  it('parses function arguments safely', () => {
    expect(parseFunctionArguments('1, 2, 3')).toEqual(['1', '2', '3']);
    expect(parseFunctionArguments('"a, b", {Price}, 4')).toEqual(['"a, b"', '{Price}', '4']);
  });
});

describe('formulaHelper evaluation', () => {
  it('evaluates math and text functions', () => {
    expect(evaluateFormula('ADD({Price}, {Qty})', context, validateNone).result).toBe(10);
    expect(evaluateFormula('SUBTRACT(10, 3)', context, validateNone).result).toBe(7);
    expect(evaluateFormula('MULTIPLY({Qty}, 3)', context, validateNone).result).toBe(6);
    expect(evaluateFormula('DIVIDE(10, 2)', context, validateNone).result).toBe(5);
    expect(evaluateFormula('SUM(1, 2, 3)', context, validateNone).result).toBe(6);
    expect(evaluateFormula('AVERAGE(2, 4)', context, validateNone).result).toBe(3);
    expect(evaluateFormula('MAX(1, 9, 3)', context, validateNone).result).toBe(9);
    expect(evaluateFormula('MIN(1, 9, 3)', context, validateNone).result).toBe(1);
    expect(evaluateFormula('ROUND(1.234, 2)', context, validateNone).result).toBe(1.23);
    expect(evaluateFormula('CEILING(1.1)', context, validateNone).result).toBe(2);
    expect(evaluateFormula('FLOOR(1.9)', context, validateNone).result).toBe(1);
    expect(evaluateFormula('ABS(-3)', context, validateNone).result).toBe(3);
    expect(evaluateFormula('POWER(2, 3)', context, validateNone).result).toBe(8);
    expect(evaluateFormula('SQRT(9)', context, validateNone).result).toBe(3);
    expect(evaluateFormula('MOD(10, 3)', context, validateNone).result).toBe(1);
    expect(evaluateFormula('CONCAT("A", "B")', context, validateNone).result).toBe('AB');
    expect(evaluateFormula('LEN("test")', context, validateNone).result).toBe(4);
    expect(evaluateFormula('UPPER("a")', context, validateNone).result).toBe('A');
    expect(evaluateFormula('LOWER("A")', context, validateNone).result).toBe('a');
    expect(evaluateFormula('TRIM(" a ")', context, validateNone).result).toBe('a');
    expect(evaluateFormula('LEFT("hello", 2)', context, validateNone).result).toBe('he');
    expect(evaluateFormula('RIGHT("hello", 2)', context, validateNone).result).toBe('lo');
    expect(evaluateFormula('MID("hello", 2, 3)', context, validateNone).result).toBe('ell');
    expect(evaluateFormula('FIND("e", "hello")', context, validateNone).result).toBe(2);
    expect(evaluateFormula('REPLACE("hello", "l", "x")', context, validateNone).result).toBe('hexxo');
  });

  it('evaluates date and logical functions', () => {
    expect(evaluateFormula('DATE(2024, 1, 2)', context, validateNone).result).toBeInstanceOf(Date);
    expect(evaluateFormula('YEAR("2024-01-02")', context, validateNone).result).toBe(2024);
    expect(evaluateFormula('MONTH("2024-01-02")', context, validateNone).result).toBe(1);
    expect(evaluateFormula('DAY("2024-01-02")', context, validateNone).result).toBe(2);
    expect(evaluateFormula('WEEKDAY("2024-01-02")', context, validateNone).result).toBeTypeOf('number');
    expect(evaluateFormula('DATEADD("2024-01-02", 2, "days")', context, validateNone).result).toBeInstanceOf(Date);
    expect(evaluateFormula('DATEDIFF("2024-01-02", "2024-01-05", "days")', context, validateNone).result).toBe(3);
    expect(evaluateFormula('ISBLANK({Empty})', context, validateNone).result).toBe(true);
    expect(evaluateFormula('ISNUMBER({Price})', context, validateNone).result).toBe(true);
    expect(evaluateFormula('ISTEXT({Name})', context, validateNone).result).toBe(true);
    expect(evaluateFormula('ISDATE({Date})', context, validateNone).result).toBe(true);
    expect(evaluateFormula('AND({Price} > 1, {Qty} < 5)', context, validateNone).result).toBe(true);
    expect(evaluateFormula('OR({Price} < 1, {Qty} > 1)', context, validateNone).result).toBe(true);
    expect(evaluateFormula('NOT({Flag})', context, validateNone).result).toBe(true);
    expect(evaluateFormula('IF({Price} > 5, "Yes", "No")', context, validateNone).result).toBe('Yes');
    expect(evaluateFormula('{Price} + 2', context, validateNone).result).toBe(10);
    expect(evaluateFormula('{Price} > 5', context, validateNone).result).toBe(true);
  });

  it('validates formulas and formats results', () => {
    expect(validateFormula('ADD({Price}, 2)', context)).toBeNull();
    expect(validateFormula('ADD({Missing}, 2)', context)).not.toBeNull();
    expect(formatResult(true, 'boolean', 0, {}, '')).toBe('TRUE');
    expect(formatResult(1.234, 'number', 2, {}, '')).toBe('1.23');
    expect(formatResult(0.5, 'percent', 2, {}, '')).toBe('0.50%');
    expect(formatResult(10, 'currency', 0, { formatting: { currency: 'USD' } }, '')).toBe('$10');
    expect(formatResult(new Date('2024-01-02T10:20:30Z'), 'date', 0, { formatting: { dateFormat: 'MM/DD/YYYY' } }, '')).toContain('/');
  });
});

describe('formulaHelper helpers', () => {
  it('detects row data usage and function hints', () => {
    expect(formulaDependsOnRowData('{Price} + 1')).toBe(true);
    expect(formulaDependsOnRowData('1 + 2')).toBe(false);
    expect(formulaUsesToday('TODAY()')).toBe(true);
    expect(getFunctionSyntax('SUM()', 'SUM({Price}, {Qty})')).toContain('SUM(');
    expect(detectCurrentFunction('ADD({Price}, 1)')?.name).toBe('ADD()');
    expect(getFunctionAtCursor('ADD({Price}, {Qty})', 6)).toBe('ADD');
    expect(getFunctionAtCursor('{Price} + {Qty}', 10)).toBe('MATH_OPERATOR');
    expect(getCompatibleFieldTypes('ADD')).not.toBeNull();
    expect(getCompatibleFieldTypes('TEXT')).toBeNull();
  });

  it('normalizes and converts results', () => {
    expect(normalizeForComparison('')).toBeNull();
    expect(normalizeForComparison('12')).toBe(12);
    expect(normalizeForComparison(true)).toBe(true);
    expect(convertResultToValue(new Date('2024-01-02T00:00:00Z'), 'date')).toBe('2024-01-02');
    expect(convertResultToValue(5, 'number')).toBe(5);
  });
});
