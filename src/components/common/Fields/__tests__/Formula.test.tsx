import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Formula } from '../Formula';

const evaluateFormulaMock = vi.fn();
const formatResultMock = vi.fn();
const formulaDependsOnRowDataMock = vi.fn();
const formulaUsesTodayMock = vi.fn();
const getFunctionSyntaxMock = vi.fn();
const validateFormulaMock = vi.fn();
const getFunctionAtCursorMock = vi.fn();
const getCompatibleFieldTypesMock = vi.fn();
const normalizeForComparisonMock = vi.fn();
const convertResultToValueMock = vi.fn();

vi.mock('../../../../utils/formulaConstants', () => ({
  FORMULA_FUNCTIONS: {
    Math: [
      { name: 'SUM()', description: 'Sum values', example: 'SUM(1,2)' },
      { name: 'AVG()', description: 'Average values', example: 'AVG(1,2)' },
    ],
    Text: [
      { name: 'CONCAT()', description: 'Concatenate strings', example: 'CONCAT("A","B")' },
    ],
  },
  FREQUENTLY_USED_FUNCTION_NAMES: ['SUM', 'AVG'],
}));

vi.mock('../../../../utils/formulaHelper', () => ({
  evaluateFormula: (...args: any[]) => evaluateFormulaMock(...args),
  formatResult: (...args: any[]) => formatResultMock(...args),
  formulaDependsOnRowData: (...args: any[]) => formulaDependsOnRowDataMock(...args),
  formulaUsesToday: (...args: any[]) => formulaUsesTodayMock(...args),
  getFunctionSyntax: (...args: any[]) => getFunctionSyntaxMock(...args),
  validateFormula: (...args: any[]) => validateFormulaMock(...args),
  getFunctionAtCursor: (...args: any[]) => getFunctionAtCursorMock(...args),
  getCompatibleFieldTypes: (...args: any[]) => getCompatibleFieldTypesMock(...args),
  normalizeForComparison: (...args: any[]) => normalizeForComparisonMock(...args),
  convertResultToValue: (...args: any[]) => convertResultToValueMock(...args),
}));

describe('Formula', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    evaluateFormulaMock.mockReturnValue({ result: 10, error: null });
    formatResultMock.mockImplementation((value: any) => value);
    formulaDependsOnRowDataMock.mockReturnValue(false);
    formulaUsesTodayMock.mockReturnValue(false);
    getFunctionSyntaxMock.mockImplementation((name: string) => name);
    validateFormulaMock.mockReturnValue(null);
    getFunctionAtCursorMock.mockReturnValue(null);
    getCompatibleFieldTypesMock.mockReturnValue([]);
    normalizeForComparisonMock.mockImplementation((value: any) => value);
    convertResultToValueMock.mockImplementation((value: any) => value);
  });

  it('renders quick functions and inserts one into textarea', () => {
    render(<Formula onFormulaChange={vi.fn()} columns={[]} allColumns={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'SUM' }));
    expect((screen.getByPlaceholderText(/enter formula/i) as HTMLTextAreaElement).value).toContain('SUM');
  });

  it('opens all-functions modal and searches', async () => {
    render(<Formula columns={[]} allColumns={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /view all functions/i }));

    expect(screen.getByText('Functions & Operators')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/search functions/i), {
      target: { value: 'xyz-not-found' },
    });
    expect(screen.getByText(/no functions found matching/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByText('Functions & Operators')).not.toBeInTheDocument();
    });
  });

  it('shows validation error on blur and notifies parent', async () => {
    const onErrorChange = vi.fn();
    validateFormulaMock.mockReturnValue('Invalid formula');

    render(
      <Formula
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[]}
        onErrorChange={onErrorChange}
      />
    );

    const textarea = screen.getByPlaceholderText(/enter formula/i);
    fireEvent.change(textarea, { target: { value: 'BAD(' } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(validateFormulaMock).toHaveBeenCalled();
      expect(onErrorChange).toHaveBeenCalledWith('Invalid formula');
    });
  });

  it('evaluates and notifies on change when row-data dependent formula changes', async () => {
    const onChange = vi.fn();
    formulaDependsOnRowDataMock.mockReturnValue(true);
    convertResultToValueMock.mockReturnValue(123);

    render(
      <Formula
        value={null}
        onChange={onChange}
        config={{ formula: 'SUM({Amount})' }}
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[]}
        rowData={{ Amount: 100 }}
      />
    );

    await waitFor(() => {
      expect(evaluateFormulaMock).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(123);
    });
  });

  it('clears formula when clear button is clicked', () => {
    const onFormulaChange = vi.fn();
    render(
      <Formula
        onFormulaChange={onFormulaChange}
        config={{ formula: 'SUM({Amount})' }}
        columns={[]}
        allColumns={[]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /clear formula/i }));
    expect((screen.getByPlaceholderText(/enter formula/i) as HTMLTextAreaElement).value).toBe('');
    expect(onFormulaChange).toHaveBeenCalledWith('');
  });
});
