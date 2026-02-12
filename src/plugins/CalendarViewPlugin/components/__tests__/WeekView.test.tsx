import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WeekView from '../WeekView';

vi.mock('../EventChip', () => ({
  default: ({ event }: { event: { title?: string } }) => (
    <div data-testid="event-chip">{event.title || 'event'}</div>
  ),
}));

vi.mock('../MoreEventsDropdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="more-events-dropdown">{children}</div>
  ),
}));

describe('WeekView', () => {
  it('renders date-based week view and handles add event clicks', () => {
    const onDateClick = vi.fn();
    const onEventClick = vi.fn();
    const currentDate = new Date('2026-02-10T10:00:00Z');
    const events = [
      { id: 'e1', title: 'Event A', date: '2026-02-10', dateTime: '2026-02-10T10:00:00Z' },
    ];

    render(
      <WeekView
        currentDate={currentDate}
        events={events as any}
        onDateClick={onDateClick}
        onEventClick={onEventClick}
      />
    );

    expect(screen.getByText('Event A')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onDateClick).toHaveBeenCalled();
  });

  it('renders datetime week view with time slots and more events dropdown', () => {
    const onDateClick = vi.fn();
    const currentDate = new Date('2026-02-10T10:00:00Z');
    const events = [
      { id: 'e1', title: 'Slot A', date: '2026-02-10', dateTime: '2026-02-10T09:00:00' },
      { id: 'e2', title: 'Slot B', date: '2026-02-10', dateTime: '2026-02-10T09:30:00' },
    ];

    render(
      <WeekView
        currentDate={currentDate}
        events={events as any}
        onDateClick={onDateClick}
        dateField={{ type: 'datetime' }}
      />
    );

    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByTestId('more-events-dropdown')).toBeInTheDocument();
  });
});
