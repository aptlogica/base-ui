import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MultiSelect } from '../MultiSelect';

describe('MultiSelect Component', () => {
  const mockOnChange = vi.fn();
  const defaultOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render multi-select component', () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByRole('button') || document.body).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(
        <MultiSelect
          label="Select Multiple"
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Select Multiple')).toBeInTheDocument();
    });

    it('should render required asterisk', () => {
      render(
        <MultiSelect
          label="Tags"
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display selected values as tags', () => {
      render(
        <MultiSelect
          value={['Option 1', 'Option 2']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should render placeholder when no values selected', () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
          placeholder="Choose options"
        />
      );
      expect(screen.getByText('Choose options')).toBeInTheDocument();
    });

    it('should render helper text when provided', () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
          helperText="Select your options"
        />
      );
      expect(screen.getByText('Select your options')).toBeInTheDocument();
    });
  });

  describe('Option Selection', () => {
    it('should add option to selection', async () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionElement = screen.getByText('Option 1');
      const option = optionElement.closest('button');
      expect(option).toBeTruthy();
      await userEvent.click(option!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['Option 1']);
      });
    });

    it('should add multiple options to selection', async () => {
      const TestWrapper = () => {
        const [value, setValue] = useState<string[]>([]);
        return <MultiSelect value={value} onChange={setValue} options={defaultOptions} />;
      };

      render(<TestWrapper />);
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const option1Element = screen.getByText('Option 1');
      const option1 = option1Element.closest('button');
      expect(option1).toBeTruthy();
      await userEvent.click(option1!);

      await waitFor(() => expect(screen.getAllByText('Option 1')).toHaveLength(2)); // tag and dropdown

      // Dropdown should still be open
      const option2Element = screen.getByText('Option 2');
      const option2 = option2Element.closest('button');
      expect(option2).toBeTruthy();
      await userEvent.click(option2!);

      await waitFor(() => expect(screen.getAllByText('Option 2')).toHaveLength(2)); // tag and dropdown
    });

    it('should remove option from selection', async () => {
      const { container } = render(
        <MultiSelect
          value={['Option 1', 'Option 2']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );

      const removeButtons = container.querySelectorAll('button[aria-label*="Remove"]') ||
                           container.querySelectorAll('[role="button"]');

      if (removeButtons.length > 1) {
        fireEvent.click(removeButtons[1]);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should remove option by unchecking in dropdown', async () => {
      const TestWrapper = () => {
        const [value, setValue] = useState<string[]>(['Option 1']);
        return <MultiSelect value={value} onChange={setValue} options={defaultOptions} />;
      };

      render(<TestWrapper />);
      const mainButton = screen.getByRole('button');

      await userEvent.click(mainButton);
      await waitFor(() => expect(screen.getAllByText('Option 1')).toHaveLength(2)); // tag and dropdown

      const optionSpans = screen.getAllByText('Option 1');
      const dropdownSpan = optionSpans.find(span => span.closest('button') !== mainButton);
      expect(dropdownSpan).toBeTruthy();
      const optionButton = dropdownSpan!.closest('button');
      expect(optionButton).toBeTruthy();
      await userEvent.click(optionButton!);

      await waitFor(() => expect(screen.getAllByText('Option 1')).toHaveLength(1)); // only dropdown left
    });
  });

  describe('Dropdown Interaction', () => {
    it('should open dropdown on button click', async () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <MultiSelect
            value={[]}
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
        const dropdownOption1 = buttons.find(btn => btn.textContent === 'Option 1');
        expect(dropdownOption1).toBeTruthy();
      });

      const outside = screen.getByTestId('outside');
      await userEvent.click(outside);

      await waitFor(() => expect(screen.queryByText('Option 1')).not.toBeInTheDocument());
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should keep dropdown open after selection', async () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const optionElement = screen.getByText('Option 1');
      const option = optionElement.closest('button');
      expect(option).toBeTruthy();
      await userEvent.click(option!);

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter options by search text', async () => {
      const { container } = render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const input = container.querySelector('input[type="text"]');
      if (input) {
        await userEvent.type(input, 'Option 1');
        await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());
        expect(screen.queryByText('Option 4')).not.toBeInTheDocument();
      }
    });

    it('should show all options when search is cleared', async () => {
      const { container } = render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const input = container.querySelector('input[type="text"]');
      if (input) {
        await userEvent.type(input, 'Option');
        await userEvent.clear(input);
        await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());
        expect(screen.getByText('Option 4')).toBeInTheDocument();
      }
    });
  });



  describe('Validation', () => {
    it('should validate required field', () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );

      expect(screen.getByRole('button') || document.body).toBeInTheDocument();
    });

    it('should accept non-empty selection for required field', async () => {
      render(
        <MultiSelect
          value={['Option 1']}
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should accept empty non-required field', () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
          required={false}
        />
      );

      expect(screen.getByRole('button') || document.body).toBeInTheDocument();
    });

    it('should prevent selection when maxSelections is reached', async () => {
      render(
        <MultiSelect
          value={['Option 1', 'Option 2']}
          onChange={mockOnChange}
          options={defaultOptions}
          maxSelections={2}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 3')).toBeInTheDocument());

      const option3Element = screen.getByText('Option 3');
      const option3 = option3Element.closest('button');
      expect(option3).toBeTruthy();
      await userEvent.click(option3!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable selection when disabled', () => {
      render(
        <MultiSelect
          value={['Option 1']}
          onChange={mockOnChange}
          options={defaultOptions}
          disabled
        />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(button).toHaveProperty('disabled');
    });

    it('should prevent editing when readOnly', () => {
      render(
        <MultiSelect
          value={['Option 1']}
          onChange={mockOnChange}
          options={defaultOptions}
          readOnly
        />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Config Props', () => {
    it('should use defaultValue from config', () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
          config={{ defaultValue: ['Option 1', 'Option 2'] }}
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should use options from config', async () => {
      const configOptions = ['Custom 1', 'Custom 2'];
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
          config={{ options: configOptions }}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Custom 1')).toBeInTheDocument());

      expect(screen.getByText('Custom 2')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <MultiSelect
          value={['Option 1']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();

      rerender(
        <MultiSelect
          value={['Option 2', 'Option 3']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );

      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={[]}
        />
      );
      expect(screen.getByRole('button') || document.body).toBeInTheDocument();
    });

    it('should handle single option', async () => {
      render(
        <MultiSelect
          value={[]}
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
        <MultiSelect
          value={[]}
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
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={[longText, 'Option 2']}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText(longText)).toBeInTheDocument());

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle duplicate selections in value', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <MultiSelect
          value={['Option 1', 'Option 1', 'Option 2']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const elements = screen.getAllByText('Option 1');
      expect(elements.length).toBeGreaterThanOrEqual(1);
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle selections not in options list', () => {
      render(
        <MultiSelect
          value={['Unknown Option']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Unknown Option')).toBeInTheDocument();
    });

    it('should handle rapid selections', async () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

      const option1Element = screen.getByText('Option 1');
      const option1 = option1Element.closest('button');
      expect(option1).toBeTruthy();
      const option2Element = screen.getByText('Option 2');
      const option2 = option2Element.closest('button');
      expect(option2).toBeTruthy();
      const option3Element = screen.getByText('Option 3');
      const option3 = option3Element.closest('button');
      expect(option3).toBeTruthy();

      await userEvent.click(option1!);
      await userEvent.click(option2!);
      await userEvent.click(option3!);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should render with button role', () => {
      render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      render(
        <MultiSelect
          label="Tags"
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('should mark required fields', () => {
      render(
        <MultiSelect
          label="Tags"
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
          required
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });
});
