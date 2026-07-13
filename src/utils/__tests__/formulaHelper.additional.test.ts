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
  normalizeForComparison,
  convertResultToValue,
  type FormulaContext,
  parseFieldReference,
  getColumnIdentifier,
  getFieldType,
  evaluateTextArgument,
  evaluateADD,
  evaluateSUBTRACT,
  evaluateMULTIPLY,
  evaluateDIVIDE,
  evaluateSUM,
  evaluateAVERAGE,
  evaluateMAX,
  evaluateMIN,
  evaluateROUND,
  evaluateCEILING,
  evaluateFLOOR,
  evaluateABS,
  evaluatePOWER,
  evaluateSQRT,
  evaluateMOD,
  evaluateCONCATENATE,
  evaluateLEN,
  evaluateUPPER,
  evaluateLOWER,
  evaluateTRIM,
  evaluateLEFT,
  evaluateRIGHT,
  evaluateMID,
  evaluateFIND,
  evaluateREPLACE,
  evaluateYEAR,
  evaluateMONTH,
  evaluateDAY,
  evaluateWEEKDAY,
  evaluateDATEADD,
  evaluateDATEDIFF,
  evaluateIF,
  evaluateISBLANK,
  evaluateISNUMBER,
  evaluateFormula,
  detectCurrentFunction,
  getCompatibleFieldTypes,
} from '../formulaHelper';

const context: FormulaContext = {
  columns: [
    { title: 'Price', key: 'price', type: 'number' },
    { title: 'Name', key: 'name', type: 'text' },
    { title: 'Active', key: 'active', type: 'boolean' },
    { title: 'Due', key: 'due', type: 'date' },
    { title: 'Unit', key: 'unit', type: 'text' },
  ],
  allColumns: [],
  rowData: {
    price: 12.5,
    name: 'Alpha',
    active: true,
    due: '2025-03-15',
    unit: 'days',
  },
};

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

  it('normalizes values for comparison and converts results', () => {
    expect(normalizeForComparison(null)).toBeNull();
    expect(normalizeForComparison('')).toBeNull();
    expect(normalizeForComparison('42')).toBe(42);
    expect(normalizeForComparison(' 42 ')).toBe(42);
    expect(normalizeForComparison(true)).toBe(true);

    const date = new Date('2026-02-03T10:20:30.000Z');
    expect(convertResultToValue(5, 'number')).toBe(5);
    expect(convertResultToValue(true, 'boolean')).toBe(true);
    expect(convertResultToValue(date, 'date')).toBe('2026-02-03');
    expect(convertResultToValue(date, 'datetime')).toBe('2026-02-03T10:20:30.000Z');
    expect(convertResultToValue('ok', 'text')).toBe('ok');
  });

  it('handles field reference parsing and column lookups across column sources', () => {
    const ctx: FormulaContext = {
      columns: [
        { title: 'Local', key: 'local_key', type: 'text' },
      ],
      allColumns: [
        { title: 'Global', column_name: 'global_name', uidt: 'number', key: 'global_key' },
      ],
    };

    expect(parseFieldReference('{Global}')).toBe('Global');
    expect(parseFieldReference('{}')).toBe('');
    expect(parseFieldReference('Global')).toBe('');
    expect(getColumnIdentifier('Global', ctx)).toBe('global_key');
    expect(getFieldType('Global', ctx)).toBe('number');
  });

  it('prefers columns when allColumns is empty', () => {
    const ctx: FormulaContext = {
      columns: [{ title: 'Local', column_name: 'local_name', uidt: 'text' }],
      allColumns: [],
    };

    expect(getColumnIdentifier('Local', ctx)).toBe('local_name');
    expect(getFieldType('Local', ctx)).toBe('text');
  });

  it('unescapes quoted text arguments and preserves non-numeric strings', () => {
    const ctx: FormulaContext = { columns: [], allColumns: [] };
    expect(evaluateTextArgument('"He said \\"hi\\""', ctx)).toBe('He said "hi"');
    expect(normalizeForComparison('01')).toBe('01');
  });

  it('formats percent and currency results with precision', () => {
    expect(formatResult(1.236, 'percent', 2, {}, '')).toBe('1.24%');
    expect(formatResult(12, 'currency', 0, { formatting: { currency: 'USD' } }, '')).toBe('$12');
  });
});

