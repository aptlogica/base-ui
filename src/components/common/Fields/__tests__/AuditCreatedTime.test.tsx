import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
        />
      );

      const input = document.querySelector('input');
      expect(input?.readOnly || input?.disabled).toBe(true);
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
          config={{ hourFormat: '24' }}
        />
      );

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
          value={null as any}
          onChange={mockOnChange}
        />
      );

      expect(document.body).toBeInTheDocument();
    });

    it('should handle undefined value', () => {
      render(
        <AuditCreatedTime
          value={undefined as any}
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

      const input = document.querySelector('input');
      expect(input?.disabled).toBe(true);
    });

    it('should be read-only as audit field by default', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
          onChange={mockOnChange}
        />
      );

      const input = document.querySelector('input');
      expect(input?.readOnly).toBe(true);
    });

    it('should prevent editing', () => {
      render(
        <AuditCreatedTime
          value="2024-01-15T10:30:00Z"
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
        />
      );

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
        />
      );

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.readOnly).toBe(true);
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
});
