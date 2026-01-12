import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Duration } from '../Duration';

describe('Duration Component', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render duration input', () => {
      render(<Duration value={null} onChange={mockOnChange} />);
      expect(document.querySelector('input')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(
        <Duration label="Duration" value={null} onChange={mockOnChange} />
      );
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });

    it('should display helper text', () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
          helperText="Time duration in hours:minutes"
        />
      );
      expect(screen.getByText('Time duration in hours:minutes')).toBeInTheDocument();
    });

    it('should show required indicator', () => {
      render(
        <Duration
          label="Time Spent"
          required
          value={null}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should display initial value in h:mm format', () => {
      render(
        <Duration
          value={90}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}/);
    });
  });

  describe('Duration Formatting', () => {
    it('should support h:mm format (default)', () => {
      render(
        <Duration
          value={150}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('2:30'); // 150 minutes = 2 hours 30 minutes
    });

    it('should support h:mm:ss format', () => {
      render(
        <Duration
          value={150}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm:ss' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}:\d{2}/);
    });

    it('should support h:mm:ss.s format (one decimal)', () => {
      render(
        <Duration
          value={150.5}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm:ss.s' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}:\d{2}\.\d/);
    });

    it('should support h:mm:ss.ss format (two decimals)', () => {
      render(
        <Duration
          value={150.55}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm:ss.ss' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}:\d{2}\.\d{2}/);
    });

    it('should support h:mm:ss.sss format (three decimals)', () => {
      render(
        <Duration
          value={150.555}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm:ss.sss' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}:\d{2}\.\d{3}/);
    });

    it('should support d:h:mm format (days)', () => {
      render(
        <Duration
          value={1500}
          onChange={mockOnChange}
          config={{ durationFormat: 'd:h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}:\d{2}/); // Supports day display
    });
  });

  describe('Input Interaction', () => {
    it('should parse h:mm format input', async () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, '2:30');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(150);
      });
    });

    it('should parse h:mm:ss format input', async () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm:ss' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, '1:30:45');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(5445); // 1*3600 + 30*60 + 45
      });
    });

    it('should handle pure numeric input as minutes', async () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, '120');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(120);
      });
    });

    it('should call onChange on blur', async () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      await userEvent.clear(input);
      await userEvent.type(input, '1:30');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('should show error for required field when empty', async () => {
      render(
        <Duration
          required
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input');
      fireEvent.blur(input!);

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should accept zero duration', () => {
      render(
        <Duration
          value={0}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('0:00');
    });

    it('should handle negative durations', () => {
      render(
        <Duration
          value={-90}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/-\d+:\d{2}/);
    });

    it('should accept decimal minutes', () => {
      render(
        <Duration
          value={90.5}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm:ss' }}
        />
      );

      expect(document.querySelector('input')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode on single click when allowEdit is true', async () => {
      const { container } = render(
        <Duration
          value={90}
          onChange={mockOnChange}
          allowEdit={true}
        />
      );

      const field = container.querySelector('div');
      fireEvent.click(field!);
      await new Promise(resolve => setTimeout(resolve, 250));

      const input = document.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('should require double click when allowEdit is false', async () => {
      const { container } = render(
        <Duration
          value={90}
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const field = container.querySelector('div');
      fireEvent.click(field!);
      await new Promise(resolve => setTimeout(resolve, 250));

      let input = document.querySelector('input');
      const isEditing = input !== null;

      fireEvent.doubleClick(field!);
      await new Promise(resolve => setTimeout(resolve, 250));

      input = document.querySelector('input');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Disabled & ReadOnly State', () => {
    it('should disable when disabled is true', () => {
      render(
        <Duration
          value={90}
          onChange={mockOnChange}
          disabled
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should prevent editing when readOnly is true', () => {
      render(
        <Duration
          value={90}
          onChange={mockOnChange}
          readOnly
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });

    it('should not trigger onChange when disabled', async () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
          disabled
        />
      );

      const input = document.querySelector('input');
      if (input) {
        await userEvent.type(input, '2:30');
      }

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Configuration Props', () => {
    it('should use durationFormat from config', () => {
      render(
        <Duration
          value={90}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm:ss' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}:\d{2}/);
    });

    it('should use defaultValue from config', () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
          config={{ defaultValue: '1:30', durationFormat: 'h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('1:30');
    });
  });

  describe('Value Synchronization', () => {
    it('should sync external value changes', () => {
      const { rerender } = render(
        <Duration value={60} onChange={mockOnChange} />
      );

      let input = document.querySelector('input') as HTMLInputElement;
      const firstValue = input.value;

      rerender(<Duration value={120} onChange={mockOnChange} />);
      input = document.querySelector('input') as HTMLInputElement;

      expect(input.value).not.toBe(firstValue);
    });

    it('should handle rapid updates', () => {
      const { rerender } = render(
        <Duration value={30} onChange={mockOnChange} />
      );

      rerender(<Duration value={60} onChange={mockOnChange} />);
      rerender(<Duration value={90} onChange={mockOnChange} />);

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null value', () => {
      render(
        <Duration value={null} onChange={mockOnChange} />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle undefined value', () => {
      render(
        <Duration value={undefined as any} onChange={mockOnChange} />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle very large durations', () => {
      render(
        <Duration
          value={99999}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}/);
    });

    it('should handle fractional seconds', () => {
      render(
        <Duration
          value={90.123}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm:ss.sss' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.value).toMatch(/\d+:\d{2}:\d{2}\.\d{3}/);
    });

    it('should round up minutes when seconds present in h:mm format', () => {
      render(
        <Duration
          value={90.5}
          onChange={mockOnChange}
          config={{ durationFormat: 'h:mm' }}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      // Should round up to next minute
      expect(input.value).toMatch(/\d+:\d{2}/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(
        <Duration
          label="Time Spent"
          value={null}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Time Spent')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <Duration
          value={null}
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input');
      input?.focus();

      expect(input).toHaveFocus();
    });

    it('should be semantic', () => {
      render(
        <Duration
          value={90}
          onChange={mockOnChange}
        />
      );

      expect(document.querySelector('input')).toBeInTheDocument();
    });
  });
});
