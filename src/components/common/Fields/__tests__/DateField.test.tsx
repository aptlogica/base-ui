import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateField } from '../DateField';

describe('DateField Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  const getTriggerButton = () =>
    screen.getByRole('button', {
      name: /yyyy|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}/i,
    });

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render date field trigger button', () => {
      render(<DateField value="" onChange={mockOnChange} />);
      expect(getTriggerButton()).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<DateField label="Start Date" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Start Date')).toBeInTheDocument();
    });

    it('should render required indicator', () => {
      render(<DateField label="Due Date" required value="" onChange={mockOnChange} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display helper text', () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          helperText="Select a date in YYYY-MM-DD format"
        />
      );
      expect(screen.getByText(/select a date/i)).toBeInTheDocument();
    });

    it('should show initial value', () => {
      render(<DateField value="2024-01-15" onChange={mockOnChange} />);
      expect(
        screen.getByRole('button', { name: /2024-01-15/ })
      ).toBeInTheDocument();
    });
  });

  describe('Calendar Interaction', () => {
    it('should open calendar picker on click', async () => {
      render(<DateField value="" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/mo|tu|we|th|fr|sa|su/i);
      });
    });

    it('should display current month in picker', async () => {
      render(<DateField value="" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(
          /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i
        );
      });
    });

    it('should select date from calendar', async () => {
      render(<DateField value="" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      const dayButton = await screen.findByRole('button', { name: /^15$/ });
      fireEvent.click(dayButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Date Format Conversion', () => {
    it('should support YYYY-MM-DD format', () => {
      render(
        <DateField value="2024-03-15" onChange={mockOnChange} format="YYYY-MM-DD" />
      );
      expect(
        screen.getByRole('button', { name: /2024-03-15/ })
      ).toBeInTheDocument();
    });

    it('should support DD-MM-YYYY format', () => {
      render(
        <DateField value="15-03-2024" onChange={mockOnChange} format="DD-MM-YYYY" />
      );
      expect(
        screen.getByRole('button', { name: /15-03-2024/ })
      ).toBeInTheDocument();
    });

    it('should support MM-DD-YYYY format', () => {
      render(
        <DateField value="03-15-2024" onChange={mockOnChange} format="MM-DD-YYYY" />
      );
      expect(
        screen.getByRole('button', { name: /03-15-2024/ })
      ).toBeInTheDocument();
    });

    it('should support YYYY/MM/DD format', () => {
      render(
        <DateField value="2024/03/15" onChange={mockOnChange} format="YYYY/MM/DD" />
      );
      expect(
        screen.getByRole('button', { name: /2024\/03\/15/ })
      ).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should not trigger onChange for required field when empty', async () => {
      render(<DateField required value="" onChange={mockOnChange} />);
      fireEvent.blur(getTriggerButton());

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });
    });

    it('should accept valid ISO date format', () => {
      render(<DateField value="2024-12-25" onChange={mockOnChange} />);
      expect(
        screen.getByRole('button', { name: /2024-12-25/ })
      ).toBeInTheDocument();
    });

    it('should render when min date is provided', () => {
      render(<DateField value="" onChange={mockOnChange} min="2024-01-01" />);
      expect(getTriggerButton()).toBeInTheDocument();
    });

    it('should render when max date is provided', () => {
      render(<DateField value="" onChange={mockOnChange} max="2024-12-31" />);
      expect(getTriggerButton()).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should allow interaction when allowEdit is true', async () => {
      render(<DateField value="" onChange={mockOnChange} allowEdit />);
      fireEvent.click(getTriggerButton());

      const dayButton = await screen.findByRole('button', { name: /^15$/ });
      fireEvent.click(dayButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should prevent editing when allowEdit is false', async () => {
      render(
        <DateField value="2024-01-15" onChange={mockOnChange} allowEdit={false} />
      );

      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable trigger when disabled is true', () => {
      render(<DateField value="2024-01-15" onChange={mockOnChange} disabled />);
      expect(getTriggerButton()).toBeDisabled();
    });

    it('should prevent interaction when readOnly is true', async () => {
      render(<DateField value="2024-01-15" onChange={mockOnChange} readOnly />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('Configuration Props', () => {
    it('should use dateFormat from config', () => {
      render(
        <DateField
          value="2024-03-15"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD-MM-YYYY' }}
        />
      );
      expect(
        screen.getByRole('button', { name: /15-03-2024/ })
      ).toBeInTheDocument();
    });

    it('should use defaultValue from config', () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: '2024-01-01' }}
        />
      );
      expect(
        screen.getByRole('button', { name: /2024-01-01/ })
      ).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external value changes', () => {
      const { rerender } = render(
        <DateField value="2024-01-15" onChange={mockOnChange} />
      );

      expect(
        screen.getByRole('button', { name: /2024-01-15/ })
      ).toBeInTheDocument();

      rerender(<DateField value="2024-06-20" onChange={mockOnChange} />);
      expect(
        screen.getByRole('button', { name: /2024-06-20/ })
      ).toBeInTheDocument();
    });

    it('should handle rapid value updates', () => {
      const { rerender } = render(
        <DateField value="2024-01-01" onChange={mockOnChange} />
      );

      rerender(<DateField value="2024-01-15" onChange={mockOnChange} />);
      rerender(<DateField value="2024-06-30" onChange={mockOnChange} />);

      expect(
        screen.getByRole('button', { name: /2024-06-30/ })
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(<DateField value={null as any} onChange={mockOnChange} />);
      expect(getTriggerButton()).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(<DateField value={undefined as any} onChange={mockOnChange} />);
      expect(getTriggerButton()).toBeInTheDocument();
    });

    it('should handle leap year dates', () => {
      render(<DateField value="2024-02-29" onChange={mockOnChange} />);
      expect(
        screen.getByRole('button', { name: /2024-02-29/ })
      ).toBeInTheDocument();
    });

    it('should handle year boundaries', () => {
      render(<DateField value="2024-12-31" onChange={mockOnChange} />);
      expect(
        screen.getByRole('button', { name: /2024-12-31/ })
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard focus', () => {
      render(<DateField value="" onChange={mockOnChange} />);
      const button = getTriggerButton();
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should have semantic button structure', () => {
      render(<DateField value="2024-01-15" onChange={mockOnChange} />);
      expect(getTriggerButton().tagName.toLowerCase()).toBe('button');
    });
  });
});
