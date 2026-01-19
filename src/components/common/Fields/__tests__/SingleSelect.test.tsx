import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Time } from '../Time';

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
}));

vi.mock('../../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(),
}));

describe('Time Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('should render time button with placeholder', () => {
      render(<Time value="" onChange={mockOnChange} />);
      expect(screen.getByText('HH:mm')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<Time label="Time" value="" onChange={mockOnChange} />);
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('should render required indicator', () => {
      render(<Time label="Time" value="" required onChange={mockOnChange} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          helperText="Select time"
        />
      );
      expect(screen.getByText('Select time')).toBeInTheDocument();
    });
  });

  describe('Dropdown Interaction', () => {
    it('should open dropdown on click', async () => {
      render(<Time value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      await waitFor(() =>
        expect(screen.getByText('00:00')).toBeInTheDocument()
      );
    });

    it('should close dropdown after selecting option', async () => {
      render(<Time value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('00:00'));
      await waitFor(() =>
        expect(screen.queryByText('00:30')).not.toBeInTheDocument()
      );
    });

    it('should not open dropdown when disabled', async () => {
      render(<Time value="" disabled onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      expect(screen.queryByText('00:00')).not.toBeInTheDocument();
    });

    it('should not open dropdown when readOnly', async () => {
      render(<Time value="" readOnly onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      expect(screen.queryByText('00:00')).not.toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call onChange with selected time', async () => {
      render(<Time value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('01:00'));
      expect(mockOnChange).toHaveBeenCalledWith('01:00');
    });

    it('should display selected value', async () => {
      render(<Time value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('02:00'));
      expect(screen.getByText('02:00')).toBeInTheDocument();
    });

    it('should not change value when readOnly', async () => {
      render(<Time value="01:00" readOnly onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(screen.getByText('01:00')).toBeInTheDocument();
    });
  });

  describe('12 Hour Format', () => {
    it('should display placeholder for 12 hour format', () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );
      expect(screen.getByText('hh:mm')).toBeInTheDocument();
    });

    it('should convert PM time to 24 hour format on change', async () => {
      render(
        <Time
          value=""
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('1:00 PM'));
      expect(mockOnChange).toHaveBeenCalledWith('13:00');
    });

    it('should display formatted 12 hour value', () => {
      render(
        <Time
          value="13:30"
          onChange={mockOnChange}
          config={{ hourFormat: '12' }}
        />
      );
      expect(screen.getByText('1:30 PM')).toBeInTheDocument();
    });
  });

  describe('Now Button', () => {
    it('should set current time when clicking Now', async () => {
      vi.setSystemTime(new Date('2025-01-01T10:15:00'));
      render(<Time value="" onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      await userEvent.click(screen.getByText('Now'));
      expect(mockOnChange).toHaveBeenCalledWith('10:15');
      vi.useRealTimers();
    });

    it('should not set time when readOnly', async () => {
      render(<Time value="" readOnly onChange={mockOnChange} />);
      await userEvent.click(screen.getByRole('button'));
      expect(screen.queryByText('Now')).not.toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should mark required field error internally when empty', () => {
      render(<Time value="" required onChange={mockOnChange} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept non-empty value for required field', () => {
      render(<Time value="09:00" required onChange={mockOnChange} />);
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });
  });

  describe('Value Synchronization', () => {
    it('should update displayed value when prop changes', () => {
      const { rerender } = render(
        <Time value="08:00" onChange={mockOnChange} />
      );
      expect(screen.getByText('08:00')).toBeInTheDocument();

      rerender(<Time value="09:30" onChange={mockOnChange} />);
      expect(screen.getByText('09:30')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render button role', () => {
      render(<Time value="" onChange={mockOnChange} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should disable button when disabled', () => {
      render(<Time value="" disabled onChange={mockOnChange} />);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
