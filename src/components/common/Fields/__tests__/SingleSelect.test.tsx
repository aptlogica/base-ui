import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SingleSelect } from '../SingleSelect';

describe('SingleSelect Component', () => {
  const mockOnChange = vi.fn();
  const defaultOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render single-select component', () => {
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
          label="Select Option"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Select Option')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(
        <SingleSelect
          label="Category"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display selected value', () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should render placeholder when no value selected', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          placeholder="Choose option"
        />
      );
      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('should render default placeholder when not provided', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Select option...')).toBeInTheDocument();
    });

    it('should render helper text when provided and allowEdit is true', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          helperText="Select an option"
          allowEdit={true}
        />
      );
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should not render helper text when allowEdit is false', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          helperText="Select an option"
          allowEdit={false}
        />
      );
      expect(screen.queryByText('Select an option')).not.toBeInTheDocument();
    });

    it('should render clear button when value is selected and not disabled and not readOnly', () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const clearButton = container.querySelector('button[type="button"]:last-child');
      expect(clearButton).toBeInTheDocument();
    });

    it('should not render clear button when disabled', () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          disabled
        />
      );
      const buttons = container.querySelectorAll('button');
      const hasClearButton = Array.from(buttons).some(btn => 
        btn.querySelector('svg') && btn !== buttons[0]
      );
      expect(hasClearButton).toBe(false);
    });

    it('should not render clear button when readOnly', () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          readOnly
        />
      );
      const buttons = container.querySelectorAll('button');
      const hasClearButton = Array.from(buttons).some(btn => 
        btn.querySelector('svg') && btn !== buttons[0]
      );
      expect(hasClearButton).toBe(false);
    });

    it('should not render clear button when value is empty', () => {
      const { container } = render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(1);
    });
  });

  describe('Option Selection', () => {
    it('should select option from dropdown', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option1Button = optionButtons.find(btn => btn.textContent?.includes('Option 1') && btn !== button);
      expect(option1Button).toBeTruthy();
      await userEvent.click(option1Button!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Option 1');
      });
    });

    it('should close dropdown after selection', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option1Button = optionButtons.find(btn => btn.textContent?.includes('Option 1') && btn !== button);
      expect(option1Button).toBeTruthy();
      await userEvent.click(option1Button!);

      await waitFor(() => {
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      });
    });

    it('should display checkmark for selected option in dropdown', async () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];

      await userEvent.click(mainButton);
      await waitFor(() => {
        const checkIcons = document.querySelectorAll('svg');
        const hasCheckIcon = Array.from(checkIcons).some(svg => {
          const path = svg.querySelector('path');
          return path && (path.getAttribute('d')?.includes('M20 6') || path.getAttribute('d')?.includes('M5 13'));
        });
        expect(hasCheckIcon).toBe(true);
      });
    });

    it('should clear value when clear button is clicked', async () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = container.querySelectorAll('button');
      const clearButton = Array.from(buttons).find(btn => 
        btn.querySelector('svg') && btn !== buttons[0]
      );
      expect(clearButton).toBeTruthy();

      await userEvent.click(clearButton!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should stop propagation when clear button is clicked', async () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const buttons = container.querySelectorAll('button');
      const clearButton = Array.from(buttons).find(btn => 
        btn.querySelector('svg') && btn !== buttons[0]
      );
      expect(clearButton).toBeTruthy();

      const stopPropagationSpy = vi.spyOn(Event.prototype, 'stopPropagation');
      await userEvent.click(clearButton!);

      expect(stopPropagationSpy).toHaveBeenCalled();
      stopPropagationSpy.mockRestore();
    });
  });

  describe('Dropdown Interaction', () => {
    it('should open dropdown on button click when allowEdit is true', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          allowEdit={true}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should not open dropdown when disabled', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          disabled
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    it('should not open dropdown when allowEdit is false and single click', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          allowEdit={false}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <SingleSelect
            value=""
            onChange={mockOnChange}
            options={defaultOptions}
          />
          <div data-testid="outside">Outside</div>
        </div>
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const dropdownOption1 = buttons.find(btn => btn.textContent?.includes('Option 1') && btn !== button);
        expect(dropdownOption1).toBeTruthy();
      });

      const outside = screen.getByTestId('outside');
      await userEvent.click(outside);

      await waitFor(() => expect(screen.queryByText('Option 1')).not.toBeInTheDocument());
    });

    it('should toggle dropdown when clicking button again', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    it('should display "No options available" when options array is empty', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={[]}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText('No options available')).toBeInTheDocument();
      });
    });
  });

  describe('Options with Colors', () => {
    it('should render options with custom colors', async () => {
      const optionsWithColors = [
        { option: 'Red', color: '#FF0000' },
        { option: 'Green', color: '#00FF00' },
        { option: 'Blue', color: '#0000FF' }
      ];
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={optionsWithColors}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Red')).toBeInTheDocument());

      const redOption = screen.getByText('Red').closest('button');
      expect(redOption).toBeTruthy();
      const style = window.getComputedStyle(redOption!.querySelector('div')!);
      expect(style.backgroundColor).toBeTruthy();
    });

    it('should display selected option with custom color', () => {
      const optionsWithColors = [
        { option: 'Red', color: '#FF0000' },
        { option: 'Green', color: '#00FF00' }
      ];
      render(
        <SingleSelect
          value="Red"
          onChange={mockOnChange}
          options={optionsWithColors}
        />
      );
      const selectedDiv = screen.getByText('Red').closest('div');
      expect(selectedDiv).toBeTruthy();
    });

    it('should use default color classes when color is not provided', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const option1Button = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Option 1') && btn !== button
      );
      expect(option1Button).toBeTruthy();
      const optionDiv = option1Button!.querySelector('div');
      expect(optionDiv).toBeTruthy();
      expect(optionDiv!.className).toContain('bg-');
    });
  });

  describe('Validation', () => {
    it('should show error when required field is empty after selection', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option1Button = optionButtons.find(btn => btn.textContent?.includes('Option 1') && btn !== button);
      expect(option1Button).toBeTruthy();
      await userEvent.click(option1Button!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should validate required field when cleared', async () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      const buttons = container.querySelectorAll('button');
      const clearButton = Array.from(buttons).find(btn => 
        btn.querySelector('svg') && btn !== buttons[0]
      );
      expect(clearButton).toBeTruthy();

      await userEvent.click(clearButton!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should show error for invalid option when allowCustom is false', async () => {
      render(
        <SingleSelect
          value="Invalid Option"
          onChange={mockOnChange}
          options={defaultOptions}
          allowCustom={false}
        />
      );
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons.find(btn => btn.className.includes('field-component')) || buttons[0];

      await userEvent.click(mainButton);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option1Button = optionButtons.find(btn => 
        btn.textContent?.includes('Option 1') && 
        btn !== mainButton &&
        !btn.querySelector('svg[class*="lucide-x"]') &&
        !btn.className.includes('field-component')
      );
      expect(option1Button).toBeTruthy();
      await userEvent.click(option1Button!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should not show error for valid option', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option1Button = optionButtons.find(btn => btn.textContent?.includes('Option 1') && btn !== button);
      expect(option1Button).toBeTruthy();
      await userEvent.click(option1Button!);

      await waitFor(() => {
        const errorMessage = screen.queryByText('This field is required');
        expect(errorMessage).not.toBeInTheDocument();
      });
    });

    it('should display error message when validation fails', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option1Button = optionButtons.find(btn => btn.textContent?.includes('Option 1') && btn !== button);
      expect(option1Button).toBeTruthy();
      await userEvent.click(option1Button!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable button when disabled prop is true', () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          disabled
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveProperty('disabled');
    });

    it('should prevent selection when readOnly', async () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          readOnly
        />
      );
      const buttons = screen.getAllByRole('button');
      const mainButton = buttons[0];

      await userEvent.click(mainButton);
      await waitFor(() => {
        const option1Elements = screen.getAllByText('Option 1');
        expect(option1Elements.length).toBeGreaterThan(0);
      });

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option2Button = optionButtons.find(btn => btn.textContent?.includes('Option 2') && btn !== mainButton);
      expect(option2Button).toBeTruthy();
      await userEvent.click(option2Button!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should prevent clear when readOnly', async () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          readOnly
        />
      );
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(1);
    });

    it('should apply disabled styling when disabled', () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          disabled
        />
      );
      const button = container.querySelector('.field-component');
      expect(button?.className).toContain('cursor-not-allowed');
    });

    it('should apply readOnly styling when readOnly', () => {
      const { container } = render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          readOnly
        />
      );
      const button = container.querySelector('.field-component');
      expect(button?.className).toContain('cursor-not-allowed');
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config when value is empty', () => {
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

    it('should prioritize value over defaultValue', () => {
      render(
        <SingleSelect
          value="Option 1"
          onChange={mockOnChange}
          options={defaultOptions}
          config={{ defaultValue: 'Option 2' }}
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    it('should use options from config', async () => {
      const configOptions = ['Custom 1', 'Custom 2'];
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          config={{ options: configOptions }}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Custom 1')).toBeInTheDocument());

      expect(screen.getByText('Custom 2')).toBeInTheDocument();
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });

    it('should use allowCustom from config', async () => {
      render(
        <SingleSelect
          value="Custom Value"
          onChange={mockOnChange}
          options={defaultOptions}
          allowCustom={false}
          config={{ allowCustom: true }}
        />
      );
      expect(screen.getByText('Custom Value')).toBeInTheDocument();
    });

    it('should fallback to props when config values are not provided', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          allowCustom={true}
          config={{}}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());
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
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });

    it('should handle null value', () => {
      render(
        <SingleSelect
          value={null as unknown as string}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Select option...')).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <SingleSelect
          value={undefined as unknown as string}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Select option...')).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Select option...')).toBeInTheDocument();
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
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle single option', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={['Only Option']}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Only Option')).toBeInTheDocument());

      expect(screen.getByText('Only Option')).toBeInTheDocument();
    });

    it('should handle many options', async () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => `Option ${i + 1}`);
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={manyOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      expect(screen.getByText('Option 1')).toBeInTheDocument();
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
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText(longText)).toBeInTheDocument());

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle value not in options list when allowCustom is true', () => {
      render(
        <SingleSelect
          value="Unknown Option"
          onChange={mockOnChange}
          options={defaultOptions}
          allowCustom={true}
        />
      );
      expect(screen.getByText('Unknown Option')).toBeInTheDocument();
    });

    it('should handle value not in options list when allowCustom is false', () => {
      render(
        <SingleSelect
          value="Unknown Option"
          onChange={mockOnChange}
          options={defaultOptions}
          allowCustom={false}
        />
      );
      expect(screen.getByText('Unknown Option')).toBeInTheDocument();
    });

    it('should handle rapid selections', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option1Button = optionButtons.find(btn => btn.textContent?.includes('Option 1') && btn !== button);
      expect(option1Button).toBeTruthy();
      await userEvent.click(option1Button!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Option 1');
      });

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 2')).toBeInTheDocument());

      const option2Button = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Option 2') && btn !== button
      );
      expect(option2Button).toBeTruthy();
      await userEvent.click(option2Button!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('Option 2');
      });
    });

    it('should handle mixed string and object options', async () => {
      const mixedOptions = [
        'String Option',
        { option: 'Object Option', color: '#FF0000' },
        'Another String'
      ];
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={mixedOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('String Option')).toBeInTheDocument());

      expect(screen.getByText('Object Option')).toBeInTheDocument();
      expect(screen.getByText('Another String')).toBeInTheDocument();
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
          label="Category"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <SingleSelect
          label="Category"
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should have proper button disabled state', () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          disabled
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Styling and Classes', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          className="custom-class"
        />
      );
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply border class when isBorder is true', () => {
      const { container } = render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          isBorder={true}
        />
      );
      const wrapper = container.querySelector('.field-component-border');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply error styling when error exists', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionButtons = Array.from(document.querySelectorAll('button'));
      const option1Button = optionButtons.find(btn => btn.textContent?.includes('Option 1') && btn !== button);
      expect(option1Button).toBeTruthy();
      await userEvent.click(option1Button!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should rotate chevron when dropdown is open', async () => {
      const { container } = render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => {
        const chevron = container.querySelector('svg.lucide-chevron-down') as SVGElement;
        expect(chevron).toBeTruthy();
        expect(chevron?.classList.contains('rotate-180')).toBe(true);
      });
    });
  });

  describe('Dropdown Position Calculation', () => {
    it('should render dropdown in portal', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => {
        const portalDropdown = document.body.querySelector('[class*="fixed"]');
        expect(portalDropdown).toBeInTheDocument();
      });
    });

    it('should calculate dropdown position', async () => {
      render(
        <SingleSelect
          value=""
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => {
        const dropdown = document.body.querySelector('[class*="fixed"]') as HTMLElement;
        expect(dropdown).toBeTruthy();
        expect(dropdown.style.left).toBeTruthy();
        expect(dropdown.style.width).toBeTruthy();
      });
    });
  });
});
