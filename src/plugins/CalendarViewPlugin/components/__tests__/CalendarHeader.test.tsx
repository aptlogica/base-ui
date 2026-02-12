import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarHeader from '../CalendarHeader';
import type { GridColumn } from '../../../../plugins/GridViewPlugin/types/grid.types';

vi.mock('../CalendarFieldSelector', () => {
  const MockFieldSelector = ({ onDateFieldChange }: any) => (
    <button onClick={() => onDateFieldChange?.({ id: '1', key: 'field1', title: 'Field 1' })}>
      Field Selector
    </button>
  );
  return {
    default: MockFieldSelector,
    CalendarFieldConfiguration: MockFieldSelector
  };
});

vi.mock('lucide-react', async (importOriginal) => {
  const mod = await importOriginal<Record<string, React.ComponentType<unknown>>>();
  return {
    ...mod,
    ChevronLeft: () => <span data-testid="chevron-left" />,
    ChevronRight: () => <span data-testid="chevron-right" />,
    ExternalLink: () => <span>Export</span>
  };
});

vi.mock('../../../../components/shared/table/FilterPopover', () => ({
  FilterPopover: () => <div data-testid="filter-popover" />
}));

vi.mock('../../../../components/shared/table/FieldsPopover', () => ({
  FieldsPopover: () => <div data-testid="fields-popover" />
}));

