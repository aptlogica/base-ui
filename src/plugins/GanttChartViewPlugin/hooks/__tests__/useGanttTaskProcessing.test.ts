import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGanttTaskProcessing } from '../useGanttTaskProcessing';
import type { TableResponse, Column, View, Model } from '../../../../types/api.types';

vi.mock('../../../../types/constants', () => ({
  fieldsToFilter: ['filterMe'],
}));

const baseModel: Model = {
  id: 'model-id',
  base_id: 'base-id',
  workspace_id: 'workspace-id',
  title: 'Model',
  description: 'Model description',
  alias: 'model',
  meta: {},
  order_index: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const createColumn = (overrides: Partial<Column>): Column => ({
  id: 'column-id',
  model_id: 'model-id',
  base_id: 'base-id',
  column_name: 'column-name',
  title: 'Column',
  uidt: 'text',
  dt: 'text',
  description: '',
  meta: {},
  virtual: false,
  system: false,
  deleted: false,
  order_index: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const createView = (overrides: Partial<View>): View => ({
  id: 'view-id',
  model_id: 'model-id',
  base_id: 'base-id',
  title: 'View',
  description: '',
  alias: 'view',
  type: 'grid',
  is_default: false,
  lock_type: 'none',
  password: '',
  public: false,
  uuid: 'view-uuid',
  order_index: 0,
  created_time: '2024-01-01T00:00:00.000Z',
  last_modified_time: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const createTableResponse = (
  columns: Column[],
  records: Record<string, unknown>[],
  views: View[],
): TableResponse => ({
  success: true,
  message: 'ok',
  data: {
    model: baseModel,
    columns,
    views,
    records,
  },
  meta: {
    code: '200',
    http_status: 200,
  },
});

describe('useGanttTaskProcessing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty defaults when no table data is provided', () => {
    const { result } = renderHook(() => useGanttTaskProcessing({ tableData: undefined }));

    expect(result.current.tasks).toEqual([]);
    expect(result.current.columns).toEqual([]);
    expect(result.current.currentView).toBeUndefined();
    expect(result.current.startDateField).toBeUndefined();
    expect(result.current.endDateField).toBeUndefined();
    expect(result.current.titleField).toBeUndefined();
    expect(result.current.progressField).toBeUndefined();
    expect(result.current.completionField).toBeUndefined();
  });

  it('filters out columns matching fieldsToFilter', () => {
    const filteredColumn = createColumn({ id: 'filtered', column_name: 'Filtered', uidt: 'filterMe' });
    const visibleColumn = createColumn({ id: 'visible', column_name: 'Visible', uidt: 'text' });
    const view = createView({ type: 'ganttChart', meta: {} });
    const tableData = createTableResponse([filteredColumn, visibleColumn], [], [view]);

    const { result } = renderHook(() => useGanttTaskProcessing({ tableData }));

    expect(result.current.columns).toHaveLength(1);
    expect(result.current.columns[0].id).toBe('visible');
  });

  it('selects the gantt chart view when available', () => {
    const gridView = createView({ id: 'grid', type: 'grid', meta: {} });
    const ganttView = createView({ id: 'gantt', type: 'ganttChart', meta: {} });
    const tableData = createTableResponse([], [], [gridView, ganttView]);

    const { result } = renderHook(() => useGanttTaskProcessing({ tableData }));

    expect(result.current.currentView?.id).toBe('gantt');
  });

  it('resolves fields from view meta identifiers', () => {
    const startColumn = createColumn({ id: 'start', column_name: 'start_date', uidt: 'date' });
    const endColumn = createColumn({ id: 'end', column_name: 'end_date', uidt: 'date' });
    const titleColumn = createColumn({ id: 'title', column_name: 'task_title', uidt: 'text' });
    const progressColumn = createColumn({ id: 'progress', column_name: 'progress', uidt: 'number' });
    const completionColumn = createColumn({ id: 'completion', column_name: 'completion', uidt: 'number' });
    const view = createView({
      type: 'ganttChart',
      meta: {
        start_date_field_id: 'start',
        end_date_field_id: 'end',
        title_field_id: 'title',
        progress_field_id: 'progress',
        completion_field_id: 'completion',
      },
    });
    const tableData = createTableResponse(
      [startColumn, endColumn, titleColumn, progressColumn, completionColumn],
      [],
      [view],
    );

    const { result } = renderHook(() => useGanttTaskProcessing({ tableData }));

    expect(result.current.startDateField?.id).toBe('start');
    expect(result.current.endDateField?.id).toBe('end');
    expect(result.current.titleField?.id).toBe('title');
    expect(result.current.progressField?.id).toBe('progress');
    expect(result.current.completionField?.id).toBe('completion');
  });

  it('falls back to a title column by name when meta is missing', () => {
    const titleColumn = createColumn({ id: 'title-id', column_name: 'title', uidt: 'text' });
    const startColumn = createColumn({ id: 'start-id', column_name: 'start', uidt: 'date' });
    const endColumn = createColumn({ id: 'end-id', column_name: 'end', uidt: 'date' });
    const view = createView({ type: 'ganttChart', meta: { start_date_field_id: 'start-id', end_date_field_id: 'end-id' } });
    const tableData = createTableResponse([titleColumn, startColumn, endColumn], [], [view]);

    const { result } = renderHook(() => useGanttTaskProcessing({ tableData }));

    expect(result.current.titleField?.id).toBe('title-id');
  });

  it('marks a task as overdue when the end date is before the current time', () => {
    const startColumn = createColumn({ id: 'start', column_name: 'start_date', uidt: 'date' });
    const endColumn = createColumn({ id: 'end', column_name: 'end_date', uidt: 'date' });
    const titleColumn = createColumn({ id: 'title', column_name: 'title', uidt: 'text' });
    const view = createView({
      type: 'ganttChart',
      meta: {
        start_date_field_id: 'start',
        end_date_field_id: 'end',
        title_field_id: 'title',
      },
    });
    const tableData = createTableResponse(
      [startColumn, endColumn, titleColumn],
      [
        {
          id: 'task-1',
          start_date: '2024-01-01T00:00:00.000Z',
          end_date: '2024-01-05T00:00:00.000Z',
          title: 'Task',
        },
      ],
      [view],
    );

    const { result } = renderHook(() => useGanttTaskProcessing({ tableData }));

    expect(result.current.tasks[0].status).toBe('overdue');
  });

  it('marks a task as completed when progress is at least 100', () => {
    const startColumn = createColumn({ id: 'start', column_name: 'start_date', uidt: 'date' });
    const endColumn = createColumn({ id: 'end', column_name: 'end_date', uidt: 'date' });
    const titleColumn = createColumn({ id: 'title', column_name: 'title', uidt: 'text' });
    const progressColumn = createColumn({ id: 'progress', column_name: 'progress', uidt: 'number' });
    const view = createView({
      type: 'ganttChart',
      meta: {
        start_date_field_id: 'start',
        end_date_field_id: 'end',
        title_field_id: 'title',
        progress_field_id: 'progress',
      },
    });
    const tableData = createTableResponse(
      [startColumn, endColumn, titleColumn, progressColumn],
      [
        {
          id: 'task-2',
          start_date: '2024-01-10T00:00:00.000Z',
          end_date: '2024-01-15T00:00:00.000Z',
          title: 'Completed task',
          progress: 120,
        },
      ],
      [view],
    );

    const { result } = renderHook(() => useGanttTaskProcessing({ tableData }));

    expect(result.current.tasks[0].status).toBe('completed');
    expect(result.current.tasks[0].progress).toBe(120);
  });

  it('marks a task as pending when start and end dates are missing', () => {
    const titleColumn = createColumn({ id: 'title', column_name: 'title', uidt: 'text' });
    const view = createView({ type: 'ganttChart', meta: { title_field_id: 'title' } });
    const tableData = createTableResponse([titleColumn], [{ id: 'task-3', title: 'Pending task' }], [view]);

    const { result } = renderHook(() => useGanttTaskProcessing({ tableData }));

    expect(result.current.tasks[0].status).toBe('pending');
  });

  it('uses fallback values when optional fields are absent', () => {
    const view = createView({ type: 'ganttChart', meta: {} });
    const tableData = createTableResponse([], [{}], [view]);

    const { result } = renderHook(() => useGanttTaskProcessing({ tableData }));

    expect(result.current.tasks[0].id).toBe(0);
    expect(result.current.tasks[0].name).toBe('-');
    expect(result.current.tasks[0].color).toBe('hsl(0, 70%, 50%)');
    expect(result.current.tasks[0].progress).toBe(0);
    expect(result.current.tasks[0].startDate.getTime()).toBe(new Date('2024-01-10T00:00:00.000Z').getTime());
    expect(result.current.tasks[0].endDate.getTime()).toBe(new Date('2024-01-17T00:00:00.000Z').getTime());
  });
});
