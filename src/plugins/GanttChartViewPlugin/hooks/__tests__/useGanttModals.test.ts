import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGanttModals } from '../useGanttModals';
import type { GanttTask } from '../useGanttData';
import type { Column } from '../../../../types/api.types';

const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('../../../../components/common/Toast', () => ({
  useToast: () => toastMock,
}));

const buildInitialValuesForEditMock = vi.hoisted(() => vi.fn(() => ({ built: true })));

vi.mock('../../../../utils/initialValues', () => ({
  buildInitialValuesForEdit: buildInitialValuesForEditMock,
}));

const createColumn = (overrides: Partial<Column> = {}): Column => ({
  id: 'col-id',
  model_id: 'model-id',
  base_id: 'base-id',
  column_name: 'title',
  title: 'Title',
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

const baseTask: GanttTask = {
  id: 'task-1',
  name: 'Sample task',
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  endDate: new Date('2024-01-05T00:00:00.000Z'),
  color: '#fff',
  progress: 10,
  status: 'active',
  rawData: { id: 'task-1' },
};

const renderUseGanttModals = (overrides: Partial<Parameters<typeof useGanttModals>[0]> = {}) => {
  const deleteRecord = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
  const actions = {
    deleteRecord,
    createTask: vi.fn().mockResolvedValue('new-task-id'),
  };
  return renderHook(() => useGanttModals({
    tasks: [baseTask],
    tableData: { model: { id: 'model-id' } },
    actions,
    onRefresh: vi.fn(),
    columns: [createColumn()],
    rawRecords: [{ id: 'task-1', value: 'record' }],
    startDateField: createColumn({ id: 'start-field' }),
    endDateField: createColumn({ id: 'end-field' }),
    ...overrides,
  }));
};

describe('useGanttModals', () => {
  beforeEach(() => {
    toastMock.success.mockReset();
    toastMock.error.mockReset();
    buildInitialValuesForEditMock.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens the create modal when handleCreateRecord is invoked', () => {
    const { result } = renderUseGanttModals();

    act(() => {
      result.current.handleCreateRecord();
    });

    expect(result.current.modalState.create.isOpen).toBe(true);
  });

  it('stores the selected task when editing', () => {
    const { result } = renderUseGanttModals();

    act(() => {
      result.current.handleEditTask(baseTask);
    });

    expect(result.current.modalState.edit.isOpen).toBe(true);
    expect(result.current.modalState.edit.selectedTask).toEqual(baseTask);
  });

  it('tracks the task scheduled for deletion and opens confirmation modal', () => {
    const { result } = renderUseGanttModals();

    act(() => {
      result.current.handleDeleteTask(baseTask);
    });

    expect(result.current.taskToDelete).toEqual(baseTask);
    expect(result.current.deleteConfirmModalOpen).toBe(true);
  });

  it('closes all modals when the close handlers are executed', () => {
    const { result } = renderUseGanttModals();

    act(() => {
      result.current.handleCreateRecord();
      result.current.handleEditTask(baseTask);
      result.current.handleDeleteTask(baseTask);
      result.current.handleCloseCreateModal();
      result.current.handleCloseEditModal();
      result.current.handleCloseDeleteModal();
    });

    expect(result.current.modalState.create.isOpen).toBe(false);
    expect(result.current.modalState.edit.isOpen).toBe(false);
    expect(result.current.deleteConfirmModalOpen).toBe(false);
    expect(result.current.taskToDelete).toBeNull();
  });

  it('invokes the refresh callback on create or edit success', () => {
    const onRefresh = vi.fn();
    const { result } = renderUseGanttModals({ onRefresh });

    act(() => {
      result.current.handleCreateSuccess({ recordId: '10' });
      result.current.handleEditSuccess({ recordId: '11' });
    });

    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it('deletes a record via the deleteRecord action', async () => {
    const deleteRecord = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    const actions = { deleteRecord };
    const { result } = renderUseGanttModals({ actions });

    await act(async () => result.current.handleDeleteRecord('44'));

    expect(deleteRecord.mutateAsync).toHaveBeenCalledWith({
      model_id: 'model-id',
      row_id: 44,
    });
  });

  it('notifies the user when confirm delete lacks required data', async () => {
    const { result } = renderUseGanttModals({ actions: undefined });

    act(() => {
      result.current.handleDeleteTask(baseTask);
    });

    await act(async () => result.current.handleConfirmDelete());

    expect(toastMock.error).toHaveBeenCalledWith('Missing information to delete record');
  });

  it('confirms deletion when prerequisites are satisfied', async () => {
    const deleteRecord = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    const onRefresh = vi.fn();
    const { result } = renderUseGanttModals({ actions: { deleteRecord }, onRefresh });

    act(() => {
      result.current.handleDeleteTask(baseTask);
    });

    await act(async () => result.current.handleConfirmDelete());

    expect(deleteRecord.mutateAsync).toHaveBeenCalledWith({
      model_id: 'model-id',
      row_id: Number(baseTask.id),
    });
    expect(toastMock.success).toHaveBeenCalledWith('Record deleted successfully');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.deleteConfirmModalOpen).toBe(false);
    expect(result.current.taskToDelete).toBeNull();
  });

  it('surfaces errors from confirm delete when mutation fails', async () => {
    const deleteRecord = { mutateAsync: vi.fn().mockRejectedValue(new Error('boom')) };
    const { result } = renderUseGanttModals({ actions: { deleteRecord } });

    act(() => {
      result.current.handleDeleteTask(baseTask);
    });

    await expect(
      act(async () => {
        await result.current.handleConfirmDelete();
      }),
    ).rejects.toThrow('boom');

    expect(toastMock.error).toHaveBeenCalledWith(
      'Failed to delete record. Please try again.',
      { title: 'Error', duration: 3500 },
    );
  });

  it('duplicates a record and schedules refresh', async () => {
    const createTask = vi.fn().mockResolvedValue('new-id');
    const onRefresh = vi.fn();
    const { result } = renderUseGanttModals({ actions: { createTask }, onRefresh });

    await act(async () => result.current.handleDuplicateRecord(String(baseTask.id)));

    expect(createTask).toHaveBeenCalledTimes(1);
    expect(createTask).toHaveBeenCalledWith({
      ...baseTask,
      name: 'Sample task (Copy)',
      startDate: new Date(baseTask.startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(baseTask.endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('builds default create modal values for start and end date fields', () => {
    const { result } = renderUseGanttModals();

    const values = result.current.getCreateInitialValues();

    expect(values['start-field']).toBe('2024-01-10');
    expect(values['end-field']).toBe('2024-01-17');
  });

  it('builds edit modal values using the provided records map', () => {
    const rawRecords = [{ id: 'task-1', value: 'record' }];
    const columns = [createColumn({ id: 'col-10', column_name: 'title' })];
    const { result } = renderUseGanttModals({ rawRecords, columns });

    act(() => {
      result.current.handleEditTask(baseTask);
    });

    const values = result.current.getEditInitialValues();

    expect(buildInitialValuesForEditMock).toHaveBeenCalledWith({
      record: rawRecords[0],
      recordId: String(baseTask.id),
      columns: expect.any(Array),
      rawRecords,
    });
    expect(values).toEqual({ built: true });
  });
});
