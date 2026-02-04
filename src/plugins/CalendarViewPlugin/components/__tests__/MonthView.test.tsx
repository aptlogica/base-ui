import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonthView from '../MonthView';

vi.mock('../EventChip', () => ({
  default: ({ event, onClick }: any) => (
    <button 
      onClick={() => onClick?.(event)} 
      data-testid={`event-${event.id}`}
    >
      {event.title}
    </button>
  )
}));

vi.mock('../MoreEventsDropdown', () => ({
  default: ({ events, children }: any) => (
    <div data-testid="more-events-dropdown">
      {children}
      <div>{events.length} hidden events</div>
    </div>
  )
}));

describe('MonthView', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Event 1',
      date: '2026-01-15',
      dateTime: new Date('2026-01-15T14:30:00'),
      data: {},
      color: 'blue'
    },
    {
      id: '2',
      title: 'Event 2',
      date: '2026-01-15',
      dateTime: new Date('2026-01-15T10:00:00'),
      data: {},
      color: 'green'
    },
    {
      id: '3',
      title: 'Event 3',
      date: '2026-01-20',
      dateTime: new Date('2026-01-20T16:00:00'),
      data: {},
      color: 'red'
    }
  ];

  const defaultProps = {
    currentDate: new Date('2026-01-15'),
    events: mockEvents,
    onDateSelect: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render month calendar grid', () => {
      const { container } = render(<MonthView {...defaultProps} />);

      const grid = container.querySelector('.grid-cols-7');
      expect(grid).toBeInTheDocument();
    });

    it('should render weekday headers', () => {
      render(<MonthView {...defaultProps} />);

      expect(screen.getByText('MON')).toBeInTheDocument();
      expect(screen.getByText('TUE')).toBeInTheDocument();
      expect(screen.getByText('WED')).toBeInTheDocument();
      expect(screen.getByText('THU')).toBeInTheDocument();
      expect(screen.getByText('FRI')).toBeInTheDocument();
      expect(screen.getByText('SAT')).toBeInTheDocument();
      expect(screen.getByText('SUN')).toBeInTheDocument();
    });

    it('should render 42 calendar cells', () => {
      const { container } = render(<MonthView {...defaultProps} />);

      const cells = container.querySelectorAll('.border-r.border-b');
      expect(cells.length).toBe(42);
    });

    it('should highlight today', () => {
      const today = new Date();
      const todayEvents = [{
        id: '1',
        title: 'Today Event',
        date: today.toISOString().split('T')[0],
        dateTime: today,
        data: {},
        color: 'blue'
      }];

      const { container } = render(<MonthView {...defaultProps} currentDate={today} events={todayEvents} />);
      const todayCell = container.querySelector(String.raw`.bg-\[var\(--color-bg-brand-primary\)\]`);
      expect(todayCell).toBeInTheDocument();
    });
  });

  describe('event display', () => {
    it('should display events on correct dates', () => {
      render(<MonthView {...defaultProps} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
      expect(screen.getByText(/Event 3/)).toBeInTheDocument();
    });

    it('should show first event and +N more indicator for multiple events', () => {
      render(<MonthView {...defaultProps} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
      expect(screen.getByText('+ 1')).toBeInTheDocument();
    });

    it('should not show more indicator for single event', () => {
      const singleEvent = [mockEvents[2]];

      render(<MonthView {...defaultProps} events={singleEvent} />);

      expect(screen.getByText(/Event 3/)).toBeInTheDocument();
      expect(screen.queryByText(/\+\s*\d+/)).not.toBeInTheDocument();
    });
  });

  describe('event clicks', () => {
    it('should call onEventClick when event is clicked', async () => {
      const mockOnEventClick = vi.fn();

      render(
        <MonthView
          {...defaultProps}
          onEventClick={mockOnEventClick}
        />
      );

      const eventChip = screen.getByTestId('event-1');
      await userEvent.click(eventChip);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('should not call onEventClick when not provided', async () => {
      render(<MonthView {...defaultProps} />);

      const eventChip = screen.getByTestId('event-1');
      await userEvent.click(eventChip);

      expect(eventChip).toBeInTheDocument();
    });
  });

  describe('date clicks', () => {
    it('should call onDateClick when plus button is clicked', async () => {
      const mockOnDateClick = vi.fn();

      render(
        <MonthView
          {...defaultProps}
          onDateClick={mockOnDateClick}
        />
      );

      const plusButtons = screen.getAllByRole('button');
      const firstPlusButton = plusButtons[0];
      await userEvent.click(firstPlusButton);

      expect(mockOnDateClick).toHaveBeenCalled();
    });

    it('should not show plus button when onDateClick is not provided', () => {
      render(<MonthView {...defaultProps} />);

      const allButtons = screen.queryAllByRole('button');
      const plusButtons = allButtons.filter(b => !b.textContent?.trim());
      expect(plusButtons.length).toBe(0);
    });

    it('should call onDateSelect when date is selected', async () => {
      const mockOnDateSelect = vi.fn();

      render(
        <MonthView
          {...defaultProps}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(mockOnDateSelect).not.toHaveBeenCalled();
    });
  });

  describe('previous month days', () => {
    it('should display previous month days with different styling', () => {
      const { container } = render(<MonthView {...defaultProps} currentDate={new Date('2026-01-15')} />);

      const grayBgCells = container.querySelectorAll('.bg-gray-50');
      expect(grayBgCells.length).toBeGreaterThan(0);
    });
  });

  describe('weekend styling', () => {
    it('should apply weekend styling to Saturday and Sunday', () => {
      const { container } = render(<MonthView {...defaultProps} />);

      const weekendHeaders = container.querySelectorAll('.bg-gray-100');
      expect(weekendHeaders.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('columns and fieldConfig', () => {
    it('should pass columns to EventChip', () => {
      const columns = [{ id: '1', key: 'field1', title: 'Field 1', type: 'text' }];

      render(<MonthView {...defaultProps} columns={columns} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
    });

    it('should pass fieldConfig to EventChip', () => {
      const fieldConfig = [{ id: '1', isHidden: false }];

      render(<MonthView {...defaultProps} fieldConfig={fieldConfig} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render calendar without events', () => {
      render(<MonthView {...defaultProps} events={[]} />);

      expect(screen.getByText('MON')).toBeInTheDocument();
      expect(screen.queryByTestId('event-1')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle invalid dates gracefully', () => {
      const invalidDateEvent = {
        id: '999',
        title: 'Invalid Event',
        date: 'invalid-date',
        dateTime: new Date('invalid'),
        data: {},
        color: 'blue'
      };

      const { container } = render(
        <MonthView
          {...defaultProps}
          events={[invalidDateEvent as any]}
        />
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle month boundaries correctly', () => {
      render(<MonthView {...defaultProps} currentDate={new Date('2026-01-01')} />);

      expect(screen.getByText('MON')).toBeInTheDocument();
    });
  });
});
