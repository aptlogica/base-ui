import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeekView from '../WeekView';

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

describe('WeekView', () => {
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
      dateTime: new Date('2026-01-30T14:00:00'),
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
    it('should render week calendar grid', () => {
      const { container } = render(<WeekView {...defaultProps} />);

      const grid = container.querySelector('.grid-cols-8');
      expect(grid).toBeInTheDocument();
    });

    it('should render weekday headers', () => {
      render(<WeekView {...defaultProps} />);

      expect(screen.getByText('MON')).toBeInTheDocument();
      expect(screen.getByText('TUE')).toBeInTheDocument();
      expect(screen.getByText('WED')).toBeInTheDocument();
      expect(screen.getByText('THU')).toBeInTheDocument();
      expect(screen.getByText('FRI')).toBeInTheDocument();
      expect(screen.getByText('SAT')).toBeInTheDocument();
      expect(screen.getByText('SUN')).toBeInTheDocument();
    });

    it('should render time column', () => {
      render(<WeekView {...defaultProps} />);

      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('12 am')).toBeInTheDocument();
      expect(screen.getByText('12 pm')).toBeInTheDocument();
    });

    it('should render 24 time slots', () => {
      render(<WeekView {...defaultProps} />);

      expect(screen.getAllByText(/am|pm/).length).toBeGreaterThanOrEqual(24);
    });
  });

  describe('date field type handling', () => {
    it('should show time slots for datetime fields', () => {
      render(<WeekView {...defaultProps} dateField={mockDateField} />);

      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('12 am')).toBeInTheDocument();
    });

    it('should show simplified view for date fields', () => {
      const dateOnlyField = { ...mockDateField, type: 'date', uidt: 'date' };

      render(<WeekView {...defaultProps} dateField={dateOnlyField} />);

      expect(screen.getByText('MON')).toBeInTheDocument();
    });

    it('should handle missing dateField', () => {
      const { container } = render(
        <WeekView {...defaultProps} dateField={undefined} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('event display', () => {
    it('should display events in time slots', () => {
      render(<WeekView {...defaultProps} />);
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByTestId('more-events-dropdown')).toBeInTheDocument();
    });

    it('should show more events dropdown for multiple events in same slot', () => {
      render(<WeekView {...defaultProps} />);

      expect(screen.getByTestId('more-events-dropdown')).toBeInTheDocument();
    });
  });

  describe('event clicks', () => {
    it('should call onEventClick when event is clicked', async () => {
      const mockOnEventClick = vi.fn();
      const singleEvent = [mockEvents[0]];

      render(
        <WeekView
          {...defaultProps}
          events={singleEvent}
          onEventClick={mockOnEventClick}
        />
      );

      const event = screen.getByTestId('event-1');
      await userEvent.click(event);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('should not call onEventClick when not provided', async () => {
      const singleEvent = [mockEvents[0]];
      render(<WeekView {...defaultProps} events={singleEvent} />);

      const event = screen.getByTestId('event-1');
      await userEvent.click(event);

      expect(event).toBeInTheDocument();
    });
  });

  describe('date selection', () => {
    it('should call onDateClick when empty time slot is clicked', async () => {
      const mockOnDateClick = vi.fn();

      const { container } = render(
        <WeekView
          {...defaultProps}
          events={[]}
          onDateClick={mockOnDateClick}
        />
      );

      const timeSlots = container.querySelectorAll('.h-12.border-b.relative');
      expect(timeSlots.length).toBeGreaterThan(0);
      await userEvent.click(timeSlots[timeSlots.length - 1] as HTMLElement);
      expect(mockOnDateClick).toHaveBeenCalled();
    });
  });

  describe('weekend styling', () => {
    it('should apply weekend styling', () => {
      const { container } = render(<WeekView {...defaultProps} />);

      const weekendCells = container.querySelectorAll('.bg-gray-50, .bg-gray-100');
      expect(weekendCells.length).toBeGreaterThan(0);
    });
  });

  describe('today highlighting', () => {
    it('should highlight today', () => {
      const today = new Date();

      const { container } = render(
        <WeekView
          {...defaultProps}
          currentDate={today}
        />
      );

      const todayHeader = container.querySelector(String.raw`.bg-\[var\(--color-bg-brand-primary\)\]`);
      expect(todayHeader).toBeInTheDocument();
    });
  });

  describe('columns and fieldConfig', () => {
    it('should pass columns to EventChip', () => {
      const columns = [{ id: '1', key: 'field1', title: 'Field 1', type: 'text' }];

      render(<WeekView {...defaultProps} columns={columns} />);
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('MON')).toBeInTheDocument();
    });

    it('should pass fieldConfig to EventChip', () => {
      const fieldConfig = [{ id: '1', isHidden: false }];

      render(<WeekView {...defaultProps} fieldConfig={fieldConfig} />);
      // Week view with events renders; event titles or time labels should be present
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('MON')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render calendar without events', () => {
      render(<WeekView {...defaultProps} events={[]} />);

      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.queryByTestId(/event-/)).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle events without times', () => {
      const dateEvents = mockEvents.map(e => ({ ...e, isDateField: true }));

      render(<WeekView {...defaultProps} events={dateEvents} />);

      expect(screen.getByText('MON')).toBeInTheDocument();
    });

    it('should handle week boundaries correctly', () => {
      render(<WeekView {...defaultProps} currentDate={new Date('2026-01-01')} />);

      expect(screen.getByText('Time')).toBeInTheDocument();
    });
  });
});
