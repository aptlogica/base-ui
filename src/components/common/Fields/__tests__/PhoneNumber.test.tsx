import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneNumber } from '../PhoneNumber';

vi.mock('../../../utils/helpers', () => ({
  useClickHandler: (single: () => void) => single,
}));

describe('PhoneNumber Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders placeholder when no value provided', () => {
      render(<PhoneNumber onChange={mockOnChange} />);
      expect(screen.getByText('Enter phone number...')).toBeInTheDocument();
    });

    it('renders label and required indicator', () => {
      render(<PhoneNumber label="Phone" required onChange={mockOnChange} />);
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders helper text when provided', () => {
      render(<PhoneNumber helperText="Helper" onChange={mockOnChange} />);
      expect(screen.getByText('Helper')).toBeInTheDocument();
    });

    it('renders formatted value when not editing', () => {
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} />);
      expect(screen.getByText('(123) 456-7890')).toBeInTheDocument();
    });
  });

  describe('Editing Behavior', () => {
    it('enters edit mode on click when allowed', async () => {
      render(<PhoneNumber value="123" onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('123'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not enter edit mode when readOnly', async () => {
      render(<PhoneNumber value="123" readOnly onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('123'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('does not enter edit mode when disabled', async () => {
      render(<PhoneNumber value="123" disabled onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('123'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('sanitizes non-numeric input when phoneValid is true', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('Enter phone number...'));
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'abc123');
      expect(input.value).toBe('123');
    });

    it('allows non-numeric input when phoneValid is false', async () => {
      render(
        <PhoneNumber
          value=""
          onChange={mockOnChange}
          config={{ phoneValid: false }}
        />
      );
      await userEvent.click(screen.getByText('Enter phone number...'));
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'abc123');
      expect(input.value).toBe('abc123');
    });

    it('calls onChange on blur with valid value', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('Enter phone number...'));
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '1234567890');
      fireEvent.blur(input);
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('1234567890');
      });
    });

    it('does not call onChange when value unchanged', async () => {
      render(<PhoneNumber value="1234567890" onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('(123) 456-7890'));
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('does not commit empty value when required', async () => {
      render(<PhoneNumber required value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('Enter phone number...'));
      const input = screen.getByRole('textbox');
      fireEvent.blur(input);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('does not commit invalid phone when phoneValid is true', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('Enter phone number...'));
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '000');
      fireEvent.blur(input);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interaction', () => {
    it('commits value on Enter key', async () => {
      render(<PhoneNumber value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('Enter phone number...'));
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '1234567890{enter}');
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('1234567890');
      });
    });

    it('reverts value on Escape key', async () => {
      render(<PhoneNumber value="123" onChange={mockOnChange} />);
      await userEvent.click(screen.getByText('123'));
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, '999');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Config Props', () => {
    it('uses defaultValue from config', () => {
      render(
        <PhoneNumber
          onChange={mockOnChange}
          config={{ defaultValue: '1112223333' }}
        />
      );
      expect(screen.getByText('(111) 222-3333')).toBeInTheDocument();
    });

    it('uses placeholder from config', () => {
      render(
        <PhoneNumber
          onChange={mockOnChange}
          config={{ placeholder: 'Custom placeholder' }}
        />
      );
      expect(screen.getByText('Custom placeholder')).toBeInTheDocument();
    });

    it('disables formatting when formatDisplay is false', () => {
      render(
        <PhoneNumber
          value="1234567890"
          onChange={mockOnChange}
          config={{ formatDisplay: false }}
        />
      );
      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });

  describe('Prop Synchronization', () => {
    it('updates display when value prop changes', () => {
      const { rerender } = render(
        <PhoneNumber value="111" onChange={mockOnChange} />
      );
      expect(screen.getByText('111')).toBeInTheDocument();

      rerender(<PhoneNumber value="222" onChange={mockOnChange} />);
      expect(screen.getByText('222')).toBeInTheDocument();
    });
  });
});
