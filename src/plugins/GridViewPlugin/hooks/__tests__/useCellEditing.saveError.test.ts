import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCellEditing } from '../useCellEditing';

// A cell value rejected by the server (e.g. it breaks a unique key) is reported, not swallowed
describe('useCellEditing: rejected saves', () => {
  const row = {
    id: '7',
    customer_id: 'abc-1',
    _meta: { id: '7', created_at: '2020-01-01', updated_at: '2020-01-01', deleted_at: null, position: 1 },
  };
  const columns = [{ id: 'col-customer', title: 'Customer Id', type: 'text' as any, key: 'customer_id' }];

  let mutateAsync: ReturnType<typeof vi.fn>;
  let onSaveError: ReturnType<typeof vi.fn<(failure: { rowId: string; columnKey: string; error: unknown }) => void>>;

  const setup = () =>
    renderHook(() =>
      useCellEditing({
        data: [row] as any,
        columns,
        tableId: 'tbl-1',
        insertRowDataMutation: { mutateAsync },
        onRecordsUpdate: vi.fn(),
        onSaveError,
      })
    );

  const typeAndWait = async (result: ReturnType<typeof setup>['result'], value: string) => {
    await act(async () => {
      await result.current.handleCellChange('7', 'customer_id', value);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mutateAsync = vi.fn();
    onSaveError = vi.fn<(failure: { rowId: string; columnKey: string; error: unknown }) => void>();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reports the cell and the server error when the save is rejected', async () => {
    const error = new Error('A record with Customer Id = abc already exists');
    mutateAsync.mockRejectedValue(error);
    const { result } = setup();

    await typeAndWait(result, 'abc');

    expect(mutateAsync).toHaveBeenCalledWith({ model_id: 'tbl-1', column_id: 'col-customer', row_id: 7, value: 'abc' });
    expect(onSaveError).toHaveBeenCalledWith({ rowId: '7', columnKey: 'customer_id', error });
  });

  it('does not report successful saves', async () => {
    mutateAsync.mockResolvedValue({});
    const { result } = setup();

    await typeAndWait(result, 'abc-2');

    expect(mutateAsync).toHaveBeenCalled();
    expect(onSaveError).not.toHaveBeenCalled();
  });

  it('keeps comparing with the saved value after a rejection, so typing it back sends nothing', async () => {
    mutateAsync.mockRejectedValue(new Error('duplicate'));
    const { result } = setup();

    await typeAndWait(result, 'abc');
    mutateAsync.mockClear();
    await typeAndWait(result, 'abc-1');

    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
