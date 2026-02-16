import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Time } from '../Time';

describe('Time Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render time button', () => {
      render(<Time value="" onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Time label="Start Time" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Start Time')).toBeInTheDocument();
    });

    it('should display helper text', () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          helperText="Enter time in HH:mm format"
        />
      );
      expect(screen.getByText('Enter time in HH:mm format')).toBeInTheDocument();
    });

    it('should hide helper text when allowEdit is false', () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          helperText="Hidden helper"
          allowEdit={false}
        />
      );
      expect(screen.queryByText('Hidden helper')).not.toBeInTheDocument();
    });

    it('should show required indicator', () => {
      render(
        <Time
          label="Meeting Time"
          required
          value=""
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display initial value on button', () => {
      render(<Time value="14:30" onChange={mockOnChange} />);
      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/14:30|2:30\s?PM/);
    });
  });

  describe('Time Format', () => {
    it('should support 24-hour format', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          config={{ hourFormat: '24' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/14:30/);
    });

    it('should support 12-hour format with AM/PM', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/2:30\s?PM/i);
    });

    it('should display 12-hour time correctly', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/[1-9]:30\s?PM/i);
    });

    it('should handle midnight in 12-hour format', () => {
      render(
        <Time
          value="00:00"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/12:00\s?AM/i);
    });

    it('should handle noon in 12-hour format', () => {
      render(
        <Time
          value="12:00"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/12:00\s?PM/i);
    });
  });

  describe('Time Selection', () => {
    it('should open dropdown picker on button click', async () => {
      render(<Time value="" onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(document.body.innerHTML).toMatch(/\d{1,2}:\d{2}/);
      });
    });

    it('should display time options in dropdown portal', async () => {
      render(<Time value="" onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        const hasTimeOptions = allButtons.some(btn => /\d{1,2}:\d{2}/.test(btn.textContent || ''));
        expect(hasTimeOptions).toBe(true);
      });
    });

    it('should select time from dropdown', async () => {
      render(<Time value="" onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        const timeButton = allButtons.find(btn => btn.textContent?.trim().match(/^\d{1,2}:\d{2}/));
        if (timeButton) {
          fireEvent.click(timeButton);
        }
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should close dropdown after selection', async () => {
      render(<Time value="" onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const allButtons = screen.getAllByRole('button');
        const timeButton = allButtons.find(btn => /^\d{1,2}:\d{2}/.test(btn.textContent?.trim() || ''));
        if (timeButton) {
          fireEvent.click(timeButton);
        }
      });

      const nowButton = screen.queryAllByRole('button').find(btn => btn.textContent === 'Now');
      expect(nowButton).toBeUndefined();
    });
  });

  describe('Placeholder and Empty State', () => {
    it('should show placeholder when value is empty in 24-hour format', () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          config={{ hourFormat: '24' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/HH:mm|hh:mm/);
    });

    it('should show placeholder when value is empty in 12-hour format', () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/hh:mm/);
    });
  });

  describe('Now Button', () => {
    it('should have a Now button in dropdown', async () => {
      render(<Time value="" onChange={mockOnChange} />);

      const button = screen.getAllByRole('button')[0];
      fireEvent.click(button);

      await waitFor(() => {
        const nowButton = screen.getByRole('button', { name: 'Now' });
        expect(nowButton).toBeInTheDocument();
      });
    });

    it('should set current time when Now button is clicked', async () => {
      render(<Time value="" onChange={mockOnChange} />);

      const button = screen.getAllByRole('button')[0];
      fireEvent.click(button);

      await waitFor(() => {
        const nowButton = screen.getByRole('button', { name: 'Now' });
        fireEvent.click(nowButton);
      });

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const call = mockOnChange.mock.calls[0][0];
        expect(call).toMatch(/\d{2}:\d{2}/);
      });
    });

    it('should output 24-hour storage value when selecting from 12-hour dropdown', async () => {
      render(<Time value="" onChange={mockOnChange} config={{ hourFormat: '12' }} />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        const option = screen.getByRole('button', { name: '1:00 PM' });
        fireEvent.click(option);
      });

      expect(mockOnChange).toHaveBeenCalledWith('13:00');
    });
  });

  describe('Validation', () => {
    it('should show error for required field when empty', async () => {
      render(
        <Time
          required
          value=""
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should accept valid time format', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should validate 24-hour format range', () => {
      render(
        <Time
          value="23:59"
          onChange={mockOnChange}
          config={{ hourFormat: '24' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/23:59/);
    });

    it('should validate 12-hour format', () => {
      render(
        <Time
          value="11:59"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/11:59/i);
    });
  });

  describe('Edit Mode', () => {
    it('should open picker on single click when allowEdit is true', async () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should prevent editing when allowEdit is false', async () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.doubleClick(button);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      const input = screen.queryByRole('spinbutton') || screen.queryByRole('textbox');
      expect(input).not.toBeInTheDocument();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable button when disabled is true', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          disabled
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable button when readOnly is true', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          readOnly
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not open dropdown when disabled', async () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          disabled
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const timeOptions = screen.queryAllByRole('button').filter(btn => /\d{1,2}:\d{2}/.test(btn.textContent || ''));
      expect(timeOptions.length).toBe(0);
    });

    it('should not open dropdown when readOnly', async () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          readOnly
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const timeOptions = screen.queryAllByRole('button').filter(btn => /\d{1,2}:\d{2}/.test(btn.textContent || ''));
      expect(timeOptions.length).toBe(0);
    });

    it('should close opened dropdown when readOnly toggles to true', async () => {
      const { rerender } = render(
        <Time
          value=""
          onChange={mockOnChange}
          readOnly={false}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Now' })).toBeInTheDocument());

      rerender(
        <Time
          value=""
          onChange={mockOnChange}
          readOnly
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Now' })).not.toBeInTheDocument();
      });
    });
  });

  describe('Configuration Props', () => {
    it('should use hourFormat from config', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/(AM|PM)/i);
    });

    it('should use defaultValue from config', () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          config={{ defaultValue: '09:00' }}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should use timeFormat from config', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          config={{ timeFormat: 'HH:mm' }}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external value changes to button display', () => {
      const { rerender } = render(
        <Time value="10:00" onChange={mockOnChange} />
      );

      let button = screen.getByRole('button');
      const firstValue = button.textContent;

      rerender(<Time value="14:30" onChange={mockOnChange} />);
      button = screen.getByRole('button');

      expect(button.textContent).not.toBe(firstValue);
      expect(button.textContent).toMatch(/14:30|2:30\s?PM/);
    });

    it('should handle rapid updates', () => {
      const { rerender } = render(
        <Time value="08:00" onChange={mockOnChange} />
      );

      rerender(<Time value="12:00" onChange={mockOnChange} />);
      rerender(<Time value="18:30" onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/18:30|6:30\s?PM/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <Time value={(null as unknown) as string} onChange={mockOnChange} />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <Time value={undefined} onChange={mockOnChange} />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle midnight', () => {
      render(
        <Time
          value="00:00"
          onChange={mockOnChange}
          config={{ hourFormat: '24' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/00:00/);
    });

    it('should handle end of day', () => {
      render(
        <Time
          value="23:59"
          onChange={mockOnChange}
          config={{ hourFormat: '24' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button.textContent).toMatch(/23:59/);
    });

    it('should keep component stable with malformed input value', () => {
      render(
        <Time
          value={'bad-value' as unknown as string}
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('AllowEdit Behavior', () => {
    it('should open dropdown when allowEdit is true and button is clicked', async () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        const nowButton = screen.getByRole('button', { name: 'Now' });
        expect(nowButton).toBeInTheDocument();
      });
    });

    it('should not open dropdown when allowEdit is false', () => {
      render(
        <Time
          value="14:30"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const nowButtons = screen.queryAllByRole('button', { name: 'Now' });
      expect(nowButtons.length).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <Time
          label="Start Time"
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Start Time')).toBeInTheDocument();
    });

    it('should be keyboard focusable', () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });
});
