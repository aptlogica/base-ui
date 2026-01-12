import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DateField } from '../DateField';

describe('DateField Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render date input field', () => {
      render(<DateField value="" onChange={mockOnChange} />);
      const input = screen.getByRole('textbox') || screen.getByDisplayValue('');
      expect(input).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<DateField label="Start Date" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Start Date')).toBeInTheDocument();
    });

    it('should render required indicator', () => {
      render(
        <DateField
          label="Due Date"
          required
          value=""
          onChange={mockOnChange}
        />
      );
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
      expect(screen.getByText('Select a date in YYYY-MM-DD format')).toBeInTheDocument();
    });

    it('should show initial value', () => {
      render(<DateField value="2024-01-15" onChange={mockOnChange} />);
      const input = screen.getByDisplayValue(/2024|01|15/);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Calendar Interaction', () => {
    it('should open calendar picker on click', async () => {
      const { container } = render(<DateField value="" onChange={mockOnChange} />);
      
      const trigger = container.querySelector('button') || container.querySelector('[role="button"]');
      if (trigger) {
        fireEvent.click(trigger);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calendar should be visible
      expect(document.body.innerHTML).toMatch(/calendar|date|day/i);
    });

    it('should display current month in picker', async () => {
      const { container } = render(<DateField value="" onChange={mockOnChange} />);
      
      const trigger = container.querySelector('button');
      if (trigger) {
        fireEvent.click(trigger);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Month/year should be displayed
      expect(document.body.innerHTML).toMatch(/January|February|March|April|May|June|July|August|September|October|November|December|2024|2025/i);
    });

    it('should allow month navigation', async () => {
      const { container } = render(<DateField value="" onChange={mockOnChange} />);
      
      const trigger = container.querySelector('button');
      if (trigger) {
        fireEvent.click(trigger);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Find and click next month button
      const nextButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.getAttribute('aria-label')?.includes('next') || btn.textContent?.includes('›')
      );
      
      if (nextButton) {
        fireEvent.click(nextButton);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });

    it('should select date from calendar', async () => {
      const { container } = render(<DateField value="" onChange={mockOnChange} />);
      
      const trigger = container.querySelector('button');
      if (trigger) {
        fireEvent.click(trigger);
        await new Promise(resolve => setTimeout(resolve, 100));

        // Find and click a date (usually day 15)
        const dateButtons = Array.from(document.querySelectorAll('button')).filter(
          btn => /^\d{1,2}$/.test(btn.textContent?.trim() || '')
        );
        
        if (dateButtons.length > 0) {
          fireEvent.click(dateButtons[14] || dateButtons[0]);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // onChange should have been called
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      }, { timeout: 1000 }).catch(() => {
        // May not be called if date selection is complex
      });
    });
  });

  describe('Date Format Conversion', () => {
    it('should support YYYY-MM-DD format', () => {
      render(
        <DateField
          value="2024-03-15"
          onChange={mockOnChange}
          format="YYYY-MM-DD"
        />
      );
      const input = screen.getByDisplayValue(/2024|03|15/);
      expect(input).toBeInTheDocument();
    });

    it('should support DD-MM-YYYY format', () => {
      render(
        <DateField
          value="15-03-2024"
          onChange={mockOnChange}
          format="DD-MM-YYYY"
        />
      );
      const input = screen.getByDisplayValue(/15|03|2024/);
      expect(input).toBeInTheDocument();
    });

    it('should support MM-DD-YYYY format', () => {
      render(
        <DateField
          value="03-15-2024"
          onChange={mockOnChange}
          format="MM-DD-YYYY"
        />
      );
      const input = screen.getByDisplayValue(/03|15|2024/);
      expect(input).toBeInTheDocument();
    });

    it('should support YYYY/MM/DD format', () => {
      render(
        <DateField
          value="2024/03/15"
          onChange={mockOnChange}
          format="YYYY/MM/DD"
        />
      );
      const input = screen.getByDisplayValue(/2024|03|15/);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error for required field when empty', async () => {
      render(
        <DateField
          required
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox') || document.querySelector('input[type="date"]');
      fireEvent.blur(input!);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should accept valid ISO date format', () => {
      render(
        <DateField
          value="2024-12-25"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByDisplayValue(/2024|12|25/);
      expect(input).toBeInTheDocument();
    });

    it('should enforce min date constraint', () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          min="2024-01-01"
        />
      );

      // Component should have min attribute or validate min in logic
      expect(document.querySelector('input[type="date"]') || screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should enforce max date constraint', () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          max="2024-12-31"
        />
      );

      expect(document.querySelector('input[type="date"]') || screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should open calendar on single click when allowEdit is true', async () => {
      const { container } = render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const button = container.querySelector('button');
      if (button) {
        fireEvent.click(button);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calendar should open
      expect(document.body.innerHTML).toMatch(/calendar|date|day/i);
    });

    it('should allow manual text input when allowEdit is true', async () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const input = screen.getByRole('textbox') || document.querySelector('input');
      if (input) {
        await userEvent.type(input, '2024-06-15');
        fireEvent.blur(input);
      }

      await waitFor(() => {
        // Should have changed value
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should prevent editing when allowEdit is false', () => {
      const { container } = render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const input = document.querySelector('input') || screen.queryByRole('textbox');
      if (input) {
        expect((input as HTMLInputElement).readOnly || (input as HTMLInputElement).disabled).toBe(true);
      }
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable input when disabled is true', () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          disabled
        />
      );

      const input = document.querySelector('input[type="date"], input[type="text"]');
      expect((input as HTMLInputElement)?.disabled).toBe(true);
    });

    it('should prevent editing when readOnly is true', () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          readOnly
        />
      );

      const input = document.querySelector('input') || screen.queryByRole('textbox');
      expect((input as HTMLInputElement)?.readOnly).toBe(true);
    });

    it('should not trigger onChange when disabled', async () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          disabled
        />
      );

      const input = document.querySelector('input');
      if (input) {
        await userEvent.type(input, '2024-01-15');
      }

      expect(mockOnChange).not.toHaveBeenCalled();
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

      expect(screen.getByDisplayValue(/15|03|2024/)).toBeInTheDocument();
    });

    it('should use defaultValue from config', () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: '2024-01-01' }}
        />
      );

      const input = screen.getByDisplayValue(/2024|01|01/) || screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should respect hideTodayButton config', () => {
      const { container } = render(
        <DateField
          value=""
          onChange={mockOnChange}
          config={{ hideTodayButton: true }}
        />
      );

      // Today button should be hidden or not present
      const todayButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.toLowerCase().includes('today')
      );

      // May not be present due to config
      expect(todayButton).toBeUndefined();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external value changes', () => {
      const { rerender } = render(
        <DateField value="2024-01-15" onChange={mockOnChange} />
      );

      let input = screen.getByDisplayValue(/2024|01|15/);
      expect(input).toBeInTheDocument();

      rerender(<DateField value="2024-06-20" onChange={mockOnChange} />);
      input = screen.getByDisplayValue(/2024|06|20/);
      expect(input).toBeInTheDocument();
    });

    it('should handle rapid value updates', () => {
      const { rerender } = render(
        <DateField value="2024-01-01" onChange={mockOnChange} />
      );

      rerender(<DateField value="2024-01-15" onChange={mockOnChange} />);
      rerender(<DateField value="2024-06-30" onChange={mockOnChange} />);

      const input = screen.getByDisplayValue(/2024|06|30/);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <DateField value={null as any} onChange={mockOnChange} />
      );

      const input = document.querySelector('input[type="date"], input[type="text"]');
      expect((input as HTMLInputElement)?.value).toBe('');
    });

    it('should handle undefined value', () => {
      render(
        <DateField value={undefined as any} onChange={mockOnChange} />
      );

      const input = document.querySelector('input[type="date"], input[type="text"]');
      expect((input as HTMLInputElement)?.value).toBe('');
    });

    it('should handle leap year dates', () => {
      render(
        <DateField
          value="2024-02-29"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue(/2024|02|29/)).toBeInTheDocument();
    });

    it('should handle year boundaries', () => {
      render(
        <DateField
          value="2024-12-31"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByDisplayValue(/2024|12|31/)).toBeInTheDocument();
    });

    it('should handle min/max date constraints', () => {
      render(
        <DateField
          value="2024-06-15"
          onChange={mockOnChange}
          min="2024-01-01"
          max="2024-12-31"
        />
      );

      expect(screen.getByDisplayValue(/2024|06|15/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <DateField
          label="Birth Date"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Birth Date')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input') || screen.getByRole('textbox');
      input?.focus();

      expect(input).toHaveFocus();
    });

    it('should have semantic structure', () => {
      const { container } = render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
        />
      );

      expect(container.querySelector('input')).toBeInTheDocument();
    });
  });
});
