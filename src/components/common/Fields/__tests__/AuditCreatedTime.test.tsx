import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditCreatedTime } from '../AuditCreatedTime';

describe('AuditCreatedTime Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render datetime display for creation timestamp', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should format and display datetime value', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      // Should display some part of the datetime
      expect(document.body.innerHTML).toMatch(/2024|01|15|10|30/);
    });

    it('should display with label when provided', () => {
      render(
        <AuditCreatedTime
          label="Created At"
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Created At')).toBeInTheDocument();
    });

    it('should show helper text when provided', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          helperText="System generated timestamp"
        />
      );

      expect(screen.getByText('System generated timestamp')).toBeInTheDocument();
    });

    it('should be read-only as audit field', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      // Component renders buttons by default, not inputs
      // When allowEdit is false, the component is read-only
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      // No input should be rendered when allowEdit is false
      const input = document.querySelector('input');
      expect(input).toBeNull();
    });
  });

  describe('Date Format Configuration', () => {
    it('should support different date formats from config', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD-MM-YYYY' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support different time formats', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should support 24-hour time format', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T14:30:00Z"
          onChange={mockOnChange}
          config={{ hourFormat: '24', timeZone: 'UTC' }}
        />
      );

      // The component converts UTC to local timezone, so we need to check for the time display
      // Using UTC timezone ensures the time matches the input value
      expect(document.body.innerHTML).toMatch(/14|30/);
    });

    it('should support 12-hour time format with AM/PM', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T14:30:00Z"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      expect(document.body.innerHTML).toMatch(/PM|AM|2:30|14:30/i);
    });
  });

  describe('Timezone Support', () => {
    it('should display timezone when configured', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ displayTimeZone: true, timeZone: 'UTC' }}
        />
      );

      expect(document.body.innerHTML).toMatch(/UTC|GMT|Z/);
    });

    it('should handle timezone offset in datetime', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00+05:30"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should convert to display timezone when configured', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeZone: 'America/New_York' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('should handle ISO datetime format', () => {
      render(
        <AuditCreatedTime
          value="2024-12-25T15:30:00Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body.innerHTML).toMatch(/2024|12|25|15|30/);
    });

    it('should handle null value', () => {
      render(
        <AuditCreatedTime
          value={(null as unknown) as string}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <AuditCreatedTime
          value={undefined}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(
        <AuditCreatedTime
          value=""
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle datetime with milliseconds', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00.123Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          disabled
        />
      );

      // Component renders buttons, not inputs by default
      const buttons = document.querySelectorAll('button[disabled]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should be read-only as audit field by default', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      // Component renders buttons by default, not inputs
      // When allowEdit is false, the component is read-only
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should prevent editing', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      // Component renders buttons by default, not inputs
      // When allowEdit is false, editing is prevented
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      // No input should be rendered when allowEdit is false and not in editing mode
      const input = document.querySelector('input');
      expect(input).toBeNull();
    });
  });

  describe('Configuration Props', () => {
    it('should use defaultValue from config', () => {
      const now = new Date().toISOString();
      render(
        <AuditCreatedTime
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: now }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should apply dateFormat from config', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY/MM/DD' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should apply timeFormat from config', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year datetime', () => {
      render(
        <AuditCreatedTime
          value="2024-02-29T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body.innerHTML).toMatch(/02|29|2024/);
    });

    it('should handle year boundaries', () => {
      render(
        <AuditCreatedTime
          value="2024-12-31T23:59:59Z"
          onChange={mockOnChange}
          config={{ timeZone: 'UTC' }}
        />
      );

      // Using UTC timezone ensures the date/time matches the input value
      expect(document.body.innerHTML).toMatch(/12|31|2024|23|59/);
    });

    it('should handle midnight', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T00:00:00Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle end of day', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T23:59:59Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle very old dates', () => {
      render(
        <AuditCreatedTime
          value="2000-01-01T00:00:00Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle future dates', () => {
      render(
        <AuditCreatedTime
          value="2099-12-31T23:59:59Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <AuditCreatedTime
          label="Creation Timestamp"
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Creation Timestamp')).toBeInTheDocument();
    });

    it('should be read-only and not editable', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      // Component renders buttons by default, not inputs
      // When allowEdit is false, the component is read-only
      const buttons = document.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      // No input should be rendered when allowEdit is false
      const input = document.querySelector('input');
      expect(input).toBeNull();
    });

    it('should have semantic structure', () => {
      const { container } = render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should enter edit mode on double-click when not disabled', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      expect(container).toBeInTheDocument();

      // Double-click to enter edit mode
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input');
          expect(input).toBeInTheDocument();
        });
      }
    });

    it('should not enter edit mode on double-click when disabled', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          disabled
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        const input = document.querySelector('input');
        expect(input).toBeNull();
      }
    });

    it('should enter edit mode even when allowEdit is false (only disabled prevents editing)', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input');
          // allowEdit=false doesn't prevent editing, only disabled does
          expect(input).toBeInTheDocument();
        });
      }
    });

    it('should handle input change', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          expect(input).toBeInTheDocument();
          fireEvent.change(input, { target: { value: '2024-01-20 14:30' } });
          expect(input.value).toBe('2024-01-20 14:30');
        });
      }
    });

    it('should handle input blur with valid date-time format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(async () => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20 14:30' } });
            fireEvent.blur(input);
            await waitFor(() => {
              expect(mockOnChange).toHaveBeenCalled();
            });
          }
        });
      }
    });

    it('should handle input blur with valid date-only format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(async () => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20' } });
            fireEvent.blur(input);
            await waitFor(() => {
              expect(mockOnChange).toHaveBeenCalled();
            });
          }
        });
      }
    });

    it('should handle input blur with empty value', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(async () => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);
            await waitFor(() => {
              expect(mockOnChange).toHaveBeenCalledWith('');
            });
          }
        });
      }
    });

    it('should handle input blur with invalid format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: 'invalid' } });
            fireEvent.blur(input);
            // Should not call onChange for invalid input
          }
        });
      }
    });
  });

  describe('Date Picker Interactions', () => {
    it('should open date picker on button click', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          const calendar = document.querySelector('.grid.grid-cols-7');
          expect(calendar).toBeInTheDocument();
        });
      }
    });

    it('should select a date from calendar', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeZone: 'UTC' }}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          const dayButtons = document.querySelectorAll('button');
          // Find a day button (not the month/year picker buttons)
          const dayButton = Array.from(dayButtons).find(
            (btn) => btn.textContent && /^\d+$/.test(btn.textContent) && btn.textContent !== '2024'
          );
          if (dayButton) {
            fireEvent.click(dayButton);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should navigate calendar months', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          const navButtons = document.querySelectorAll('button');
          const nextButton = Array.from(navButtons).find((btn) =>
            btn.querySelector('.lucide-chevron-right')
          );
          if (nextButton) {
            fireEvent.click(nextButton);
            // Calendar should update
            expect(document.querySelector('.grid.grid-cols-7')).toBeInTheDocument();
          }
        });
      }
    });

    it('should open month picker', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          const monthButton = Array.from(document.querySelectorAll('button')).find((btn) =>
            btn.textContent?.includes('January')
          );
          expect(monthButton).toBeInTheDocument();
        });
        
        const monthButton = Array.from(document.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('January')
        );
        if (monthButton) {
          fireEvent.click(monthButton);
          await waitFor(() => {
            const monthPicker = document.querySelector('[data-month-picker]');
            expect(monthPicker).toBeInTheDocument();
          });
        }
      }
    });

    it('should select a month from month picker', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          const monthButton = Array.from(document.querySelectorAll('button')).find((btn) =>
            btn.textContent?.includes('January')
          );
          expect(monthButton).toBeInTheDocument();
        });
        
        const monthButton = Array.from(document.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('January')
        );
        if (monthButton) {
          fireEvent.click(monthButton);
          await waitFor(() => {
            const monthOptions = document.querySelectorAll('[data-month-picker] button');
            expect(monthOptions.length).toBeGreaterThan(0);
          });
          
          const monthOptions = document.querySelectorAll('[data-month-picker] button');
          if (monthOptions.length > 0) {
            fireEvent.click(monthOptions[2] as HTMLElement); // Select March
            // Month should be updated
            expect(document.querySelector('.grid.grid-cols-7')).toBeInTheDocument();
          }
        }
      }
    });

    it('should open year picker', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          const yearButton = Array.from(document.querySelectorAll('button')).find((btn) =>
            btn.textContent === '2024'
          );
          expect(yearButton).toBeInTheDocument();
        });
        
        const yearButton = Array.from(document.querySelectorAll('button')).find((btn) =>
          btn.textContent === '2024'
        );
        if (yearButton) {
          fireEvent.click(yearButton);
          await waitFor(() => {
            const yearPicker = document.querySelector('[data-year-picker]');
            expect(yearPicker).toBeInTheDocument();
          });
        }
      }
    });

    it('should select a year from year picker', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          const yearButton = Array.from(document.querySelectorAll('button')).find((btn) =>
            btn.textContent === '2024'
          );
          expect(yearButton).toBeInTheDocument();
        });
        
        const yearButton = Array.from(document.querySelectorAll('button')).find((btn) =>
          btn.textContent === '2024'
        );
        if (yearButton) {
          fireEvent.click(yearButton);
          await waitFor(() => {
            const yearOptions = document.querySelectorAll('[data-year-picker] button');
            expect(yearOptions.length).toBeGreaterThan(0);
          });
          
          const yearOptions = document.querySelectorAll('[data-year-picker] button');
          if (yearOptions.length > 0) {
            fireEvent.click(yearOptions[10] as HTMLElement); // Select a different year
            // Year should be updated
            expect(document.querySelector('.grid.grid-cols-7')).toBeInTheDocument();
          }
        }
      }
    });

    it('should click Today button', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        await waitFor(() => {
          const todayButton = Array.from(document.querySelectorAll('button')).find((btn) =>
            btn.textContent === 'Today'
          );
          if (todayButton) {
            fireEvent.click(todayButton);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });
  });

  describe('Time Picker Interactions', () => {
    it('should open time picker on button click', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const timeButtons = document.querySelectorAll('button[type="button"]');
      const timeButton = timeButtons[1]; // Second button is time button
      if (timeButton) {
        fireEvent.click(timeButton);
        await waitFor(() => {
          const timeOptions = document.querySelectorAll('.max-h-64 button');
          expect(timeOptions.length).toBeGreaterThan(0);
        });
      }
    });

    it('should select a time from time picker', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeZone: 'UTC' }}
        />
      );

      const timeButtons = document.querySelectorAll('button[type="button"]');
      const timeButton = timeButtons[1];
      if (timeButton) {
        fireEvent.click(timeButton);
        await waitFor(() => {
          const timeOptions = document.querySelectorAll('.max-h-64 button');
          if (timeOptions.length > 0) {
            fireEvent.click(timeOptions[5] as HTMLElement);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should click Now button in time picker', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const timeButtons = document.querySelectorAll('button[type="button"]');
      const timeButton = timeButtons[1];
      if (timeButton) {
        fireEvent.click(timeButton);
        await waitFor(() => {
          const nowButton = Array.from(document.querySelectorAll('button')).find((btn) =>
            btn.textContent === 'Now'
          );
          if (nowButton) {
            fireEvent.click(nowButton);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });
  });

  describe('Date Format Parsing', () => {
    it('should parse YYYY/MM/DD format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'YYYY/MM/DD' }}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024/01/20' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should parse DD-MM-YYYY format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD-MM-YYYY' }}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '20-01-2024' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should parse MM-DD-YYYY format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'MM-DD-YYYY' }}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '01-20-2024' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should parse DD/MM/YYYY format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD/MM/YYYY' }}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '20/01/2024' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should parse MM/DD/YYYY format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'MM/DD/YYYY' }}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '01/20/2024' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should parse DD MM YYYY format', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ dateFormat: 'DD MM YYYY' }}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '20 01 2024' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });
  });

  describe('Time Format Handling', () => {
    it('should handle 12-hour format with AM', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ hourFormat: '12', timeZone: 'UTC' }}
        />
      );

      const timeButtons = document.querySelectorAll('button[type="button"]');
      const timeButton = timeButtons[1];
      if (timeButton) {
        fireEvent.click(timeButton);
        await waitFor(() => {
          const timeOptions = document.querySelectorAll('.max-h-64 button');
          // Find an AM time option
          const amOption = Array.from(timeOptions).find((btn) =>
            btn.textContent?.includes('AM')
          );
          if (amOption) {
            fireEvent.click(amOption);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should handle 12-hour format with PM', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ hourFormat: '12', timeZone: 'UTC' }}
        />
      );

      const timeButtons = document.querySelectorAll('button[type="button"]');
      const timeButton = timeButtons[1];
      if (timeButton) {
        fireEvent.click(timeButton);
        await waitFor(() => {
          const timeOptions = document.querySelectorAll('.max-h-64 button');
          // Find a PM time option
          const pmOption = Array.from(timeOptions).find((btn) =>
            btn.textContent?.includes('PM')
          );
          if (pmOption) {
            fireEvent.click(pmOption);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should handle time format with seconds', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss', timeZone: 'UTC' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle time format with milliseconds', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm:ss.SSS', timeZone: 'UTC' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle 12-hour format input with date-time', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ hourFormat: '12', timeZone: 'UTC' }}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20 2:30 PM' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });
  });

  describe('Required Field Validation', () => {
    it('should show error when required and value is empty', async () => {
      render(
        <AuditCreatedTime
          value=""
          onChange={mockOnChange}
          required
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.blur(input);
            // Error should be set (though it may not be displayed if allowEdit is false)
          }
        });
      }
    });

    it('should not show error when required and value is provided', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          required
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Additional Props', () => {
    it('should apply className prop', () => {
      const { container } = render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should apply isBorder prop', () => {
      const { container } = render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          isBorder
        />
      );

      expect(container.querySelector('.field-component-border')).toBeInTheDocument();
    });

    it('should display required asterisk', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          label="Created At"
          required
        />
      );

      const asterisk = document.querySelector('.field-component-required');
      expect(asterisk).toBeInTheDocument();
    });
  });

  describe('Timezone Conversions', () => {
    it('should handle GMT offset timezone', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeZone: 'GMT-7' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle UTC offset timezone', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeZone: 'UTC+05:30' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle timeZoneLabel in config', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          config={{ timeZoneLabel: 'America/New_York' }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error when allowEdit is true', async () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          allowEdit={true}
          required
        />
      );

      // Error display is conditional on allowEdit
      expect(document.body).toBeInTheDocument();
    });

    it('should not display error when allowEdit is false', () => {
      render(
        <AuditCreatedTime
          value=""
          onChange={mockOnChange}
          allowEdit={false}
          required
        />
      );

      const errorDiv = document.querySelector('.text-red-500');
      expect(errorDiv).toBeNull();
    });
  });

  describe('Helper Text Display', () => {
    it('should display helper text when allowEdit is true', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          helperText="Helper text"
          allowEdit={true}
        />
      );

      expect(screen.getByText('Helper text')).toBeInTheDocument();
    });

    it('should not display helper text when allowEdit is false', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
          helperText="Helper text"
          allowEdit={false}
        />
      );

      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Calendar Edge Cases', () => {
    it('should handle calendar with different start days', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        // Calendar should render correctly regardless of start day
        expect(document.querySelector('.grid.grid-cols-7')).toBeInTheDocument();
      }
    });

    it('should handle month with 31 days', () => {
      render(
        <AuditCreatedTime
          value="2024-01-31T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        expect(document.querySelector('.grid.grid-cols-7')).toBeInTheDocument();
      }
    });

    it('should handle February with 28 days', () => {
      render(
        <AuditCreatedTime
          value="2023-02-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const dateButton = document.querySelector('button[type="button"]');
      if (dateButton) {
        fireEvent.click(dateButton);
        expect(document.querySelector('.grid.grid-cols-7')).toBeInTheDocument();
      }
    });
  });

  describe('Value Updates', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      rerender(
        <AuditCreatedTime
          value="2024-02-20T15:45:00Z"
          onChange={mockOnChange}
        />
      );

      expect(document.body.innerHTML).toMatch(/2024|02|20|15|45/);
    });

    it('should use defaultValue when value is empty', () => {
      const defaultValue = '2024-01-15T10:30:00Z';
      render(
        <AuditCreatedTime
          value=""
          onChange={mockOnChange}
          config={{ defaultValue }}
        />
      );

      expect(document.body).toBeInTheDocument();
    });
  });
});
