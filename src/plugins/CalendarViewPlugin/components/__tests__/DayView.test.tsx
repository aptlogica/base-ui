import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DayView from '../DayView';

const getEventsForDateKeyMock = vi.fn();
const isDateTimeFieldTypeMock = vi.fn();
const createTimeSlotsMock = vi.fn();

vi.mock('../../utils/calendarViewUtils', () => ({
  getEventsForDateKey: (...args: any[]) => getEventsForDateKeyMock(...args),
  isDateTimeFieldType: (...args: any[]) => isDateTimeFieldTypeMock(...args),
  createTimeSlots: (...args: any[]) => createTimeSlotsMock(...args),
}));

vi.mock('../EventChip', () => ({
  default: ({ event }: { event: { title: string } }) => (
    <div data-testid="event-chip">{event.title}</div>
  ),
}));

vi.mock('../TimeSlotCell', () => ({
  default: ({ hour }: { hour: number }) => (
    <div data-testid="time-slot">{hour}</div>
  ),
}));

describe('DayView', () => {
  const baseDate = new Date('2024-01-15T00:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders time slots when date field is datetime', () => {
    isDateTimeFieldTypeMock.mockReturnValue(true);
    createTimeSlotsMock.mockReturnValue([
      { hour: 9, label: '09:00' },
      { hour: 10, label: '10:00' },
    ]);

    render(<DayView currentDate={baseDate} events={[]} />);
    expect(screen.getAllByTestId('time-slot')).toHaveLength(2);
  });

  it('renders empty day state and add event button for date field', () => {
    isDateTimeFieldTypeMock.mockReturnValue(false);
    getEventsForDateKeyMock.mockReturnValue([]);
    const onDateClick = vi.fn();

    render(
      <DayView
        currentDate={baseDate}
        events={[]}
        onDateClick={onDateClick}
      />
    );

    expect(screen.getByText(/no events scheduled/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add event/i }));
    expect(onDateClick).toHaveBeenCalledWith(baseDate);
  });

  it('renders events list when events exist', () => {
    isDateTimeFieldTypeMock.mockReturnValue(false);
    getEventsForDateKeyMock.mockReturnValue([
      { id: 'e1', title: 'Event 1', date: '2024-01-15', dateTime: new Date(), data: {} },
    ]);

    render(<DayView currentDate={baseDate} events={[]} />);
    expect(screen.getByTestId('event-chip')).toHaveTextContent('Event 1');
  });
});
