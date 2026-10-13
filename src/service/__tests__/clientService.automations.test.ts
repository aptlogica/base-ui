import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  client,
  getAutomationsService,
  createAutomationService,
  updateAutomationService,
  runAutomationService,
  deleteAutomationService,
} from '../clientService';

// The SDK has no automation resource, so the services call its HTTP client directly
const http = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

describe('automation services', () => {
  let originalHttp: unknown;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    originalHttp = (client as any).http;
    (client as any).http = http;
    Object.values(http).forEach(fn => fn.mockResolvedValue({ data: 'ok' }));
  });

  afterEach(() => {
    (client as any).http = originalHttp;
  });

  it('lists the automations of a table', async () => {
    await expect(getAutomationsService('t1')).resolves.toEqual({ data: 'ok' });
    expect(http.get).toHaveBeenCalledWith('/automation', { params: { model_id: 't1' } });
  });

  it('creates an automation', async () => {
    const params = { model_id: 't1', title: 'Log', type: 'trigger' as const, context: 'CREATE TRIGGER x', event: 'AFTER INSERT' };
    await createAutomationService(params);
    expect(http.post).toHaveBeenCalledWith('/automation/create', params);
  });

  it('updates an automation without sending its id in the body', async () => {
    await updateAutomationService({ id: 'a1', title: 'Log', context: 'q', event: 'AFTER INSERT' });
    expect(http.put).toHaveBeenCalledWith('/automation/a1', { title: 'Log', context: 'q', event: 'AFTER INSERT' });
  });

  it('runs an automation', async () => {
    await runAutomationService('a1');
    expect(http.post).toHaveBeenCalledWith('/automation/a1/run');
  });

  it('deletes an automation', async () => {
    await deleteAutomationService('a1');
    expect(http.delete).toHaveBeenCalledWith('/automation/a1');
  });

  it('passes server errors to the caller', async () => {
    const error = Object.assign(new Error('syntax error'), { status: 400 });
    http.post.mockRejectedValue(error);
    await expect(runAutomationService('a1')).rejects.toBe(error);
  });
});
