import { describe, expect, it } from 'vitest';
import { validateFormula, type FormulaContext } from '../formulaHelper';

const context: FormulaContext = {
  columns: [
    { id: 'c1', title: 'Price', column_name: 'price', uidt: 'number', key: 'price' },
    { id: 'c2', title: 'Name', column_name: 'name', uidt: 'text', key: 'name' },
    { id: 'c3', title: 'Date', column_name: 'date', uidt: 'date', key: 'date' },
    { id: 'c4', title: 'Flag', column_name: 'flag', uidt: 'boolean', key: 'flag' },
  ],
  allColumns: [],
  rowData: {},
};

describe('formulaHelper validateFormula branch paths', () => {
  it('validates math-function numeric constraints', () => {
    expect(validateFormula('ADD({Name}, 2)', context))
      .toBe('ADD() requires numeric fields. "Name" is a text field');

    expect(validateFormula('MOD(10, text)', context))
      .toBe('MOD() requires numeric values. "text" is not numeric');
  });

  it('validates text-function arity and argument typing', () => {
    expect(validateFormula('LEN({Name}, 1)', context))
      .toBe('LEN() accepts only 1 argument, but 2 provided');

    expect(validateFormula('LEFT({Name}, "x")', context))
      .toBe('LEFT() second argument must be a number');

    expect(validateFormula('MID({Name}, {Name}, 2)', context))
      .toBe('MID() second argument (start) must be numeric');
  });

  it('validates date-function argument constraints and units', () => {
    expect(validateFormula('DATEADD({Date}, 2, "centuries")', context))
      .toBe('DATEADD() third argument must be a valid time unit: "year", "month", "day", "week", "hour", "minute", or "second"');

    expect(validateFormula('DATEDIFF({Date}, {Name}, "day")', context))
      .toBe('DATEDIFF() second argument requires a date field. "Name" is a text field');

    expect(validateFormula('DATE(2024, 13, 1)', context))
      .toBe('DATE() second argument (month) must be between 1 and 12');
  });

  it('validates comparison and logical function argument rules', () => {
    expect(validateFormula('abc = 1', context))
      .toBe('Invalid left side in comparison: "abc"');

    expect(validateFormula('IF(abc, "Y", "N")', context))
      .toBe('IF() first argument must be a condition (comparison, field reference, or boolean)');

    expect(validateFormula('ISNUMBER(abc)', context))
      .toBe('ISNUMBER() argument must be a field reference, quoted string, number, or function call');
  });

  it('validates compound function-statement restrictions', () => {
    expect(validateFormula('ADD(1,2) + SUM(3,4)', context))
      .toBe('Only one function call is allowed at a time. Compound expressions are not supported.');
  });
});

