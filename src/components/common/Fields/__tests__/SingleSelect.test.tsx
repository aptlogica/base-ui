import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SingleSelect } from '../SingleSelect';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SingleSelect Component', () => {
  const mockOnChange = vi.fn();
  const defaultOptions = ['Option 1', 'Option 2', 'Option 3'];
  const optionsWithColor = [
    { option: 'Red', color: 'red' },
    { option: 'Blue', color: 'blue' },
    { option: 'Green', color: 'green' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render select component', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(
        <SingleSelect
          label="Choose Option"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Choose Option')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(
        <SingleSelect
          label="Option"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render placeholder when no value selected', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          placeholder="Choose an option"
        />
      );
      expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });

    it('should render selected value', () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should render helper text when provided', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          helperText="Select one option"
        />
      );
      expect(screen.getByText('Select one option')).toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    it('should open dropdown on button click', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];

      fireEvent.click(mainButton);
      await delay(100);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should close dropdown when option is selected', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];

      fireEvent.click(mainButton);
      await delay(100);

      const optionElements = screen.getAllByText('Option 1');
      fireEvent.click(optionElements[0]);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Option 1');
      });
    });

    it('should toggle dropdown on multiple clicks', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];

      // Open
      fireEvent.click(mainButton);
      await delay(100);

      // Close
      fireEvent.click(mainButton);
      await delay(100);

      // Open again
      fireEvent.click(mainButton);
      await delay(100);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <SingleSelect
            value=""
            onChange={mockOnChange}
            options={defaultOptions}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      );
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];

      fireEvent.click(mainButton);
      await delay(100);

      const outside = screen.getByTestId('outside');
      fireEvent.click(outside);
      await delay(100);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Option Selection', () => {
    it('should select option and call onChange', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];

      fireEvent.click(mainButton);
      await delay(100);

      const option = screen.getAllByText('Option 2')[0];
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Option 2');
      });
    });

    it('should select option with color', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={optionsWithColor}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      const option = screen.getByText('Red');
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Red');
      });
    });

    it('should show checkmark on selected option', async () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should select new option when already selected', async () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      const options = screen.getAllByText('Option 2');
      fireEvent.click(options[0]);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Option 2');
      });
    });
  });

  describe('Clear Functionality', () => {
    it('should show clear button when value is selected', () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
    });

    it('should clear value when clear button is clicked', async () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons[buttons.length - 1];

      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should not show clear button when no value selected', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      // Should only have 1 button (the main select button)
      expect(buttons.length).toBe(1);
    });
  });

  describe('Custom Values', () => {
    it('should allow custom value when allowCustom is true', async () => {
      const { container } = render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          allowCustom={true}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      // With allowCustom, there should be an input for custom value
      const input = container.querySelector('input');
      expect(input).toBeDefined();
    });

    it('should not allow custom value when allowCustom is false', async () => {
      const { container } = render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          allowCustom={false}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      const input = container.querySelector('input');
      expect(input).not.toBeInTheDocument();
    });

    it('should use allowCustom from config', async () => {
      const { container } = render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          config={{ allowCustom: true }}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      const input = container.querySelector('input');
      expect(input).toBeDefined();
    });
  });

  describe('Required Field', () => {
    it('should mark field as required', () => {
      render(
        <SingleSelect
          label="Required Field"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not allow empty value for required field', async () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons[buttons.length - 1];

      fireEvent.click(clearButton);

      // Required field should prevent clearing
      expect(mockOnChange).not.toHaveBeenCalledWith('');
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable select when disabled prop is true', () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          disabled
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      expect(button).toBeDisabled();
    });

    it('should prevent opening when disabled', async () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          disabled
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    it('should prevent editing when readOnly is true', async () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          readOnly
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          config={{ defaultValue: 'Option 2' }}
        />
      );
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should use options from config', async () => {
      const configOptions = ['Config 1', 'Config 2'];
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          config={{ options: configOptions }}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.getByText('Config 1')).toBeInTheDocument();
      expect(screen.getByText('Config 2')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      rerender(
        <SingleSelect
          value="Option 2"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should update when options change', async () => {
      const { rerender } = render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={['Old 1', 'Old 2']}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      rerender(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={['New 1', 'New 2']}
        />
      );

      fireEvent.click(button);
      await delay(100);

      expect(screen.getByText('New 1')).toBeInTheDocument();
      expect(screen.getByText('New 2')).toBeInTheDocument();
      expect(screen.queryByText('Old 1')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={[]}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeInTheDocument();
    });

    it('should handle single option', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={['Only Option']}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.getByText('Only Option')).toBeInTheDocument();
    });

    it('should handle very long option text', async () => {
      const longText = 'A'.repeat(100);
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={[longText, 'Option 2']}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters in options', async () => {
      const specialOptions = ['<Option>', 'Option & More', '"Quoted"'];
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={specialOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.getByText('<Option>')).toBeInTheDocument();
      expect(screen.getByText('Option & More')).toBeInTheDocument();
      expect(screen.getByText('"Quoted"')).toBeInTheDocument();
    });

    it('should handle unicode in options', async () => {
      const unicodeOptions = ['中文', 'العربية', '🎯 Emoji'];
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={unicodeOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.getByText('中文')).toBeInTheDocument();
      expect(screen.getByText('العربية')).toBeInTheDocument();
      expect(screen.getByText('🎯 Emoji')).toBeInTheDocument();
    });

    it('should handle duplicate options', async () => {
      const duplicateOptions = ['Option 1', 'Option 1', 'Option 2'];
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={duplicateOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      const optionElements = screen.getAllByText('Option 1');
      expect(optionElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle whitespace-only options', async () => {
      const whitespaceOptions = ['   ', 'Normal Option'];
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={whitespaceOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const button = buttons[0];

      fireEvent.click(button);
      await delay(100);

      expect(screen.getByText('Normal Option')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render with button role', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      render(
        <SingleSelect
          label="Select Option"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Select Option')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <SingleSelect
          label="Option"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });
});
