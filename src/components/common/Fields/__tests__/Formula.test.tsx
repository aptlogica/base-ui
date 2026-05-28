import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (element: React.ReactNode) => element,
  };
});

describe('Formula', () => {
  beforeEach(() => {
    vi.useRealTimers();
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

  it('closes all-functions modal when clicking outside', async () => {
    render(<Formula columns={[]} allColumns={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /view all functions/i }));

    expect(screen.getByText('Functions & Operators')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Functions & Operators')).not.toBeInTheDocument();
    });
  });

  it('clears function search in modal', () => {
    render(<Formula columns={[]} allColumns={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /view all functions/i }));

    const searchInput = screen.getByPlaceholderText(/search functions/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'sum' } });
    expect(searchInput.value).toBe('sum');

    const clearButton = searchInput.parentElement?.querySelector('button');
    fireEvent.click(clearButton as HTMLElement);
    expect(searchInput.value).toBe('');
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

  it('re-evaluates when rowData changes and formula uses TODAY()', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    formulaDependsOnRowDataMock.mockReturnValue(false);
    formulaUsesTodayMock.mockReturnValue(true);
    convertResultToValueMock.mockReturnValue(456);

    try {
      const { rerender } = render(
        <Formula
          value={null}
          onChange={onChange}
          config={{ formula: 'TODAY()' }}
          columns={[]}
          allColumns={[]}
          rowData={{ a: 1 }}
        />
      );

      rerender(
        <Formula
          value={null}
          onChange={onChange}
          config={{ formula: 'TODAY()' }}
          columns={[]}
          allColumns={[]}
          rowData={{ a: 2 }}
        />
      );

      vi.advanceTimersByTime(400);

      expect(evaluateFormulaMock).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(456);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears value when formula evaluation returns error', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    evaluateFormulaMock.mockReturnValue({ result: null, error: 'bad' });

    try {
      render(
        <Formula
          value={10}
          onChange={onChange}
          config={{ formula: '' }}
          columns={[]}
          allColumns={[]}
        />
      );

      const textarea = screen.getByPlaceholderText(/enter formula/i);
      fireEvent.change(textarea, { target: { value: 'BAD(' } });

      vi.runOnlyPendingTimers();
      expect(onChange).toHaveBeenCalledWith(null);
    } finally {
      vi.useRealTimers();
    }
  });

  it('surfaces runtime evaluation errors such as division by zero', async () => {
    const onErrorChange = vi.fn();
    evaluateFormulaMock.mockReturnValue({ result: null, error: 'Division by zero is not allowed.' });

    render(
      <Formula
        value={10}
        onChange={vi.fn()}
        onErrorChange={onErrorChange}
        config={{ formula: '{Amount} / 0' }}
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[]}
      />
    );

    const textarea = screen.getByPlaceholderText(/enter formula/i);
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(onErrorChange).toHaveBeenCalledWith('Division by zero is not allowed.');
      expect(screen.getByText('Division by zero is not allowed.')).toBeInTheDocument();
    });
  });

  it('does not repeatedly notify the parent for the same error across rerenders', async () => {
    validateFormulaMock.mockReturnValue('Invalid formula');

    const firstOnErrorChange = vi.fn();
    const secondOnErrorChange = vi.fn();

    const { rerender } = render(
      <Formula
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[]}
        config={{ formula: 'BAD(' }}
        onErrorChange={firstOnErrorChange}
      />
    );

    await waitFor(() => {
      expect(firstOnErrorChange).toHaveBeenCalledWith('Invalid formula');
    });

    rerender(
      <Formula
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[]}
        config={{ formula: 'BAD(' }}
        onErrorChange={secondOnErrorChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Invalid formula')).toBeInTheDocument();
    });

    expect(firstOnErrorChange).toHaveBeenCalledTimes(1);
    expect(secondOnErrorChange).not.toHaveBeenCalled();
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

  it('opens field dropdown when typing "{" and inserts a column', async () => {
    getCompatibleFieldTypesMock.mockReturnValue(null);
    render(
      <Formula
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
      />
    );

    const textarea = screen.getByPlaceholderText(/enter formula/i);
    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: '{' } });

    await waitFor(() => {
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Amount'));

    expect((textarea as HTMLTextAreaElement).value).toContain('Amount');
  });

  it('does not notify when normalized value is unchanged', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onFormulaChange = vi.fn();
    evaluateFormulaMock.mockReturnValue({ result: 10, error: null });
    convertResultToValueMock.mockReturnValue(10);
    normalizeForComparisonMock.mockImplementation((value: any) => value);

    try {
      render(
        <Formula
          value={10}
          onChange={onChange}
          onFormulaChange={onFormulaChange}
          config={{ formula: '' }}
          columns={[]}
          allColumns={[]}
        />
      );

      const textarea = screen.getByPlaceholderText(/enter formula/i);
      fireEvent.change(textarea, { target: { value: 'SUM(1,2)' } });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onFormulaChange).toHaveBeenCalledWith('SUM(1,2)');
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides field dropdown when typing "}"', async () => {
    getCompatibleFieldTypesMock.mockReturnValue(null);
    render(
      <Formula
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
      />
    );

    const textarea = screen.getByPlaceholderText(/enter formula/i);
    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: '{' } });

    await waitFor(() => {
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    fireEvent.change(textarea, { target: { value: '{}' } });
    await waitFor(() => {
      expect(screen.queryByText('Amount')).not.toBeInTheDocument();
    });
  });

  it('closes field dropdown on Escape', async () => {
    getCompatibleFieldTypesMock.mockReturnValue(null);
    render(
      <Formula
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
      />
    );

    const textarea = screen.getByPlaceholderText(/enter formula/i);
    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: '{' } });

    await waitFor(() => {
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    fireEvent.keyDown(textarea, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Amount')).not.toBeInTheDocument();
    });
  });

  it('shows quick function tooltip on hover', () => {
    render(<Formula columns={[]} allColumns={[]} />);
    const sumButton = screen.getByRole('button', { name: 'SUM' });
    fireEvent.mouseEnter(sumButton);
    expect(screen.getByText(/sum values/i)).toBeInTheDocument();
    fireEvent.mouseLeave(sumButton);
  });

  it('filters columns by compatible types when function at cursor', async () => {
    getFunctionAtCursorMock.mockReturnValue('SUM');
    getCompatibleFieldTypesMock.mockReturnValue(['number']);

    render(
      <Formula
        columns={[
          { id: 'c1', title: 'Amount', type: 'number' },
          { id: 'c2', title: 'Name', type: 'text' }
        ]}
        allColumns={[
          { id: 'c1', title: 'Amount', type: 'number' },
          { id: 'c2', title: 'Name', type: 'text' }
        ]}
      />
    );

    const textarea = screen.getByPlaceholderText(/enter formula/i);
    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: '{' } });

    await waitFor(() => {
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
  });

  it('renders formatted result when disabled', () => {
    formatResultMock.mockReturnValue('Formatted');
    render(
      <Formula
        disabled
        config={{ formula: 'SUM({Amount})' }}
        columns={[{ id: 'c1', title: 'Amount', type: 'number' }]}
        allColumns={[]}
      />
    );

    expect(screen.getByText('Formatted')).toBeInTheDocument();
  });

  it('renders nothing in disabled mode when evaluation fails', () => {
    evaluateFormulaMock.mockReturnValue({ result: null, error: 'bad' });
    render(
      <Formula
        disabled
        config={{ formula: 'BAD(' }}
        columns={[]}
        allColumns={[]}
      />
    );

    expect(screen.getByText('#VALUE ERROR')).toBeInTheDocument();
  });
});
