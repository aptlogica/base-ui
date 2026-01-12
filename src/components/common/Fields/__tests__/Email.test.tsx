import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Email } from '../Email';

describe('Email Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Email value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Email label="Email Address" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(<Email label="Email" value="" onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(<Email value="test@example.com" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('should render helper text when provided', () => {
      render(
        <Email
          value=""
          onChange={mockOnChange}
          helperText="Please enter a valid email"
        />
      );
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });

    it('should apply border class when isBorder is true', () => {
      const { container } = render(
        <Email value="" onChange={mockOnChange} isBorder />
      );
      expect(container.querySelector('.field-component-border')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should update local value on input change', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user@example.com');
      expect(input).toHaveValue('user@example.com');
    });

    it('should call onChange on blur with valid email', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('should handle Enter key to blur', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user@example.com');
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('should handle Escape key to revert changes', async () => {
      render(<Email value="original@example.com" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.clear(input);
      await userEvent.type(input, 'new@example.com');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(input).toHaveValue('original@example.com');
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email format', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'valid.email@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('valid.email@example.com');
      });
    });

    it('should reject email without @ symbol', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'invalidemail.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should reject email without domain', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user@');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should reject email without TLD', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user@example');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should accept email with multiple subdomains', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user@mail.example.co.uk');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('user@mail.example.co.uk');
      });
    });

    it('should accept email with numbers and dots', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user.name.123@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('user.name.123@example.com');
      });
    });

    it('should skip validation when emailValid is false', async () => {
      render(
        <Email
          value=""
          onChange={mockOnChange}
          config={{ emailValid: false }}
        />
      );
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'not-an-email');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('not-an-email');
      });
    });
  });

  describe('Required Field Validation', () => {
    it('should not accept empty required field', async () => {
      render(<Email value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should accept empty non-required field', async () => {
      render(<Email value="" onChange={mockOnChange} required={false} />);
      const input = screen.getByRole('textbox');

      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should not accept whitespace-only required field', async () => {
      render(<Email value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, '   ');
      fireEvent.blur(input);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode Behavior', () => {
    it('should enter edit mode on single click when allowEdit is true', async () => {
      const { container } = render(
        <Email value="test@example.com" onChange={mockOnChange} allowEdit={true} />
      );
      const editable = container.querySelector('.field-component');

      expect(screen.queryByDisplayValue('test@example.com')).not.toBeInTheDocument();

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('should require double click when allowEdit is false', async () => {
      const { container } = render(
        <Email value="test@example.com" onChange={mockOnChange} allowEdit={false} />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.queryByDisplayValue('test@example.com')).not.toBeInTheDocument();

      fireEvent.click(editable!);
      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled prop is true', () => {
      render(
        <Email value="test@example.com" onChange={mockOnChange} disabled />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should prevent editing when readOnly is true', async () => {
      const { container } = render(
        <Email value="test@example.com" onChange={mockOnChange} readOnly allowEdit={true} />
      );
      const editable = container.querySelector('.field-component');

      fireEvent.click(editable!);
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should exit edit mode if readOnly becomes true', async () => {
      const { rerender } = render(
        <Email value="test@example.com" onChange={mockOnChange} readOnly={false} />
      );

      rerender(
        <Email value="test@example.com" onChange={mockOnChange} readOnly={true} />
      );

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <Email
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 'default@example.com' }}
        />
      );
      expect(screen.getByRole('textbox')).toHaveValue('default@example.com');
    });

    it('should use emailValid flag from config', async () => {
      render(
        <Email
          value=""
          onChange={mockOnChange}
          config={{ emailValid: false }}
        />
      );
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'invalid');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('invalid');
      });
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes externally', () => {
      const { rerender } = render(
        <Email value="first@example.com" onChange={mockOnChange} />
      );
      expect(screen.getByDisplayValue('first@example.com')).toBeInTheDocument();

      rerender(
        <Email value="second@example.com" onChange={mockOnChange} />
      );

      expect(screen.getByDisplayValue('second@example.com')).toBeInTheDocument();
    });

    it('should not save invalid email on blur', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'invalid-email');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      render(<Email value="" onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle undefined value', () => {
      render(<Email value={undefined as any} onChange={mockOnChange} />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('should handle email with plus addressing', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user+tag@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('user+tag@example.com');
      });
    });

    it('should handle email with underscores', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user_name@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('user_name@example.com');
      });
    });

    it('should handle email with hyphens', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'user-name@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('user-name@example.com');
      });
    });

    it('should clear value on invalid email', async () => {
      render(<Email value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await userEvent.type(input, 'invalid');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Accessibility', () => {
    it('should render with accessible label', () => {
      render(<Email label="Email" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(<Email label="Email" value="" onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });
});
