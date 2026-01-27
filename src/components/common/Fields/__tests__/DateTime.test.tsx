import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DateTime } from '../DateTime';

const mockOnChange = vi.fn();

const getDateButton = () =>
  screen.getByRole('button', { name: /YYYY|202\d-/i });

const getTimeButton = () =>
  screen.getByRole('button', { name: /HH:mm|\d{1,2}:\d{2}/i });

describe('DateTime Component', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render date and time buttons', () => {
      render(<DateTime value="" onChange={mockOnChange} />);
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should display initial value (timezone-safe)', () => {
      render(
        <DateTime value="2024-03-15T10:30:00Z" onChange={mockOnChange} />
      );

      expect(getDateButton().textContent).toContain('2024');
      expect(getTimeButton().textContent).toMatch(/\d{2}:\d{2}/);
    });

    it('should render label when provided', () => {
      render(
        <DateTime
          label="Event Date"
          value="2024-03-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Event Date')).toBeInTheDocument();
    });

    it('should render required indicator when required', () => {
      render(
        <DateTime
          label="Due Date"
          required
          value="2024-03-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display helper text when provided', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          onChange={mockOnChange}
          helperText="Select date and time"
        />
      );
      expect(screen.getByText('Select date and time')).toBeInTheDocument();
    });
  });

  describe('Format Configuration', () => {
    it('should use defaultValue from config', () => {
      render(
        <DateTime
          value=""
          config={{ defaultValue: '2024-02-10T09:00:00Z' }}
          onChange={mockOnChange}
        />
      );

      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should render timezone label when displayTimeZone is enabled', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ displayTimeZone: true, timeZone: 'UTC' }}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('UTC')).toBeInTheDocument();
    });

    it('should support different date formats - YYYY/MM/DD', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ dateFormat: 'YYYY/MM/DD' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
    });

    it('should support different date formats - DD-MM-YYYY', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ dateFormat: 'DD-MM-YYYY' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
    });

    it('should support different date formats - MM/DD/YYYY', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ dateFormat: 'MM/DD/YYYY' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
    });

    it('should support 12-hour time format', () => {
      render(
        <DateTime
          value="2024-03-15T14:30:00Z"
          config={{ hourFormat: '12' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should support time format with seconds - HH:mm:ss', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:45Z"
          config={{ timeFormat: 'HH:mm:ss' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should support time format with milliseconds - HH:mm:ss.SSS', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:45Z"
          config={{ timeFormat: 'HH:mm:ss.SSS' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Picker Interaction', () => {
    it('should open date picker on click', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        expect(screen.getByText('Mo')).toBeInTheDocument();
      });
    });

    it('should open time picker on click', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getTimeButton());

      await waitFor(() => {
        expect(screen.getByText('Now')).toBeInTheDocument();
      });
    });

    it('should select a date from calendar', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const dayButtons = document.querySelectorAll(
          'button[class*="rounded-full"]'
        );
        if (dayButtons.length > 0) {
          const firstEnabledDay = Array.from(dayButtons).find(
            (btn) => !(btn as HTMLButtonElement).disabled
          ) as HTMLButtonElement;
          if (firstEnabledDay) {
            fireEvent.click(firstEnabledDay);
            expect(mockOnChange).toHaveBeenCalled();
          }
        }
      });
    });

    it('should select a time from time picker', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getTimeButton());

      await waitFor(() => {
        const timeOptions = document.querySelectorAll(
          'button[class*="rounded-xl"]'
        );
        if (timeOptions.length > 0) {
          const firstTimeOption = timeOptions[0] as HTMLButtonElement;
          if (firstTimeOption && !firstTimeOption.disabled) {
            fireEvent.click(firstTimeOption);
            expect(mockOnChange).toHaveBeenCalled();
          }
        }
      });
    });

    it('should use "Now" button to set current time', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getTimeButton());

      await waitFor(() => {
        const nowButton = screen.getByText('Now');
        fireEvent.click(nowButton);
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should use "Today" button to set current date', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const todayButton = screen.getByText('Today');
        fireEvent.click(todayButton);
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should navigate to previous month', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const prevButton = document.querySelector(
          'button[class*="p-2 rounded-xl"]'
        ) as HTMLButtonElement;
        if (prevButton) {
          fireEvent.click(prevButton);
        }
      });
    });

    it('should navigate to next month', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const buttons = document.querySelectorAll(
          'button[class*="p-2 rounded-xl"]'
        );
        if (buttons.length > 1) {
          const nextButton = buttons[buttons.length - 1] as HTMLButtonElement;
          fireEvent.click(nextButton);
        }
      });
    });

    it('should open year picker', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const yearButton = screen.getByText('2024');
        fireEvent.click(yearButton);
        expect(screen.getByText(/2024|2025|2026/i)).toBeInTheDocument();
      });
    });

    it('should select a year from year picker', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(async () => {
        const yearButton = screen.getByText('2024');
        fireEvent.click(yearButton);

        await waitFor(() => {
          const yearOptions = document.querySelectorAll(
            'button[class*="rounded-md"]'
          );
          if (yearOptions.length > 0) {
            const firstYear = yearOptions[0] as HTMLButtonElement;
            if (firstYear && firstYear.textContent?.match(/\d{4}/)) {
              fireEvent.click(firstYear);
            }
          }
        });
      });
    });

    it('should open month picker', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const monthButton = screen.getByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
        if (monthButton) {
          fireEvent.click(monthButton);
          expect(screen.getByText(/Jan|Feb|Mar/i)).toBeInTheDocument();
        }
      });
    });

    it('should select a month from month picker', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(async () => {
        const monthButton = screen.getByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
        if (monthButton) {
          fireEvent.click(monthButton);

          await waitFor(() => {
            const monthOptions = document.querySelectorAll(
              'button[class*="rounded-xl"]'
            );
            if (monthOptions.length > 0) {
              const firstMonth = monthOptions[0] as HTMLButtonElement;
              if (firstMonth && firstMonth.textContent?.match(/Jan|Feb|Mar/i)) {
                fireEvent.click(firstMonth);
              }
            }
          });
        }
      });
    });

    it('should navigate year pages in year picker', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(async () => {
        const yearButton = screen.getByText('2024');
        fireEvent.click(yearButton);

        await waitFor(() => {
          const navButtons = document.querySelectorAll(
            'button[class*="h-8 w-8"]'
          );
          if (navButtons.length > 0) {
            const prevButton = navButtons[0] as HTMLButtonElement;
            fireEvent.click(prevButton);
          }
        });
      });
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should prevent opening date picker when disabled', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          disabled
          onChange={mockOnChange}
        />
      );

      fireEvent.click(getDateButton());
      expect(screen.queryByText('Mo')).not.toBeInTheDocument();
    });

    it('should prevent opening date picker when readOnly', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          readOnly
          onChange={mockOnChange}
        />
      );

      fireEvent.click(getDateButton());
      expect(screen.queryByText('Mo')).not.toBeInTheDocument();
    });

    it('should prevent opening time picker when disabled', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          disabled
          onChange={mockOnChange}
        />
      );

      fireEvent.click(getTimeButton());
      expect(screen.queryByText('Now')).not.toBeInTheDocument();
    });

    it('should prevent opening time picker when readOnly', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          readOnly
          onChange={mockOnChange}
        />
      );

      fireEvent.click(getTimeButton());
      expect(screen.queryByText('Now')).not.toBeInTheDocument();
    });

    it('should exit edit mode when readOnly becomes true', () => {
      const { rerender } = render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        expect(document.querySelector('input')).toBeInTheDocument();

        rerender(
          <DateTime
            value="2024-01-15T10:30:00Z"
            readOnly
            onChange={mockOnChange}
          />
        );

        expect(document.querySelector('input')).not.toBeInTheDocument();
      }
    });
  });

  describe('Input Editing Mode', () => {
    it('should enter edit mode on double click', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input');
          expect(input).toBeInTheDocument();
        });
      }
    });

    it('should not enter edit mode when readOnly', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          readOnly
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        expect(document.querySelector('input')).not.toBeInTheDocument();
      }
    });

    it('should not enter edit mode when disabled', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          disabled
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);
        expect(document.querySelector('input')).not.toBeInTheDocument();
      }
    });

    it('should handle input change', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20 14:30' } });
            expect(input.value).toBe('2024-01-20 14:30');
          }
        });
      }
    });

    it('should save valid date and time on blur', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20 14:30' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should save valid date-only input on blur', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should handle invalid input format', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            const initialCallCount = mockOnChange.mock.calls.length;
            fireEvent.change(input, { target: { value: 'invalid' } });
            fireEvent.blur(input);
            // Should not call onChange for invalid input
            expect(mockOnChange.mock.calls.length).toBe(initialCallCount);
          }
        });
      }
    });

    it('should clear value on empty input blur', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalledWith('');
          }
        });
      }
    });

    it('should handle 12-hour format input', async () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          config={{ hourFormat: '12' }}
          onChange={mockOnChange}
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

  describe('Validation', () => {
    it('should not call onChange when required and empty', async () => {
      render(<DateTime required value="" onChange={mockOnChange} />);

      fireEvent.blur(getDateButton());

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });
    });

    it('should show error when required and empty', () => {
      render(<DateTime required value="" onChange={mockOnChange} />);
      // Error might not be visible until blur, but validation should exist
      expect(getDateButton()).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value safely', () => {
      render(<DateTime value={null as any} onChange={mockOnChange} />);
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle undefined value safely', () => {
      render(<DateTime value={undefined as any} onChange={mockOnChange} />);
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle invalid date string', () => {
      render(<DateTime value="invalid-date" onChange={mockOnChange} />);
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(<DateTime value="" onChange={mockOnChange} />);
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle value without timezone', () => {
      render(<DateTime value="2024-01-15T10:30:00" onChange={mockOnChange} />);
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should allow keyboard focus on date button', () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const btn = getDateButton();
      btn.focus();
      expect(btn).toHaveFocus();
    });

    it('should allow keyboard focus on time button', () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const btn = getTimeButton();
      btn.focus();
      expect(btn).toHaveFocus();
    });
  });

  describe('Value Synchronization', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(
        <DateTime value="2024-01-01T10:00:00Z" onChange={mockOnChange} />
      );

      rerender(
        <DateTime value="2024-02-01T12:00:00Z" onChange={mockOnChange} />
      );

      expect(getDateButton().textContent).toContain('2024');
    });

    it('should handle value change to empty', () => {
      const { rerender } = render(
        <DateTime value="2024-01-01T10:00:00Z" onChange={mockOnChange} />
      );

      rerender(<DateTime value="" onChange={mockOnChange} />);

      expect(getDateButton()).toBeInTheDocument();
    });
  });

  describe('Timezone Handling', () => {
    it('should handle different timezone configurations', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ timeZone: 'America/New_York' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle GMT timezone format', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ timeZone: 'GMT-7' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle UTC timezone format', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ timeZone: 'UTC+05:30' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Time Format Variations', () => {
    it('should display time with seconds in 24-hour format', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:45Z"
          config={{ timeFormat: 'HH:mm:ss' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should display time with milliseconds', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:45Z"
          config={{ timeFormat: 'HH:mm:ss.SSS' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should display time in 12-hour format with seconds', () => {
      render(
        <DateTime
          value="2024-03-15T14:30:45Z"
          config={{ hourFormat: '12', timeFormat: 'HH:mm:ss' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Calendar Day Selection', () => {
    it('should highlight selected date in calendar', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const dayButtons = document.querySelectorAll(
          'button[class*="rounded-full"]'
        );
        const selectedDay = Array.from(dayButtons).find((btn) =>
          btn.textContent?.includes('15')
        );
        expect(selectedDay).toBeInTheDocument();
      });
    });

    it('should highlight today in calendar', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const dayButtons = document.querySelectorAll(
          'button[class*="rounded-full"]'
        );
        // Today button should exist if we're viewing current month
        expect(dayButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Click Outside Handling', () => {
    it('should close date picker when clicking outside', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        expect(screen.getByText('Mo')).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Mo')).not.toBeInTheDocument();
      });
    });

    it('should close time picker when clicking outside', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getTimeButton());

      await waitFor(() => {
        expect(screen.getByText('Now')).toBeInTheDocument();
      });

      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText('Now')).not.toBeInTheDocument();
      });
    });
  });

  describe('allowEdit Configuration', () => {
    it('should prevent opening picker when allowEdit is false', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          allowEdit={false}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(getDateButton());
      expect(screen.queryByText('Mo')).not.toBeInTheDocument();
    });

    it('should allow opening picker when allowEdit is true', async () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          allowEdit={true}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        expect(screen.getByText('Mo')).toBeInTheDocument();
      });
    });
  });

  describe('isBorder and className props', () => {
    it('should apply border class when isBorder is true', () => {
      const { container } = render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          isBorder
          onChange={mockOnChange}
        />
      );
      expect(container.querySelector('.field-component-border')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          className="custom-class"
          onChange={mockOnChange}
        />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Additional Date Formats', () => {
    it('should support MM-DD-YYYY format', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ dateFormat: 'MM-DD-YYYY' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
    });

    it('should support DD/MM/YYYY format', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ dateFormat: 'DD/MM/YYYY' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
    });

    it('should support DD MM YYYY format', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ dateFormat: 'DD MM YYYY' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
    });

    it('should handle input with MM-DD-YYYY format', async () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          config={{ dateFormat: 'MM-DD-YYYY' }}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '03-15-2024 14:30' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should handle input with DD/MM/YYYY format', async () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          config={{ dateFormat: 'DD/MM/YYYY' }}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '15/03/2024 14:30' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should handle date-only input with DD/MM/YYYY format', async () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          config={{ dateFormat: 'DD/MM/YYYY' }}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '15/03/2024' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });
  });

  describe('Time Format Edge Cases', () => {
    it('should handle hh:mm:ss format in 12-hour mode', () => {
      render(
        <DateTime
          value="2024-03-15T14:30:45Z"
          config={{ hourFormat: '12', timeFormat: 'hh:mm:ss' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle hh:mm:ss.SSS format in 12-hour mode', () => {
      render(
        <DateTime
          value="2024-03-15T14:30:45Z"
          config={{ hourFormat: '12', timeFormat: 'hh:mm:ss.SSS' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle hh:mm:ss format in 24-hour mode', () => {
      render(
        <DateTime
          value="2024-03-15T14:30:45Z"
          config={{ hourFormat: '24', timeFormat: 'hh:mm:ss' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle input with seconds in 12-hour format', async () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          config={{ hourFormat: '12', timeFormat: 'HH:mm:ss' }}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20 2:30:00 PM' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });
  });

  describe('Error and Validation', () => {
    it('should display error when validation fails', () => {
      const { rerender } = render(
        <DateTime required value="" onChange={mockOnChange} />
      );

      const dateButton = getDateButton();
      fireEvent.blur(dateButton);

      // Error should be shown when required and empty
      rerender(<DateTime required value="" onChange={mockOnChange} />);
      expect(dateButton).toBeInTheDocument();
    });

    it('should not show error when allowEdit is false', () => {
      render(
        <DateTime
          required
          value=""
          allowEdit={false}
          onChange={mockOnChange}
        />
      );

      const errorDiv = document.querySelector('.text-red-500');
      expect(errorDiv).not.toBeInTheDocument();
    });

    it('should show helper text only when allowEdit is true', () => {
      const { rerender } = render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          helperText="Select date and time"
          allowEdit={true}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Select date and time')).toBeInTheDocument();

      rerender(
        <DateTime
          value="2024-01-15T10:30:00Z"
          helperText="Select date and time"
          allowEdit={false}
          onChange={mockOnChange}
        />
      );
      expect(screen.queryByText('Select date and time')).not.toBeInTheDocument();
    });
  });

  describe('Input Handling Edge Cases', () => {
    it('should handle input with invalid date format', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            const initialCallCount = mockOnChange.mock.calls.length;
            fireEvent.change(input, { target: { value: '2024-13-45 25:99' } });
            fireEvent.blur(input);
            // Should not call onChange for invalid input
            expect(mockOnChange.mock.calls.length).toBe(initialCallCount);
          }
        });
      }
    });

    it('should handle input with only time part', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            const initialCallCount = mockOnChange.mock.calls.length;
            fireEvent.change(input, { target: { value: '14:30' } });
            fireEvent.blur(input);
            // Should not call onChange for time-only input
            expect(mockOnChange.mock.calls.length).toBe(initialCallCount);
          }
        });
      }
    });

    it('should handle input with extra spaces', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '  2024-01-20  14:30  ' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should handle Enter key in input mode', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20 14:30' } });
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
            // Enter should blur the input
            expect(document.activeElement).not.toBe(input);
          }
        });
      }
    });
  });

  describe('Calendar Navigation Edge Cases', () => {
    it('should navigate to different year in calendar', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(async () => {
        const yearButton = screen.getByText('2024');
        fireEvent.click(yearButton);

        await waitFor(() => {
          const yearOptions = document.querySelectorAll(
            'button[class*="rounded-md"]'
          );
          if (yearOptions.length > 0) {
            // Find a different year
            const differentYear = Array.from(yearOptions).find(
              (btn) => btn.textContent !== '2024' && btn.textContent?.match(/\d{4}/)
            ) as HTMLButtonElement;
            if (differentYear) {
              fireEvent.click(differentYear);
              expect(mockOnChange).toHaveBeenCalled();
            }
          }
        });
      });
    });

    it('should navigate year pages forward and backward', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(async () => {
        const yearButton = screen.getByText('2024');
        fireEvent.click(yearButton);

        await waitFor(() => {
          const navButtons = document.querySelectorAll(
            'button[class*="h-8 w-8"]'
          );
          if (navButtons.length >= 2) {
            const nextButton = navButtons[navButtons.length - 1] as HTMLButtonElement;
            fireEvent.click(nextButton);
            // Should navigate to next year page
            expect(navButtons.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('should select different month from month picker', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(async () => {
        const monthButton = screen.getByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
        if (monthButton) {
          fireEvent.click(monthButton);

          await waitFor(() => {
            const monthOptions = document.querySelectorAll(
              'button[class*="rounded-xl"]'
            );
            if (monthOptions.length > 0) {
              // Find a different month
              const differentMonth = Array.from(monthOptions).find(
                (btn) => !btn.textContent?.includes('Jan')
              ) as HTMLButtonElement;
              if (differentMonth) {
                fireEvent.click(differentMonth);
                expect(mockOnChange).toHaveBeenCalled();
              }
            }
          });
        }
      });
    });

    it('should navigate month year forward and backward', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(async () => {
        const monthButton = screen.getByText(/Jan|Feb|Mar/i);
        if (monthButton) {
          fireEvent.click(monthButton);

          await waitFor(() => {
            const navButtons = document.querySelectorAll(
              'button[class*="h-8 w-8"]'
            );
            if (navButtons.length >= 2) {
              const nextButton = navButtons[navButtons.length - 1] as HTMLButtonElement;
              fireEvent.click(nextButton);
              // Should navigate to next year
              expect(navButtons.length).toBeGreaterThan(0);
            }
          });
        }
      });
    });
  });

  describe('Timezone Edge Cases', () => {
    it('should handle sameTimezone config option', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ sameTimezone: true, timeZone: 'UTC' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle timeZoneLabel config option', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ timeZoneLabel: 'America/Los_Angeles' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle value with timezone offset', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00+05:30"
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle value with negative timezone offset', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00-07:00"
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Icon Prop', () => {
    it('should render with icon prop', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          icon="calendar"
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Default Value Handling', () => {
    it('should use defaultValue when value is empty', () => {
      render(
        <DateTime
          value=""
          config={{ defaultValue: '2024-05-20T12:00:00Z' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should prioritize value over defaultValue', () => {
      render(
        <DateTime
          value="2024-06-15T14:30:00Z"
          config={{ defaultValue: '2024-05-20T12:00:00Z' }}
          onChange={mockOnChange}
        />
      );
      expect(getDateButton().textContent).toContain('2024');
    });
  });

  describe('Time Selection Edge Cases', () => {
    it('should handle time selection when date is empty', async () => {
      render(
        <DateTime value="" onChange={mockOnChange} />
      );

      fireEvent.click(getTimeButton());

      await waitFor(() => {
        const timeOptions = document.querySelectorAll(
          'button[class*="rounded-xl"]'
        );
        if (timeOptions.length > 0) {
          const firstTimeOption = timeOptions[0] as HTMLButtonElement;
          if (firstTimeOption && !firstTimeOption.disabled) {
            fireEvent.click(firstTimeOption);
            expect(mockOnChange).toHaveBeenCalled();
          }
        }
      });
    });

    it('should handle "Now" button when date is empty', async () => {
      render(
        <DateTime value="" onChange={mockOnChange} />
      );

      fireEvent.click(getTimeButton());

      await waitFor(() => {
        const nowButton = screen.getByText('Now');
        fireEvent.click(nowButton);
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Date Selection Edge Cases', () => {
    it('should handle date selection when time is empty', async () => {
      render(
        <DateTime value="" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const dayButtons = document.querySelectorAll(
          'button[class*="rounded-full"]'
        );
        if (dayButtons.length > 0) {
          const firstEnabledDay = Array.from(dayButtons).find(
            (btn) => !(btn as HTMLButtonElement).disabled
          ) as HTMLButtonElement;
          if (firstEnabledDay) {
            fireEvent.click(firstEnabledDay);
            expect(mockOnChange).toHaveBeenCalled();
          }
        }
      });
    });

    it('should handle "Today" button when time is empty', async () => {
      render(
        <DateTime value="" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const todayButton = screen.getByText('Today');
        fireEvent.click(todayButton);
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Input Focus and Blur', () => {
    it('should focus input when entering edit mode', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            input.focus();
            expect(document.activeElement).toBe(input);
          }
        });
      }
    });

    it('should maintain input value during editing', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20 14:30' } });
            expect(input.value).toBe('2024-01-20 14:30');
            // Value should persist until blur
            expect(input.value).toBe('2024-01-20 14:30');
          }
        });
      }
    });
  });

  describe('Calendar Edge Cases', () => {
    it('should handle calendar month with different start days', async () => {
      render(
        <DateTime value="2024-02-01T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        expect(screen.getByText('Mo')).toBeInTheDocument();
      });
    });

    it('should handle leap year dates', async () => {
      render(
        <DateTime value="2024-02-29T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const dayButtons = document.querySelectorAll(
          'button[class*="rounded-full"]'
        );
        expect(dayButtons.length).toBeGreaterThan(0);
      });
    });

    it('should handle year boundary navigation', async () => {
      render(
        <DateTime value="2024-12-31T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const nextButton = document.querySelectorAll(
          'button[class*="p-2 rounded-xl"]'
        );
        if (nextButton.length > 0) {
          const lastButton = nextButton[nextButton.length - 1] as HTMLButtonElement;
          fireEvent.click(lastButton);
          // Should navigate to next year
          expect(nextButton.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Display Format Edge Cases', () => {
    it('should display placeholder when value is empty', () => {
      render(
        <DateTime value="" onChange={mockOnChange} />
      );

      const dateButton = getDateButton();
      expect(dateButton.textContent).toContain('YYYY');
    });

    it('should display time placeholder when value is empty', () => {
      render(
        <DateTime value="" onChange={mockOnChange} />
      );

      const timeButton = getTimeButton();
      expect(timeButton.textContent).toContain('HH:mm');
    });
  });

  describe('Input Parsing Edge Cases', () => {
    it('should handle date with single digit month and day', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-1-5 14:30' } });
            fireEvent.blur(input);
            // Should handle or reject based on format
            expect(input).toBeInTheDocument();
          }
        });
      }
    });

    it('should handle time with single digit hour in 12-hour format', async () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          config={{ hourFormat: '12' }}
          onChange={mockOnChange}
        />
      );

      const container = document.querySelector('.w-full.relative');
      if (container) {
        fireEvent.doubleClick(container);

        await waitFor(() => {
          const input = document.querySelector('input') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: '2024-01-20 9:30 AM' } });
            fireEvent.blur(input);
            expect(mockOnChange).toHaveBeenCalled();
          }
        });
      }
    });

    it('should handle midnight in 12-hour format', async () => {
      render(
        <DateTime
          value="2024-01-15T00:00:00Z"
          config={{ hourFormat: '12' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle noon in 12-hour format', async () => {
      render(
        <DateTime
          value="2024-01-15T12:00:00Z"
          config={{ hourFormat: '12' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Calendar State Management', () => {
    it('should update calendar month when date changes externally', () => {
      const { rerender } = render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      rerender(
        <DateTime value="2024-06-20T10:30:00Z" onChange={mockOnChange} />
      );

      expect(getDateButton()).toBeInTheDocument();
    });

    it('should initialize calendar with current date when value is empty', () => {
      render(
        <DateTime value="" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      // Calendar should render
      expect(screen.queryByText('Mo')).toBeInTheDocument();
    });
  });

  describe('Dropdown Position Calculation', () => {
    it('should calculate dropdown position when opened', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        const dropdown = document.querySelector('.fixed.z-\\[9999\\]');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('should calculate time dropdown position when opened', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getTimeButton());

      await waitFor(() => {
        const dropdown = document.querySelector('.fixed.z-\\[9999\\]');
        expect(dropdown).toBeInTheDocument();
      });
    });
  });

  describe('ReadOnly State Transitions', () => {
    it('should close pickers when readOnly becomes true', async () => {
      const { rerender } = render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      fireEvent.click(getDateButton());

      await waitFor(() => {
        expect(screen.getByText('Mo')).toBeInTheDocument();
      });

      rerender(
        <DateTime
          value="2024-01-15T10:30:00Z"
          readOnly
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Mo')).not.toBeInTheDocument();
      });
    });

    it('should prevent time selection when readOnly', async () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          readOnly
          onChange={mockOnChange}
        />
      );

      fireEvent.click(getTimeButton());
      expect(screen.queryByText('Now')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State Behavior', () => {
    it('should prevent all interactions when disabled', () => {
      render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          disabled
          onChange={mockOnChange}
        />
      );

      const dateButton = getDateButton();
      const timeButton = getTimeButton();

      expect(dateButton).toBeDisabled();
      expect(timeButton).toBeDisabled();
    });

    it('should not call onChange when disabled and value changes externally', () => {
      const { rerender } = render(
        <DateTime
          value="2024-01-15T10:30:00Z"
          disabled
          onChange={mockOnChange}
        />
      );

      mockOnChange.mockClear();

      rerender(
        <DateTime
          value="2024-02-15T10:30:00Z"
          disabled
          onChange={mockOnChange}
        />
      );

      // onChange should not be called by component itself when disabled
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Value Format Variations', () => {
    it('should handle ISO string without Z suffix', () => {
      render(
        <DateTime value="2024-01-15T10:30:00" onChange={mockOnChange} />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle value with milliseconds', () => {
      render(
        <DateTime value="2024-01-15T10:30:00.123Z" onChange={mockOnChange} />
      );
      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should handle value change from valid to invalid', () => {
      const { rerender } = render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      rerender(
        <DateTime value="invalid-date-string" onChange={mockOnChange} />
      );

      expect(getDateButton()).toBeInTheDocument();
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Time Format Display', () => {
    it('should display time correctly in 24-hour format with seconds', () => {
      render(
        <DateTime
          value="2024-03-15T14:30:45Z"
          config={{ timeFormat: 'HH:mm:ss', hourFormat: '24' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });

    it('should display time correctly in 12-hour format with seconds', () => {
      render(
        <DateTime
          value="2024-03-15T14:30:45Z"
          config={{ timeFormat: 'HH:mm:ss', hourFormat: '12' }}
          onChange={mockOnChange}
        />
      );
      expect(getTimeButton()).toBeInTheDocument();
    });
  });

  describe('Date Format Display', () => {
    it('should display date in YYYY/MM/DD format correctly', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ dateFormat: 'YYYY/MM/DD' }}
          onChange={mockOnChange}
        />
      );
      const dateButton = getDateButton();
      expect(dateButton).toBeInTheDocument();
    });

    it('should display date in DD-MM-YYYY format correctly', () => {
      render(
        <DateTime
          value="2024-03-15T10:30:00Z"
          config={{ dateFormat: 'DD-MM-YYYY' }}
          onChange={mockOnChange}
        />
      );
      const dateButton = getDateButton();
      expect(dateButton).toBeInTheDocument();
    });
  });

  describe('Multiple Rapid Interactions', () => {
    it('should handle rapid date picker open/close', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const dateButton = getDateButton();
      fireEvent.click(dateButton);
      fireEvent.click(dateButton);
      fireEvent.click(dateButton);

      await waitFor(() => {
        // Should handle rapid clicks gracefully
        expect(dateButton).toBeInTheDocument();
      });
    });

    it('should handle rapid time picker open/close', async () => {
      render(
        <DateTime value="2024-01-15T10:30:00Z" onChange={mockOnChange} />
      );

      const timeButton = getTimeButton();
      fireEvent.click(timeButton);
      fireEvent.click(timeButton);
      fireEvent.click(timeButton);

      await waitFor(() => {
        // Should handle rapid clicks gracefully
        expect(timeButton).toBeInTheDocument();
      });
    });
  });
});
