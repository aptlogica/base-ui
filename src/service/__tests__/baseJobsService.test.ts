import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../clientService', () => ({ getStoredToken: vi.fn(async () => 'token') }));

import { isActiveJob, listWorkspaceJobs } from '../baseJobsService';
import { JOBS_REFRESH_EVENT, requestJobsRefresh } from '../jobsEvents';

const fetchMock = vi.fn();

describe('listWorkspaceJobs', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('asks for the jobs of the workspace with the login token and returns the list', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 'j1', type: 'export', status: 'running', progress: 5, created_at: 'x' }] }), { status: 200 }));
    const jobs = await listWorkspaceJobs('ws1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/workspace/ws1/transfer-jobs');
    expect(init.headers.Authorization).toBe('Bearer token');
    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe('j1');
  });

  it('a body that is not a list gives an empty list', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: null }), { status: 200 }));
    expect(await listWorkspaceJobs('ws1')).toEqual([]);
  });

  it('turns an error answer into a message', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: 'no access' } }), { status: 403 }));
    await expect(listWorkspaceJobs('ws1')).rejects.toThrow('no access');
    fetchMock.mockResolvedValue(new Response('not json', { status: 500 }));
    await expect(listWorkspaceJobs('ws1')).rejects.toThrow('The jobs could not be loaded');
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
