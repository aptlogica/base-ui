import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));
vi.mock('../../service/baseJobsService', async (orig) => ({ ...(await orig<typeof import('../../service/baseJobsService')>()), listWorkspaceJobs: listMock }));

import { useTransferJobs, POLL_CLOSED_MS, POLL_OPEN_MS } from '../useTransferJobs';
import { requestJobsRefresh } from '../../service/jobsEvents';

const job = (o: object = {}) => ({ id: 'j1', type: 'export', status: 'running', progress: 10, created_at: 'x', ...o });

describe('useTransferJobs', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    listMock.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('loads the jobs of the workspace and counts the running ones', async () => {
    listMock.mockResolvedValue([job(), job({ id: 'j2', status: 'queued' }), job({ id: 'j3', status: 'completed' })]);
    const { result } = renderHook(() => useTransferJobs('ws1', false));
    await waitFor(() => expect(result.current.jobs).toHaveLength(3));
    expect(listMock).toHaveBeenCalledWith('ws1');
    expect(result.current.runningCount).toBe(2);
    expect(result.current.loading).toBe(false);
  });

  it('asks again while a job runs: every 5 s with the panel closed, every 2 s with it open', async () => {
    listMock.mockResolvedValue([job()]);
    const { result, rerender } = renderHook(({ open }) => useTransferJobs('ws1', open), { initialProps: { open: false } });
    await waitFor(() => expect(result.current.jobs).toHaveLength(1));
    listMock.mockClear();

    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_CLOSED_MS - 100); });
    expect(listMock).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    expect(listMock).toHaveBeenCalledTimes(1);

    rerender({ open: true });
    listMock.mockClear();
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_OPEN_MS + 50); });
    expect(listMock).toHaveBeenCalledTimes(1);
  });

  it('stops asking when nothing is running', async () => {
    listMock.mockResolvedValue([job({ status: 'completed' })]);
    const { result } = renderHook(() => useTransferJobs('ws1', true));
    await waitFor(() => expect(result.current.jobs).toHaveLength(1));
    listMock.mockClear();
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_CLOSED_MS * 3); });
    expect(listMock).not.toHaveBeenCalled();
    expect(result.current.runningCount).toBe(0);
  });

  it('stops after the last running job finishes', async () => {
    listMock.mockResolvedValueOnce([job()]).mockResolvedValue([job({ status: 'completed', progress: 100 })]);
    const { result } = renderHook(() => useTransferJobs('ws1', false));
    await waitFor(() => expect(result.current.runningCount).toBe(1));
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_CLOSED_MS + 50); });
    await waitFor(() => expect(result.current.runningCount).toBe(0));
    listMock.mockClear();
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_CLOSED_MS * 3); });
    expect(listMock).not.toHaveBeenCalled();
  });

  it('does not ask while the tab is hidden', async () => {
    listMock.mockResolvedValue([job()]);
    const { result } = renderHook(() => useTransferJobs('ws1', false));
    await waitFor(() => expect(result.current.jobs).toHaveLength(1));
    listMock.mockClear();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    await act(async () => { await vi.advanceTimersByTimeAsync(POLL_CLOSED_MS * 2); });
    expect(listMock).not.toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(listMock).toHaveBeenCalled();
  });

  it('a new workspace clears the list and loads the new one; an old answer is dropped', async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    listMock.mockImplementationOnce(() => new Promise((r) => { resolveFirst = r; }));
    const { result, rerender } = renderHook(({ ws }) => useTransferJobs(ws, false), { initialProps: { ws: 'ws1' } });
    listMock.mockResolvedValue([job({ id: 'b1', status: 'completed' })]);
    rerender({ ws: 'ws2' });
    await waitFor(() => expect(result.current.jobs.map((j) => j.id)).toEqual(['b1']));
    await act(async () => { resolveFirst([job({ id: 'a1' })]); });
    expect(result.current.jobs.map((j) => j.id)).toEqual(['b1']);
    expect(listMock).toHaveBeenLastCalledWith('ws2');
  });

  it('no workspace, no request', async () => {
    const { result } = renderHook(() => useTransferJobs(null, true));
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(listMock).not.toHaveBeenCalled();
    expect(result.current.jobs).toEqual([]);
  });

  it('an export or an import that starts asks for the list at once', async () => {
    listMock.mockResolvedValue([]);
    const { result } = renderHook(() => useTransferJobs('ws1', false));
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));
    listMock.mockResolvedValue([job()]);
    act(() => requestJobsRefresh());
    await waitFor(() => expect(result.current.jobs).toHaveLength(1));
    expect(listMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the list and says so when a request fails', async () => {
    listMock.mockResolvedValueOnce([job({ status: 'completed' })]).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useTransferJobs('ws1', false));
    await waitFor(() => expect(result.current.jobs).toHaveLength(1));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.error).toBe('offline');
    expect(result.current.jobs).toHaveLength(1);
  });
});
