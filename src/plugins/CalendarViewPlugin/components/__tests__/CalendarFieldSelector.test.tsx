import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarFieldConfiguration } from '../CalendarFieldSelector';
import type { GridColumn } from '../../../../plugins/GridViewPlugin/types/grid.types';

vi.mock('../../../../hooks/useSmartPopover', () => ({
  useSmartPopover: () => ({
    position: { top: 100, left: 100 },
    triggerRef: { current: null },
    panelRef: { current: null }
  })
}));

vi.mock('../../../../types/fieldTypes', () => ({
  getFieldTypeIconWithMargin: () => <span>Icon</span>
}));

vi.mock('../../../../components/common/dropdown/AdvancedDropdown', () => ({
  AdvancedDropdown: ({ label, value, onChange, options, helpText }: any) => (
    <div data-testid="advanced-dropdown">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helpText && <span>{helpText}</span>}
    </div>
  )
}));

describe('CalendarFieldConfiguration', () => {
  const mockColumns: GridColumn[] = [
    { id: '1', key: 'start_date', title: 'Start Date', type: 'datetime', uidt: 'datetime' },
    { id: '2', key: 'end_date', title: 'End Date', type: 'date', uidt: 'date' },
    { id: '3', key: 'created_at', title: 'Created', type: 'createdTime', uidt: 'createdtime' },
    { id: '4', key: 'name', title: 'Name', type: 'text', uidt: 'text' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render calendar fields button', () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      expect(screen.getByText('Calendar Fields')).toBeInTheDocument();
    });

    it('should not render when onDateFieldChange is not provided', () => {
      const { container } = render(
        <CalendarFieldConfiguration columns={mockColumns} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
          className="custom-class"
        />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('button interaction', () => {
    it('should open dropdown on button click', async () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Calendar Fields')).toBeInTheDocument();
      });
    });

    it('should close dropdown on second button click', async () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Configure Calendar Fields')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown on Escape key', async () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Configure Calendar Fields')).toBeInTheDocument();
      });

      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Configure Calendar Fields')).not.toBeInTheDocument();
      });
    });
  });

  describe('date field filtering', () => {
    it('should only show date/datetime columns', async () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      await waitFor(() => {
        const dropdown = screen.getByTestId('advanced-dropdown');
        expect(dropdown).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      const options = Array.from(select.querySelectorAll('option'));

      const hasStartDate = (opt: Element) => opt.textContent === 'Start Date';
      const hasEndDate = (opt: Element) => opt.textContent === 'End Date';
      const hasCreated = (opt: Element) => opt.textContent === 'Created';
      const hasName = (opt: Element) => opt.textContent === 'Name';

      expect(options.some(hasStartDate)).toBe(true);
      expect(options.some(hasEndDate)).toBe(true);
      expect(options.some(hasCreated)).toBe(true);
      expect(options.some(hasName)).toBe(false);
    });

    it('should filter datetime type columns', async () => {
      const columns: GridColumn[] = [
        ...mockColumns,
        { id: '5', key: 'updated', title: 'Updated', type: 'lastModifiedTime' as const, uidt: 'lastmodifiedtime' }
      ];

      render(
        <CalendarFieldConfiguration
          columns={columns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      const hasUpdatedOption = (opt: Element) => opt.textContent === 'Updated';
      await waitFor(() => {
        const select = screen.getByRole('combobox');
        const options = Array.from(select.querySelectorAll('option'));
        expect(options.some(hasUpdatedOption)).toBe(true);
      });
    });
  });

  describe('date field selection', () => {
    it('should display selected date field', async () => {
      const dateField = mockColumns[0];

      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          dateField={dateField}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('1');
      });
    });

    it('should call onDateFieldChange when field is selected', async () => {
      const mockOnChange = vi.fn();

      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={mockOnChange}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '2');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });
    });

    it('should call onDateFieldChange with correct field object', async () => {
      const mockOnChange = vi.fn();

      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={mockOnChange}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      const select = screen.getByRole('combobox');
      await userEvent.selectOptions(select, '1');

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({ id: '1' })
        );
      });
    });
  });

  describe('dropdown content', () => {
    it('should display help text', async () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText(/date or datetime field that determines when events appear/i)
        ).toBeInTheDocument();
      });
    });

    it('should show Date Field label', async () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Date Field')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      render(
        <CalendarFieldConfiguration
          columns={[]}
          onDateFieldChange={vi.fn()}
        />
      );

      expect(screen.getByText('Calendar Fields')).toBeInTheDocument();
    });

    it('should handle columns without date fields', async () => {
      const nonDateColumns: GridColumn[] = [
        { id: '1', key: 'name', title: 'Name', type: 'text', uidt: 'text' },
        { id: '2', key: 'count', title: 'Count', type: 'number', uidt: 'number' }
      ];

      render(
        <CalendarFieldConfiguration
          columns={nonDateColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByText('Calendar Fields');
      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        const options = Array.from(select.querySelectorAll('option'));
        expect(options.length).toBe(0);
      });
    });

    it('should handle dateField not in columns', async () => {
      const dateField = {
        id: '999',
        key: 'other_date',
        title: 'Other Date',
        type: 'date',
        uidt: 'date'
      };

      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          dateField={dateField as any}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: 'Calendar Fields' });
      await userEvent.click(button);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper aria attributes', () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: 'Calendar Fields' });
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when opened', async () => {
      render(
        <CalendarFieldConfiguration
          columns={mockColumns}
          onDateFieldChange={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: 'Calendar Fields' });
      await userEvent.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });
  });
});
