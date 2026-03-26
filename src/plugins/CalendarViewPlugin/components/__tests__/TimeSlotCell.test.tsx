import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeSlotCell from '../TimeSlotCell';

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

describe('TimeSlotCell', () => {
  it('renders event chip and "+ n" dropdown when multiple events exist', () => {
    const events = [
      { id: 'e1', title: 'Event A', date: '2026-02-10', dateTime: '2026-02-10T09:00:00' },
      { id: 'e2', title: 'Event B', date: '2026-02-10', dateTime: '2026-02-10T09:30:00' },
    ];

    render(
      <TimeSlotCell
        date={new Date('2026-02-10T09:00:00')}
        hour={9}
        events={events as any}
      />
    );

    expect(screen.getByText('Event A')).toBeInTheDocument();
    expect(screen.getByTestId('more-events-dropdown')).toBeInTheDocument();
    expect(screen.getByText('+ 1')).toBeInTheDocument();
  });

  it('calls onDateClick when empty slot is clicked', async () => {
    const onDateClick = vi.fn();
    const user = userEvent.setup();

    render(
      <TimeSlotCell
        date={new Date('2026-02-10T00:00:00')}
        hour={10}
        events={[]}
        onDateClick={onDateClick}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(onDateClick).toHaveBeenCalledTimes(1);
  });

  it('triggers onDateClick on keyboard when enabled', async () => {
    const onDateClick = vi.fn();
    const user = userEvent.setup();

    render(
      <TimeSlotCell
        date={new Date('2026-02-10T00:00:00')}
        hour={7}
        events={[]}
        onDateClick={onDateClick}
        enableKeyboard={true}
        className="test-slot"
      />
    );

    const wrapper = document.querySelector('.test-slot');
    if (!wrapper) {
      throw new Error('Missing wrapper');
    }
    fireEvent.keyDown(wrapper, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(onDateClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onDateClick when slot has events and container is clicked', async () => {
    const onDateClick = vi.fn();
    const user = userEvent.setup();
    const events = [
      { id: 'e1', title: 'Event A', date: '2026-02-10', dateTime: '2026-02-10T09:00:00' },
    ];

    const { container } = render(
      <TimeSlotCell
        date={new Date('2026-02-10T09:00:00')}
        hour={9}
        events={events as any}
        onDateClick={onDateClick}
      />
    );

    await user.click(container.firstChild as Element);
    expect(onDateClick).not.toHaveBeenCalled();
  });

  it('calls onDateClick when create button is clicked', async () => {
    const onDateClick = vi.fn();
    const user = userEvent.setup();
    const events = [
      { id: 'e1', title: 'Event A', date: '2026-02-10', dateTime: '2026-02-10T09:00:00' },
    ];

    render(
      <TimeSlotCell
        date={new Date('2026-02-10T09:00:00')}
        hour={9}
        events={events as any}
        onDateClick={onDateClick}
      />
    );

    await user.click(screen.getByRole('button', { name: /create event at 9:00/i }));
    expect(onDateClick).toHaveBeenCalledTimes(1);
  });

  it('ignores keyboard actions when enableKeyboard is false', () => {
    const onDateClick = vi.fn();
    render(
      <TimeSlotCell
        date={new Date('2026-02-10T00:00:00')}
        hour={7}
        events={[]}
        onDateClick={onDateClick}
        enableKeyboard={false}
        className="test-slot"
      />
    );

    const wrapper = document.querySelector('.test-slot');
    if (!wrapper) throw new Error('Missing wrapper');
    fireEvent.keyDown(wrapper, { key: 'Enter', code: 'Enter' });
    expect(onDateClick).not.toHaveBeenCalled();
  });
});
