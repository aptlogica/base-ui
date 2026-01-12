import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneNumber } from '../PhoneNumber';

describe('PhoneNumber Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render phone input component', () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<PhoneNumber label="Contact" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Contact')).toBeInTheDocument();
    });

    it('should display phone value', () => {
      render(<PhoneNumber value="+1234567890" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should accept phone numbers with digits', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '+1-234-567-8900');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept phone without formatting', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '1234567890');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should accept international format', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '+44 20 7946 0958');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('should validate required field', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should accept valid phone numbers', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '555-1234');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled', () => {
      render(
        <PhoneNumber value="+1234567890" onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should prevent editing when readOnly', async () => {
      const { container } = render(
        <PhoneNumber
          value="+1234567890"
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

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle extensions', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '1-555-123-4567 x123');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should handle parentheses format', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '(555) 123-4567');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });
});
