import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarData } from '../useCalendarData';

const refetch = vi.fn();
const addRowMutate = vi.fn();
const deleteRecordMutate = vi.fn();
const updateFieldMutate = vi.fn();
const updateViewMutate = vi.fn();

let tableDataMock = {
  data: {
    model: { id: 't1', base_id: 'b1' },
    columns: [
      { id: 'c1', column_name: 'start_date', title: 'Start', uidt: 'date', meta: {} },
    ],
    records: [
      { id: 1, data: { start_date: '2026-02-10', title: 'Row 1' } },
    ],
    views: [{ id: 'v1', meta: { date_field_id: 'c1' } }],
  },
};

vi.mock('../../../../hooks/useApi', () => ({
  useTable: () => ({
    data: tableDataMock,
    isLoading: false,
    error: null,
    refetch,
  }),
  useAddRow: () => ({ mutateAsync: addRowMutate }),
  useInsertRowData: () => ({ mutateAsync: vi.fn() }),
  useDeleteRecord: () => ({ mutateAsync: deleteRecordMutate }),
  useUpdateField: () => ({ mutateAsync: updateFieldMutate }),
  useUpdateView: () => ({ mutateAsync: updateViewMutate }),
}));

vi.mock('../../../../components/shared/table/tableUtils', () => ({
  parseApiColumnMeta: () => ({}),
}));

vi.mock('../../../../utils/fieldType', () => ({
  normalizeFieldType: (t: string) => t,
}));

describe('useCalendarData', () => {
  beforeEach(() => {
    refetch.mockReset();
    addRowMutate.mockReset();
    deleteRecordMutate.mockReset();
    updateFieldMutate.mockReset();
    updateViewMutate.mockReset();
    tableDataMock = {
      data: {
        model: { id: 't1', base_id: 'b1' },
        columns: [
          { id: 'c1', column_name: 'start_date', title: 'Start', uidt: 'date', meta: {} },
        ],
        records: [
          { id: 1, data: { start_date: '2026-02-10', title: 'Row 1' } },
        ],
        views: [{ id: 'v1', meta: { date_field_id: 'c1' } }],
      },
    };
  });

  it('builds events and date fields', () => {
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.dateFields.length).toBe(1);
    expect(result.current.events.length).toBe(1);
    expect(result.current.dateField?.id).toBe('c1');
  });

  it('builds events when date value is a Date instance', () => {
    tableDataMock = {
      data: {
        model: { id: 't1', base_id: 'b1' },
        columns: [
          { id: 'c1', column_name: 'start_date', title: 'Start', uidt: 'date', meta: {} },
        ],
        records: [
          { id: 2, data: { start_date: new Date('2026-02-11T00:00:00Z'), title: 'Row 2' } },
        ],
        views: [{ id: 'v1', meta: { date_field_id: 'c1' } }],
      },
    };
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.events.length).toBe(1);
    expect(result.current.events[0]?.date).toBe('2026-02-11');
  });

  it('builds events when date value is a number timestamp', () => {
    const timestamp = new Date('2026-02-12T00:00:00Z').getTime();
    tableDataMock = {
      data: {
        model: { id: 't1', base_id: 'b1' },
        columns: [
          { id: 'c1', column_name: 'start_date', title: 'Start', uidt: 'date', meta: {} },
        ],
        records: [
          { id: 3, data: { start_date: timestamp, title: 'Row 3' } },
        ],
        views: [{ id: 'v1', meta: { date_field_id: 'c1' } }],
      },
    };
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.events.length).toBe(1);
    expect(result.current.events[0]?.date).toBe('2026-02-12');
  });

  it('updateEvent calls updateField for each update', async () => {
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    await act(async () => {
      await result.current.updateEvent('1', { start_date: '2026-02-11' });
    });
    expect(updateFieldMutate).toHaveBeenCalled();
  });

  it('createEvent uses addRow and returns id', async () => {
    addRowMutate.mockResolvedValue({ id: 123 });
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    const id = await result.current.createEvent({});
    expect(id).toBe('123');
  });

  it('deleteEvent calls deleteRecord', async () => {
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    await act(async () => {
      await result.current.deleteEvent('5');
    });
    expect(deleteRecordMutate).toHaveBeenCalledWith({ model_id: 't1', row_id: 5 });
  });

  it('changeDateField updates view and refetches', async () => {
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    await act(async () => {
      await result.current.changeDateField('c1');
    });
    expect(updateViewMutate).toHaveBeenCalled();
    expect(refetch).toHaveBeenCalled();
  });

  it('updateViewConfig throws if view missing', async () => {
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'missing' }));
    await expect(result.current.updateViewConfig('missing', {})).rejects.toThrow('View not found');
  });
});
