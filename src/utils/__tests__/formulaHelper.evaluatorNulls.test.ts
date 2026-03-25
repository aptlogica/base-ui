import { describe, it, expect } from 'vitest';
import {
  evaluateADD,
  evaluateSUBTRACT,
  evaluateMULTIPLY,
  evaluateDIVIDE,
  evaluateAVERAGE,
  evaluateMAX,
  evaluateMIN,
  evaluateROUND,
  evaluateCEILING,
  evaluateFLOOR,
  evaluatePOWER,
  evaluateSQRT,
  evaluateLEN,
  evaluateFIND,
  type FormulaContext,
} from '../formulaHelper';

const context: FormulaContext = {
  columns: [
    { title: 'Price', key: 'price', type: 'number' },
  ],
  allColumns: [],
  rowData: { price: 10 },
};

describe('formulaHelper evaluator null paths', () => {
  it('returns null for missing or insufficient args', () => {
    expect(evaluateADD('ADD()', context)).toBeNull();
    expect(evaluateSUBTRACT('SUBTRACT(1)', context)).toBeNull();
    expect(evaluateMULTIPLY('MULTIPLY(1)', context)).toBeNull();
    expect(evaluateAVERAGE('AVERAGE()', context)).toBeNull();
    expect(evaluateMIN('MIN()', context)).toBeNull();
    expect(evaluateMAX('MAX()', context)).toBeNull();
  });

  it('returns null for invalid numeric inputs', () => {
    expect(evaluateDIVIDE('DIVIDE(10, 0)', context)).toBeNull();
    expect(evaluateAVERAGE('AVERAGE(foo, bar)', context)).toBeNull();
    expect(evaluateROUND('ROUND("x")', context)).toBeNull();
    expect(evaluateCEILING('CEILING("x")', context)).toBeNull();
    expect(evaluateFLOOR('FLOOR("x")', context)).toBeNull();
    expect(evaluatePOWER('POWER("x", 2)', context)).toBeNull();
    expect(evaluateSQRT('SQRT("x")', context)).toBeNull();
  });

  it('returns null for text functions with insufficient args', () => {
    expect(evaluateLEN('LEN()', context)).toBeNull();
    expect(evaluateFIND('FIND("a")', context)).toBeNull();
  });
});
