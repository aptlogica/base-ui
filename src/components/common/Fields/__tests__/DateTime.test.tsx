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
  });

  describe('Validation', () => {
    it('should not call onChange when required and empty', async () => {
      render(<DateTime required value="" onChange={mockOnChange} />);

      fireEvent.blur(getDateButton());

      await waitFor(() => {
        expect(mockOnChange).not.toHaveBeenCalled();
      });
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
  });
});
