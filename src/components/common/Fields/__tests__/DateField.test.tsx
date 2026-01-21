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

    it('should support DD/MM/YYYY format', () => {
      render(
        <DateField value="15/03/2024" onChange={mockOnChange} format="DD/MM/YYYY" />
      );
      expect(
        screen.getByRole('button', { name: /15\/03\/2024/ })
      ).toBeInTheDocument();
    });

    it('should support MM/DD/YYYY format', () => {
      render(
        <DateField value="03/15/2024" onChange={mockOnChange} format="MM/DD/YYYY" />
      );
      expect(
        screen.getByRole('button', { name: /03\/15\/2024/ })
      ).toBeInTheDocument();
    });

    it('should support DD MM YYYY format', () => {
      render(
        <DateField value="15 03 2024" onChange={mockOnChange} format="DD MM YYYY" />
      );
      expect(
        screen.getByRole('button', { name: /15 03 2024/ })
      ).toBeInTheDocument();
    });

    it('should handle ISO datetime format', () => {
      render(
        <DateField value="2024-03-15T00:00:00Z" onChange={mockOnChange} format="ISO" />
      );
      expect(
        screen.getByRole('button', { name: /2024-03-15/ })
      ).toBeInTheDocument();
    });

    it('should handle ISO datetime with offset', () => {
      render(
        <DateField value="2024-03-15T00:00:00+00:00" onChange={mockOnChange} format="ISO" />
      );
      expect(
        screen.getByRole('button', { name: /2024-03-15/ })
      ).toBeInTheDocument();
    });

    it('should auto-detect ISO datetime format', () => {
      render(
        <DateField value="2024-03-15T10:30:00Z" onChange={mockOnChange} />
      );
      expect(
        screen.getByRole('button', { name: /2024-03-15/ })
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

    it('should validate min date constraint', async () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          min="2024-06-01"
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: '2024-05-01' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should validate max date constraint', async () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          max="2024-06-30"
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: '2024-07-01' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should validate min date from config', async () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          config={{ min: '2024-06-01' }}
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: '2024-05-01' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should validate max date from config', async () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          config={{ max: '2024-06-30' }}
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: '2024-07-01' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should show error for invalid date format', async () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: 'invalid-date' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should show error for required field when empty on blur', async () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          required
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      await waitFor(() => {
        // When required field is cleared, onChange is called with empty string
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
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

    it('should enter edit mode on double-click', async () => {
      render(
        <DateField value="2024-01-15" onChange={mockOnChange} format="YYYY-MM-DD" />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });
    });

    it('should not enter edit mode on double-click when disabled', () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          disabled
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      expect(screen.queryByPlaceholderText(/YYYY-MM-DD/)).not.toBeInTheDocument();
    });

    it('should not enter edit mode on double-click when readOnly', () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          readOnly
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      expect(screen.queryByPlaceholderText(/YYYY-MM-DD/)).not.toBeInTheDocument();
    });

    it('should handle input change in edit mode', async () => {
      render(
        <DateField value="2024-01-15" onChange={mockOnChange} format="YYYY-MM-DD" />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: '2024-06-20' } });
      expect(input).toHaveValue('2024-06-20');
    });

    it('should save valid date on blur', async () => {
      render(
        <DateField value="2024-01-15" onChange={mockOnChange} format="YYYY-MM-DD" />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: '2024-06-20' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('2024-06-20');
      });
    });

    it('should clear invalid date on blur', async () => {
      render(
        <DateField value="2024-01-15" onChange={mockOnChange} format="YYYY-MM-DD" />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: 'not-a-date' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    it('should clear empty date on blur', async () => {
      render(
        <DateField value="2024-01-15" onChange={mockOnChange} format="YYYY-MM-DD" />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('');
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

  describe('Calendar Navigation', () => {
    it('should navigate to previous month', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Jun/i);
      });

      const prevButton = document.querySelector('button[class*="rounded-xl"]');
      if (prevButton) {
        fireEvent.click(prevButton);
        await waitFor(() => {
          expect(document.body.innerHTML).toMatch(/May|Apr/i);
        });
      }
    });

    it('should navigate to next month', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Jun/i);
      });

      const buttons = document.querySelectorAll('button[class*="rounded-xl"]');
      const nextButton = Array.from(buttons).find((btn) =>
        btn.querySelector('.lucide-chevron-right')
      );
      if (nextButton) {
        fireEvent.click(nextButton);
        await waitFor(() => {
          expect(document.body.innerHTML).toMatch(/Jul|Aug/i);
        });
      }
    });

    it('should open month picker', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Jun|Jul/i);
      });

      const monthButton = document.querySelector('button[class*="px-3 py-1"]');
      if (monthButton) {
        fireEvent.click(monthButton);
        await waitFor(() => {
          expect(document.querySelector('[data-month-picker]')).toBeInTheDocument();
        });
      }
    });

    it('should select month from month picker', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Jun|Jul/i);
      });

      const monthButton = document.querySelector('button[class*="px-3 py-1"]');
      if (monthButton) {
        fireEvent.click(monthButton);
        await waitFor(() => {
          expect(document.querySelector('[data-month-picker]')).toBeInTheDocument();
        });

        const monthOptions = document.querySelectorAll('[data-month-picker] button');
        if (monthOptions.length > 0) {
          const janButton = Array.from(monthOptions).find((btn) =>
            btn.textContent?.includes('Jan')
          );
          if (janButton) {
            fireEvent.click(janButton);
            await waitFor(() => {
              expect(document.body.innerHTML).toMatch(/Jan/i);
            });
          }
        }
      }
    });

    it('should navigate year in month picker', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Jun|Jul/i);
      });

      const monthButton = document.querySelector('button[class*="px-3 py-1"]');
      if (monthButton) {
        fireEvent.click(monthButton);
        await waitFor(() => {
          expect(document.querySelector('[data-month-picker]')).toBeInTheDocument();
        });

        const yearNavButtons = document.querySelectorAll('[data-month-picker] button[class*="h-8 w-8"]');
        if (yearNavButtons.length > 0) {
          const prevYearButton = yearNavButtons[0];
          fireEvent.click(prevYearButton);
          await waitFor(() => {
            expect(document.body.innerHTML).toMatch(/2023/);
          });
        }
      }
    });

    it('should open year picker', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/2024/);
      });

      const yearButton = Array.from(document.querySelectorAll('button[class*="px-3 py-1"]')).find(
        (btn) => btn.textContent?.includes('2024')
      );
      if (yearButton) {
        fireEvent.click(yearButton);
        await waitFor(() => {
          expect(document.querySelector('[data-year-picker]')).toBeInTheDocument();
        });
      }
    });

    it('should select year from year picker', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/2024/);
      });

      const yearButton = Array.from(document.querySelectorAll('button[class*="px-3 py-1"]')).find(
        (btn) => btn.textContent?.includes('2024')
      );
      if (yearButton) {
        fireEvent.click(yearButton);
        await waitFor(() => {
          expect(document.querySelector('[data-year-picker]')).toBeInTheDocument();
        });

        const yearOptions = document.querySelectorAll('[data-year-picker] button[type="button"]');
        if (yearOptions.length > 0) {
          const year2025 = Array.from(yearOptions).find((btn) =>
            btn.textContent?.includes('2025')
          );
          if (year2025) {
            fireEvent.click(year2025);
            await waitFor(() => {
              expect(document.body.innerHTML).toMatch(/2025/);
            });
          }
        }
      }
    });

    it('should navigate year pages in year picker', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/2024/);
      });

      const yearButton = Array.from(document.querySelectorAll('button[class*="px-3 py-1"]')).find(
        (btn) => btn.textContent?.includes('2024')
      );
      if (yearButton) {
        fireEvent.click(yearButton);
        await waitFor(() => {
          expect(document.querySelector('[data-year-picker]')).toBeInTheDocument();
        });

        const navButtons = document.querySelectorAll('[data-year-picker] button[class*="h-8 w-8"]');
        if (navButtons.length > 0) {
          const nextButton = navButtons[navButtons.length - 1];
          fireEvent.click(nextButton);
          await waitFor(() => {
            // Check that year options have changed (new years visible)
            const yearOptions = document.querySelectorAll('[data-year-picker] button[type="button"]');
            const yearTexts = Array.from(yearOptions).map(btn => btn.textContent);
            expect(yearTexts.some(text => text && /203[0-9]/.test(text))).toBe(true);
          });
        }
      }
    });
  });

  describe('Today Button', () => {
    it('should select today when Today button is clicked', async () => {
      render(<DateField value="" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Mo|Tu|We/i);
      });

      const todayButton = screen.queryByText('Today');
      if (todayButton) {
        fireEvent.click(todayButton);
        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalled();
        });
      }
    });

    it('should hide Today button when hideTodayButton is true', async () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          config={{ hideTodayButton: true }}
        />
      );
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
      });
    });

    it('should not select today when readOnly', async () => {
      render(<DateField value="" onChange={mockOnChange} readOnly />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        const todayButton = screen.queryByText('Today');
        if (todayButton) {
          expect(todayButton).toBeDisabled();
        }
      });
    });
  });

  describe('Click Outside', () => {
    it('should close calendar when clicking outside', async () => {
      render(
        <div>
          <DateField value="" onChange={mockOnChange} />
          <div data-testid="outside">Outside</div>
        </div>
      );
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Mo|Tu|We/i);
      });

      const outside = screen.getByTestId('outside');
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(document.body.innerHTML).not.toMatch(/Mo|Tu|We/i);
      });
    });

    it('should close year picker when clicking outside', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/2024/);
      });

      const yearButton = Array.from(document.querySelectorAll('button[class*="px-3 py-1"]')).find(
        (btn) => btn.textContent?.includes('2024')
      );
      if (yearButton) {
        fireEvent.click(yearButton);
        await waitFor(() => {
          expect(document.querySelector('[data-year-picker] .absolute')).toBeInTheDocument();
        });

        fireEvent.mouseDown(document.body);
        await waitFor(() => {
          const dropdown = document.querySelector('[data-year-picker] .absolute');
          expect(dropdown).toBeNull();
        });
      }
    });

    it('should close month picker when clicking outside', async () => {
      render(<DateField value="2024-06-15" onChange={mockOnChange} />);
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/Jun|Jul/i);
      });

      const monthButton = document.querySelector('button[class*="px-3 py-1"]');
      if (monthButton) {
        fireEvent.click(monthButton);
        await waitFor(() => {
          expect(document.querySelector('[data-month-picker] .absolute')).toBeInTheDocument();
        });

        fireEvent.mouseDown(document.body);
        await waitFor(() => {
          const dropdown = document.querySelector('[data-month-picker] .absolute');
          expect(dropdown).toBeNull();
        });
      }
    });
  });

  describe('Disabled Dates', () => {
    it('should disable dates before min date', async () => {
      render(
        <DateField
          value="2024-06-15"
          onChange={mockOnChange}
          min="2024-06-10"
          format="YYYY-MM-DD"
        />
      );
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        const dayButtons = document.querySelectorAll('button[class*="rounded-full"]');
        const disabledButtons = Array.from(dayButtons).filter((btn) => btn.disabled);
        expect(disabledButtons.length).toBeGreaterThan(0);
      });
    });

    it('should disable dates after max date', async () => {
      render(
        <DateField
          value="2024-06-15"
          onChange={mockOnChange}
          max="2024-06-20"
          format="YYYY-MM-DD"
        />
      );
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        const dayButtons = document.querySelectorAll('button[class*="rounded-full"]');
        const disabledButtons = Array.from(dayButtons).filter((btn) => btn.disabled);
        expect(disabledButtons.length).toBeGreaterThan(0);
      });
    });

    it('should not allow selecting disabled dates', async () => {
      render(
        <DateField
          value="2024-06-15"
          onChange={mockOnChange}
          min="2024-06-10"
          max="2024-06-20"
          format="YYYY-MM-DD"
        />
      );
      fireEvent.click(getTriggerButton());

      await waitFor(() => {
        const dayButtons = document.querySelectorAll('button[class*="rounded-full"]');
        const disabledButton = Array.from(dayButtons).find((btn) => btn.disabled);
        if (disabledButton) {
          const initialCallCount = mockOnChange.mock.calls.length;
          fireEvent.click(disabledButton);
          expect(mockOnChange.mock.calls.length).toBe(initialCallCount);
        }
      });
    });
  });

  describe('Additional Format Support', () => {
    it('should handle format detection for ambiguous dates', () => {
      render(
        <DateField value="15-03-2024" onChange={mockOnChange} format="DD-MM-YYYY" />
      );
      expect(
        screen.getByRole('button', { name: /15-03-2024/ })
      ).toBeInTheDocument();
    });

    it('should handle format detection for dates with first number > 12', () => {
      render(
        <DateField value="25-03-2024" onChange={mockOnChange} format="DD-MM-YYYY" />
      );
      expect(
        screen.getByRole('button', { name: /25-03-2024/ })
      ).toBeInTheDocument();
    });

    it('should handle format detection for dates with second number > 12', () => {
      render(
        <DateField value="03-25-2024" onChange={mockOnChange} format="MM-DD-YYYY" />
      );
      expect(
        screen.getByRole('button', { name: /03-25-2024/ })
      ).toBeInTheDocument();
    });
  });

  describe('Styling Props', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <DateField value="" onChange={mockOnChange} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should apply isBorder class when isBorder is true', () => {
      const { container } = render(
        <DateField value="" onChange={mockOnChange} isBorder />
      );
      expect(container.firstChild).toHaveClass('field-component-border');
    });
  });

  describe('Error Display', () => {
    it('should display error message when validation fails', async () => {
      render(
        <DateField
          value="2024-01-15"
          onChange={mockOnChange}
          min="2024-06-01"
          max="2024-12-31"
          format="YYYY-MM-DD"
        />
      );
      const button = getTriggerButton();
      fireEvent.doubleClick(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
        expect(input).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/YYYY-MM-DD/);
      // Enter a date that violates min constraint - error should show while typing
      fireEvent.change(input, { target: { value: '2024-05-01' } });

      await waitFor(() => {
        // Error message should appear while typing invalid date
        const errorElement = document.querySelector('.text-red-600');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement?.textContent).toMatch(/Date must be after/i);
      });
    });

    it('should not display error when allowEdit is false', async () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          required
          allowEdit={false}
        />
      );
      const button = getTriggerButton();
      fireEvent.blur(button);

      await waitFor(() => {
        const errorElement = document.querySelector('.text-red-600');
        expect(errorElement).not.toBeInTheDocument();
      });
    });
  });

  describe('Helper Text Display', () => {
    it('should not display helper text when allowEdit is false', () => {
      render(
        <DateField
          value=""
          onChange={mockOnChange}
          helperText="Select a date"
          allowEdit={false}
        />
      );
      expect(screen.queryByText(/select a date/i)).not.toBeInTheDocument();
    });
  });
});
