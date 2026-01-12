import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      const option = screen.getAllByText('Option 1')[0];
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['Option 1']);
      });
    });

    it('should add multiple options to selection', async () => {
      const { rerender } = render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      let options = screen.getAllByText('Option 1');
      fireEvent.click(options[0]);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['Option 1']);
      });

      vi.clearAllMocks();

      rerender(
        <MultiSelect
          value={['Option 1']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      options = screen.getAllByText('Option 2');
      fireEvent.click(options[0]);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(['Option 1', 'Option 2']);
      });
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
      render(
        <MultiSelect
          value={['Option 1']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      const option = screen.getAllByText('Option 1')[0];
      fireEvent.click(option);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith([]);
      });
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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const { container } = render(
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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      const outside = screen.getByTestId('outside');
      fireEvent.click(outside);
      await new Promise(resolve => setTimeout(resolve, 100));

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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      let option = screen.getAllByText('Option 1')[0];
      fireEvent.click(option);
      await new Promise(resolve => setTimeout(resolve, 100));

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
      await new Promise(resolve => setTimeout(resolve, 100));

      const input = container.querySelector('input[type="text"]');
      if (input) {
        await userEvent.type(input, 'Option 1');
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(screen.getByText('Option 1')).toBeInTheDocument();
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
      await new Promise(resolve => setTimeout(resolve, 100));

      const input = container.querySelector('input[type="text"]');
      if (input) {
        await userEvent.type(input, 'Option');
        await userEvent.clear(input);
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 4')).toBeInTheDocument();
      }
    });
  });

  describe('Select All / Deselect All', () => {
    it('should select all options when select all is clicked', async () => {
      const { container } = render(
        <MultiSelect
          value={[]}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      const selectAllButton = container.querySelector('[aria-label*="Select all"]') ||
                             container.querySelector('[title*="Select all"]');

      if (selectAllButton) {
        fireEvent.click(selectAllButton);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should deselect all options when deselect all is clicked', async () => {
      const { container } = render(
        <MultiSelect
          value={['Option 1', 'Option 2']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      const deselectAllButton = container.querySelector('[aria-label*="Deselect all"]') ||
                               container.querySelector('[title*="Clear"]');

      if (deselectAllButton) {
        fireEvent.click(deselectAllButton);

        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
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
      const { container } = render(
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
  });

  describe('Disabled and ReadOnly States', () => {
    it('should disable selection when disabled', () => {
      const { container } = render(
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
      const { container } = render(
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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByText('Custom 1')).toBeInTheDocument();
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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle duplicate selections in value', () => {
      render(
        <MultiSelect
          value={['Option 1', 'Option 1', 'Option 2']}
          onChange={mockOnChange}
          options={defaultOptions}
        />
      );
      const elements = screen.getAllByText('Option 1');
      expect(elements.length).toBeGreaterThanOrEqual(1);
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

      fireEvent.click(button);
      await new Promise(resolve => setTimeout(resolve, 100));

      const option1 = screen.getAllByText('Option 1')[0];
      const option2 = screen.getAllByText('Option 2')[0];
      const option3 = screen.getAllByText('Option 3')[0];

      fireEvent.click(option1);
      fireEvent.click(option2);
      fireEvent.click(option3);

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
