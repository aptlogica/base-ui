import { describe, expect, it } from 'vitest';
import {
  getFieldValue,
  getTextFieldValue,
  getBooleanValue,
  getDateValue,
  getFieldValueByType,
  evaluateDateArgument,
  formatResult,
  getFunctionSyntax,
  formulaUsesToday,
  validateFormula,
  type FormulaContext,
} from '../formulaHelper';

describe('formulaHelper additional branches', () => {
  it('reads values from rowData.data and uses sample fallbacks', () => {
    const ctx: FormulaContext = {
      columns: [
        { title: 'Price', key: 'price', type: 'number' },
        { title: 'Name', key: 'name', type: 'text' },
        { title: 'Active', key: 'active', type: 'boolean' },
        { title: 'Due', key: 'due', type: 'date' },
      ],
      allColumns: [],
      rowData: {
        data: {
          price: '7',
          name: 'Beta',
          active: 1,
          due: '2025-02-03',
        },
      },
    };

    expect(getFieldValue('Price', ctx)).toBe(7);
    expect(getTextFieldValue('Name', ctx)).toBe('Beta');
    expect(getBooleanValue('Active', ctx)).toBe(true);
    const due = getDateValue('Due', ctx);
    expect(due).toBeInstanceOf(Date);
    expect(due?.getFullYear()).toBe(2025);

    const noRowData: FormulaContext = {
      columns: [{ title: 'Price', key: 'price', type: 'number' }],
      allColumns: [],
    };
    expect(getFieldValue('Price', noRowData)).toBe(15);
    expect(getTextFieldValue('Price', noRowData)).toBe('Sample Price');
  });

  it('returns boolean defaults and unknown-type fallbacks', () => {
    const boolCtx: FormulaContext = {
      columns: [{ title: 'Flag', key: 'flag', type: 'boolean' }],
      allColumns: [],
    };
    expect(getBooleanValue('Flag', boolCtx)).toBe(false);

    const textCtx: FormulaContext = {
      columns: [{ title: 'Name', key: 'name', type: 'text' }],
      allColumns: [],
    };
    expect(getBooleanValue('Name', textCtx)).toBeNull();

    const unknownCtx: FormulaContext = {
      columns: [],
      allColumns: [],
      rowData: {
        Flag: 1,
      },
    };
    expect(getFieldValueByType('Flag', unknownCtx)).toBe(true);
  });

  it('covers date argument parsing and formatting fallbacks', () => {
    const ctx: FormulaContext = {
      columns: [],
      allColumns: [],
    };
    expect(evaluateDateArgument('"not-a-date"', ctx)).toBeNull();
    expect(formatResult(12.3, 'text', 2, {}, '')).toBe('12.3');
  });

  it('derives function syntax from examples and detects TODAY() usage', () => {
    expect(getFunctionSyntax('TEST', 'TEST({Price})')).toBe('TEST(number)');
    expect(getFunctionSyntax('PAIR', 'PAIR({Price}, {Tax})')).toBe('PAIR(number1, number2)');
    expect(formulaUsesToday('today()')).toBe(true);
  });

  it('accepts comparisons with quoted values, parens, and function calls', () => {
    const ctx: FormulaContext = {
      columns: [{ title: 'Price', key: 'price', type: 'number' }],
      allColumns: [],
    };
    expect(validateFormula('"a=b" = "a=b"', ctx)).toBeNull();
    expect(validateFormula('(1 > 0)', ctx)).toBeNull();
    expect(validateFormula('1 < SUM(1, 2)', ctx)).toBeNull();
    expect(validateFormula('SUM(1, 2) > 1', ctx)).toBeNull();
  });
});