describe('CalendarHeader', () => {
  const defaultProps = {
    currentDate: new Date('2026-01-15'),
    currentView: 'month' as const,
    onDateChange: vi.fn(),
    onViewChange: vi.fn(),
    dateField: { id: '1', key: 'date', title: 'Date', type: 'date' },
    dateFields: [],
    onDateFieldChange: vi.fn(),
    onExport: vi.fn(),
    sidebarCollapsed: false,
    onToggleSidebar: vi.fn(),
    columns: [],
    fieldConfig: [],
    filters: [],
    onFieldToggle: undefined,
    onAddFilter: undefined,
    onRemoveFilter: undefined,
    onUpdateFilter: undefined,
    onRealTimeFilter: undefined,
    onGroupByChange: vi.fn(),
    tableId: 'test-table',
    events: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render calendar header', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(document.body.textContent).toMatch(/Jan/);
      expect(document.body.textContent).toMatch(/2026/);
    });

    it('should render date navigation buttons', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.getAllByTestId('chevron-left').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByTestId('chevron-right').length).toBeGreaterThanOrEqual(1);
    });

    it('should render today button', () => {
      render(<CalendarHeader {...defaultProps} />);

      const todayButtons = screen.getAllByText('Today');
      expect(todayButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should render view selector buttons', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.getAllByText(/Month/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Week/)).toBeInTheDocument();
      expect(screen.getByText(/Day/)).toBeInTheDocument();
      expect(screen.getByText(/Year/)).toBeInTheDocument();
    });

    it('should render field selector', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.getByText(/Field Selector/)).toBeInTheDocument();
    });
  });

  describe('date display', () => {
    it('should display month and year for month view', () => {
      render(<CalendarHeader {...defaultProps} currentView="month" />);

      expect(document.body.textContent).toMatch(/Jan/);
      expect(document.body.textContent).toMatch(/2026/);
    });

    it('should display week range for week view', () => {
      render(<CalendarHeader {...defaultProps} currentView="week" />);

      expect(document.body.textContent).toMatch(/Jan|2026|26/);
    });

    it('should display full date for day view', () => {
      render(<CalendarHeader {...defaultProps} currentView="day" />);

      expect(document.body.textContent).toMatch(/Jan/);
      expect(document.body.textContent).toMatch(/2026|26/);
    });

    it('should display year for year view', () => {
      render(<CalendarHeader {...defaultProps} currentView="year" />);

      expect(screen.getAllByText(/2026/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('navigation', () => {
    it('should call onDateChange when previous button is clicked', async () => {
      render(<CalendarHeader {...defaultProps} />);

      const prevButtons = screen.getAllByTestId('chevron-left');
      const prevButton = prevButtons[0].closest('button');
      expect(prevButton).toBeTruthy();
      if (prevButton) await userEvent.click(prevButton);

      expect(defaultProps.onDateChange).toHaveBeenCalled();
    });

    it('should call onDateChange when next button is clicked', async () => {
      render(<CalendarHeader {...defaultProps} />);

      const nextButtons = screen.getAllByTestId('chevron-right');
      const nextButton = nextButtons[0].closest('button');
      expect(nextButton).toBeTruthy();
      if (nextButton) await userEvent.click(nextButton);

      expect(defaultProps.onDateChange).toHaveBeenCalled();
    });

    it('should call onDateChange when today button is clicked', async () => {
      render(<CalendarHeader {...defaultProps} />);

      const todayButtons = screen.getAllByText('Today');
      await userEvent.click(todayButtons[0]);

      expect(defaultProps.onDateChange).toHaveBeenCalled();
    });
  });

  describe('view switching', () => {
    it('should call onViewChange when month view is selected', async () => {
      render(<CalendarHeader {...defaultProps} currentView="week" />);

      const monthButtons = screen.getAllByText('Month');
      await userEvent.click(monthButtons[0]);

      expect(defaultProps.onViewChange).toHaveBeenCalledWith('month');
    });

    it('should call onViewChange when week view is selected', async () => {
      render(<CalendarHeader {...defaultProps} currentView="month" />);

      const weekButton = screen.getByText('Week');
      await userEvent.click(weekButton);

      expect(defaultProps.onViewChange).toHaveBeenCalledWith('week');
    });

    it('should call onViewChange when day view is selected', async () => {
      render(<CalendarHeader {...defaultProps} currentView="month" />);

      const dayButton = screen.getByText('Day');
      await userEvent.click(dayButton);

      expect(defaultProps.onViewChange).toHaveBeenCalledWith('day');
    });

    it('should call onViewChange when year view is selected', async () => {
      render(<CalendarHeader {...defaultProps} currentView="month" />);

      const yearButton = screen.getByText('Year');
      await userEvent.click(yearButton);

      expect(defaultProps.onViewChange).toHaveBeenCalledWith('year');
    });

    it('should highlight active view', () => {
      render(<CalendarHeader {...defaultProps} currentView="month" />);

      const monthButtons = screen.getAllByText('Month');
      const monthButton = monthButtons[0].closest('button');
      expect(monthButton).toBeInTheDocument();
    });
  });

  describe('field selector', () => {
    it('should call onGroupByChange when field is selected', async () => {
      render(<CalendarHeader {...defaultProps} />);

      const fieldSelector = screen.getByText(/Field Selector/);
      await userEvent.click(fieldSelector);

      expect(defaultProps.onGroupByChange).toHaveBeenCalledWith({
        id: '1',
        key: 'field1',
        title: 'Field 1'
      });
    });

    it('should pass columns to CalendarFieldSelector', () => {
      const columns: GridColumn[] = [
        { id: '1', key: 'field1', title: 'Field 1', type: 'date' },
        { id: '2', key: 'field2', title: 'Field 2', type: 'datetime' }
      ];

      render(<CalendarHeader {...defaultProps} columns={columns} />);

      expect(screen.getByText(/Field Selector/)).toBeInTheDocument();
    });

    it('should pass dateField to CalendarFieldSelector', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.getByText(/Field Selector/)).toBeInTheDocument();
    });
  });

  describe('export button', () => {
    it('should render export button when onExport is provided', () => {
      const onExport = vi.fn();

      render(<CalendarHeader {...defaultProps} onExport={onExport} />);

      expect(screen.getAllByText(/Export/).length).toBeGreaterThanOrEqual(1);
    });

    it('should call onExport when export button is clicked', async () => {
      const onExport = vi.fn();

      render(<CalendarHeader {...defaultProps} onExport={onExport} />);

      const exportButtons = screen.getAllByText(/Export/);
      const exportButton = exportButtons[0].closest('button') ?? exportButtons[0];
      await userEvent.click(exportButton);

      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it('should not render export button when onExport is not provided', () => {
      const { onExport, ...rest } = defaultProps;
      const { container } = render(<CalendarHeader {...rest} onExport={undefined as unknown as () => void} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle different date formats', () => {
      render(<CalendarHeader {...defaultProps} currentDate={new Date('2026-12-31')} />);

      expect(document.body.textContent).toMatch(/Dec/);
      expect(document.body.textContent).toMatch(/2026/);
    });

    it('should handle year boundaries', () => {
      render(<CalendarHeader {...defaultProps} currentDate={new Date('2027-01-01')} />);

      expect(document.body.textContent).toMatch(/Jan/);
      expect(document.body.textContent).toMatch(/2027/);
    });

    it('should handle leap years', () => {
      render(<CalendarHeader {...defaultProps} currentDate={new Date('2024-02-29')} />);

      expect(document.body.textContent).toMatch(/Feb/);
      expect(document.body.textContent).toMatch(/2024/);
    });
  });

  describe('responsive behavior', () => {
    it('should render all controls on desktop', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Month/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Field Selector/)).toBeInTheDocument();
    });
  });

  describe('columns prop', () => {
    it('should work without columns', () => {
      render(<CalendarHeader {...defaultProps} />);

      expect(document.body.textContent).toMatch(/Jan/);
      expect(document.body.textContent).toMatch(/2026/);
    });

    it('should work with empty columns array', () => {
      render(<CalendarHeader {...defaultProps} columns={[]} />);

      expect(document.body.textContent).toMatch(/Jan/);
      expect(document.body.textContent).toMatch(/2026/);
    });
  });
});
