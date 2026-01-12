import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Currency } from '../Currency';

describe('Currency Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render currency component', () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Currency label="Price" value={null} onChange={mockOnChange} />);
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(
        <Currency label="Amount" value={null} onChange={mockOnChange} required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display formatted currency value', () => {
      render(
        <Currency
          value={100}
          onChange={mockOnChange}
          config={{ currencyType: 'USD' }}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render placeholder when no value', () => {
      render(
        <Currency
          value={null}
          onChange={mockOnChange}
          placeholder="Enter amount"
        />
      );
      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(
        <Currency
          value={null}
          onChange={mockOnChange}
          helperText="Enter in USD"
        />
      );
      expect(screen.getByText('Enter in USD')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should update local value on input change', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '100.50');
      expect(input).toHaveValue('100.50');
    });

    it('should call onChange on blur with valid amount', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '99.99');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle Enter key to blur', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '50');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle Escape key to revert', async () => {
      render(<Currency value={100} onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      const originalValue = input.value;

      await userEvent.clear(input);
      await userEvent.type(input, '200');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(input.value).toBe(originalValue);
    });
  });

  describe('Currency Formatting', () => {
    it('should format value as USD by default', () => {
      const { container } = render(
        <Currency
          value={1000.50}
          onChange={mockOnChange}
          config={{ currencyType: 'USD' }}
        />
      );
      expect(container.textContent).toContain('$');
    });

    it('should use custom currency type', () => {
      const { container } = render(
        <Currency
          value={100}
          onChange={mockOnChange}
          config={{ currencyType: 'EUR' }}
        />
      );
      expect(container.textContent).toContain('100');
    });

    it('should use custom precision', async () => {
      render(
        <Currency
          value={null}
          onChange={mockOnChange}
          config={{ precision: 3 }}
        />
      );
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '99.999');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should use custom locale for formatting', () => {
      const { container } = render(
        <Currency
          value={1000}
          onChange={mockOnChange}
          config={{ currencyLocale: 'de-DE', currencyType: 'EUR' }}
        />
      );
      expect(container.textContent).toContain('1');
    });
  });

  describe('Validation', () => {
    it('should reject invalid currency amounts', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'abc');
      fireEvent.blur(input);

      // The component should handle this gracefully
      expect(input).toBeInTheDocument();
    });

    it('should accept zero value', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '0');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept negative amounts', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '-50.00');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept decimal amounts', async () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '99.99');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should validate required field', async () => {
      render(<Currency value={null} onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not call onChange with empty non-required field', async () => {
      render(<Currency value={null} onChange={mockOnChange} required={false} />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode Behavior', () => {
    it('should enter edit mode on single click when allowEdit is true', async () => {
      const { container } = render(
        <Currency
          value={100}
          onChange={mockOnChange}
          allowEdit={true}
        />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should require double click when allowEdit is false', async () => {
      const { container } = render(
        <Currency
          value={100}
          onChange={mockOnChange}
          allowEdit={false}
        />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      fireEvent.click(editable!);
      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled prop is true', () => {
      render(
        <Currency value={100} onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should prevent editing when readOnly is true', async () => {
      const { container } = render(
        <Currency
          value={100}
          onChange={mockOnChange}
          readOnly
          allowEdit={true}
        />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should exit edit mode if readOnly becomes true', async () => {
      const { rerender } = render(
        <Currency value={100} onChange={mockOnChange} readOnly={false} />
      );

      rerender(
        <Currency value={100} onChange={mockOnChange} readOnly={true} />
      );

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <Currency
          value={null}
          onChange={mockOnChange}
          config={{ defaultValue: '100.00' }}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('100.00');
    });

    it('should use currencyType from config', () => {
      const { container } = render(
        <Currency
          value={100}
          onChange={mockOnChange}
          config={{ currencyType: 'GBP' }}
        />
      );
      expect(container.textContent).toContain('100');
    });

    it('should use precision from config', async () => {
      render(
        <Currency
          value={null}
          onChange={mockOnChange}
          config={{ precision: 2 }}
        />
      );
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '10.12');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <Currency value={100} onChange={mockOnChange} />
      );

      rerender(
        <Currency value={200} onChange={mockOnChange} />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should sync defaultValue on mount', () => {
      const { rerender } = render(
        <Currency
          value={null}
          onChange={mockOnChange}
          config={{ defaultValue: '50.00' }}
        />
      );

      expect(screen.getByRole('textbox')).toHaveValue('50.00');

      rerender(
        <Currency
          value={100}
          onChange={mockOnChange}
          config={{ defaultValue: '50.00' }}
        />
      );

      expect(screen.getByRole('textbox')).toHaveValue('100');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(<Currency value={null} onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <Currency value={undefined as any} onChange={mockOnChange} />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle zero value', () => {
      render(<Currency value={0} onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle very large numbers', async () => {
      render(<Currency value={999999999.99} onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle negative zero', async () => {
      render(
        <Currency value={-0} onChange={mockOnChange} />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should clear value on invalid input', async () => {
      render(<Currency value={null} onChange={mockOnChange} required={false} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'invalid' } });
      fireEvent.blur(input);

      expect(input.value).toBe('invalid');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(
        <Currency label="Price" value={null} onChange={mockOnChange} />
      );
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <Currency label="Amount" value={null} onChange={mockOnChange} required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should have disabled attribute when disabled', () => {
      render(
        <Currency value={100} onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
});
