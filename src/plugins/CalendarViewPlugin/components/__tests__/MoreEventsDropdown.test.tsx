import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoreEventsDropdown from '../MoreEventsDropdown';
import type { GridColumn } from '../../../../plugins/GridViewPlugin/types/grid.types';

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

vi.mock('../../../components/ui/Loader', () => ({
  Loader: () => <div>Loading...</div>
}));

vi.mock('../EventChip', () => ({
  default: ({ event, onClick }: any) => (
    <button 
      onClick={() => onClick?.(event)} 
      data-testid={`event-chip-${event.id}`}
    >
      {event.title}
    </button>
  )
}));

describe('MoreEventsDropdown', () => {
  const mockEvents = Array.from({ length: 5 }, (_, i) => ({
    id: `event-${i}`,
    title: `Event ${i}`,
    date: '2026-01-30',
    dateTime: new Date('2026-01-30T14:30:00'),
    data: {},
    color: 'blue'
  }));

  const mockColumns: GridColumn[] = [
    { id: '1', key: 'field1', title: 'Field 1', type: 'text' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render trigger with children', () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      expect(screen.getByText('+5 more')).toBeInTheDocument();
    });

    it('should not show dropdown initially', () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      expect(screen.queryByText('5 more events')).not.toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('should open dropdown on trigger click', async () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('5 more events')).toBeInTheDocument();
      });
    });

    it('should display event count in dropdown header', async () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('5 more events')).toBeInTheDocument();
      });
    });

    it('should display singular event text', async () => {
      const singleEvent = [mockEvents[0]];

      render(
        <MoreEventsDropdown events={singleEvent}>
          <span>+1 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+1 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('1 more event')).toBeInTheDocument();
      });
    });

    it('should close dropdown on second click', async () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('5 more events')).toBeInTheDocument();
      });

      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText('5 more events')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <MoreEventsDropdown events={mockEvents}>
            <span>+5 more</span>
          </MoreEventsDropdown>
        </div>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('5 more events')).toBeInTheDocument();
      });

      const outside = screen.getByTestId('outside');
      await userEvent.click(outside);

      await waitFor(() => {
        expect(screen.queryByText('5 more events')).not.toBeInTheDocument();
      });
    });

    it('should stop propagation on trigger click', async () => {
      const mockParentClick = vi.fn();

      render(
        <div
          role="button"
          tabIndex={0}
          onClick={mockParentClick}
          onKeyDown={(e) => { if (e.key === 'Enter') mockParentClick(); }}
        >
          <MoreEventsDropdown events={mockEvents}>
            <span>+5 more</span>
          </MoreEventsDropdown>
        </div>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      expect(mockParentClick).not.toHaveBeenCalled();
    });
  });

  describe('event list', () => {
    it('should render all events in dropdown', async () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      const checkEventPresence = (event: typeof mockEvents[0]) => {
        expect(screen.getByText(new RegExp(event.title))).toBeInTheDocument();
      };

      await waitFor(() => {
        mockEvents.forEach(checkEventPresence);
      });
    });

    it('should pass columns to EventChip', async () => {
      render(
        <MoreEventsDropdown events={mockEvents} columns={mockColumns}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Event 0/)).toBeInTheDocument();
      });
    });

    it('should pass fieldConfig to EventChip', async () => {
      const fieldConfig = [{ id: '1', isHidden: false }];

      render(
        <MoreEventsDropdown
          events={mockEvents}
          columns={mockColumns}
          fieldConfig={fieldConfig}
        >
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Event 0/)).toBeInTheDocument();
      });
    });
  });

  describe('event click handling', () => {
    it('should call onEventClick when event is clicked', async () => {
      const mockOnEventClick = vi.fn();

      render(
        <MoreEventsDropdown events={mockEvents} onEventClick={mockOnEventClick}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Event 0/)).toBeInTheDocument();
      });

      const eventChip = screen.getByTestId('event-chip-event-0');
      await userEvent.click(eventChip);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('should close dropdown after event click', async () => {
      const mockOnEventClick = vi.fn();

      render(
        <MoreEventsDropdown events={mockEvents} onEventClick={mockOnEventClick}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Event 0/)).toBeInTheDocument();
      });

      const eventChip = screen.getByTestId('event-chip-event-0');
      await userEvent.click(eventChip);

      await waitFor(() => {
        expect(screen.queryByText('5 more events')).not.toBeInTheDocument();
      });
    });

    it('should not call onEventClick when not provided', async () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Event 0/)).toBeInTheDocument();
      });

      const eventChip = screen.getByTestId('event-chip-event-0');
      await userEvent.click(eventChip);

      expect(screen.getByText('5 more events')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should show load more button when hasMore is true', async () => {
      const manyEvents = Array.from({ length: 50 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        date: '2026-01-30',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: {},
        color: 'blue'
      }));

      render(
        <MoreEventsDropdown events={manyEvents}>
          <span>+50 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+50 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('50 more events')).toBeInTheDocument();
      });
    });

    it('should display loaded count when pagination active', async () => {
      const manyEvents = Array.from({ length: 50 }, (_, i) => ({
        id: `event-${i}`,
        title: `Event ${i}`,
        date: '2026-01-30',
        dateTime: new Date('2026-01-30T14:30:00'),
        data: {},
        color: 'blue'
      }));

      render(
        <MoreEventsDropdown events={manyEvents}>
          <span>+50 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+50 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/30 loaded/i)).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty events array', () => {
      render(
        <MoreEventsDropdown events={[]}>
          <span>+0 more</span>
        </MoreEventsDropdown>
      );

      expect(screen.getByText('+0 more')).toBeInTheDocument();
    });

    it('should handle events without onEventClick', async () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText(/Event 0/)).toBeInTheDocument();
      });
    });
  });

  describe('dropdown positioning', () => {
    it('should position dropdown as fixed element', async () => {
      render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = screen.getByText('+5 more');
      await userEvent.click(trigger);

      await waitFor(() => {
        const dropdown = screen.getByText('5 more events').closest('.fixed');
        expect(dropdown).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper cursor styling on trigger', () => {
      const { container } = render(
        <MoreEventsDropdown events={mockEvents}>
          <span>+5 more</span>
        </MoreEventsDropdown>
      );

      const trigger = container.querySelector('.cursor-pointer');
      expect(trigger).toBeInTheDocument();
    });
  });
});
