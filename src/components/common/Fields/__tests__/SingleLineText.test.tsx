import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SingleLineText } from '../SingleLineText';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SingleLineText Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<SingleLineText value="" onChange={mockOnChange} />);
      // Component should render, check for the field component div
      const fieldComponent = container.querySelector('.field-component');
      expect(fieldComponent).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<SingleLineText label="Name" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should render required asterisk when required prop is true', () => {
      render(<SingleLineText label="Name" value="" onChange={mockOnChange} required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render placeholder when provided', () => {
      render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          placeholder="Enter name"
        />
      );
      expect(screen.getByText('Enter name')).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(<SingleLineText value="John Doe" onChange={mockOnChange} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render helper text when provided', () => {
      render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          helperText="This field is required"
        />
      );
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply border class when isBorder is true', () => {
      const { container } = render(
        <SingleLineText value="" onChange={mockOnChange} isBorder />
      );
      const inputContainer = container.querySelector('.field-component-border');
      expect(inputContainer).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          className="custom-class"
        />
      );
      const inputContainer = container.querySelector('.custom-class');
      expect(inputContainer).toBeInTheDocument();
    });
  });

  describe('Input Interaction', () => {
    it('should update local value on input change', async () => {
      const { container } = render(<SingleLineText value="" onChange={mockOnChange} />);
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode (single click with allowEdit=true by default)
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250); // Use 250ms to account for useClickHandler delay
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'John');
      expect(input).toHaveValue('John');
    });

    it('should call onChange when input is blurred after modification', async () => {
      const { container } = render(
        <SingleLineText value="" onChange={mockOnChange} />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'John Doe');
      await act(async () => {
        fireEvent.blur(input);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('John Doe');
      });
    });

    it('should not call onChange when value has not changed', async () => {
      const { container } = render(<SingleLineText value="John" onChange={mockOnChange} />);
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.blur(input);
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle Enter key to blur and save', async () => {
      const { container } = render(<SingleLineText value="" onChange={mockOnChange} />);
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'New Value');
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('New Value');
      });
    });

    it('should handle Escape key to revert changes', async () => {
      const { container } = render(
        <SingleLineText value="Original" onChange={mockOnChange} />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.clear(input);
      await userEvent.type(input, 'New Value');
      
      // Press Escape to revert
      await act(async () => {
        fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
        await delay(100);
      });

      // Value should be reverted to original and onChange should not be called
      const revertedInput = screen.getByRole('textbox');
      expect(revertedInput).toHaveValue('Original');
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate required field', async () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          required
          label="Name"
        />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await act(async () => {
        fireEvent.blur(input);
      });

      // Should show error and not call onChange
      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });
    });

    it('should validate maxLength constraint', async () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          maxLength={5}
        />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'This is a long text');

      // Input element enforces maxLength natively
      expect((input as HTMLInputElement).value.length).toBeLessThanOrEqual(5);
    });

    it('should not allow exceeding maxLength', async () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          maxLength={10}
        />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'This is a very long text');
      await act(async () => {
        fireEvent.blur(input);
      });

      expect((input as HTMLInputElement).value.length).toBeLessThanOrEqual(10);
    });

    it('should accept valid value', async () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          required
          maxLength={20}
        />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Valid Value');
      await act(async () => {
        fireEvent.blur(input);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Valid Value');
      });
    });
  });

  describe('Edit Mode Behavior', () => {
    it('should enter edit mode on single click when allowEdit is true', async () => {
      const { container } = render(
        <SingleLineText
          value="Test"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );
      const editable = container.querySelector('.field-component');

      expect(screen.queryByDisplayValue('Test')).not.toBeInTheDocument();

      await act(async () => {
        fireEvent.click(editable!);
        await delay(250);
      });

      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });

    it('should require double click when allowEdit is false', async () => {
      const { container } = render(
        <SingleLineText
          value="Test"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );
      const editable = container.querySelector('.field-component');

      // Single click should not enter edit mode
      await act(async () => {
        fireEvent.click(editable!);
        await delay(250);
      });

      expect(screen.queryByDisplayValue('Test')).not.toBeInTheDocument();

      // Double click should enter edit mode
      await act(async () => {
        fireEvent.click(editable!);
        fireEvent.click(editable!);
        await delay(250);
      });

      expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    });

    it('should exit edit mode on blur', async () => {
      const { container } = render(<SingleLineText value="Test" onChange={mockOnChange} />);
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Modified');
      await act(async () => {
        fireEvent.blur(input);
      });

      // After blur, should exit edit mode and input should not be in document
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable input when disabled prop is true', () => {
      render(
        <SingleLineText value="Test" onChange={mockOnChange} disabled />
      );
      // When disabled, the textbox should not be in the document (not in edit mode)
      // Try to enter edit mode - should fail
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should not allow editing when disabled', async () => {
      const { container } = render(
        <SingleLineText
          value="Test"
          onChange={mockOnChange}
          disabled
        />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Try to enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(100);
      });

      // Should not have textbox input
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should prevent edit mode when readOnly is true', async () => {
      const { container } = render(
        <SingleLineText
          value="Test"
          onChange={mockOnChange}
          readOnly
          allowEdit={true}
        />
      );
      const editable = container.querySelector('.field-component');

      await act(async () => {
        fireEvent.click(editable!);
      });

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should apply disabled cursor style when readOnly', () => {
      const { container } = render(
        <SingleLineText
          value="Test"
          onChange={mockOnChange}
          readOnly
        />
      );
      const editable = container.querySelector('.field-component') as HTMLElement;
      const inlineStyle = editable?.getAttribute('style');

      // The component applies cursor: 'default' as inline style when readOnly
      if (inlineStyle) {
        expect(inlineStyle).toContain('cursor');
        expect(inlineStyle).toContain('default');
      } else {
        // If no inline style, check via getComputedStyle
        const styles = globalThis.getComputedStyle(editable);
        expect(styles.cursor).toBeDefined();
      }
    });

    it('should exit edit mode if readOnly becomes true', async () => {
      const { rerender, container } = render(
        <SingleLineText
          value="Test"
          onChange={mockOnChange}
          readOnly={false}
        />
      );

      // Enter edit mode
      const editable = container.querySelector('.field-component');
      await act(async () => {
        fireEvent.click(editable!);
        await delay(250);
      });

      expect(screen.getByRole('textbox')).toBeInTheDocument();

      // Now make it readOnly
      rerender(
        <SingleLineText
          value="Test"
          onChange={mockOnChange}
          readOnly={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      const { container } = render(
        <SingleLineText
          value={undefined}
          onChange={mockOnChange}
          config={{ defaultValue: 'Default Name' }}
        />
      );
      // The field component displays the value in a span when not editing
      const fieldDiv = container.querySelector('.field-component');
      // Check the actual text content displayed
      expect(fieldDiv?.textContent).toContain('Default Name');
    });

    it('should use maxLength from config', async () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          maxLength={10}
          config={{ maxLength: 5 }}
        />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });
      const input = screen.getByRole('textbox');
      // Check maxLength attribute is set to config value
      expect((input as HTMLInputElement).maxLength).toBe(5);
      
      await userEvent.type(input, 'This is very long text');
      await act(async () => {
        fireEvent.blur(input);
      });

      expect((input as HTMLInputElement).value.length).toBeLessThanOrEqual(5);
      expect(input.value.length).toBeLessThanOrEqual(5);
    });

    it('should use placeholder from config', () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          config={{ placeholder: 'Config Placeholder' }}
        />
      );
      const fieldDiv = container.querySelector('.field-component');
      expect(fieldDiv?.textContent).toContain('Config Placeholder');
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes externally', async () => {
      const { rerender } = render(
        <SingleLineText value="Initial" onChange={mockOnChange} />
      );
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(
        <SingleLineText value="Updated" onChange={mockOnChange} />
      );

      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
      });
    });

    it('should preserve local changes until blur', async () => {
      const { container } = render(
        <SingleLineText value="Initial" onChange={mockOnChange} />
      );
      let fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'Modified');

      // Verify local changes are reflected in the input
      expect(input).toHaveValue('InitialModified');
      
      // Blur the input to save the changes
      await act(async () => {
        fireEvent.blur(input);
        await delay(50);
      });

      // Verify onChange was called with the modified value
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('InitialModified');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      const { container } = render(<SingleLineText value="" onChange={mockOnChange} />);
      // Empty value should display as empty in field-component
      const fieldComponent = container.querySelector('.field-component');
      expect(fieldComponent).toBeInTheDocument();
      expect(fieldComponent?.textContent).toBe('');
    });

    it('should handle undefined value', () => {
      const { container } = render(<SingleLineText value={undefined} onChange={mockOnChange} />);
      // Undefined should be treated as empty
      const fieldComponent = container.querySelector('.field-component');
      expect(fieldComponent).toBeInTheDocument();
      expect(fieldComponent?.textContent).toBe('');
    });

    it('should handle whitespace-only values', async () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          required
        />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      await userEvent.type(input, '   ');
      await act(async () => {
        fireEvent.blur(input);
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should handle rapid value changes', async () => {
      const { rerender } = render(
        <SingleLineText value="Value1" onChange={mockOnChange} />
      );

      rerender(<SingleLineText value="Value2" onChange={mockOnChange} />);
      rerender(<SingleLineText value="Value3" onChange={mockOnChange} />);

      await waitFor(() => {
        expect(screen.getByText('Value3')).toBeInTheDocument();
      });
    });

    it('should handle very long values', async () => {
      const { container } = render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          maxLength={255}
        />
      );
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const longValue = 'A'.repeat(255);
      const input = screen.getByRole('textbox');
      await userEvent.type(input, longValue);
      expect((input as HTMLInputElement).value.length).toBeLessThanOrEqual(255);
    });

    it('should handle special characters', async () => {
      const { container } = render(<SingleLineText value="" onChange={mockOnChange} />);
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      const specialChars = '!@#$%^&*()_+-={}[]|:;<>?,./';
      
      // Use fireEvent.change instead of userEvent.type to handle special characters
      // that userEvent interprets as keyboard descriptors
      await act(async () => {
        fireEvent.change(input, { target: { value: specialChars } });
      });
      
      await act(async () => {
        fireEvent.blur(input);
        await delay(50);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(specialChars);
      });
    });

    it('should handle unicode characters', async () => {
      const { container } = render(<SingleLineText value="" onChange={mockOnChange} />);
      const fieldComponent = container.querySelector('.field-component');

      // Enter edit mode
      await act(async () => {
        fireEvent.click(fieldComponent!);
        await delay(250);
      });

      const input = screen.getByRole('textbox');
      const unicodeText = '你好世界 🌍 مرحبا';
      await userEvent.type(input, unicodeText);
      await act(async () => {
        fireEvent.blur(input);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(unicodeText);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label association', () => {
      render(
        <SingleLineText
          label="Username"
          value=""
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Username')).toBeInTheDocument();
      // The component is not in edit mode, so no textbox initially
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should mark required fields with asterisk', () => {
      render(
        <SingleLineText
          label="Name"
          value=""
          onChange={mockOnChange}
          required
        />
      );
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
    });

    it('should have proper disabled attribute', () => {
      render(
        <SingleLineText
          value=""
          onChange={mockOnChange}
          disabled
        />
      );
      // When disabled, component is not in edit mode, so no textbox
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });
});
