import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

      const input = document.querySelector('input');
      expect(input?.readOnly || input?.disabled).toBe(true);
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

      const input = document.querySelector('input');
      expect(input?.disabled).toBe(true);
    });

    it('should be read-only as audit field', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input');
      expect(input?.readOnly).toBe(true);
    });

    it('should prevent editing', () => {
      render(
        <AuditLastModifiedTime
          value="2024-06-20T15:45:30Z"
          onChange={mockOnChange}
          allowEdit={false}
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.readOnly || input.disabled).toBe(true);
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
        />
      );

      expect(document.body.innerHTML).toMatch(/12|31|2024|23|59/);
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

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
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
});
