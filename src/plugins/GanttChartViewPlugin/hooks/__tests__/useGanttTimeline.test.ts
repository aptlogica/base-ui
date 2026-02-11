import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGanttTimeline } from '../useGanttTimeline';

vi.mock('../../utils/buildGanttTooltip', () => ({
  buildGanttTooltipLines: () => ['line'],
}));

const makeTask = (start: string, end: string) => ({
  id: 't1',
  startDate: new Date(start),
  endDate: new Date(end),
  row: { id: 1 },
});

describe('useGanttTimeline', () => {
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
});
