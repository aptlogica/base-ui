import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Formula } from '../Formula';

vi.mock('../../../../utils/formulaConstants', () => ({
  FORMULA_FUNCTIONS: {
    Math: [
      { name: 'SUM()', description: 'Sum values', example: 'SUM(1,2)' },
    ],
  },
  FREQUENTLY_USED_FUNCTION_NAMES: ['SUM'],
}));

vi.mock('../../../../utils/formulaHelper', () => ({
  evaluateFormula: () => ({ result: 10, error: null }),
  formatResult: (value: any) => value,
  formulaDependsOnRowData: () => false,
  formulaUsesToday: () => false,
  getFunctionSyntax: (name: string) => name,
  validateFormula: () => null,
  getFunctionAtCursor: () => null,
  getCompatibleFieldTypes: () => [],
  normalizeForComparison: (value: any) => value,
  convertResultToValue: (value: any) => value,
}));

describe('Formula', () => {
  it('renders quick functions and inserts a function', () => {
    const onFormulaChange = vi.fn();
    render(
      <Formula
        onFormulaChange={onFormulaChange}
        columns={[]}
        allColumns={[]}
      />
    );

    expect(screen.getByText('Quick Functions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'SUM' }));
    const textarea = screen.getByPlaceholderText(/enter formula/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('SUM');
  });

  it('opens the all functions modal', () => {
    vi.useFakeTimers();
    const rafSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
    render(
      <Formula
        columns={[]}
        allColumns={[]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /view all functions/i }));
    vi.runAllTimers();
    expect(screen.getByText('Functions & Operators')).toBeInTheDocument();
    rafSpy.mockRestore();
    vi.useRealTimers();
  });
});
