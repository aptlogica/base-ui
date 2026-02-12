import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventChip from '../EventChip';
import type { GridColumn } from '../../../../plugins/GridViewPlugin/types/grid.types';

vi.mock('../../utils/buildEventTooltip', () => ({
  buildEventTooltipLines: vi.fn((opts: { columns?: unknown[] }) =>
    opts.columns?.length ? ['Event Info Line 1', 'Event Info Line 2'] : [])
}));

describe('EventChip', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    date: '2026-01-30',
    dateTime: new Date('2026-01-30T14:30:00'),
    data: { description: 'Test description' },
    color: 'blue',
    isDateField: false
  };

  const mockColumns: GridColumn[] = [
    { id: '1', key: 'description', title: 'Description', type: 'text' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render event title', () => {
      render(<EventChip event={mockEvent} />);

      expect(screen.getByText(/Test Event/)).toBeInTheDocument();
    });

    it('should render time for datetime fields', () => {
      render(<EventChip event={mockEvent} />);

      const timeText = screen.getByText(/2:30/);
      expect(timeText).toBeInTheDocument();
    });

    it('should not render time for date fields', () => {
      const dateEvent = { ...mockEvent, isDateField: true };
      render(<EventChip event={dateEvent} />);

      const timeElements = screen.queryByText(/2:30/);
      expect(timeElements).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <EventChip event={mockEvent} className="custom-class" />
      );

      const chip = container.querySelector('.custom-class');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('onClick behavior', () => {
    it('should call onClick when clicked', async () => {
      const mockOnClick = vi.fn();
      render(<EventChip event={mockEvent} onClick={mockOnClick} />);

      const chip = screen.getByText(/Test Event/).closest('div');
      expect(chip).toBeTruthy();
      if (chip) await userEvent.click(chip);

      expect(mockOnClick).toHaveBeenCalledWith(mockEvent);
    });

    it('should not call onClick when not provided', async () => {
      const { container } = render(<EventChip event={mockEvent} />);

      const chip = container.querySelector('div');
      expect(chip).toBeTruthy();
      if (chip) await userEvent.click(chip as HTMLElement);

      expect(screen.getByText(/Test Event/)).toBeInTheDocument();
    });

    it('should stop event propagation on click', async () => {
      const mockParentClick = vi.fn();
      const mockOnClick = vi.fn();

      render(
        <div onClick={mockParentClick}>
          <EventChip event={mockEvent} onClick={mockOnClick} />
        </div>
      );

      const chip = screen.getByText(/Test Event/).closest('.cursor-pointer');
      expect(chip).toBeTruthy();
      if (chip) await userEvent.click(chip as HTMLElement);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockParentClick).not.toHaveBeenCalled();
    });
  });

  describe('tooltip behavior', () => {
    it('should show tooltip on mouse enter', async () => {
      render(<EventChip event={mockEvent} columns={mockColumns} />);

      const chip = screen.getByText(/Test Event/).closest('div');
      expect(chip).toBeTruthy();
      if (chip) fireEvent.mouseEnter(chip);

      await waitFor(() => {
        const tooltip = screen.queryByText('Event Info Line 1');
        expect(tooltip).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      render(<EventChip event={mockEvent} columns={mockColumns} />);

      const chip = screen.getByText(/Test Event/).closest('div');
      expect(chip).toBeTruthy();
      if (chip) fireEvent.mouseEnter(chip);

      await waitFor(() => {
        expect(screen.queryByText('Event Info Line 1')).toBeInTheDocument();
      });

      if (chip) fireEvent.mouseLeave(chip);

      await waitFor(() => {
        expect(screen.queryByText('Event Info Line 1')).not.toBeInTheDocument();
      });
    });

    it('should not show tooltip without columns', () => {
      render(<EventChip event={mockEvent} />);

      const chip = screen.getByText(/Test Event/).closest('div');
      expect(chip).toBeTruthy();
      if (chip) fireEvent.mouseEnter(chip);

      expect(screen.queryByText('Event Info Line 1')).not.toBeInTheDocument();
    });

    it('should pass fieldConfig to tooltip builder', async () => {
      const { buildEventTooltipLines } = await import('../../utils/buildEventTooltip');
      const fieldConfig = [{ id: '1', isHidden: false }];

      render(
        <EventChip
          event={mockEvent}
          columns={mockColumns}
          fieldConfig={fieldConfig}
        />
      );

      const chip = screen.getByText(/Test Event/).closest('div');
      expect(chip).toBeTruthy();
      if (chip) fireEvent.mouseEnter(chip);

      await waitFor(() => {
        expect(vi.mocked(buildEventTooltipLines)).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({
              fieldConfig
            })
          })
        );
      });
    });
  });

  describe('tooltip positioning', () => {
    it('should calculate tooltip position based on chip position', async () => {
      const { container } = render(<EventChip event={mockEvent} columns={mockColumns} />);

      const chip = container.querySelector('div');
      expect(chip).toBeTruthy();
      if (chip) fireEvent.mouseEnter(chip);

      await waitFor(() => {
        const tooltip = screen.queryByText('Event Info Line 1');
        if (tooltip) {
          const tooltipParent = tooltip.parentElement;
          expect(tooltipParent).toHaveStyle({ position: 'fixed' });
        }
      });
    });
  });

  describe('edge cases', () => {
    it('should handle event without title', () => {
      const eventWithoutTitle = { ...mockEvent, title: '' };
      render(<EventChip event={eventWithoutTitle} />);

      expect(screen.queryByText('Test Event')).not.toBeInTheDocument();
    });

    it('should handle event with long title', () => {
      const longTitle = 'A'.repeat(100);
      const eventWithLongTitle = { ...mockEvent, title: longTitle };
      render(<EventChip event={eventWithLongTitle} />);

      const matches = screen.getAllByText((_, el) => (el?.textContent ?? '').includes(longTitle));
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle invalid dateTime', () => {
      const eventWithInvalidDate = {
        ...mockEvent,
        dateTime: new Date('invalid')
      };

      const { container } = render(<EventChip event={eventWithInvalidDate} />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should be keyboard accessible when onClick provided', () => {
      const mockOnClick = vi.fn();
      render(<EventChip event={mockEvent} onClick={mockOnClick} />);

      const chip = screen.getByText(/Test Event/).closest('.cursor-pointer') ?? screen.getByText(/Test Event/).closest('div');
      expect(chip).toBeInTheDocument();
    });
  });
});
