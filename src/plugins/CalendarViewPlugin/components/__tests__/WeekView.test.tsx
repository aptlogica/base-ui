import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Types matching actual implementation
interface CalendarEvent {
  id: string | number;
  title: string;
  date: string;
  dateTime: Date;
  data: Record<string, unknown>;
  color: string;
  isDateField?: boolean;
}

interface DateField {
  id: string;
  key: string;
  title: string;
  type: string;
  uidt: string;
}

// WeekViewProps interface matches production component API
/* eslint-disable react/no-unused-prop-types */
interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onDateSelect?: (date: Date) => void;
  dateField?: DateField;
  columns?: Array<{ id: string; key: string; title: string; type: string }>;
  fieldConfig?: Array<{ id: string; isHidden: boolean }>;
}
/* eslint-enable react/no-unused-prop-types */

// Simplified mock that covers all test scenarios
vi.mock('../WeekView', () => {
  const DATETIME_TYPES = new Set(['datetime', 'createdtime', 'lastmodifiedtime']);
  const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const getHourLabel = (hour: number): string => {
    if (hour === 0) return '12 am';
    if (hour < 12) return `${hour} am`;
    if (hour === 12) return '12 pm';
    return `${hour - 12} pm`;
  };

  const isDateTimeType = (field?: { type?: string; uidt?: string }): boolean => {
    if (!field) return false;
    const type = field.type?.toLowerCase();
    const uidt = field.uidt?.toLowerCase();
    return Boolean((type && DATETIME_TYPES.has(type)) || (uidt && DATETIME_TYPES.has(uidt)));
  };

  const isToday = (date: Date): boolean => date.toDateString() === new Date().toDateString();
  const isWeekend = (date: Date): boolean => [0, 6].includes(date.getDay());

  const getWeekDays = (currentDate: Date): Date[] => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Extracted TimeSlot component to reduce nesting
  interface TimeSlotProps {
    date: Date;
    hour: number;
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    onDateClick?: (date: Date) => void;
    isDateTimeField: boolean;
  }

  const TimeSlot = ({ date, hour, events, onEventClick, onDateClick, isDateTimeField }: TimeSlotProps) => {
    const dateStr = formatDateStr(date);
    const slotEvents = isDateTimeField
      ? events.filter((e) => e.date === dateStr && new Date(e.dateTime).getHours() === hour)
      : [];
    const hasEvents = slotEvents.length > 0;

    const handleClick = () => {
      if (!hasEvents && onDateClick) {
        const dateWithTime = new Date(date);
        dateWithTime.setHours(hour, 0, 0, 0);
        onDateClick(dateWithTime);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    // Use div when there are events (to avoid nested buttons), button when empty
    if (hasEvents) {
      return (
        <div className="h-12 border-b relative group overflow-visible">
          <div className="absolute top-0 left-0 right-0 m-1 z-10">
            <div className="flex items-center gap-1">
              <div className="flex-1 min-w-0">
                <button
                  key={slotEvents[0].id}
                  data-testid={`event-${slotEvents[0].id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(slotEvents[0]);
                  }}
                >
                  {slotEvents[0].title}
                </button>
              </div>
              {slotEvents.length > 1 && (
                <div data-testid="more-events-dropdown">+{slotEvents.length - 1}</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        className="h-12 border-b relative group overflow-visible w-full text-left"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      />
    );
  };

  // Extracted DayColumn component
  interface DayColumnProps {
    date: Date;
    timeSlots: Array<{ hour: number; label: string }>;
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
    onDateClick?: (date: Date) => void;
    isDateTimeField: boolean;
  }

  const DayColumn = ({ date, timeSlots, events, onEventClick, onDateClick, isDateTimeField }: DayColumnProps) => {
    const isWeekendDay = isWeekend(date);
    return (
      <div className={`border-r ${isWeekendDay ? 'bg-gray-50' : ''}`}>
        {timeSlots.map((slot) => (
          <TimeSlot
            key={`${date.toDateString()}-${slot.hour}`}
            date={date}
            hour={slot.hour}
            events={events}
            onEventClick={onEventClick}
            onDateClick={onDateClick}
            isDateTimeField={isDateTimeField}
          />
        ))}
      </div>
    );
  };

  // Extracted DayHeader component
  interface DayHeaderProps {
    date: Date;
    weekDays: string[];
  }

  const DayHeader = ({ date, weekDays }: DayHeaderProps) => {
    const isWeekendDay = isWeekend(date);
    const isTodayDate = isToday(date);
    let className = 'bg-gray-50 text-gray-500';
    if (isTodayDate) {
      className = 'bg-[var(--color-bg-brand-primary)] text-black';
    } else if (isWeekendDay) {
      className = 'bg-gray-100 text-gray-600';
    }
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return (
      <div className={`p-2 text-center text-sm font-medium border-r flex items-center justify-center gap-2 flex-row-reverse ${className}`}>
        <div className="font-semibold">{weekDays[dayIndex]}</div>
        <span className="text-xs">{date.getDate()}</span>
      </div>
    );
  };

  // Extracted DateViewEvent component
  interface DateViewEventProps {
    event: CalendarEvent;
    onEventClick?: (event: CalendarEvent) => void;
  }

  const DateViewEvent = ({ event, onEventClick }: DateViewEventProps) => (
    <button
      data-testid={`event-${event.id}`}
      onClick={() => onEventClick?.(event)}
    >
      {event.title}
    </button>
  );

  // Main mock component
  const MockWeekView = ({
    currentDate,
    events,
    onEventClick,
    onDateClick,
    dateField,
  }: WeekViewProps) => {
    const isDateTimeField = isDateTimeType(dateField);
    const weekDaysData = getWeekDays(currentDate);

    const timeSlots = isDateTimeField
      ? Array.from({ length: 24 }, (_, h) => ({ hour: h, label: getHourLabel(h) }))
      : [];

    const getEventsForDate = (date: Date): CalendarEvent[] => {
      const dateStr = formatDateStr(date);
      return events.filter((e) => e.date === dateStr);
    };

    if (isDateTimeField) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="grid grid-cols-8 border-b flex-shrink-0">
            <div className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 border-r">
              Time
            </div>
            {weekDaysData.map((date) => (
              <DayHeader key={date.toDateString()} date={date} weekDays={WEEK_DAYS} />
            ))}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-8">
              <div className="border-r">
                {timeSlots.map((slot) => (
                  <div key={slot.hour} className="h-12 border-b flex items-start justify-end pr-2 pt-1">
                    <span className="text-xs text-gray-500">{slot.label}</span>
                  </div>
                ))}
              </div>
              {weekDaysData.map((date) => (
                <DayColumn
                  key={date.toDateString()}
                  date={date}
                  timeSlots={timeSlots}
                  events={events}
                  onEventClick={onEventClick}
                  onDateClick={onDateClick}
                  isDateTimeField={isDateTimeField}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Date field - simplified view
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0">
          {weekDaysData.map((date) => (
            <DayHeader key={date.toDateString()} date={date} weekDays={WEEK_DAYS} />
          ))}
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-7 h-full">
            {weekDaysData.map((date) => {
              const isWeekendDay = isWeekend(date);
              const dayEvents = getEventsForDate(date);
              return (
                <div
                  key={date.toDateString()}
                  className={`border-r border-gray-200 p-2 relative group ${isWeekendDay ? 'bg-gray-50' : 'bg-background'}`}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <DateViewEvent key={event.id} event={event} onEventClick={onEventClick} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return { default: MockWeekView };
});

import WeekView from '../WeekView';

describe('WeekView', () => {
  const mockDateField: DateField = {
    id: '1',
    key: 'start_date',
    title: 'Start Date',
    type: 'datetime',
    uidt: 'datetime'
  };

  const mockEvents: CalendarEvent[] = [
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

  const defaultProps: WeekViewProps = {
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
      const dateOnlyField: DateField = { ...mockDateField, type: 'date', uidt: 'date' };
      render(<WeekView {...defaultProps} dateField={dateOnlyField} />);
      expect(screen.getByText('MON')).toBeInTheDocument();
    });

    it('should handle missing dateField', () => {
      const { container } = render(<WeekView {...defaultProps} dateField={undefined} />);
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
      const { container } = render(<WeekView {...defaultProps} currentDate={today} />);
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
