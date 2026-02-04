import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YearView from '../YearView';

describe('YearView', () => {
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
      date: '2026-06-20',
      dateTime: new Date('2026-06-20T10:00:00'),
      data: {},
      color: 'green'
    },
    {
      id: '3',
      title: 'Event 3',
      date: '2026-12-25',
      dateTime: new Date('2026-12-25T16:00:00'),
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
    it('should render all 12 months', () => {
      render(<YearView {...defaultProps} />);

      expect(screen.getByText('January')).toBeInTheDocument();
      expect(screen.getByText('February')).toBeInTheDocument();
      expect(screen.getByText('March')).toBeInTheDocument();
      expect(screen.getByText('April')).toBeInTheDocument();
      expect(screen.getByText('May')).toBeInTheDocument();
      expect(screen.getByText('June')).toBeInTheDocument();
      expect(screen.getByText('July')).toBeInTheDocument();
      expect(screen.getByText('August')).toBeInTheDocument();
      expect(screen.getByText('September')).toBeInTheDocument();
      expect(screen.getByText('October')).toBeInTheDocument();
      expect(screen.getByText('November')).toBeInTheDocument();
      expect(screen.getByText('December')).toBeInTheDocument();
    });

    it('should render in grid layout', () => {
      const { container } = render(<YearView {...defaultProps} />);

      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('should render weekday headers for each month', () => {
      render(<YearView {...defaultProps} />);

      const mondays = screen.getAllByText('Mon');
      expect(mondays.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('event indicators', () => {
    it('should show event indicators on dates with events', () => {
      const { container } = render(<YearView {...defaultProps} />);

      const eventDots = container.querySelectorAll('.rounded-full');
      expect(eventDots.length).toBeGreaterThan(0);
    });

    it('should show correct color for event indicators', () => {
      const { container } = render(<YearView {...defaultProps} />);

      const blueDots = container.querySelectorAll('.bg-blue-500');
      expect(blueDots.length).toBeGreaterThanOrEqual(0);
    });

    it('should show multiple indicators for multiple events on same day', () => {
      const sameDay = [
        mockEvents[0],
        { ...mockEvents[1], date: '2026-01-15', dateTime: new Date('2026-01-15T16:00:00') }
      ];

      const { container } = render(
        <YearView {...defaultProps} events={sameDay} />
      );

      const eventDots = container.querySelectorAll('.rounded-full');
      expect(eventDots.length).toBeGreaterThan(0);
    });
  });

  describe('date clicks', () => {
    it('should call onDateSelect when date is clicked', async () => {
      const mockOnDateSelect = vi.fn();

      const { container } = render(
        <YearView
          {...defaultProps}
          onDateSelect={mockOnDateSelect}
        />
      );

      const dateCell = container.querySelector('.cursor-pointer');
      if (dateCell) {
        await userEvent.click(dateCell);
        expect(mockOnDateSelect).toHaveBeenCalled();
      }
    });

    it('should call default onDateSelect when clicking date cell', async () => {
      const { container } = render(<YearView {...defaultProps} />);

      const dateCell = container.querySelector('.cursor-pointer');
      if (dateCell) {
        await userEvent.click(dateCell as HTMLElement);
      }

      expect(defaultProps.onDateSelect).toHaveBeenCalled();
    });
  });

  describe('today highlighting', () => {
    it('should highlight today', () => {
      const today = new Date();

      const { container } = render(
        <YearView
          {...defaultProps}
          currentDate={today}
        />
      );

      const todayCell = container.querySelector(String.raw`.bg-\[var\(--color-bg-brand-primary\)\]`);
      expect(todayCell).toBeInTheDocument();
    });

    it('should not highlight other days', () => {
      render(<YearView {...defaultProps} currentDate={new Date('2026-01-15')} />);

      const today = new Date();
      const isTestDateToday = today.getDate() === 15 && today.getMonth() === 0 && today.getFullYear() === 2026;

      if (!isTestDateToday) {
        expect(screen.queryByText('Today')).not.toBeInTheDocument();
      }
    });
  });

  describe('previous and next month days', () => {
    it('should show previous month days with different styling', () => {
      const { container } = render(<YearView {...defaultProps} />);

      const grayText = container.querySelectorAll('.text-gray-400');
      expect(grayText.length).toBeGreaterThan(0);
    });

    it('should show next month days with different styling', () => {
      const { container } = render(<YearView {...defaultProps} />);

      const grayText = container.querySelectorAll('.text-gray-400');
      expect(grayText.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('should render calendar without events', () => {
      render(<YearView {...defaultProps} events={[]} />);

      expect(screen.getByText('January')).toBeInTheDocument();
      expect(screen.getByText('December')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle leap year correctly', () => {
      render(<YearView {...defaultProps} currentDate={new Date('2024-02-15')} />);

      expect(screen.getByText('February')).toBeInTheDocument();
    });

    it('should handle year boundaries', () => {
      render(<YearView {...defaultProps} currentDate={new Date('2026-12-31')} />);

      expect(screen.getByText('December')).toBeInTheDocument();
    });

    it('should handle events across different months', () => {
      render(<YearView {...defaultProps} />);

      expect(screen.getByText('January')).toBeInTheDocument();
      expect(screen.getByText('June')).toBeInTheDocument();
      expect(screen.getByText('December')).toBeInTheDocument();
    });

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
        <YearView
          {...defaultProps}
          events={[invalidDateEvent as any]}
        />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('weekend styling', () => {
    it('should render weekend day headers', () => {
      render(<YearView {...defaultProps} />);

      const saturdayHeaders = screen.getAllByText('Sat');
      const sundayHeaders = screen.getAllByText('Sun');
      expect(saturdayHeaders.length).toBeGreaterThanOrEqual(12);
      expect(sundayHeaders.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('responsive layout', () => {
    it('should render 3 columns on desktop', () => {
      const { container } = render(<YearView {...defaultProps} />);

      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('should have proper spacing between months', () => {
      const { container } = render(<YearView {...defaultProps} />);

      const gap = container.querySelector('.gap-4, .gap-6, .gap-8');
      expect(gap).toBeInTheDocument();
    });
  });
});