describe('formulaHelper additional standalone math evaluators', () => {
  it('evaluates math function happy paths', () => {
    expect(evaluateADD('ADD(1, 2, {Price})', context)).toBe(15.5);
    expect(evaluateSUM('SUM(1, 2, 3)', context)).toBe(6);
    expect(evaluateSUBTRACT('SUBTRACT(20, 5, 2)', context)).toBe(13);
    expect(evaluateMULTIPLY('MULTIPLY(2, 3, 4)', context)).toBe(24);
    expect(evaluateDIVIDE('DIVIDE(100, 4, 5)', context)).toBe(5);
    expect(evaluateAVERAGE('AVERAGE(2, 4, 6)', context)).toBe(4);
    expect(evaluateAVERAGE('AVERAGE(2, foo, 6)', context)).toBe(4);
    expect(evaluateMAX('MAX(1, 9, 3)', context)).toBe(9);
    expect(evaluateMIN('MIN(8, 2, 5)', context)).toBe(2);
    expect(evaluateROUND('ROUND(1.2345, 2)', context)).toBe(1.23);
    expect(evaluateROUND('ROUND(1.5)', context)).toBe(2);
    expect(evaluateCEILING('CEILING(1.1)', context)).toBe(2);
    expect(evaluateFLOOR('FLOOR(1.9)', context)).toBe(1);
    expect(evaluateABS('ABS(-7)', context)).toBe(7);
    expect(evaluatePOWER('POWER(2, 4)', context)).toBe(16);
    expect(evaluateSQRT('SQRT(16)', context)).toBe(4);
    expect(evaluateMOD('MOD(17, 5)', context)).toBe(2);
  });

  it('returns null for unmatched or empty math formulas', () => {
    expect(evaluateADD('NOPE()', context)).toBeNull();
    expect(evaluateADD('ADD(   )', context)).toBeNull();
    expect(evaluateSUBTRACT('NOPE()', context)).toBeNull();
    expect(evaluateMULTIPLY('NOPE()', context)).toBeNull();
    expect(evaluateAVERAGE('NOPE()', context)).toBeNull();
    expect(evaluateMAX('NOPE()', context)).toBeNull();
    expect(evaluateMIN('NOPE()', context)).toBeNull();
    expect(evaluateABS('NOPE()', context)).toBeNull();
    expect(evaluateABS('ABS()', context)).toBeNull();
    expect(evaluateABS('ABS(foo)', context)).toBeNull();
  });
});

describe('formulaHelper additional standalone text evaluators', () => {
  it('evaluates text function happy paths and edges', () => {
    expect(evaluateCONCATENATE('CONCATENATE("A", "B", {Name})', context)).toBe('ABAlpha');
    expect(evaluateCONCATENATE('CONCAT("x", "y")', context)).toBe('xy');
    expect(evaluateLEN('LEN({Name})', context)).toBe(5);
    expect(evaluateUPPER('UPPER({Name})', context)).toBe('ALPHA');
    expect(evaluateLOWER('LOWER("MiXeD")', context)).toBe('mixed');
    expect(evaluateTRIM('TRIM("  hi  ")', context)).toBe('hi');
    expect(evaluateLEFT('LEFT("abcdef", 3)', context)).toBe('abc');
    expect(evaluateLEFT('LEFT("abcdef", 0)', context)).toBe('');
    expect(evaluateRIGHT('RIGHT("abcdef", 2)', context)).toBe('ef');
    expect(evaluateRIGHT('RIGHT("abcdef", 0)', context)).toBe('');
    expect(evaluateRIGHT('RIGHT("abcdef", 20)', context)).toBe('abcdef');
    expect(evaluateMID('MID("abcdef", 2, 3)', context)).toBe('bcd');
    expect(evaluateMID('MID("abcdef", 2, 0)', context)).toBe('');
    expect(evaluateFIND('FIND("ph", {Name})', context)).toBe(3);
    expect(evaluateFIND('FIND("zz", {Name})', context)).toBe(0);
    expect(evaluateREPLACE('REPLACE("a.b+c", ".", "-")', context)).toBe('a-b+c');
  });

  it('returns null for unmatched or invalid text formulas', () => {
    expect(evaluateCONCATENATE('NOPE()', context)).toBeNull();
    expect(evaluateCONCATENATE('CONCATENATE()', context)).toBeNull();
    expect(evaluateUPPER('NOPE()', context)).toBeNull();
    expect(evaluateUPPER('UPPER()', context)).toBeNull();
    expect(evaluateLOWER('LOWER()', context)).toBeNull();
    expect(evaluateTRIM('TRIM()', context)).toBeNull();
    expect(evaluateLEFT('LEFT("a")', context)).toBeNull();
    expect(evaluateRIGHT('RIGHT("a")', context)).toBeNull();
    expect(evaluateMID('MID("a", 1)', context)).toBeNull();
    expect(evaluateREPLACE('REPLACE("a", "b")', context)).toBeNull();
  });
});

