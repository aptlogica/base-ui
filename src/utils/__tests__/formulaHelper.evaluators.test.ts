import { describe, expect, it } from 'vitest';
import {
  parseFunctionArguments,
  evaluateArgument,
  evaluateTextArgument,
  evaluateDateArgument,
  evaluateTODAY,
  evaluateNOW,
  evaluateISBLANK,
  evaluateDIVIDE,
  evaluateSQRT,
  evaluateMOD,
  evaluateDATEADD,
  evaluateDATEDIFF,
  evaluateDATE,
  evaluateCondition,
  evaluateIF,
  evaluateAND,
  evaluateOR,
  evaluateNOT,
  evaluateISNUMBER,
  evaluateISTEXT,
  evaluateISDATE,
  evaluateComparison,
  type FormulaContext,
} from '../formulaHelper';

const context: FormulaContext = {
  columns: [
    { id: 'c1', title: 'Price', column_name: 'price', uidt: 'number', key: 'price' },
    { id: 'c2', title: 'Name', column_name: 'name', uidt: 'text', key: 'name' },
    { id: 'c3', title: 'Date', column_name: 'date', uidt: 'date', key: 'date' },
    { id: 'c4', title: 'Flag', column_name: 'flag', uidt: 'boolean', key: 'flag' },
    { id: 'c5', title: 'Unit', column_name: 'unit', uidt: 'text', key: 'unit' },
  ],
  allColumns: [],
  rowData: {
    price: 8,
    name: 'Alice',
    date: '2024-01-02',
    flag: true,
    unit: 'days',
  },
};

describe('formulaHelper evaluator edges', () => {
  it('evaluates numeric/text/date arguments with null guards', () => {
    expect(evaluateArgument('{Price}', context)).toBe(8);
    expect(evaluateArgument('"12.5"', context)).toBeNull();
    expect(evaluateArgument('SOME_FUNC(1)', context)).toBeNull();

    expect(evaluateTextArgument('{Name}', context)).toBe('Alice');
    expect(evaluateTextArgument('123', context)).toBe('123');
    expect(evaluateTextArgument('ADD(1,2)', context)).toBeNull();

    expect(evaluateDateArgument('{Date}', context)).toBeInstanceOf(Date);
    expect(evaluateDateArgument('"2024-01-02"', context)).toBeInstanceOf(Date);
    expect(evaluateDateArgument('ADD(1,2)', context)).toBeNull();
  });

  it('handles math evaluator null branches', () => {
    expect(evaluateDIVIDE('DIVIDE(10, 0)', context)).toBeNull();
    expect(evaluateSQRT('SQRT(-1)', context)).toBeNull();
    expect(evaluateMOD('MOD(10, 0)', context)).toBeNull();
  });

  it('handles DATEADD and DATEDIFF unit variants and invalid units', () => {
    const withFieldUnit = evaluateDATEADD('DATEADD("2024-01-02", 2, {Unit})', context);
    expect(withFieldUnit).toBeInstanceOf(Date);

    const badUnit = evaluateDATEADD('DATEADD("2024-01-02", 2, "centuries")', context);
    expect(badUnit).toBeNull();

    const diffDays = evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-03", "days")', context);
    expect(diffDays).toBe(2);

    const diffBadUnit = evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-03", "fortnights")', context);
    expect(diffBadUnit).toBeNull();

    expect(evaluateDATEADD('DATEADD("2024-01-01", 1, "weeks")', context)).toBeInstanceOf(Date);
    expect(evaluateDATEADD('DATEADD("2024-01-01", 90, "minutes")', context)).toBeInstanceOf(Date);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-01T01:30:00", "minutes")', context)).toBeNull();
  });

  it('validates DATE argument bounds', () => {
    expect(evaluateDATE('DATE(2024, 2, 29)', context)).toBeInstanceOf(Date);
    expect(evaluateDATE('DATE(2024, 13, 1)', context)).toBeNull();
    expect(evaluateDATE('DATE(2024, 2, 31)', context)).toBeNull();
  });

  it('evaluates condition/logical and typed-check paths', () => {
    expect(evaluateCondition('{Flag}', context)).toBe(true);
    expect(evaluateCondition('true', context)).toBe(true);
    expect(evaluateCondition('false', context)).toBe(false);
    expect(evaluateCondition('unknown-token', context)).toBeNull();

    expect(evaluateIF('IF({Price} > 5, "Yes", "No")', context)).toBe('Yes');
    expect(evaluateIF('IF({Price} > 50, "Yes", "No")', context)).toBe('No');

    expect(evaluateAND('AND({Price} > 1, {Flag})', context)).toBe(true);
    expect(evaluateOR('OR({Price} < 1, {Flag})', context)).toBe(true);
    expect(evaluateNOT('NOT({Flag})', context)).toBe(false);
  });

  it('evaluates IS* helpers and comparison parser edge cases', () => {
    expect(evaluateISBLANK('ISBLANK({Name})', context)).toBe(false);
    expect(evaluateISBLANK('ISBLANK(   )', context)).toBeNull();
    expect(evaluateISNUMBER('ISNUMBER({Price})', context)).toBe(true);
    expect(evaluateISTEXT('ISTEXT({Name})', context)).toBe(true);
    expect(evaluateISDATE('ISDATE({Date})', context)).toBe(true);

    expect(evaluateComparison('{Price} >= 8', context)).toBe(true);
    expect(evaluateComparison('"a=b" = "a=b"', context)).toBeNull();
    expect(evaluateComparison('not-a-comparison', context)).toBeNull();
  });

  it('covers TODAY/NOW and argument parser nested tokens', () => {
    const today = evaluateTODAY();
    const now = evaluateNOW();
    expect(today).toBeInstanceOf(Date);
    expect(now).toBeInstanceOf(Date);
    expect(today?.getHours()).toBe(0);
    expect(today?.getMinutes()).toBe(0);

    expect(
      parseFunctionArguments(String.raw`{Name}, "x, y", IF({Price} > 1, "A", "B"), "q\"uote"`)
    ).toEqual(['{Name}', '"x, y"', 'IF({Price} > 1, "A", "B")', '"q\\"uote"']);
  });
});
