import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useCellEditing } from '../useCellEditing';

type HarnessProps = Parameters<typeof useCellEditing>[0] & {
  onReady: (handler: (rowId: string, columnKey: string, value: any) => void) => void;
};

const Harness: React.FC<HarnessProps> = ({ onReady, ...props }) => {
  const { handleCellChange } = useCellEditing(props);
  useEffect(() => {
    onReady(handleCellChange);
  }, [handleCellChange, onReady]);
  return null;
};

const createRow = (overrides: Record<string, any> = {}) => ({
  id: 1,
  _meta: { id: '1', created_at: '2024-01-01T00:00:00.000Z' },
  name: 'Old',
  data: {},
  ...overrides,
});

const createColumn = (overrides: Record<string, any> = {}) => ({
  id: 'col-1',
  key: 'name',
  uidt: 'text',
  type: 'text',
  ...overrides,
});

describe('useCellEditing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates attachment fields locally without API calls', () => {
    const onReady = vi.fn();
    const onRecordsUpdate = vi.fn();
    const mutateAsync = vi.fn();

    render(
      <Harness
        data={[createRow()]}
        columns={[createColumn({ key: 'files', type: 'attachment' })]}
        tableId="tbl-1"
        insertRowDataMutation={{ mutateAsync }}
        onRecordsUpdate={onRecordsUpdate}
        onReady={onReady}
      />
    );

    const handler = onReady.mock.calls[0][0];
    act(() => {
      handler('1', 'files', { id: 'file-1' });
    });

    expect(onRecordsUpdate).toHaveBeenCalledTimes(1);
    const updater = onRecordsUpdate.mock.calls[0][0];
    const updated = updater([createRow({ files: [] })]);
    expect(updated[0].files).toEqual([{ id: 'file-1' }]);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('updates links fields locally without API calls', () => {
    const onReady = vi.fn();
    const onRecordsUpdate = vi.fn();
    const mutateAsync = vi.fn();

    render(
      <Harness
        data={[createRow()]}
        columns={[createColumn({ key: 'links', uidt: 'links' })]}
        tableId="tbl-1"
        insertRowDataMutation={{ mutateAsync }}
        onRecordsUpdate={onRecordsUpdate}
        onReady={onReady}
      />
    );

    const handler = onReady.mock.calls[0][0];
    act(() => {
      handler('1', 'links', ['r2']);
    });

    expect(onRecordsUpdate).toHaveBeenCalledTimes(1);
    const updater = onRecordsUpdate.mock.calls[0][0];
    const updated = updater([createRow({ links: [] })]);
    expect(updated[0].links).toEqual(['r2']);
    expect(updated[0].data?.links).toEqual(['r2']);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('skips updates for system fields, missing rows, and invalid row ids', () => {
    const onReady = vi.fn();
    const onRecordsUpdate = vi.fn();
    const mutateAsync = vi.fn();

    render(
      <Harness
        data={[createRow()]}
        columns={[
          createColumn({ key: 'sys', id: 'col-sys', isSystem: true }),
          createColumn({ key: 'name' }),
        ]}
        tableId="tbl-1"
        insertRowDataMutation={{ mutateAsync }}
        onRecordsUpdate={onRecordsUpdate}
        onReady={onReady}
      />
    );

    const handler = onReady.mock.calls[0][0];
    act(() => {
      handler('1', 'sys', 'x');
      handler('missing', 'name', 'x');
      handler('bad', 'name', 'x');
    });

    expect(onRecordsUpdate).not.toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('debounces updates and persists changes to the backend', async () => {
    const onReady = vi.fn();
    const onRecordsUpdate = vi.fn();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);

    render(
      <Harness
        data={[createRow()]}
        columns={[createColumn({ key: 'name', id: 'col-name', type: 'text' })]}
        tableId="tbl-1"
        insertRowDataMutation={{ mutateAsync }}
        onRecordsUpdate={onRecordsUpdate}
        onReady={onReady}
      />
    );

    const handler = onReady.mock.calls[0][0];
    act(() => {
      handler('1', 'name', 'New');
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      model_id: 'tbl-1',
      column_id: 'col-name',
      row_id: 1,
      value: 'New',
    });
    expect(onRecordsUpdate).toHaveBeenCalled();
  });

  it('updates multi-select locally and uses longer debounce', async () => {
    const onReady = vi.fn();
    const onRecordsUpdate = vi.fn();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);

    render(
      <Harness
        data={[createRow()]}
        columns={[createColumn({ key: 'tags', uidt: 'multiSelect', id: 'col-tags' })]}
        tableId="tbl-1"
        insertRowDataMutation={{ mutateAsync }}
        onRecordsUpdate={onRecordsUpdate}
        onReady={onReady}
      />
    );

    const handler = onReady.mock.calls[0][0];
    act(() => {
      handler('1', 'tags', ['A', 'B']);
    });

    expect(onRecordsUpdate).toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    expect(mutateAsync).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(mutateAsync).toHaveBeenCalled();
  });

  it('serializes JSON values and user multi-selects before saving', async () => {
    const onReady = vi.fn();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);

    render(
      <Harness
        data={[createRow({ data: { config: {} } })]}
        columns={[
          createColumn({ key: 'config', id: 'col-json', type: 'json' }),
          createColumn({ key: 'assignees', id: 'col-user', type: 'user', meta: { allowMultiple: true } }),
        ]}
        tableId="tbl-1"
        insertRowDataMutation={{ mutateAsync }}
        onRecordsUpdate={vi.fn()}
        onReady={onReady}
      />
    );

    const handler = onReady.mock.calls[0][0];
    act(() => {
      handler('1', 'config', { a: 1 });
      handler('1', 'assignees', ['u1', 'u2', '']);
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      column_id: 'col-json',
      value: JSON.stringify({ a: 1 }),
    }));
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      column_id: 'col-user',
      value: 'u1,u2',
    }));
  });

  it('skips empty updates for newly created rows', async () => {
    const onReady = vi.fn();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const recent = new Date(Date.now() - 500).toISOString();

    render(
      <Harness
        data={[createRow({ _meta: { id: '1', created_at: recent }, qty: 5 })]}
        columns={[createColumn({ key: 'qty', id: 'col-qty', type: 'number', uidt: 'number' })]}
        tableId="tbl-1"
        insertRowDataMutation={{ mutateAsync }}
        onRecordsUpdate={vi.fn()}
        onReady={onReady}
      />
    );

    const handler = onReady.mock.calls[0][0];
    act(() => {
      handler('1', 'qty', '');
    });

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
