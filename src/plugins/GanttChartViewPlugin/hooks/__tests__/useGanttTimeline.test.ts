import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGanttTimeline } from '../useGanttTimeline';
import { buildGanttTooltipLines } from '../../utils/buildGanttTooltip';

vi.mock('../../utils/buildGanttTooltip', () => ({
  buildGanttTooltipLines: vi.fn(() => ['line']),
}));

const makeTask = (start: string, end: string) => ({
  id: 't1',
  startDate: new Date(start),
  endDate: new Date(end),
  row: { id: 1 },
});

describe('useGanttTimeline', () => {
  const originalInnerWidth = globalThis.innerWidth;
  const originalInnerHeight = globalThis.innerHeight;

  beforeEach(() => {
    vi.mocked(buildGanttTooltipLines).mockClear();
  });

  afterEach(() => {
    globalThis.innerWidth = originalInnerWidth;
    globalThis.innerHeight = originalInnerHeight;
  });

  it('computes timeline days and task position', () => {
    const tasks = [makeTask('2026-02-01', '2026-02-05')];
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: tasks, columns: [] })
    );
    expect(result.current.timelineDays.length).toBeGreaterThan(0);
    const pos = result.current.getTaskPosition(tasks[0]);
    expect(pos.width).toBeGreaterThan(0);
  });

  it('zooms in and out', () => {
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: [], columns: [] })
    );
    const initial = result.current.dayWidth;
    act(() => result.current.zoomIn());
    expect(result.current.dayWidth).toBe(initial + 10);
    act(() => result.current.zoomOut());
    expect(result.current.dayWidth).toBe(initial);
    act(() => result.current.resetZoom());
    expect(result.current.dayWidth).toBe(30);
  });

  it('adjusts timeline range based on task dates with padding', async () => {
    const tasks = [makeTask('2026-02-10', '2026-02-12')];
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: tasks, columns: [] })
    );

    await waitFor(() => {
      const start = result.current.timelineStart.getTime();
      const end = result.current.timelineEnd.getTime();
      expect(start).toBeLessThan(tasks[0].startDate.getTime());
      expect(end).toBeGreaterThan(tasks[0].endDate.getTime());
    });
  });

  it('shows and hides tooltip state', () => {
    const tasks = [makeTask('2026-02-01', '2026-02-05')];
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: tasks, columns: [] })
    );

    act(() => result.current.handleTaskMouseEnter(tasks[0]));
    expect(result.current.showTooltip).toBe(true);
    expect(result.current.tooltipTask).toEqual(tasks[0]);

    act(() => result.current.handleTaskMouseLeave());
    expect(result.current.showTooltip).toBe(false);
    expect(result.current.tooltipTask).toBeNull();
  });

  it('sets tooltip position based on available space', () => {
    const tasks = [makeTask('2026-02-01', '2026-02-05')];
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: tasks, columns: [] })
    );

    const fakeRect = {
      bottom: 10,
      right: 10,
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    };

    globalThis.innerWidth = 800;
    globalThis.innerHeight = 600;

    act(() => {
      result.current.tooltipRef.current = {
        getBoundingClientRect: () => fakeRect,
      } as any;
      result.current.handleTaskMouseEnter(tasks[0]);
    });

    expect(result.current.tooltipPosition).toBe('bottom');
    expect(result.current.getTooltipClasses()).toContain('top-full');
    expect(result.current.getTooltipArrowClasses()).toContain('bottom-full');
  });

  it('prefers right position when there is space to the right', () => {
    const tasks = [makeTask('2026-02-01', '2026-02-05')];
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: tasks, columns: [] })
    );

    const fakeRect = {
      bottom: 700,
      right: 400,
      left: 10,
      top: 650,
      width: 100,
      height: 100,
    };

    globalThis.innerWidth = 800;
    globalThis.innerHeight = 600;

    act(() => {
      result.current.tooltipRef.current = {
        getBoundingClientRect: () => fakeRect,
      } as any;
      result.current.handleTaskMouseEnter(tasks[0]);
    });

    expect(result.current.tooltipPosition).toBe('right');
    expect(result.current.getTooltipClasses()).toContain('left-full');
  });

  it('prefers left position when only left has space', () => {
    const tasks = [makeTask('2026-02-01', '2026-02-05')];
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: tasks, columns: [] })
    );

    const fakeRect = {
      bottom: 700,
      right: 900,
      left: 50,
      top: 650,
      width: 100,
      height: 100,
    };

    globalThis.innerWidth = 800;
    globalThis.innerHeight = 600;

    act(() => {
      result.current.tooltipRef.current = {
        getBoundingClientRect: () => fakeRect,
      } as any;
      result.current.handleTaskMouseEnter(tasks[0]);
    });

    expect(result.current.tooltipPosition).toBe('left');
    expect(result.current.getTooltipClasses()).toContain('right-full');
  });

  it('clamps zoom in and out limits', () => {
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: [], columns: [] })
    );

    act(() => {
      for (let i = 0; i < 20; i++) result.current.zoomIn();
    });
    expect(result.current.dayWidth).toBe(100);

    act(() => {
      for (let i = 0; i < 20; i++) result.current.zoomOut();
    });
    expect(result.current.dayWidth).toBe(15);
  });

  it('formats time using 12-hour format in tooltip builder', () => {
    const tasks = [makeTask('2026-02-01T00:00:00Z', '2026-02-01T12:30:00Z')];
    const { result } = renderHook(() =>
      useGanttTimeline({ filteredTasks: tasks, columns: [] })
    );

    act(() => {
      result.current.handleTaskMouseEnter(tasks[0]);
    });

    const call = vi.mocked(buildGanttTooltipLines).mock.calls[0]?.[0];
    expect(call).toBeDefined();
    const formatted = call.options.formatTime('13:05');
    expect(formatted).toBe('1:05 PM');
  });
});
