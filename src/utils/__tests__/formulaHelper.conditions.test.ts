import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateIF,
  evaluateAND,
  evaluateOR,
  evaluateNOT,
  evaluateISBLANK,
  evaluateISTEXT,
  evaluateISDATE,
  evaluateComparison,
  evaluateFormula,
  validateFormula,
  type FormulaContext,
} from '../formulaHelper';

const baseContext: FormulaContext = {
  columns: [
    { title: 'Active', key: 'active', type: 'boolean' },
    { title: 'Price', key: 'price', type: 'number' },
    { title: 'Due', key: 'due', type: 'date' },
    { title: 'Name', key: 'name', type: 'text' },
  ],
  allColumns: [],
  rowData: {
    active: 1,
    price: 12.5,
    due: '2026-03-01',
    name: 'Alpha',
  },
};

describe('formulaHelper logical evaluation branches', () => {
  it('evaluates boolean field references and literals', () => {
    expect(evaluateCondition('{Active}', baseContext)).toBe(true);
    expect(evaluateCondition('TRUE', baseContext)).toBe(true);
    expect(evaluateCondition('FALSE', baseContext)).toBe(false);
  });

  it('evaluates IF with date literal and false fallback', () => {
    const dateResult = evaluateIF('IF(TRUE, 2026-03-01, "x")', baseContext);
    expect(dateResult).toBeInstanceOf(Date);
    const falseResult = evaluateIF('IF(FALSE, 1)', baseContext);
    expect(falseResult).toBe('');
  });

  it('evaluates AND/OR/NOT using mixed conditions', () => {
    expect(evaluateAND('AND(TRUE, {Active})', baseContext)).toBe(true);
    expect(evaluateOR('OR(FALSE, {Active})', baseContext)).toBe(true);
    expect(evaluateNOT('NOT(FALSE)', baseContext)).toBe(true);
  });
});

describe('formulaHelper IS* helpers', () => {
  it('evaluates ISBLANK for fields and literals', () => {
    const blankContext: FormulaContext = {
      ...baseContext,
      rowData: { ...baseContext.rowData, name: '' },
    };
    expect(evaluateISBLANK('ISBLANK({Name})', blankContext)).toBe(true);
    expect(evaluateISBLANK('ISBLANK("x")', baseContext)).toBe(false);
  });

  it('evaluates ISTEXT and ISDATE for literals', () => {
    expect(evaluateISTEXT('ISTEXT(123)', baseContext)).toBe(false);
    expect(evaluateISTEXT("ISTEXT('abc')", baseContext)).toBe(true);
    expect(evaluateISDATE('ISDATE(2026-03-01)', baseContext)).toBe(true);
    expect(evaluateISDATE('ISDATE(not-a-date)', baseContext)).toBe(false);
  });
});

describe('formulaHelper comparison and math fallback', () => {
  it('skips comparisons inside parentheses and evaluates plain comparisons', () => {
    expect(evaluateComparison('(1 > 0)', baseContext)).toBeNull();
    expect(evaluateComparison('1 > 0', baseContext)).toBe(true);
  });

  it('falls back to math expression evaluation when no function matches', () => {
    const result = evaluateFormula('{Price} + 2 * 3', baseContext, validateFormula);
    expect(result.error).toBeNull();
    expect(result.result).toBe(18.5);
  });
});