describe('formulaHelper additional standalone date evaluators', () => {
  it('evaluates YEAR/MONTH/DAY/WEEKDAY', () => {
    expect(evaluateYEAR('YEAR("2025-03-15")', context)).toBe(2025);
    expect(evaluateMONTH('YEAR("2025-03-15")', context)).toBeNull();
    expect(evaluateMONTH('MONTH("2025-03-15")', context)).toBe(3);
    expect(evaluateDAY('DAY("2025-03-15")', context)).toBe(15);
    expect(evaluateWEEKDAY('WEEKDAY("2025-03-15")', context)).toBe(6);
    expect(evaluateWEEKDAY('WEEKDAY("2025-03-16")', context)).toBe(7);
  });

  it('evaluates DATEADD for all units including unquoted and field units', () => {
    expect(evaluateDATEADD('DATEADD("2025-01-01", 1, "years")', context)?.getFullYear()).toBe(2026);
    expect(evaluateDATEADD('DATEADD("2025-01-01", 1, "months")', context)?.getMonth()).toBe(1);
    expect(evaluateDATEADD('DATEADD("2025-01-01", 1, "weeks")', context)?.getDate()).toBe(8);
    const plusHours = evaluateDATEADD('DATEADD({Due}, 2, "hours")', context);
    expect(plusHours).toBeInstanceOf(Date);
    expect(plusHours!.getUTCHours()).toBe((new Date('2025-03-15').getUTCHours() + 2) % 24);
    expect(evaluateDATEADD('DATEADD({Due}, 30, "minutes")', context)).toBeInstanceOf(Date);
    expect(evaluateDATEADD('DATEADD({Due}, 45, "seconds")', context)).toBeInstanceOf(Date);
    expect(evaluateDATEADD('DATEADD("2025-01-01", 1, days)', context)?.getDate()).toBe(2);
    expect(evaluateDATEADD('DATEADD("2025-01-01", 1, {Unit})', context)?.getDate()).toBe(2);
    expect(evaluateDATEADD('DATEADD("2025-01-01", 1, "bogus")', context)).toBeNull();
  });

  it('evaluates DATEDIFF for all units including unquoted and field units', () => {
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2025-01-01", "years")', context)).toBe(1);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-03-01", "months")', context)).toBeGreaterThan(0);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-15", "weeks")', context)).toBe(2);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-03", "days")', context)).toBe(2);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-02", "hours")', context)).toBe(24);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-02", "minutes")', context)).toBe(1440);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-02", "seconds")', context)).toBe(86400);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-03", days)', context)).toBe(2);
    expect(evaluateDATEDIFF('DATEDIFF("2024-01-01", "2024-01-03", {Unit})', context)).toBe(2);
  });
});

