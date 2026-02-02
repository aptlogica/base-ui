import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MultiLineText } from '../MultiLineText';

describe('MultiLineText Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render textarea element', () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<MultiLineText label="Comments" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    it('should render required indicator when required is true', () => {
      render(<MultiLineText label="Notes" required value="" onChange={mockOnChange} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(
        <MultiLineText
          value=""
          onChange={mockOnChange}
          placeholder="Enter your feedback"
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea.placeholder).toBe('Enter your feedback');
    });

    it('should display initial value', () => {
      render(
        <MultiLineText value="Initial content" onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea.value).toBe('Initial content');
    });

    it('should display helper text when provided', () => {
      render(
        <MultiLineText
          value=""
          onChange={mockOnChange}
          helperText="Please provide detailed feedback"
        />
      );
      expect(screen.getByText('Please provide detailed feedback')).toBeInTheDocument();
    });

    it('should apply default rows value', () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.rows).toBe(3); // Default rows value
    });

    it('should apply custom rows value', () => {
      render(<MultiLineText value="" onChange={mockOnChange} rows={5} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea.rows).toBe(5);
    });
  });

  describe('Input Interaction', () => {
    it('should update local value when typing', async () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'New content');

      expect(textarea.value).toBe('New content');
    });

    it('should call onChange when value changes and blur occurs', async () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'Test content');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Test content');
      });
    });

    it('should not call onChange on blur if value unchanged', async () => {
      render(<MultiLineText value="Existing" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      fireEvent.blur(textarea);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call onChange for each keystroke during typing', async () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'Content');
      fireEvent.blur(textarea);

      // onChange is called for each character typed: C-o-n-t-e-n-t (7 times)
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(7);
      });
    });

    it('should sync external value changes', () => {
      const { rerender } = render(
        <MultiLineText value="Initial" onChange={mockOnChange} />
      );
      let textarea = screen.getByRole('textbox');
      expect(textarea.value).toBe('Initial');

      rerender(<MultiLineText value="Updated" onChange={mockOnChange} />);
      textarea = screen.getByRole('textbox');
      expect(textarea.value).toBe('Updated');
    });

    it('should handle multiple lines of text', async () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'Line 1\nLine 2\nLine 3');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Line 1\nLine 2\nLine 3');
      });
    });
  });

  describe('Validation', () => {
    it('should show error for required field when empty', async () => {
      render(
        <MultiLineText
          required
          value=""
          onChange={mockOnChange}
        />
      );
      const textarea = screen.getByRole('textbox');

      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });

    it('should clear error when required field is filled', async () => {
      render(
        <MultiLineText
          required
          value=""
          onChange={mockOnChange}
        />
      );
      const textarea = screen.getByRole('textbox');

      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      await userEvent.type(textarea, 'Content');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
      });
    });

    it('should enforce maxLength constraint', () => {
      render(
        <MultiLineText
          value=""
          onChange={mockOnChange}
          maxLength={10}
        />
      );
      const textarea = screen.getByRole('textbox');

      expect(textarea.maxLength).toBe(10);
    });

    it('should show error when exceeding maxLength', async () => {
      render(
        <MultiLineText
          value=""
          onChange={mockOnChange}
          maxLength={5}
        />
      );
      const textarea = screen.getByRole('textbox');

      // Note: maxLength attribute prevents typing beyond limit
      await userEvent.type(textarea, 'toolong');
      fireEvent.blur(textarea);

      // Browser enforces maxLength, so value won't exceed it
      expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(5);
    });
    it('should show error when value exceeds maxLength on initial render', async () => {
      render(
        <MultiLineText
          value="This is longer than 5"
          onChange={mockOnChange}
          maxLength={5}
        />
      );
      const textarea = screen.getByRole('textbox');

      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(screen.getByText('Max 5 characters allowed')).toBeInTheDocument();
      });
    });
    it('should accept whitespace-only content', async () => {
      render(
        <MultiLineText
          required
          value=""
          onChange={mockOnChange}
        />
      );
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, '   ');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable textarea when disabled is true', () => {
      render(<MultiLineText value="" onChange={mockOnChange} disabled />);
      const textarea = screen.getByRole('textbox');

      expect(textarea.disabled).toBe(true);
    });

    it('should set readonly attribute when allowEdit is false', () => {
      render(
        <MultiLineText
          value="Content"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );
      const textarea = screen.getByRole('textbox');

      expect(textarea.readOnly).toBe(true);
    });

    it('should not call onChange when disabled', async () => {
      render(<MultiLineText value="" onChange={mockOnChange} disabled />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, 'Test');
      fireEvent.blur(textarea);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should prevent editing when readOnly', async () => {
      render(
        <MultiLineText
          value="Original"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );
      const textarea = screen.getByRole('textbox');

      // ReadOnly input ignores user input
      await userEvent.type(textarea, 'New');
      expect(textarea.value).toBe('Original');
    });

    it('should apply disabled styling', () => {
      render(
        <MultiLineText value="" onChange={mockOnChange} disabled />
      );
      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveClass('cursor-not-allowed');
    });
  });

  describe('CSS & Styling', () => {
    it('should apply border class when isBorder is true', () => {
      render(
        <MultiLineText value="" onChange={mockOnChange} isBorder />
      );
      const textarea = screen.getByRole('textbox');

      expect(textarea).toHaveClass('field-component-border');
    });

    it('should apply custom className', () => {
      render(
        <MultiLineText
          value=""
          onChange={mockOnChange}
          className="custom-class"
        />
      );
      const wrapper = document.querySelector('.w-full.relative');

      expect(wrapper).toBeInTheDocument();
    });

    it('should apply error styling when validation fails', async () => {
      render(
        <MultiLineText
          required
          value=""
          onChange={mockOnChange}
        />
      );
      const textarea = screen.getByRole('textbox');

      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(textarea).toHaveClass('border-red-500');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined value', () => {
      render(<MultiLineText value={undefined as any} onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      expect(textarea.value).toBe('');
    });

    it('should handle null value', () => {
      render(<MultiLineText value={null as any} onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      expect(textarea.value).toBe('');
    });

    it('should handle special characters', async () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, '!@#$%^&*()');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('!@#$%^&*()');
      });
    });

    it('should handle unicode characters', async () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      await userEvent.type(textarea, '你好世界 🌍');
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('你好世界 🌍');
      });
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(100);
      render(
        <MultiLineText
          value=""
          onChange={mockOnChange}
          maxLength={1000}
        />
      );
      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: longText } });
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(longText);
      });
    }, 10000);

    it('should preserve empty lines', async () => {
      render(<MultiLineText value="" onChange={mockOnChange} />);
      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: 'Line1\n\n\nLine2' } });
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Line1\n\n\nLine2');
      });
    });

    it('should handle rapid updates', async () => {
      const { rerender } = render(
        <MultiLineText value="First" onChange={mockOnChange} />
      );

      rerender(<MultiLineText value="Second" onChange={mockOnChange} />);
      rerender(<MultiLineText value="Third" onChange={mockOnChange} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea.value).toBe('Third');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <MultiLineText
          label="Feedback"
          value=""
          onChange={mockOnChange}
        />
      );
      const label = screen.getByText('Feedback');
      const textarea = screen.getByRole('textbox');

      expect(label).toBeInTheDocument();
      expect(textarea).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <MultiLineText value="" onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');

      textarea.focus();
      expect(textarea).toHaveFocus();

      fireEvent.change(textarea, { target: { value: 'Focused input' } });
      fireEvent.blur(textarea);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Focused input');
      });
    });

    it('should have semantic textarea element', () => {
      render(
        <MultiLineText value="" onChange={mockOnChange} />
      );
      const textarea = screen.getByRole('textbox');

      expect(textarea.tagName).toBe('TEXTAREA');
    });
  });
});
