import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneNumber } from '../PhoneNumber';

const { clickMode, mockToastError } = vi.hoisted(() => ({
  clickMode: { current: 'single' as 'single' | 'double' },
  mockToastError: vi.fn(),
}));

vi.mock('../../../../utils/helpers', () => ({
  useClickHandler: (single: () => void, double: () => void) => () =>
    clickMode.current === 'double' ? double() : single(),
}));

vi.mock('../../Toast', () => ({
  useOptionalToast: () => ({ error: mockToastError }),
}));

describe('PhoneNumber Component', () => {
  const mockOnChange = vi.fn();
  const placeholder = 'Enter phone number...';
  const renderPhone = (props: React.ComponentProps<typeof PhoneNumber> = {}) =>
    render(<PhoneNumber placeholder={placeholder} onChange={mockOnChange} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders placeholder when no value provided', () => {
      renderPhone();
      expect(screen.getByText(placeholder)).toBeInTheDocument();
    });

    it('renders label and required indicator', () => {
      renderPhone({ label: 'Phone', required: true });
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
      renderPhone({ helperText: 'Helper' });
      expect(screen.getByText('Helper')).toBeInTheDocument();
    });

    it('does not render helper text when allowEdit is false', () => {
      renderPhone({ helperText: 'Helper', allowEdit: false });
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('renders formatted value when not editing', () => {
      renderPhone({ value: '1234567890' });
      expect(screen.getByText('(123) 456-7890')).toBeInTheDocument();
    });
  });

  describe('Editing Behavior', () => {
    it('enters edit mode on click when allowed', async () => {
      renderPhone({ value: '123' });
      await userEvent.click(screen.getByText('123'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not enter edit mode when readOnly', async () => {
      renderPhone({ value: '123', readOnly: true });
      await userEvent.click(screen.getByText('123'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('does not enter edit mode when disabled', async () => {
      renderPhone({ value: '123', disabled: true });
      await userEvent.click(screen.getByText('123'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('sanitizes non-numeric input when phoneValid is true', async () => {
      renderPhone({ value: '' });
      await userEvent.click(screen.getByText(placeholder));
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'abc123');
      expect(input.value).toBe('123');
    });

    it('allows non-numeric input when phoneValid is false', async () => {
      renderPhone({ value: '', config: { phoneValid: false } });
      await userEvent.click(screen.getByText(placeholder));
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'abc123');
      expect(input.value).toBe('abc123');
    });

    it('calls onChange on blur with valid value', async () => {
      renderPhone({ value: '' });
      await userEvent.click(screen.getByText(placeholder));
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '1234567890');
      fireEvent.blur(input);
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('1234567890');
      });
    });

    it('sanitizes pasted value when phoneValid is true', async () => {
      renderPhone({ value: '' });
      await userEvent.click(screen.getByText(placeholder));
      const input = screen.getByRole('textbox') as HTMLInputElement;

      fireEvent.paste(input, {
        clipboardData: {
          getData: () => '+1 (234) 567-8900'
        }
      });

      expect(input.value).toBe('12345678900');
    });

    it('commits non-numeric value when phoneValid is false', async () => {
      renderPhone({ value: '', config: { phoneValid: false } });
      await userEvent.click(screen.getByText(placeholder));
      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'abc123');
      fireEvent.blur(input);
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('abc123');
      });
    });

    it('does not call onChange when value unchanged', async () => {
      renderPhone({ value: '1234567890' });
      await userEvent.click(screen.getByText('(123) 456-7890'));
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('does not commit empty value when required', async () => {
      renderPhone({ required: true, value: '' });
      await userEvent.click(screen.getByText(placeholder));
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not commit invalid phone when phoneValid is true', async () => {
      renderPhone({ value: '' });
      await userEvent.click(screen.getByText(placeholder));
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '000');
      fireEvent.blur(input);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interaction', () => {
    it('commits value on Enter key', async () => {
      renderPhone({ value: '' });
      await userEvent.click(screen.getByText(placeholder));
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '1234567890{enter}');
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('1234567890');
      });
    });

    it('reverts value on Escape key', async () => {
      renderPhone({ value: '123', allowEdit: true });
      await userEvent.click(screen.getByText('123'));
      const input = await screen.findByRole('textbox') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, '999');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Config Props', () => {
    it('uses defaultValue from config', () => {
      renderPhone({ config: { defaultValue: '1112223333' } });
      expect(screen.getByText('(111) 222-3333')).toBeInTheDocument();
    });

    it('uses placeholder from config', () => {
      renderPhone({ config: { placeholder: 'Custom placeholder' } });
      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    it('disables formatting when formatDisplay is false', () => {
      renderPhone({ value: '1234567890', config: { formatDisplay: false } });
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });

  describe('Prop Synchronization', () => {
    it('updates display when value prop changes', () => {
      const { rerender } = renderPhone({ value: '111' });
      expect(screen.getByText('111')).toBeInTheDocument();

      rerender(<PhoneNumber placeholder={placeholder} value="222" onChange={mockOnChange} />);
      expect(screen.getByText('222')).toBeInTheDocument();
    });

    it('exits edit mode when readOnly changes to true', async () => {
      const { rerender } = renderPhone({ value: '123' });
      await userEvent.click(screen.getByText('123'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();

      rerender(<PhoneNumber placeholder={placeholder} value="123" readOnly onChange={mockOnChange} />);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Invalid existing value', () => {
    it('shows an error toast when editing a stored value that is not a valid phone number', () => {
      renderPhone({ value: 'abc', config: { formatDisplay: false } });
      fireEvent.mouseDown(screen.getByText('abc'));

      expect(mockToastError).toHaveBeenCalledWith('Invalid phone number', expect.objectContaining({ title: 'Error' }));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not show the toast for a valid or empty value', () => {
      renderPhone({ value: '1234567890' });
      fireEvent.mouseDown(screen.getByText('(123) 456-7890'));
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it('does not show the toast when phone validation is off', () => {
      renderPhone({ value: 'abc', config: { phoneValid: false, formatDisplay: false } });
      fireEvent.mouseDown(screen.getByText('abc'));

      expect(mockToastError).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Double click editing', () => {
    beforeEach(() => {
      clickMode.current = 'double';
    });

    afterEach(() => {
      clickMode.current = 'single';
    });

    it('enters edit mode on double click when allowEdit is false', () => {
      renderPhone({ value: '123', allowEdit: false });
      fireEvent.mouseDown(screen.getByText('123'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not enter edit mode on double click when allowEdit is true', () => {
      renderPhone({ value: '123' });
      fireEvent.mouseDown(screen.getByText('123'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('does not enter edit mode on double click when readOnly', () => {
      renderPhone({ value: '123', allowEdit: false, readOnly: true });
      fireEvent.mouseDown(screen.getByText('123'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });
});