describe('formulaHelper additional IF and IS* branches', () => {
  it('covers IF true/false value parsing branches', () => {
    expect(evaluateIF('IF(TRUE, {Name}, {Price})', context)).toBe('Alpha');
    expect(evaluateIF('IF(FALSE, {Name}, {Price})', context)).toBe(12.5);
    expect(evaluateIF('IF(TRUE, true, false)', context)).toBe(true);
    expect(evaluateIF('IF(FALSE, true, false)', context)).toBe(false);
    expect(evaluateIF('IF(TRUE, false, true)', context)).toBe(false);
    expect(evaluateIF('IF(FALSE, 1, plainToken)', context)).toBe('plainToken');
    expect(evaluateIF('IF(TRUE, plainToken, 1)', context)).toBe('plainToken');
    expect(evaluateIF('IF(FALSE, "a", 2026-03-01)', context)).toBeInstanceOf(Date);
  });

  it('covers ISBLANK when column identifier is missing', () => {
    const noIdCtx: FormulaContext = {
      columns: [{ title: 'Ghost', type: 'text' }],
      allColumns: [],
      rowData: {},
    };
    expect(evaluateISBLANK('ISBLANK({Ghost})', noIdCtx)).toBe(false);
    expect(evaluateISNUMBER('ISNUMBER(42)', context)).toBe(true);
  });
});

describe('formulaHelper additional field value fallbacks', () => {
  it('reads values keyed by field title when column key is absent', () => {
    const titleCtx: FormulaContext = {
      columns: [
        { title: 'Amount', type: 'number' },
        { title: 'Label', type: 'text' },
        { title: 'Flag', type: 'boolean' },
        { title: 'When', type: 'date' },
      ],
      allColumns: [],
      rowData: {
        Amount: '42',
        Label: 'Hello',
        Flag: 1,
        When: '2024-06-01',
        data: {
          Amount2: '99',
        },
      },
    };

    expect(getFieldValue('Amount', titleCtx)).toBe(42);
    expect(getTextFieldValue('Label', titleCtx)).toBe('Hello');
    expect(getBooleanValue('Flag', titleCtx)).toBe(true);
    expect(getDateValue('When', titleCtx)?.getFullYear()).toBe(2024);
  });

  it('reads values from rowData.data keyed by field title', () => {
    const dataCtx: FormulaContext = {
      columns: [
        { title: 'Amount', type: 'number' },
        { title: 'Label', type: 'text' },
        { title: 'Flag', type: 'boolean' },
        { title: 'When', type: 'date' },
      ],
      allColumns: [],
      rowData: {
        data: {
          Amount: '7',
          Label: 'Nested',
          Flag: 0,
          When: '2023-12-25',
        },
      },
    };

    expect(getFieldValue('Amount', dataCtx)).toBe(7);
    expect(getTextFieldValue('Label', dataCtx)).toBe('Nested');
    expect(getBooleanValue('Flag', dataCtx)).toBe(false);
    expect(getDateValue('When', dataCtx)?.getFullYear()).toBe(2023);
  });

  it('falls through unknown-type getFieldValueByType branches', () => {
    const unknownCtx: FormulaContext = {
      columns: [],
      allColumns: [],
      rowData: { Mystery: 'texty' },
    };
    expect(getFieldValueByType('Mystery', unknownCtx)).toBe(true);
    expect(getFieldValue('UnknownField', context)).toBe(0);

    const emptyCtx: FormulaContext = { columns: [], allColumns: [], rowData: {} };
    expect(getFieldValueByType('Nope', emptyCtx)).toBeInstanceOf(Date);
  });
});

