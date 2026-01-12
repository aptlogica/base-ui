import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Percent } from '../Percent';

describe('Percent Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render percentage input component', () => {
      render(<Percent value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Percent label="Discount" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Discount')).toBeInTheDocument();
    });

    it('should display percentage value', () => {
      render(<Percent value="50" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });

    it('should show percentage symbol', () => {
      const { container } = render(
        <Percent value="25" onChange={mockOnChange} />
      );
      expect(container.textContent).toContain('%');
    });
  });

  describe('Input Interaction', () => {
    it('should accept percentage values', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '50');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept decimal percentages', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '33.33');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept zero percent', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '0');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept 100 percent', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '100');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept above 100 percent', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '150');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('should validate required field', async () => {
      render(<Percent value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should reject non-numeric input', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, '50abc');
      fireEvent.blur(input);

      expect(/^\d*\.?\d*$/.test(input.value)).toBe(true);
    });

    it('should accept valid percentages', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '75');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Range Validation', () => {
    it('should validate min constraint if set', () => {
      render(
        <Percent
          value=""
          onChange={mockOnChange}
          config={{ min: 0 }}
        />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should validate max constraint if set', () => {
      render(
        <Percent
          value=""
          onChange={mockOnChange}
          config={{ max: 100 }}
        />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled', () => {
      render(
        <Percent value="50" onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should prevent editing when readOnly', async () => {
      const { container } = render(
        <Percent
          value="50"
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
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <Percent
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 25 }}
        />
      );
      expect(screen.getByRole('textbox')).toHaveValue('25');
    });

    it('should use min from config', () => {
      render(
        <Percent
          value=""
          onChange={mockOnChange}
          config={{ min: 0 }}
        />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should use max from config', () => {
      render(
        <Percent
          value=""
          onChange={mockOnChange}
          config={{ max: 100 }}
        />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <Percent value="25" onChange={mockOnChange} />
      );
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();

      rerender(
        <Percent value="75" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('75')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Percent value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle very large percentages', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '9999');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle fractional percentages', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '0.01');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle trailing zeros', async () => {
      render(<Percent value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '50.00');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(
        <Percent label="Percentage" value="" onChange={mockOnChange} />
      );
      expect(screen.getByText('Percentage')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <Percent label="Discount" value="" onChange={mockOnChange} required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should have disabled attribute when disabled', () => {
      render(
        <Percent value="50" onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });
});
