import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildBaseApiLogQuery,
  client,
  countBaseApiLogsService,
  getBaseApiLogsService,
} from '../clientService';

describe('buildBaseApiLogQuery', () => {
  it('is empty without filters', () => {
    expect(buildBaseApiLogQuery({})).toBe('');
  });

  it('leaves out empty filters and keeps the rest', () => {
    const query = buildBaseApiLogQuery({ level: 'error', status: 500, search: '  ', method: '', limit: 50, cursor: undefined });
    const params = new URLSearchParams(query.slice(1));
    expect(query.startsWith('?')).toBe(true);
    expect(Object.fromEntries(params)).toEqual({ level: 'error', status: '500', limit: '50' });
  });

  it('encodes values', () => {
    expect(buildBaseApiLogQuery({ search: 'a&b c' })).toBe('?search=a%26b+c');
  });
});

describe('base API log services', () => {
  const get = vi.fn();

  beforeEach(() => {
    get.mockReset().mockResolvedValue({ success: true, data: { count: 0, entries: [] } });
    (client.baseService as any).http = { get };
  });

  it('lists the logs of a base', async () => {
    await getBaseApiLogsService('base-1', { level: 'warn', limit: 20 });

    expect(get).toHaveBeenCalledWith('/base/base-1/api/logs?level=warn&limit=20');
  });

  it('counts without paging', async () => {
    await countBaseApiLogsService('base-1', { level: 'warn', limit: 20, direction: 'forward', cursor: 'abc' });

    expect(get).toHaveBeenCalledWith('/base/base-1/api/logs/count?level=warn');
  });
});
