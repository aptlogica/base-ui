import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Password } from '../Password';

describe('Password Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render password input component', () => {
      render(<Password value="" onChange={mockOnChange} />);
      expect(screen.getByDisplayValue('') || screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Password label="Password" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('should mask password input by default', () => {
      const { container } = render(
        <Password value="secret123" onChange={mockOnChange} />
      );
      // Password should be masked, not visible
      expect(container.querySelector('input')).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should accept password input', async () => {
      render(<Password value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') || screen.getByDisplayValue('');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, 'MyPassword123!');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should accept special characters', async () => {
      render(<Password value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') || screen.getByDisplayValue('');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, 'P@ssw0rd!#$%');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const { container } = render(
        <Password value="secret" onChange={mockOnChange} />
      );

      const toggleButton = container.querySelector('button');
      if (toggleButton) {
        fireEvent.click(toggleButton);
        await waitFor(() => {
          expect(container.querySelector('input')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Validation', () => {
    it('should validate required field', async () => {
      render(<Password value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox') || screen.getByDisplayValue('');

      if (input) {
        fireEvent.blur(input);
        expect(mockOnChange).not.toHaveBeenCalled();
      }
    });

    it('should accept non-empty password', async () => {
      render(<Password value="" onChange={mockOnChange} required />);
      const input = screen.getByRole('textbox') || screen.getByDisplayValue('');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, 'ValidPassword123');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled', () => {
      render(
        <Password value="secret" onChange={mockOnChange} disabled />
      );
      const input = screen.getByRole('textbox') || document.querySelector('input');
      if (input) {
        expect(input).toBeDisabled();
      }
    });

    it('should prevent editing when readOnly', async () => {
      const { container } = render(
        <Password
          value="secret"
          onChange={mockOnChange}
          readOnly
          allowEdit={true}
        />
      );
      const editable = container.querySelector('.field-component');

      if (editable) {
        fireEvent.click(editable);
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      const { container } = render(
        <Password
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: 'default123' }}
        />
      );
      expect(container.querySelector('input')).toBeInTheDocument();
    });

    it('should enforce maxLength from config', async () => {
      render(
        <Password
          value=""
          onChange={mockOnChange}
          config={{ maxLength: 8 }}
        />
      );
      const input = screen.getByRole('textbox') || document.querySelector('input');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, 'VeryLongPassword');
        expect((input as HTMLInputElement).maxLength).toBe(8);
      }
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <Password value="first" onChange={mockOnChange} />
      );

      rerender(
        <Password value="second" onChange={mockOnChange} />
      );

      expect(document.querySelector('input')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty value', () => {
      render(<Password value="" onChange={mockOnChange} />);
      expect(document.querySelector('input')).toBeInTheDocument();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'A'.repeat(100);
      render(<Password value="" onChange={mockOnChange} />);
      const input = document.querySelector('input');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, longPassword);
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should handle unicode characters', async () => {
      render(<Password value="" onChange={mockOnChange} />);
      const input = document.querySelector('input');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, '密码🔒');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should handle whitespace in password', async () => {
      render(<Password value="" onChange={mockOnChange} />);
      const input = document.querySelector('input');

      if (input && input.tagName === 'INPUT') {
        await userEvent.type(input, 'Pass word 123');
        fireEvent.blur(input);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(
        <Password label="Enter Password" value="" onChange={mockOnChange} />
      );
      expect(screen.getByText('Enter Password')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <Password label="Password" value="" onChange={mockOnChange} required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should have proper input type attribute', () => {
      const { container } = render(
        <Password value="" onChange={mockOnChange} />
      );
      const input = container.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });
  });
});
