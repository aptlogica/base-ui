import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Number } from '../Number';

describe('Number Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Number value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Number label="Age" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Age')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(<Number label="Count" value="" onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(<Number value="42" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    });

    it('should render placeholder when provided', () => {
      render(
        <Number
          value=""
          onChange={mockOnChange}
          placeholder="Enter a number"
        />
      );
      expect(screen.getByPlaceholderText('Enter a number')).toBeInTheDocument();
    });

    it('should render helper text when provided', () => {
      render(
        <Number
          value=""
          onChange={mockOnChange}
          helperText="Enter a positive number"
        />
      );
      expect(screen.getByText('Enter a positive number')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should update local value on input change', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '123');
      expect(input).toHaveValue('123');
    });

    it('should call onChange on blur with valid number', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '42');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('42');
      });
    });

    it('should handle Enter key to blur', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '100');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('100');
      });
    });

    it('should handle Escape key to revert changes', async () => {
      render(<Number value="50" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.clear(input);
      await userEvent.type(input, '100');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(input).toHaveValue('50');
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Number Validation', () => {
    it('should accept positive integer', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '42');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('42');
      });
    });

    it('should accept negative number', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '-42');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('-42');
      });
    });

    it('should accept decimal number', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '42.5');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('42.5');
      });
    });

    it('should reject non-numeric characters', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, '42abc');
      fireEvent.blur(input);

      // Number input doesn't allow non-numeric
      expect(input.value).toBe('42');
    });

    it('should reject letters', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'abc');
      fireEvent.blur(input);

      // Input should be empty or contain only valid characters
      expect(/^-?\d*\.?\d*$/.test(input.value)).toBe(true);
    });

    it('should enforce maximum digit limit (10 digits)', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      // Try to type 11 digits
      await userEvent.type(input, '12345678901');
      fireEvent.blur(input);

      // Should still allow 10 digits or less
      const cleanValue = input.value.replace(/[.-]/g, '');
      expect(cleanValue.length).toBeLessThanOrEqual(10);
    });

    it('should handle very large numbers', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '9999999999');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('9999999999');
      });
    });

    it('should handle decimal with many places', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '3.14159265');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Required Field Validation', () => {
    it('should reject empty required field', async () => {
      render(<Number value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should accept empty non-required field', async () => {
      render(<Number value="" onChange={mockOnChange} required={false} />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept valid number in required field', async () => {
      render(<Number value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '42');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('42');
      });
    });
  });

  describe('Edit Mode Behavior', () => {
    it('should enter edit mode on single click when allowEdit is true', async () => {
      const { container } = render(
        <Number value="50" onChange={mockOnChange} allowEdit={true} />
      );
      const editable = container.querySelector('.field-component');

      expect(screen.queryByDisplayValue('50')).not.toBeInTheDocument();

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });

    it('should require double click when allowEdit is false', async () => {
      const { container } = render(
        <Number value="50" onChange={mockOnChange} allowEdit={false} />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.queryByDisplayValue('50')).not.toBeInTheDocument();

      fireEvent.click(editable!);
      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled prop is true', () => {
      render(
        <Number value="42" onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should prevent editing when readOnly is true', async () => {
      const { container } = render(
        <Number value="42" onChange={mockOnChange} readOnly allowEdit={true} />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should exit edit mode if readOnly becomes true', async () => {
      const { rerender } = render(
        <Number value="42" onChange={mockOnChange} readOnly={false} />
      );

      rerender(
        <Number value="42" onChange={mockOnChange} readOnly={true} />
      );

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <Number
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 100 }}
        />
      );
      expect(screen.getByRole('textbox')).toHaveValue('100');
    });

    it('should use string defaultValue from config', () => {
      render(
        <Number
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: '50' }}
        />
      );
      expect(screen.getByRole('textbox')).toHaveValue('50');
    });

    it('should use showThousands from config', () => {
      const { container } = render(
        <Number
          value="1000"
          onChange={mockOnChange}
          config={{ showThousands: true }}
        />
      );
      expect(container.querySelector('.field-component')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes externally', () => {
      const { rerender } = render(
        <Number value="42" onChange={mockOnChange} />
      );
      expect(screen.getByDisplayValue('42')).toBeInTheDocument();

      rerender(
        <Number value="100" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });

    it('should sync defaultValue on mount', () => {
      const { rerender } = render(
        <Number
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 99 }}
        />
      );

      expect(screen.getByRole('textbox')).toHaveValue('99');

      rerender(
        <Number
          value="42"
          onChange={mockOnChange}
          config={{ defaultValue: 99 }}
        />
      );

      expect(screen.getByDisplayValue('42')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      render(<Number value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle null value', () => {
      render(<Number value={null as any} onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle undefined value', () => {
      render(<Number value={undefined as any} onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle zero', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '0');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('0');
      });
    });

    it('should handle negative zero', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '-0');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle multiple decimal points', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      // Most implementations will reject multiple decimals
      await userEvent.type(input, '1.2.3');
      fireEvent.blur(input);

      // Should only contain valid format
      expect(/^-?\d*\.?\d*$/.test(input.value)).toBe(true);
    });

    it('should handle only decimal point', async () => {
      render(<Number value="" onChange={mockOnChange} required={false} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, '.');
      fireEvent.blur(input);

      // Should be empty or valid format
      expect(/^-?\d*\.?\d*$/.test(input.value)).toBe(true);
    });

    it('should handle trailing zeros', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '100.00');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle leading zeros', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '00042');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should not save invalid number', async () => {
      render(<Number value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      // Type invalid characters (HTML5 will prevent this)
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalledWith('abc');
    });
  });

  describe('Accessibility', () => {
    it('should render with accessible label', () => {
      render(
        <Number label="Amount" value="" onChange={mockOnChange} />
      );
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <Number label="Count" value="" onChange={mockOnChange} required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should have disabled attribute when disabled', () => {
      render(
        <Number value="42" onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
});
