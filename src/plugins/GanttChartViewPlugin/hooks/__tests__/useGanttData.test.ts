import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGanttData } from '../useGanttData';
import type { TableResponse, Column, View, Model } from '../../../../types/api.types';

vi.mock('../../../../types/constants', () => ({
  fieldsToFilter: ['filtered'],
}));

const mockUseTable = vi.fn();
let addRowMock: { mutateAsync: ReturnType<typeof vi.fn> };
let insertRowDataMock: { mutateAsync: ReturnType<typeof vi.fn> };
let deleteRecordMock: { mutateAsync: ReturnType<typeof vi.fn> };
let updateFieldMock: { mutateAsync: ReturnType<typeof vi.fn> };
let updateViewMutationMock: { mutateAsync: ReturnType<typeof vi.fn> };

vi.mock('../../../../hooks/useApi', () => ({
  useTable: () => mockUseTable(),
  useAddRow: () => addRowMock,
  useDeleteRecord: () => deleteRecordMock,
  useInsertRowData: () => insertRowDataMock,
  useUpdateField: () => updateFieldMock,
  useUpdateView: () => updateViewMutationMock,
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
  meta: {},
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

describe('useGanttData', () => {
  let refetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T00:00:00.000Z'));
    refetchMock = vi.fn();
    addRowMock = { mutateAsync: vi.fn() };
    insertRowDataMock = { mutateAsync: vi.fn() };
    deleteRecordMock = { mutateAsync: vi.fn() };
    updateFieldMock = { mutateAsync: vi.fn() };
    updateViewMutationMock = { mutateAsync: vi.fn() };
    mockUseTable.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const arrangeTableData = (tableData?: TableResponse) => {
    mockUseTable.mockReturnValue({
      data: tableData,
      isLoading: false,
      error: null,
      refetch: refetchMock,
    });
  };

  it('returns fallback values when table data is unavailable', () => {
    arrangeTableData();

    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: undefined }));

    expect(result.current.tasks).toEqual([]);
    expect(result.current.columns).toEqual([]);
    expect(result.current.viewConfig.filters).toEqual([]);
    expect(result.current.startDateField).toBeUndefined();
    expect(result.current.endDateField).toBeUndefined();
  });

  it('filters columns using fieldsToFilter and resolves view config', () => {
    const filteredColumn = createColumn({ id: 'filtered-column', column_name: 'Filtered', uidt: 'filtered' });
    const startColumn = createColumn({ id: 'start', column_name: 'start_date', uidt: 'date' });
    const endColumn = createColumn({ id: 'end', column_name: 'end_date', uidt: 'date' });
    const view = createView({
      id: 'view-1',
      type: 'ganttChart',
      meta: {
        start_date_field_id: 'start',
        end_date_field_id: 'end',
        filters: [{ column: 'status' }],
        sorts: [{ column: 'title' }],
      },
    });
    const tableData = createTableResponse(
      [filteredColumn, startColumn, endColumn],
      [
        {
          id: 'rec-1',
          start_date: '2024-01-05',
          end_date: '2024-01-12',
          title: 'Task 1',
        },
      ],
      [view],
    );
    arrangeTableData(tableData);

    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: 'view-1' }));

    expect(result.current.columns).toHaveLength(2);
    expect(result.current.viewConfig.filters[0]).toEqual({ column: 'status' });
    expect(result.current.startDateField?.id).toBe('start');
    expect(result.current.endDateField?.id).toBe('end');
    expect(result.current.currentView?.id).toBe('view-1');
  });

  it('invokes refetch when refresh is called', () => {
    arrangeTableData();
    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: undefined }));

    act(() => {
      result.current.refresh();
    });

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns timestamp when attempting to create a task without a model id', async () => {
    const tableData = createTableResponse([], [], [createView({ type: 'ganttChart' })]);
    const missingModelData = {
      ...tableData,
      data: {
        ...tableData.data,
        model: { ...tableData.data.model, id: '' },
      },
    };
    arrangeTableData(missingModelData);

    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: undefined }));
    let taskId: string | undefined;

    await act(async () => {
      taskId = await result.current.createTask({ name: 'Untitled' });
    });

    expect(taskId).toBe(String(new Date('2024-01-10T00:00:00.000Z').getTime()));
    expect(addRowMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('creates a task by inserting field values after row creation', async () => {
    const startColumn = createColumn({ id: 'start', column_name: 'start_date', uidt: 'date' });
    const endColumn = createColumn({ id: 'end', column_name: 'end_date', uidt: 'date' });
    const titleColumn = createColumn({ id: 'title', column_name: 'title', uidt: 'text' });
    const progressColumn = createColumn({ id: 'progress', column_name: 'progress', uidt: 'number' });
    const view = createView({
      id: 'view-1',
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
          id: 'rec-1',
          start_date: '2024-01-05',
          end_date: '2024-01-12',
          title: 'Task 1',
          progress: 10,
        },
      ],
      [view],
    );
    arrangeTableData(tableData);
    addRowMock.mutateAsync.mockResolvedValue({ id: 200 });
    insertRowDataMock.mutateAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: 'view-1' }));
    let recordId: string | undefined;

    await act(async () => {
      recordId = await result.current.createTask({
        name: 'Launch',
        startDate: new Date('2024-02-01T00:00:00.000Z'),
        endDate: new Date('2024-02-10T00:00:00.000Z'),
        progress: 75,
      });
    });

    expect(recordId).toBe('200');
    expect(addRowMock.mutateAsync).toHaveBeenCalledWith({
      model_id: 'model-id',
      rows: [{
        title: 'Launch',
        start: '2024-02-01',
        end: '2024-02-10',
        progress: 75,
      }]
    });
    expect(insertRowDataMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('moves a task by updating start and end fields', async () => {
    const startColumn = createColumn({ id: 'start', column_name: 'start_date', uidt: 'date' });
    const endColumn = createColumn({ id: 'end', column_name: 'end_date', uidt: 'date' });
    const view = createView({
      type: 'ganttChart',
      meta: {
        start_date_field_id: 'start',
        end_date_field_id: 'end',
      },
    });
    const tableData = createTableResponse(
      [startColumn, endColumn],
      [
        {
          id: 'rec-1',
          start_date: '2024-01-05',
          end_date: '2024-01-12',
        },
      ],
      [view],
    );
    arrangeTableData(tableData);
    insertRowDataMock.mutateAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: undefined }));

    await act(async () => result.current.moveTask(
      '15',
      new Date('2024-03-01T00:00:00.000Z'),
      new Date('2024-03-05T00:00:00.000Z'),
    ));

    expect(insertRowDataMock.mutateAsync).toHaveBeenCalledWith({
      model_id: 'model-id',
      column_id: 'start',
      row_id: 15,
      value: '2024-03-01',
    });
    expect(insertRowDataMock.mutateAsync).toHaveBeenCalledWith({
      model_id: 'model-id',
      column_id: 'end',
      row_id: 15,
      value: '2024-03-05',
    });
  });

  it('deletes a task when deleteTask is invoked', async () => {
    const tableData = createTableResponse([], [], [createView({ type: 'ganttChart' })]);
    arrangeTableData(tableData);
    deleteRecordMock.mutateAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: undefined }));

    await act(async () => result.current.deleteTask('22'));

    expect(deleteRecordMock.mutateAsync).toHaveBeenCalledWith({
      model_id: 'model-id',
      row_id: 22,
    });
  });

  it('updates task progress when a progress field exists', async () => {
    const progressColumn = createColumn({ id: 'progress', column_name: 'progress', uidt: 'number' });
    const view = createView({
      type: 'ganttChart',
      meta: {
        progress_field_id: 'progress',
      },
    });
    const tableData = createTableResponse([progressColumn], [{ id: 'rec-1', progress: 10 }], [view]);
    arrangeTableData(tableData);
    insertRowDataMock.mutateAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: undefined }));

    await act(async () => result.current.updateTaskProgress('33', 55));

    expect(insertRowDataMock.mutateAsync).toHaveBeenCalledWith({
      model_id: 'model-id',
      column_id: 'progress',
      row_id: 33,
      value: 55,
    });
  });

  it('updates view configuration through the updateViewConfig helper', async () => {
    const tableData = createTableResponse([], [], [createView({ type: 'ganttChart' })]);
    arrangeTableData(tableData);
    updateViewMutationMock.mutateAsync.mockResolvedValue(undefined);

    const { result } = renderHook(() => useGanttData({ tableId: 'tbl', viewId: undefined }));

    await act(async () => result.current.updateViewConfig('view-55', { meta: { title: 'Updated' } }));

    expect(updateViewMutationMock.mutateAsync).toHaveBeenCalledWith({
      viewId: 'view-55',
      view: { meta: { title: 'Updated' } },
    });
  });
});
