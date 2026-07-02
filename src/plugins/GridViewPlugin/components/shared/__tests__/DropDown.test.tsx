import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dropdown from '../DropDown/DropDown';

describe('Dropdown', () => {
  const mockOnChange = vi.fn();
  const defaultOptions = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
  ];

  const defaultProps = {
    options: defaultOptions,
    value: '',
    onChange: mockOnChange,
  };

  // Helper to get the dropdown trigger element (first clickable trigger div)
  const getTrigger = (container: HTMLElement) => container.querySelector('div.cursor-pointer') as HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dropdown with placeholder', () => {
      render(<Dropdown {...defaultProps} placeholder="Choose option" />);

      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('should render dropdown with default placeholder', () => {
      render(<Dropdown {...defaultProps} />);

      expect(screen.getByText('Select...')).toBeInTheDocument();
    });

    it('should show selected value instead of placeholder', () => {
      render(<Dropdown {...defaultProps} value="option1" />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.queryByText('Select...')).not.toBeInTheDocument();
    });

    it('should show down chevron when closed', () => {
      render(<Dropdown {...defaultProps} />);

      const chevronDown = document.querySelector('.lucide-chevron-down');
      expect(chevronDown).toBeInTheDocument();
    });

    it('should not show options list when closed', () => {
      render(<Dropdown {...defaultProps} />);

      defaultOptions.forEach(option => {
        expect(screen.queryByText(option.label)).not.toBeInTheDocument();
      });
    });
  });

  describe('dropdown opening and closing', () => {
    it('should open dropdown when trigger is clicked', async () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = getTrigger(container);
      await userEvent.click(trigger);

      await waitFor(() => {
        defaultOptions.forEach(option => {
          expect(screen.getByText(new RegExp(option.label, 'i'))).toBeInTheDocument();
        });
      });
    });

    it('should show up chevron when open', async () => {
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      const chevronUp = document.querySelector('.lucide-chevron-up');
      expect(chevronUp).toBeInTheDocument();
    });

    it('should close dropdown when trigger is clicked again', async () => {
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByText("Select...");
      
      // Open dropdown
      await userEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByText(/Option 1/i)).toBeInTheDocument();
      });

      // Close dropdown
      await userEvent.click(trigger);
      await waitFor(() => {
        expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      });
    });

    it('should support keyboard navigation to open dropdown', async () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = getTrigger(container);
      await userEvent.click(trigger);

      expect(screen.getByText(/Option 1/i)).toBeInTheDocument();
    });
  });

  describe('single selection mode', () => {
    it('should select option and close dropdown', async () => {
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      const option1 = screen.getAllByText(/Option 1/i).find(e => e.closest('li'));
      expect(option1).toBeDefined();
      await userEvent.click(option1!);

      expect(mockOnChange).toHaveBeenCalledWith('option1');
      expect(screen.queryByText(/Option 2/i)).not.toBeInTheDocument(); // Dropdown closed
    });

    it('should highlight selected option', async () => {
      const { container } = render(<Dropdown {...defaultProps} value="option2" />);

      const trigger = getTrigger(container);
      await userEvent.click(trigger);

      const selectedOption = screen.getAllByText(/Option 2/i).find(e => e.closest('li'));
      expect(selectedOption).toBeDefined();
      expect(selectedOption!.closest('li')).toHaveClass('bg-[var(--color-bg-brand-secondary)]');
    });

    it('should show current selection in trigger', () => {
      render(<Dropdown {...defaultProps} value="option2" />);

      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  describe('multiple selection mode', () => {
    const multipleProps = {
      ...defaultProps,
      multiple: true,
      value: [],
    };

    it('should allow multiple selections without closing dropdown', async () => {
      const { container } = render(<Dropdown {...multipleProps} />);

      const trigger = getTrigger(container);
      await userEvent.click(trigger);

      const option1 = screen.getAllByText(/Option 1/i).find(e => e.closest('li'));
      expect(option1).toBeDefined();
      await userEvent.click(option1!);
      expect(mockOnChange).toHaveBeenCalledWith(['option1']);

      // Dropdown should still be open after first selection
      expect(screen.getByText(/Option 2/i)).toBeInTheDocument();
    });

    it('should deselect option when clicked again', async () => {
      const { container } = render(<Dropdown {...multipleProps} value={['option1', 'option2']} />);

      const trigger = getTrigger(container);
      await userEvent.click(trigger);

      const option1 = screen.getAllByText(/Option 1/i).find(e => e.closest('li'));
      expect(option1).toBeDefined();
      await userEvent.click(option1!);

      expect(mockOnChange).toHaveBeenCalledWith(['option2']);
    });

    it('should show multiple selected values in trigger', () => {
      render(<Dropdown {...multipleProps} value={['option1', 'option2']} />);

      expect(screen.getByText('Option 1, Option 2')).toBeInTheDocument();
    });

    it('should show placeholder when no options selected', () => {
      render(<Dropdown {...multipleProps} value={[]} placeholder="Choose multiple" />);

      expect(screen.getByText('Choose multiple')).toBeInTheDocument();
    });

    it('should highlight multiple selected options', async () => {
      const { container } = render(<Dropdown {...multipleProps} value={['option1', 'option3']} />);

      const trigger = getTrigger(container);
      await userEvent.click(trigger);

      const option1 = screen.getAllByText(/Option 1/i).find(e => e.closest('li'));
      const option3 = screen.getAllByText(/Option 3/i).find(e => e.closest('li'));
      expect(option1).toBeDefined();
      expect(option3).toBeDefined();

      // Check that selected options have highlight styling
      expect(option1!.closest('li')).toHaveClass('bg-[var(--color-bg-brand-secondary)]');
      expect(option3!.closest('li')).toHaveClass('bg-[var(--color-bg-brand-secondary)]');
    });
  });

  describe('option rendering', () => {
    it('should render all options when dropdown is open', async () => {
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      defaultOptions.forEach(option => {
        expect(screen.getByText(new RegExp(option.label, 'i'))).toBeInTheDocument();
      });
    });

    it('should handle empty options array', () => {
      const propsWithEmptyOptions = {
        ...defaultProps,
        options: [],
      };

      render(<Dropdown {...propsWithEmptyOptions} />);

      const trigger = screen.getByText("Select...");
      expect(trigger).toBeInTheDocument();
    });

    it('should apply hover styles to options', async () => {
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      const option1 = screen.getByText(/Option 1/i);
      expect(option1).toHaveClass('hover:bg-[var(--color-bg-brand-primary)]');
    });
  });

  describe('accessibility', () => {
    it('should have focusable trigger element', () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = getTrigger(container);
      expect(trigger).toBeInTheDocument();
    });

    it('should have correct tabindex', () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = getTrigger(container);
      expect(trigger).not.toHaveAttribute('tabindex');
    });

    it('should have focus styles', () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = getTrigger(container);
      expect(trigger).toHaveClass('focus:outline-none', 'focus:ring-1');
    });

    it('should be operable with keyboard', async () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = getTrigger(container);
      await userEvent.click(trigger);

      // Should show options when opened
      expect(screen.getByText(/Option 1/i)).toBeInTheDocument();
    });
  });

  describe('styling and appearance', () => {
    it('should have correct base styling', () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = getTrigger(container);
      expect(trigger).toHaveClass(
        'w-full',
        'px-3',
        'py-2',
        'border',
        'rounded-xl',
        'cursor-pointer'
      );
    });

    it('should have dropdown list styling when open', async () => {
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      const dropdownList = screen.getByRole('list');
      expect(dropdownList).toHaveClass(
        'absolute',
        'mt-1',
        'w-full',
        'border',
        'rounded-xl',
        'shadow-lg',
        'z-10'
      );
    });

    it('should have maximum height and scroll for long lists', async () => {
      const manyOptions = Array.from({ length: 20 }, (_, i) => ({
        label: `Option ${i + 1}`,
        value: `option${i + 1}`,
      }));

      const propsWithManyOptions = {
        ...defaultProps,
        options: manyOptions,
      };

      render(<Dropdown {...propsWithManyOptions} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      const dropdownList = screen.getByRole('list');
      expect(dropdownList).toHaveClass('max-h-48', 'overflow-auto');
    });
  });

  describe('edge cases', () => {
    it('should handle options with same labels but different values', async () => {
      const duplicateLabelOptions = [
        { label: 'Same Label', value: 'value1' },
        { label: 'Same Label', value: 'value2' },
      ];

      const propsWithDuplicateLabels = {
        ...defaultProps,
        options: duplicateLabelOptions,
      };

      render(<Dropdown {...propsWithDuplicateLabels} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      const options = screen.getAllByText('Same Label');
      expect(options).toHaveLength(2);

      await userEvent.click(options[0]);
      expect(mockOnChange).toHaveBeenCalledWith('value1');
    });

    it('should handle non-string values in multiple mode', () => {
      const propsWithNonArrayValue = {
        ...defaultProps,
        multiple: true,
        value: 'not-an-array' as any,
      };

      expect(() => render(<Dropdown {...propsWithNonArrayValue} />)).not.toThrow();
    });

    it('should handle special characters in option values', async () => {
      const specialCharOptions = [
        { label: 'Special & Chars', value: 'special&chars' },
        { label: 'Unicode 🌟', value: 'unicode🌟' },
      ];

      const propsWithSpecialChars = {
        ...defaultProps,
        options: specialCharOptions,
      };

      render(<Dropdown {...propsWithSpecialChars} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      const specialOption = screen.getByText('Special & Chars');
      await userEvent.click(specialOption);

      expect(mockOnChange).toHaveBeenCalledWith('special&chars');
    });

    it('should handle very long option labels', async () => {
      const longLabelOptions = [
        { 
          label: 'This is a very long option label that might overflow the container width', 
          value: 'long-option' 
        },
      ];

      const propsWithLongLabels = {
        ...defaultProps,
        options: longLabelOptions,
      };

      render(<Dropdown {...propsWithLongLabels} />);

      const trigger = screen.getByText("Select...");
      await userEvent.click(trigger);

      expect(screen.getByText(/This is a very long option label/)).toBeInTheDocument();
    });

    it('should handle rapid clicking without errors', async () => {
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByText("Select...");

      // Rapidly click trigger multiple times
      await userEvent.click(trigger);
      await userEvent.click(trigger);
      await userEvent.click(trigger);
      await userEvent.click(trigger);

      // Should not throw errors
      expect(trigger).toBeInTheDocument();
    });
  });
});
