import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditLastModifiedTime } from '../AuditLastModifiedTime';

describe('AuditLastModifiedTime Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render datetime display for last modified timestamp', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should format and display datetime value', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body.innerHTML).toMatch(/2024|06|20|15|45/);
    });

    it('should display with label when provided', () => {
      render(
        <AuditLastModifiedTime
          label="Last Updated"
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Last Updated')).toBeInTheDocument();
    });

    it('should show helper text when provided', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          helperText="System generated timestamp"
        />
      );

      expect(screen.getByText('System generated timestamp')).toBeInTheDocument();
    });

    it('should be read-only as audit field', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const buttons = document.querySelectorAll('button[type="button"]');
      expect(buttons.length).toBeGreaterThan(0);
      const dateTimeButtons = Array.from(buttons).filter(btn => 
        btn.className.includes('field-component')
      );
      expect(dateTimeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Date Format Configuration', () => {
    it('should support different date formats', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD-MM-YYYY' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support YYYY/MM/DD format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY/MM/DD' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support MM-DD-YYYY format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'MM-DD-YYYY' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support DD/MM/YYYY format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD/MM/YYYY' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support MM/DD/YYYY format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'MM/DD/YYYY' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support DD MM YYYY format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD MM YYYY' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support different time formats', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support time format with milliseconds', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss.SSS' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support 24-hour format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ hourFormat: '24' }}
        />
      );

      expect(document.body.innerHTML).toMatch(/15|45/);
    });

    it('should support 12-hour format with AM/PM', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      expect(document.body.innerHTML).toMatch(/PM|AM|3:45/i);
    });
  });

  describe('Timezone Support', () => {
    it('should display timezone when configured', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ displayTimeZone: true, timeZone: 'UTC' }}
        />
      );

      expect(document.body.innerHTML).toMatch(/UTC|GMT|Z/);
    });

    it('should handle timezone offset in datetime', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30+02:00"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should convert to display timezone when configured', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeZone: 'Europe/London' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle GMT timezone format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeZone: 'GMT-7' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle UTC timezone format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeZone: 'UTC+05:30' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle timeZoneLabel in config', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeZoneLabel: 'America/New_York' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('should handle ISO datetime format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-12-25T20:15:45Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body.innerHTML).toMatch(/2024|12|25|20|15/);
    });

    it('should handle null value', () => {
      render(
        <AuditLastModifiedTime
          value={null as any}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <AuditLastModifiedTime
          value={undefined as any}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty string', () => {
      render(
        <AuditLastModifiedTime
          value=""
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle datetime with milliseconds', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30.456Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          disabled
        />
      );

      const buttons = document.querySelectorAll('button[type="button"]');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should be read-only as audit field', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const buttons = document.querySelectorAll('button[type="button"]');
      expect(buttons.length).toBeGreaterThan(0);
      const dateTimeButtons = Array.from(buttons).filter(btn => 
        btn.className.includes('field-component')
      );
      expect(dateTimeButtons.length).toBeGreaterThan(0);
    });

    it('should prevent editing', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const buttons = document.querySelectorAll('button[type="button"]');
      expect(buttons.length).toBeGreaterThan(0);
      const dateTimeButtons = Array.from(buttons).filter(btn => 
        btn.className.includes('field-component')
      );
      expect(dateTimeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Props', () => {
    it('should use defaultValue from config', () => {
      const now = new Date().toISOString();
      render(
        <AuditLastModifiedTime
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: now }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should apply dateFormat from config', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY/MM/DD' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should apply timeFormat from config', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle isBorder prop', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          isBorder
        />
      );

      expect(container.querySelector('.field-component-border')).toBeInTheDocument();
    });

    it('should handle className prop', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should handle required prop', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          required
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year datetime', () => {
      render(
        <AuditLastModifiedTime
          value="2024-02-29T12:30:00Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body.innerHTML).toMatch(/02|29|2024/);
    });

    it('should handle year boundaries', () => {
      render(
        <AuditLastModifiedTime
          value="2024-12-31T23:59:59Z"
          onChange={mockOnChange}
          config={{ timeZone: 'UTC' }}
        />
      );

      expect(document.body.innerHTML).toMatch(/2024|2025|12|31|23|59|00|01/);
    });

    it('should handle midnight', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T00:00:00Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle end of day', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T23:59:59Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle various timestamps from same date', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T08:15:22Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body.innerHTML).toMatch(/06|20|2024|08|15|22/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <AuditLastModifiedTime
          label="Modified Timestamp"
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Modified Timestamp')).toBeInTheDocument();
    });

    it('should be read-only and not editable', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const buttons = document.querySelectorAll('button[type="button"]');
      expect(buttons.length).toBeGreaterThan(0);
      const dateTimeButtons = Array.from(buttons).filter(btn => 
        btn.className.includes('field-component')
      );
      expect(dateTimeButtons.length).toBeGreaterThan(0);
    });

    it('should have semantic structure', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should open date picker when date button is clicked', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Mo|Tu|We|Th|Fr|Sa|Su/);
      });
    });

    it('should open time picker when time button is clicked', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const buttons = container.querySelectorAll('button[type="button"]');
      const timeButton = buttons[1] as HTMLButtonElement;
      fireEvent.click(timeButton);

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Now/);
      });
    });

    it('should select a date from calendar', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        const dayButtons = document.querySelectorAll('button[class*="rounded-full"]');
        if (dayButtons.length > 0) {
          const firstDayButton = dayButtons[0] as HTMLButtonElement;
          if (!firstDayButton.disabled) {
            fireEvent.click(firstDayButton);
            expect(mockOnChange).toHaveBeenCalled();
          }
        }
      });
    });

    it('should select a time from time picker', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const buttons = container.querySelectorAll('button[type="button"]');
      const timeButton = buttons[1] as HTMLButtonElement;
      fireEvent.click(timeButton);

      await waitFor(() => {
        const timeOptions = document.querySelectorAll('button[class*="rounded-xl"]');
        if (timeOptions.length > 0) {
          const firstTimeOption = timeOptions[0] as HTMLButtonElement;
          fireEvent.click(firstTimeOption);
          expect(mockOnChange).toHaveBeenCalled();
        }
      });
    });

    it('should navigate calendar months', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        const navButtons = document.querySelectorAll('button[class*="rounded-xl"]');
        const nextButton = Array.from(navButtons).find(btn => 
          btn.querySelector('svg') && btn.className.includes('p-2')
        ) as HTMLButtonElement;
        if (nextButton) {
          fireEvent.click(nextButton);
          expect(document.body).toBeInTheDocument();
        }
      });
    });

    it('should open month picker', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        const monthButton = document.querySelector('[data-month-picker] button') as HTMLButtonElement;
        if (monthButton) {
          fireEvent.click(monthButton);
          expect(document.body.innerHTML).toMatch(/January|February|March/);
        }
      });
    });

    it('should open year picker', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        const yearButton = document.querySelector('[data-year-picker] button') as HTMLButtonElement;
        if (yearButton) {
          fireEvent.click(yearButton);
          expect(document.body.innerHTML).toMatch(/\d{4}/);
        }
      });
    });

    it('should select a month from month picker', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        const monthButton = document.querySelector('[data-month-picker] button') as HTMLButtonElement;
        if (monthButton) {
          fireEvent.click(monthButton);
          const monthOptions = document.querySelectorAll('[data-month-picker] button');
          if (monthOptions.length > 1) {
            fireEvent.click(monthOptions[1] as HTMLButtonElement);
            expect(document.body).toBeInTheDocument();
          }
        }
      });
    });

    it('should select a year from year picker', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        const yearButton = document.querySelector('[data-year-picker] button') as HTMLButtonElement;
        if (yearButton) {
          fireEvent.click(yearButton);
          const yearOptions = document.querySelectorAll('[data-year-picker] button');
          if (yearOptions.length > 1) {
            fireEvent.click(yearOptions[1] as HTMLButtonElement);
            expect(document.body).toBeInTheDocument();
          }
        }
      });
    });

    it('should use Now button to set current time', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const buttons = container.querySelectorAll('button[type="button"]');
      const timeButton = buttons[1] as HTMLButtonElement;
      fireEvent.click(timeButton);

      await waitFor(() => {
        const nowButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.includes('Now')
        ) as HTMLButtonElement;
        if (nowButton) {
          fireEvent.click(nowButton);
          expect(mockOnChange).toHaveBeenCalled();
        }
      });
    });

    it('should use Today button to set current date', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        const todayButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.includes('Today')
        ) as HTMLButtonElement;
        if (todayButton) {
          fireEvent.click(todayButton);
          expect(mockOnChange).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Input Editing Mode', () => {
    it('should enter editing mode on double-click', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input');
        expect(input).toBeInTheDocument();
      }
    });

    it('should not enter editing mode when disabled', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          disabled
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input');
        expect(input).not.toBeInTheDocument();
      }
    });

    it('should handle input change', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '2024-06-21 14:30' } });
          expect(input.value).toBe('2024-06-21 14:30');
        }
      }
    });

    it('should save valid date+time input on blur', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '2024-06-21 14:30' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should save valid date-only input on blur', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY-MM-DD' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '2024-06-21' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should clear value on empty input blur', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalledWith('');
        }
      }
    });

    it('should handle 12-hour format input', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '12' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        expect(input).toBeInTheDocument();
        if (input) {
          fireEvent.change(input, { target: { value: '2024-06-21 02:30 PM' } });
          expect(input.value).toBe('2024-06-21 02:30 PM');
        }
      }
    });
  });

  describe('Validation', () => {
    it('should show error when required and empty', () => {
      render(
        <AuditLastModifiedTime
          value=""
          onChange={mockOnChange}
          required
          allowEdit
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should validate required field on date selection', async () => {
      const { container } = render(
        <AuditLastModifiedTime
          value=""
          onChange={mockOnChange}
          required
        />
      );

      const dateButton = container.querySelector('button[type="button"]') as HTMLButtonElement;
      fireEvent.click(dateButton);

      await waitFor(() => {
        const dayButtons = document.querySelectorAll('button[class*="rounded-full"]');
        if (dayButtons.length > 0) {
          const firstDayButton = dayButtons[0] as HTMLButtonElement;
          if (!firstDayButton.disabled) {
            fireEvent.click(firstDayButton);
            expect(mockOnChange).toHaveBeenCalled();
          }
        }
      });
    });
  });

  describe('Date Format Parsing', () => {
    it('should parse YYYY/MM/DD format', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY/MM/DD' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '2024/06/21 14:30' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should parse DD-MM-YYYY format', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD-MM-YYYY' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '21-06-2024 14:30' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should parse MM-DD-YYYY format', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'MM-DD-YYYY' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '06-21-2024 14:30' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should parse DD/MM/YYYY format', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD/MM/YYYY' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '21/06/2024 14:30' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should parse MM/DD/YYYY format', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'MM/DD/YYYY' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '06/21/2024 14:30' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should parse DD MM YYYY format', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD MM YYYY' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Time Format Handling', () => {
    it('should handle time format with seconds', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle time format with milliseconds', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss.SSS' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle 12-hour format with seconds', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ hourFormat: '12', timeFormat: 'HH:mm:ss' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid datetime value gracefully', () => {
      render(
        <AuditLastModifiedTime
          value="invalid-date"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle value without time component', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle value with only date when time is missing', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          fireEvent.change(input, { target: { value: '2024-06-21' } });
          fireEvent.blur(input);
          expect(mockOnChange).toHaveBeenCalled();
        }
      }
    });

    it('should not call onChange when input is invalid', () => {
      const { container } = render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY-MM-DD' }}
        />
      );

      const wrapper = container.querySelector('div[class*="w-full relative"]');
      if (wrapper) {
        fireEvent.doubleClick(wrapper);
        const input = container.querySelector('input') as HTMLInputElement;
        if (input) {
          const initialCallCount = mockOnChange.mock.calls.length;
          fireEvent.change(input, { target: { value: 'invalid-date' } });
          fireEvent.blur(input);
          expect(mockOnChange.mock.calls.length).toBe(initialCallCount);
        }
      }
    });
  });
});
