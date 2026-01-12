import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Decimal } from '../Decimal';

describe('Decimal Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render decimal input component', () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Decimal label="Rate" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Rate')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(<Decimal label="Percentage" value="" onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display decimal value', () => {
      render(<Decimal value="3.14" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('3.14')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should accept decimal input', async () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '10.5');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept negative decimals', async () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '-5.75');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept multiple decimal places', async () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '3.141592');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should reject non-numeric characters', async () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, '3.14abc');
      fireEvent.blur(input);

      expect(/^-?\d*\.?\d*$/.test(input.value)).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate required field', async () => {
      render(<Decimal value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should accept zero', async () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '0.0');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept empty non-required field', async () => {
      render(<Decimal value="" onChange={mockOnChange} required={false} />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled', () => {
      render(<Decimal value="5.5" onChange={mockOnChange} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should prevent editing when readOnly', async () => {
      const { container } = render(
        <Decimal value="5.5" onChange={mockOnChange} readOnly allowEdit={true} />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle very small decimals', async () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '0.000001');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle trailing zeros', async () => {
      render(<Decimal value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '5.00');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });
});
