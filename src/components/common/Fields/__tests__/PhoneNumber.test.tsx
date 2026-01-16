import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneNumber } from '../PhoneNumber';

const CLICK_DELAY = 200;

describe('PhoneNumber Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render display value when not editing', () => {
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} />);
      expect(screen.getByText(/\(123\) 456-7890/)).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<PhoneNumber label="Contact" value="" onChange={mockOnChange} />);
      expect(screen.getByText(/Contact/i)).toBeInTheDocument();
    });

    it('should render asterisk when required', () => {
      render(<PhoneNumber label="Contact" value="" onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render placeholder when no value', () => {
      render(<PhoneNumber value="" onChange={mockOnChange} placeholder="Test Placeholder" config={{ formatDisplay: false }} />);
      expect(screen.getByText('Test Placeholder')).toBeInTheDocument();
    });

    it('should render config placeholder when provided', () => {
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ placeholder: 'Config Placeholder', formatDisplay: false }} />);
      expect(screen.getByText('Config Placeholder')).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should enter edit mode on single click by default', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} allowEdit={true} />);
      const display = screen.getByText('(123) 456-7890');

      await act(async () => {
        await user.click(display);
        vi.advanceTimersByTime(CLICK_DELAY);
      });

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('1234567890');
      });
    });

    it('should enter edit mode on double click when allowEdit is false', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} allowEdit={false} />);
      const display = screen.getByText('(123) 456-7890');

      await act(async () => {
        await user.dblClick(display);
        vi.advanceTimersByTime(CLICK_DELAY);
      });

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('should not enter edit mode when readOnly', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} readOnly />);
      const display = screen.getByText('(123) 456-7890');

      await act(async () => {
        await user.click(display);
        vi.advanceTimersByTime(CLICK_DELAY);
      });
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      await act(async () => {
        await user.dblClick(display);
        vi.advanceTimersByTime(CLICK_DELAY);
      });
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not enter edit mode when disabled', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} disabled />);
      const display = screen.getByText('(123) 456-7890');

      await act(async () => {
        await user.click(display);
        vi.advanceTimersByTime(CLICK_DELAY);
      });
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should sanitize input when phoneValid is true', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ phoneValid: true, formatDisplay: false }} />);
      const display = screen.getByText('Enter phone number...');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.type(input, '1-23a!4');
        expect(input).toHaveValue('1234');
      });
    });

    it('should NOT sanitize input when phoneValid is false', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ phoneValid: false, formatDisplay: false }} />);
      const display = screen.getByText('Enter phone number...');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.type(input, 'abc-123');
        expect(input).toHaveValue('abc-123');
      });
    });

    it('should call onChange on blur if value changed and is valid', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1231231234" onChange={mockOnChange} />);
      const display = screen.getByText('(123) 123-1234');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.type(input, '9876543210');
        await user.tab();

        expect(mockOnChange).toHaveBeenCalledWith('9876543210');
        expect(screen.getByText('(987) 654-3210')).toBeInTheDocument();
      });
    });

    it('should revert to previous value on blur if invalid', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1231231234" onChange={mockOnChange} required />);
      const display = screen.getByText('(123) 123-1234');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.tab();

        expect(mockOnChange).not.toHaveBeenCalled();
        expect(screen.getByText('(123) 123-1234')).toBeInTheDocument();
      });
    });

    it('should handle Enter key to commit', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1231231234" onChange={mockOnChange} />);
      const display = screen.getByText('(123) 123-1234');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.type(input, '9876543210{Enter}');

        expect(mockOnChange).toHaveBeenCalledWith('9876543210');
      });
    });

    it('should handle Escape key to cancel', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1231231234" onChange={mockOnChange} />);
      const display = screen.getByText('(123) 123-1234');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.type(input, '000');
        await user.type(input, '{Escape}');

        expect(mockOnChange).not.toHaveBeenCalled();
        expect(screen.getByText('(123) 123-1234')).toBeInTheDocument();
      });
    });

    it('should not call onChange if value unchanged on blur', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="1231231234" onChange={mockOnChange} />);
      const display = screen.getByText('(123) 123-1234');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.tab();

        expect(mockOnChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases & Configuration', () => {
    it('should handle paste events with sanitation', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ phoneValid: true, formatDisplay: false }} />);
      const display = screen.getByText('Enter phone number...');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.click(input);
        await user.paste('123-abc-456');
        expect(input).toHaveValue('123456');
      });
    });

    it('should not sanitize paste when phoneValid is false', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ phoneValid: false, formatDisplay: false }} />);
      const display = screen.getByText('Enter phone number...');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.click(input);
        await user.paste('123-abc-456');
        expect(input).toHaveValue('123-abc-456');
      });
    });

    it('should sync with prop value changes', () => {
      const { rerender } = render(<PhoneNumber value="111" onChange={mockOnChange} />);
      expect(screen.getByText('111')).toBeInTheDocument();

      rerender(<PhoneNumber value="222" onChange={mockOnChange} />);
      expect(screen.getByText('222')).toBeInTheDocument();
    });

    it('should not sync if value unchanged', () => {
      const { rerender } = render(<PhoneNumber value="111" onChange={mockOnChange} />);
      expect(screen.getByText('111')).toBeInTheDocument();

      rerender(<PhoneNumber value="111" onChange={mockOnChange} />);
      expect(screen.getByText('111')).toBeInTheDocument();
    });

    it('should exit editing if readOnly becomes true', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = render(<PhoneNumber value="111" onChange={mockOnChange} />);
      const display = screen.getByText('111');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      rerender(<PhoneNumber value="111" onChange={mockOnChange} readOnly />);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not format if formatDisplay is false', () => {
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} config={{ formatDisplay: false }} />);
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });

    it('should show helper text when provided', () => {
      render(<PhoneNumber value="" onChange={mockOnChange} helperText="Help info" />);
      expect(screen.getByText('Help info')).toBeInTheDocument();
    });

    it('should not show helper text when allowEdit is false', () => {
      render(<PhoneNumber value="" onChange={mockOnChange} helperText="Help info" allowEdit={false} />);
      expect(screen.queryByText('Help info')).not.toBeInTheDocument();
    });

    it('should use defaultValue from config', () => {
      render(<PhoneNumber value={undefined} onChange={mockOnChange} config={{ defaultValue: '5551234567' }} />);
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });

    it('should handle className prop', () => {
      const { container } = render(<PhoneNumber value="123" onChange={mockOnChange} className="custom-class" />);
      const fieldComponent = container.querySelector('.custom-class');
      expect(fieldComponent).toBeInTheDocument();
    });

    it('should handle isBorder prop', () => {
      const { container } = render(<PhoneNumber value="123" onChange={mockOnChange} isBorder />);
      const fieldComponent = container.querySelector('.field-component-border');
      expect(fieldComponent).toBeInTheDocument();
    });

    it('should handle countryCode prop', () => {
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} countryCode="+44" />);
      expect(screen.getByText('(123) 456-7890')).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ formatDisplay: false }} />);
      expect(screen.getByText('Enter phone number...')).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(<PhoneNumber value={undefined} onChange={mockOnChange} config={{ formatDisplay: false }} />);
      expect(screen.getByText('Enter phone number...')).toBeInTheDocument();
    });

    it('should handle phone numbers that do not match format pattern', () => {
      render(<PhoneNumber value="123" onChange={mockOnChange} />);
      expect(screen.getByText('123')).toBeInTheDocument();
    });
  });

  describe('Validation Logic', () => {
    it('should show error for invalid phone number', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ phoneValid: true, formatDisplay: false }} />);
      const display = screen.getByText('Enter phone number...');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.type(input, '0');
        await user.tab();

        expect(screen.getByText('Enter phone number...')).toBeInTheDocument();
      });
    });

    it('should accept valid phone numbers', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ phoneValid: true, formatDisplay: false }} />);
      const display = screen.getByText('Enter phone number...');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.type(input, '1234567890');
        await user.tab();

        expect(mockOnChange).toHaveBeenCalledWith('1234567890');
      });
    });

    it('should accept phone numbers starting with plus', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ phoneValid: true, formatDisplay: false }} />);
      const display = screen.getByText('Enter phone number...');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.type(input, '+1234567890');
        await user.tab();

        expect(mockOnChange).toHaveBeenCalledWith('1234567890');
      });
    });

    it('should validate empty string when not required', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="123" onChange={mockOnChange} required={false} />);
      const display = screen.getByText('123');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.clear(input);
        await user.tab();

        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should handle disabled input', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="123" onChange={mockOnChange} disabled />);
      const display = screen.getByText('123');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should handle input with spaces and dashes in validation', async () => {
      const user = userEvent.setup({ delay: null });
      render(<PhoneNumber value="" onChange={mockOnChange} config={{ phoneValid: true, formatDisplay: false }} />);
      const display = screen.getByText('Enter phone number...');

      await user.click(display);
      vi.advanceTimersByTime(CLICK_DELAY);

      await waitFor(async () => {
        const input = screen.getByRole('textbox');
        await user.type(input, '123 456 7890');
        await user.tab();

        expect(mockOnChange).toHaveBeenCalledWith('1234567890');
      });
    });
  });
});