describe('formulaHelper additional runtime date units', () => {
  it('covers year/hour/second DATEADD and DATEDIFF units', () => {
    const addYear = evaluateFormula('DATEADD("2024-01-01", 1, "year")', context, validateFormula);
    expect(addYear.error).toBeNull();
    expect(addYear.result.getFullYear()).toBe(2025);

    const addHour = evaluateFormula('DATEADD({Due}, 3, "hour")', context, validateFormula);
    expect(addHour.error).toBeNull();
    expect(addHour.result).toBeInstanceOf(Date);

    const addSec = evaluateFormula('DATEADD({Due}, 12, "second")', context, validateFormula);
    expect(addSec.error).toBeNull();
    expect(addSec.result).toBeInstanceOf(Date);

    const addMin = evaluateFormula('DATEADD({Due}, 5, "minute")', context, validateFormula);
    expect(addMin.error).toBeNull();
    expect(addMin.result).toBeInstanceOf(Date);

    expect(
      evaluateFormula('DATEDIFF("2020-01-01", "2022-01-01", "year")', context, validateFormula).result
    ).toBe(2);
    expect(
      evaluateFormula('DATEDIFF("2024-01-01", "2024-01-02", "hour")', context, validateFormula).result
    ).toBe(24);
    expect(
      evaluateFormula('DATEDIFF("2024-01-01", "2024-01-02", "second")', context, validateFormula).result
    ).toBe(86400);
    expect(
      evaluateFormula('DATEDIFF("2024-01-01", "2024-01-02", "minute")', context, validateFormula).result
    ).toBe(1440);
    expect(
      evaluateFormula('DATEDIFF("2024-01-01", "2024-01-22", "week")', context, validateFormula).result
    ).toBe(3);
    expect(
      evaluateFormula('DATEDIFF("2024-01-01", "2024-03-01", "month")', context, validateFormula).result
    ).toBeGreaterThan(0);
  });
});

describe('formulaHelper additional detectCurrentFunction and compat types', () => {
  it('detects comparison and arithmetic operators', () => {
    expect(detectCurrentFunction('{Price} != 1')?.name).toBe('!=');
    expect(detectCurrentFunction('{Price} >= 1')?.name).toBe('>=');
    expect(detectCurrentFunction('{Price} <= 1')?.name).toBe('<=');
    expect(detectCurrentFunction('{Price} > 1')?.name).toBe('>');
    expect(detectCurrentFunction('{Price} < 1')?.name).toBe('<');
    expect(detectCurrentFunction('{Price} + 1')).toBeNull();
    expect(detectCurrentFunction('{Price} * 2')).toBeNull();
    expect(detectCurrentFunction('{Price} / 2')).toBeNull();
    expect(detectCurrentFunction('{Price} = 1')).toBeNull();
    expect(detectCurrentFunction('{Price} - 1')).toBeNull();
    expect(detectCurrentFunction('1 ^ 2')).toBeNull();
    expect(detectCurrentFunction('10 % 3')).toBeNull();
  });

  it('returns compatible field types for text and date functions', () => {
    expect(getCompatibleFieldTypes('UPPER')).toEqual(expect.arrayContaining(['text']));
    expect(getCompatibleFieldTypes('YEAR')).toEqual(expect.arrayContaining(['date']));
    expect(getCompatibleFieldTypes('CONCAT')).toEqual(expect.arrayContaining(['text', 'number']));
  });
});

describe('formulaHelper additional compound statements and formatting', () => {
  it('rejects compound expressions without operators', () => {
    expect(validateFormula('ADD(1,2) SUM(3,4)', context)).toMatch(/compound/i);
    expect(validateFormula('{Price}{Name}', context)).toMatch(/compound/i);
    expect(validateFormula('{Price}ADD(1,2)', context)).toMatch(/compound/i);
    expect(validateFormula('ADD(1,2)){Price}', context)).toMatch(/compound|mismatch|invalid/i);
    expect(validateFormula('ADD(1,2)) SUM(1)', context)).toMatch(/compound|mismatch|invalid/i);
    expect(validateFormula('ADD(1,2)) + {Price}', context)).toMatch(/mismatch|invalid|operator/i);
  });

  it('formats null and currency fallbacks', () => {
    expect(formatResult(null, 'number', 2, {}, '')).toBe('');
    expect(formatResult(undefined, 'number', 2, {}, '')).toBe('');
    expect(formatResult(false, 'text', 2, {}, '')).toBe('FALSE');
    expect(formatResult(10, 'currency', 0, { formatting: { currency: 'XYZ' } }, '')).toBe('XYZ10');
  });
});
