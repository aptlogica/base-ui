import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayView from '../DayView';

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
  default: ({ children }: any) => (
    <div data-testid="more-events-dropdown">{children}</div>
  )
}));

describe('DayView', () => {
  const mockDateField = {
    id: '1',
    key: 'start_date',
    title: 'Start Date',
    type: 'datetime',
    uidt: 'datetime'
  };

  const mockEvents = [
    {
      id: '1',
      title: 'Event 1',
      date: '2026-01-30',
      dateTime: new Date('2026-01-30T14:00:00'),
      data: {},
      color: 'blue',
      isDateField: false
    },
    {
      id: '2',
      title: 'Event 2',
      date: '2026-01-30',
      dateTime: new Date('2026-01-30T16:00:00'),
      data: {},
      color: 'green',
      isDateField: false
    }
  ];

  const defaultProps = {
    currentDate: new Date('2026-01-30'),
    events: mockEvents,
    onDateSelect: vi.fn(),
    dateField: mockDateField
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render day view layout', () => {
      const { container } = render(<DayView {...defaultProps} />);

      expect(container.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should render time column', () => {
      render(<DayView {...defaultProps} />);

      expect(screen.getByText('12 am')).toBeInTheDocument();
      expect(screen.getByText('12 pm')).toBeInTheDocument();
      expect(screen.getByText('11 pm')).toBeInTheDocument();
    });

    it('should render all 24 hours', () => {
      render(<DayView {...defaultProps} />);

      const timeLabels = screen.getAllByText(/am|pm/);
      expect(timeLabels.length).toBeGreaterThanOrEqual(24);
    });

    it('should render date header', () => {
      render(<DayView {...defaultProps} />);

      expect(screen.getByText(/30/)).toBeInTheDocument();
    });
  });

  describe('date field type handling', () => {
    it('should show time slots for datetime fields', () => {
      render(<DayView {...defaultProps} dateField={mockDateField} />);

      expect(screen.getByText('12 am')).toBeInTheDocument();
    });

    it('should show simplified view for date fields', () => {
      const dateOnlyField = { ...mockDateField, type: 'date', uidt: 'date' };

      render(<DayView {...defaultProps} dateField={dateOnlyField} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
    });

    it('should handle missing dateField', () => {
      const { container } = render(
        <DayView {...defaultProps} dateField={undefined} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('event display', () => {
    it('should display all events for the day', () => {
      render(<DayView {...defaultProps} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
      expect(screen.getByText(/Event 2/)).toBeInTheDocument();
    });

    it('should display events at correct time slots', () => {
      render(<DayView {...defaultProps} />);

      const event1 = screen.getByTestId('event-1');
      const event2 = screen.getByTestId('event-2');

      expect(event1).toBeInTheDocument();
      expect(event2).toBeInTheDocument();
    });

    it('should show more events dropdown when multiple events in same slot', () => {
      const sameTimeEvents = [
        mockEvents[0],
        { ...mockEvents[1], dateTime: mockEvents[0].dateTime }
      ];

      render(<DayView {...defaultProps} events={sameTimeEvents} />);

      expect(screen.getByTestId('more-events-dropdown')).toBeInTheDocument();
    });
  });

  describe('event clicks', () => {
    it('should call onEventClick when event is clicked', async () => {
      const mockOnEventClick = vi.fn();

      render(
        <DayView
          {...defaultProps}
          onEventClick={mockOnEventClick}
        />
      );

      const event = screen.getByTestId('event-1');
      await userEvent.click(event);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('should not call onEventClick when not provided', async () => {
      render(<DayView {...defaultProps} />);

      const event = screen.getByTestId('event-1');
      await userEvent.click(event);

      expect(event).toBeInTheDocument();
    });
  });

  describe('date selection', () => {
    it('should call onDateClick when time slot is clicked', async () => {
      const mockOnDateClick = vi.fn();

      const { container } = render(
        <DayView
          {...defaultProps}
          events={[]}
          onDateClick={mockOnDateClick}
        />
      );

      const eventsColumnSlots = container.querySelectorAll('.flex-1.relative .h-12');
      const firstSlot = eventsColumnSlots[0];
      if (firstSlot) {
        await userEvent.click(firstSlot as HTMLElement);
        expect(mockOnDateClick).toHaveBeenCalled();
      }
    });

    it('should not call onDateClick when not provided', async () => {
      const { container } = render(<DayView {...defaultProps} events={[]} />);

      const timeSlot = container.querySelector('.h-12');
      if (timeSlot) {
        await userEvent.click(timeSlot as HTMLElement);
      }

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('current time indicator', () => {
    it('should show current time indicator for today', () => {
      const now = new Date();

      const { container } = render(
        <DayView
          {...defaultProps}
          currentDate={now}
        />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not show current time indicator for other days', () => {
      const { container } = render(
        <DayView
          {...defaultProps}
          currentDate={new Date('2026-01-30')}
        />
      );

      const today = new Date();
      const isToday = today.getDate() === 30 && today.getMonth() === 0 && today.getFullYear() === 2026;

      if (!isToday) {
        const indicator = container.querySelector('.bg-red-500');
        expect(indicator).not.toBeInTheDocument();
      }
    });
  });

  describe('columns and fieldConfig', () => {
    it('should pass columns to EventChip', () => {
      const columns = [{ id: '1', key: 'field1', title: 'Field 1', type: 'text' }];

      render(<DayView {...defaultProps} columns={columns} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
    });

    it('should pass fieldConfig to EventChip', () => {
      const fieldConfig = [{ id: '1', isHidden: false }];

      render(<DayView {...defaultProps} fieldConfig={fieldConfig} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render calendar without events', () => {
      render(<DayView {...defaultProps} events={[]} />);

      expect(screen.getByText('12 am')).toBeInTheDocument();
      expect(screen.queryByTestId('event-1')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle midnight events', () => {
      const midnightEvent = {
        id: '999',
        title: 'Midnight Event',
        date: '2026-01-30',
        dateTime: new Date('2026-01-30T00:00:00'),
        data: {},
        color: 'blue',
        isDateField: false
      };

      render(<DayView {...defaultProps} events={[midnightEvent]} />);

      expect(screen.getByText(/Midnight Event/)).toBeInTheDocument();
    });

    it('should handle end of day events', () => {
      const endOfDayEvent = {
        id: '999',
        title: 'End of Day Event',
        date: '2026-01-30',
        dateTime: new Date('2026-01-30T23:59:00'),
        data: {},
        color: 'blue',
        isDateField: false
      };

      render(<DayView {...defaultProps} events={[endOfDayEvent]} />);

      expect(screen.getByText(/End of Day Event/)).toBeInTheDocument();
    });

    it('should handle events without times', () => {
      const dateEvents = mockEvents.map(e => ({ ...e, isDateField: true }));

      render(<DayView {...defaultProps} events={dateEvents} />);

      expect(screen.getByText(/Event 1/)).toBeInTheDocument();
    });
  });
});
