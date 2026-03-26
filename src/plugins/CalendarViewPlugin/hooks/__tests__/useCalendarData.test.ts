import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarData } from '../useCalendarData';
import { utcISOToZoned } from '../../../../utils/dateUtils';

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

vi.mock('../../../../utils/dateUtils', () => ({
  utcISOToZoned: vi.fn(() => '2026-02-13 05:30'),
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

  it('builds events for datetime values with Z using timezone conversion', () => {
    tableDataMock = {
      data: {
        model: { id: 't1', base_id: 'b1' },
        columns: [
          { id: 'c1', column_name: 'start_date', title: 'Start', uidt: 'datetime', meta: { timeZone: 'UTC' } },
        ],
        records: [
          { id: 4, data: { start_date: '2026-02-13T00:00:00Z', title: 'Row 4' } },
        ],
        views: [{ id: 'v1', meta: { date_field_id: 'c1' } }],
      },
    };
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.events.length).toBe(1);
    expect(result.current.events[0]?.date).toBe('2026-02-13');
    expect(utcISOToZoned).toHaveBeenCalled();
  });

  it('builds events for datetime values without Z', () => {
    vi.mocked(utcISOToZoned).mockReturnValueOnce('2026-02-14 16:00');
    tableDataMock = {
      data: {
        model: { id: 't1', base_id: 'b1' },
        columns: [
          { id: 'c1', column_name: 'start_date', title: 'Start', uidt: 'datetime', meta: { timeZone: 'UTC' } },
        ],
        records: [
          { id: 5, data: { start_date: '2026-02-14T10:30:00', title: 'Row 5' } },
        ],
        views: [{ id: 'v1', meta: { date_field_id: 'c1' } }],
      },
    };
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.events[0]?.date).toBe('2026-02-14');
  });

  it('returns no events when no date fields are available', () => {
    tableDataMock = {
      data: {
        model: { id: 't1', base_id: 'b1' },
        columns: [
          { id: 'c1', column_name: 'title', title: 'Title', uidt: 'text', meta: {} },
        ],
        records: [
          { id: 6, data: { title: 'Row 6' } },
        ],
        views: [{ id: 'v1', meta: {} }],
      },
    };
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.dateFields.length).toBe(0);
    expect(result.current.events.length).toBe(0);
  });

  it('falls back to first matching date field when view meta is missing', () => {
    tableDataMock = {
      data: {
        model: { id: 't1', base_id: 'b1' },
        columns: [
          { id: 'c1', column_name: 'created_at', title: 'Created', uidt: 'createdtime', meta: {} },
          { id: 'c2', column_name: 'start_date', title: 'Start', uidt: 'date', meta: {} },
        ],
        records: [
          { id: 7, data: { created_at: '2026-02-20T00:00:00Z', title: 'Row 7' } },
        ],
        views: [{ id: 'v1', meta: {} }],
      },
    };

    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.dateField?.id).toBe('c1');
    expect(result.current.events.length).toBe(1);
  });

  it('skips records with empty date values', () => {
    tableDataMock = {
      data: {
        model: { id: 't1', base_id: 'b1' },
        columns: [
          { id: 'c1', column_name: 'start_date', title: 'Start', uidt: 'date', meta: {} },
        ],
        records: [
          { id: 8, data: { start_date: null, title: 'Row 8' } },
        ],
        views: [{ id: 'v1', meta: { date_field_id: 'c1' } }],
      },
    };

    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.events.length).toBe(0);
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

  it('changeDateField is a no-op when viewId is missing', async () => {
    const { result } = renderHook(() => useCalendarData({ tableId: 't1' }));
    await act(async () => {
      await result.current.changeDateField('c1');
    });
    expect(updateViewMutate).not.toHaveBeenCalled();
  });

  it('changeDateField rethrows when update fails', async () => {
    updateViewMutate.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    await expect(result.current.changeDateField('c1')).rejects.toThrow('fail');
  });

  it('updateViewConfig merges meta and calls updateView', async () => {
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    await act(async () => {
      await result.current.updateViewConfig('v1', { filters: ['x'] });
    });
    expect(updateViewMutate).toHaveBeenCalledWith({
      viewId: 'v1',
      view: { meta: { date_field_id: 'c1', filters: ['x'] } },
    });
  });

  it('unwraps table data when api response is not nested', () => {
    tableDataMock = {
      model: { id: 't1', base_id: 'b1' },
      columns: [
        { id: 'c1', column_name: 'start_date', title: 'Start', uidt: 'date', meta: {} },
      ],
      records: [
        { id: 9, data: { start_date: '2026-02-21', title: 'Row 9' } },
      ],
      views: [{ id: 'v1', meta: { date_field_id: 'c1' } }],
    } as any;

    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'v1' }));
    expect(result.current.uiTableId).toBe('t1');
    expect(result.current.events.length).toBe(1);
  });

  it('updateViewConfig throws if view missing', async () => {
    const { result } = renderHook(() => useCalendarData({ tableId: 't1', viewId: 'missing' }));
    await expect(result.current.updateViewConfig('missing', {})).rejects.toThrow('View not found');
  });
});
