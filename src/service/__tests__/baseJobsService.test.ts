import { describe, it, expect, vi, beforeEach } from 'vitest';

const { list, remove } = vi.hoisted(() => ({ list: vi.fn(), remove: vi.fn() }));
vi.mock('../clientService', () => ({ listTransferJobsService: list, deleteTransferJobService: remove }));

import { isActiveJob, listWorkspaceJobs, deleteJob } from '../baseJobsService';
import { JOBS_REFRESH_EVENT, requestJobsRefresh } from '../jobsEvents';

describe('listWorkspaceJobs', () => {
  beforeEach(() => {
    list.mockReset();
  });

  it('asks the SDK for the jobs of the workspace and returns the list', async () => {
    list.mockResolvedValue([{ id: 'j1', type: 'export', status: 'running', progress: 5, created_at: 'x' }]);
    const controller = new AbortController();
    const jobs = await listWorkspaceJobs('ws1', controller.signal);
    expect(list).toHaveBeenCalledWith('ws1', controller.signal);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('j1');
  });

  it('turns an error into a message: the one of the server, or a plain one', async () => {
    list.mockRejectedValue(Object.assign(new Error('no access'), { code: 'ERR_1' }));
    await expect(listWorkspaceJobs('ws1')).rejects.toThrow('no access');
    list.mockRejectedValue(new Error('Request failed with status code 500'));
    await expect(listWorkspaceJobs('ws1')).rejects.toThrow('The jobs could not be loaded');
  });

  it('fails as an AbortError when it was cancelled', async () => {
    list.mockRejectedValue(Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' }));
    await expect(listWorkspaceJobs('ws1')).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('queued and running jobs are active', () => {
    expect(isActiveJob({ status: 'queued' })).toBe(true);
    expect(isActiveJob({ status: 'running' })).toBe(true);
    expect(isActiveJob({ status: 'completed' })).toBe(false);
    expect(isActiveJob({ status: 'failed' })).toBe(false);
  });
});

describe('requestJobsRefresh', () => {
  it('tells the listeners', () => {
    const listener = vi.fn();
    window.addEventListener(JOBS_REFRESH_EVENT, listener);
    requestJobsRefresh();
    window.removeEventListener(JOBS_REFRESH_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('deleteJob', () => {
  beforeEach(() => {
    remove.mockReset();
  });

  it('asks the SDK to remove the export or import job', async () => {
    remove.mockResolvedValue({});
    await deleteJob({ id: 'j1', type: 'export' });
    await deleteJob({ id: 'j2', type: 'import' });
    expect(remove).toHaveBeenNthCalledWith(1, { id: 'j1', type: 'export' }, undefined);
    expect(remove).toHaveBeenNthCalledWith(2, { id: 'j2', type: 'import' }, undefined);
  });

  it('turns an error into a message', async () => {
    remove.mockRejectedValue(Object.assign(new Error('Export is not ready'), { code: 'ERR_9' }));
    await expect(deleteJob({ id: 'j1', type: 'export' })).rejects.toThrow('Export is not ready');
    remove.mockRejectedValue(new Error('Network Error'));
    await expect(deleteJob({ id: 'j1', type: 'export' })).rejects.toThrow('The job could not be removed');
  });
});
