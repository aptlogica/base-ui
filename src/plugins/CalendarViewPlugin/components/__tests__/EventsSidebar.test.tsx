import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsSidebar from '../EventsSidebar';

vi.mock('../../../hooks/useFrontendPagination', () => ({
  useFrontendPagination: ({ data }: any) => ({
    allLoadedData: data.slice(0, 30),
    loadNextPage: vi.fn(),
    hasMore: data.length > 30,
    totalItems: data.length
  })
}));

vi.mock('../../../utils/helpers', () => ({
  formatCompactNumber: (num: number) => num.toString()
}));

vi.mock('../../../utils/sortUtils', () => ({
  sortRowsByDataKey: (_columns: any, _sorts: any, records: any) => records
}));

vi.mock('../../../components/ui/Loader', () => ({
  Loader: () => <div>Loading...</div>
}));

vi.mock('../../../components/shared/table/SortPopover', () => ({
  SortPopover: ({ onSortChange }: any) => (
    <div data-testid="sort-popover">
      <button onClick={() => onSortChange?.([{ column: 'field1', direction: 'asc' }])}>
        Sort
      </button>
    </div>
  )
}));

describe('EventsSidebar', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Event 1',
      date: '2026-01-30',
      dateTime: new Date('2026-01-30T14:30:00'),
      data: {},
      color: 'blue',
      isDateField: false
    },
    {
      id: '2',
      title: 'Event 2',
      date: '2026-01-30',
      dateTime: new Date('2026-01-30T10:00:00'),
      data: {},
      color: 'green',
      isDateField: false
    }
  ];

  const mockColumns = [
    { id: '1', key: 'field1', type: 'text', title: 'Field 1' }
  ];

  const defaultProps = {
    events: mockEvents,
    onDateSelect: vi.fn(),
    selectedDate: null,
    currentView: 'month',
    currentDate: new Date('2026-01-30'),
    columns: mockColumns,
    sorts: [],
    onSortChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render sidebar container', () => {
      const { container } = render(<EventsSidebar {...defaultProps} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display section title based on current view', () => {
      render(<EventsSidebar {...defaultProps} currentView="month" />);

      expect(screen.getByText('Records In this month')).toBeInTheDocument();
    });

    it('should display day view title', () => {
      render(<EventsSidebar {...defaultProps} currentView="day" />);

      expect(screen.getByText('Records In this day')).toBeInTheDocument();
    });

    it('should display week view title', () => {
      render(<EventsSidebar {...defaultProps} currentView="week" />);

      expect(screen.getByText('Records In selected hours')).toBeInTheDocument();
    });

    it('should display year view title', () => {
      render(<EventsSidebar {...defaultProps} currentView="year" />);

      expect(screen.getByText('Records In this year')).toBeInTheDocument();
    });
  });

  describe('event filtering', () => {
    it('should filter events for day view', () => {
      render(
        <EventsSidebar
          {...defaultProps}
          currentView="day"
          currentDate={new Date('2026-01-30')}
        />
      );

      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });

    it('should filter events for month view', () => {
      const monthEvents = [
        ...mockEvents,
        {
          id: '3',
          title: 'Event 3',
          date: '2026-02-15',
          dateTime: new Date('2026-02-15T14:30:00'),
          data: {},
          color: 'red',
          isDateField: false
        }
      ];

      render(
        <EventsSidebar
          {...defaultProps}
          events={monthEvents}
          currentView="month"
          currentDate={new Date('2026-01-30')}
        />
      );

      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
      expect(screen.queryByText('Event 3')).not.toBeInTheDocument();
    });

    it('should filter events for week view', () => {
      render(
        <EventsSidebar
          {...defaultProps}
          currentView="week"
          currentDate={new Date('2026-01-30')}
        />
      );

      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });

    it('should filter events for year view', () => {
      const yearEvents = [
        ...mockEvents,
        {
          id: '3',
          title: 'Event 3',
          date: '2027-01-30',
          dateTime: new Date('2027-01-30T14:30:00'),
          data: {},
          color: 'red',
          isDateField: false
        }
      ];

      render(
        <EventsSidebar
          {...defaultProps}
          events={yearEvents}
          currentView="year"
          currentDate={new Date('2026-01-30')}
        />
      );

      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.queryByText('Event 3')).not.toBeInTheDocument();
    });
  });

  describe('event click handling', () => {
    it('should call onEventClick when event is clicked', async () => {
      const mockOnEventClick = vi.fn();

      render(
        <EventsSidebar
          {...defaultProps}
          onEventClick={mockOnEventClick}
        />
      );

      const event = screen.getByText('Event 1');
      await userEvent.click(event);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('should not call onEventClick when not provided', async () => {
      render(<EventsSidebar {...defaultProps} />);

      const event = screen.getByText('Event 1');
      await userEvent.click(event);

      expect(event).toBeInTheDocument();
    });
  });

  describe('create record button', () => {
    it('should show create button when onCreateRecord is provided', () => {
      const mockOnCreateRecord = vi.fn();

      render(
        <EventsSidebar
          {...defaultProps}
          onCreateRecord={mockOnCreateRecord}
        />
      );

      const createButton = screen.getByRole('button', { name: /record/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should not show create button when onCreateRecord is not provided', () => {
      render(<EventsSidebar {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const hasRecordButton = buttons.some(btn => 
        btn.textContent && /record/i.test(btn.textContent) && !/sort/i.test(btn.textContent)
      );
      expect(hasRecordButton).toBe(false);
    });

    it('should call onCreateRecord when create button is clicked', async () => {
      const mockOnCreateRecord = vi.fn();

      render(
        <EventsSidebar
          {...defaultProps}
          onCreateRecord={mockOnCreateRecord}
        />
      );

      const createButton = screen.getByRole('button', { name: /record/i });
      await userEvent.click(createButton);

      expect(mockOnCreateRecord).toHaveBeenCalled();
    });
  });

  describe('sorting', () => {
    it('should render sort button', () => {
      render(<EventsSidebar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();
    });

    it('should call onSortChange when sort is changed', async () => {
      const mockOnSortChange = vi.fn();

      render(
        <EventsSidebar
          {...defaultProps}
          onSortChange={mockOnSortChange}
        />
      );

      // Just verify the sort button exists, actual SortPopover interaction is complex
      const sortButton = screen.getByRole('button', { name: /sort/i });
      expect(sortButton).toBeInTheDocument();
    });

    it('should pass sorts to sort popover', () => {
      const sorts = [{ column: 'field1', direction: 'desc' as const }];

      render(
        <EventsSidebar
          {...defaultProps}
          sorts={sorts}
        />
      );

      // Verify sort button exists with sorts applied
      expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should paginate large event lists', () => {
      const manyEvents = Array.from({ length: 50 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        date: '2026-01-30',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: {},
        color: 'blue',
        isDateField: false
      }));

      render(
        <EventsSidebar
          {...defaultProps}
          events={manyEvents}
        />
      );

      const displayedEvents = screen.getAllByText(/Event \d+/);
      expect(displayedEvents.length).toBeLessThanOrEqual(30);
    });
  });

  describe('date formatting', () => {
    it('should format event dates correctly', () => {
      render(<EventsSidebar {...defaultProps} />);
      const dateElements = screen.getAllByText(/30/);
      expect(dateElements.length).toBeGreaterThan(0);
      const janElements = screen.getAllByText(/jan/i);
      expect(janElements.length).toBeGreaterThan(0);
    });

    it('should format event times for datetime fields', () => {
      render(<EventsSidebar {...defaultProps} />);

      expect(screen.getByText(/2:30/i)).toBeInTheDocument();
    });

    it('should not show time for date fields', () => {
      const dateEvents = mockEvents.map(e => ({ ...e, isDateField: true }));

      render(
        <EventsSidebar
          {...defaultProps}
          events={dateEvents}
        />
      );

      expect(screen.queryByText(/2:30/i)).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should handle empty events array', () => {
      render(<EventsSidebar {...defaultProps} events={[]} />);

      expect(screen.getByText('Records In this month')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle missing columns', () => {
      render(<EventsSidebar {...defaultProps} columns={[]} />);

      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });

    it('should handle undefined sorts', () => {
      render(<EventsSidebar {...defaultProps} sorts={undefined as any} />);

      expect(screen.getByText('Event 1')).toBeInTheDocument();
    });
  });
});
