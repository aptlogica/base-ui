import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../clientService', () => ({ getStoredToken: vi.fn(async () => 'token') }));

import { exportBaseAsSbase, getExportDependencies } from '../baseExportService';

const fetchMock = vi.fn();

const fileResponse = () =>
  new Response(new Blob(['zip']), { status: 200, headers: { 'Content-Type': 'application/zip' } });

describe('exportBaseAsSbase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    // saving the file clicks a link; jsdom cannot navigate
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it('without filters it is a GET with the options in the URL', async () => {
    fetchMock.mockResolvedValue(fileResponse());
    await exportBaseAsSbase('b1', { includeData: false, tables: ['t1', 't2'], title: 'My Base' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/base/b1/export?');
    expect(String(url)).toContain('include_data=false');
    expect(String(url)).toContain('tables=t1%2Ct2');
    expect(init.method).toBeUndefined();
  });

  it('with filters it is a POST with a JSON body', async () => {
    fetchMock.mockResolvedValue(fileResponse());
    await exportBaseAsSbase('b1', {
      includeData: true,
      includeAttachments: false,
      tables: ['t1'],
      filters: { t1: [{ column: 'f1', operator: 'is equal', value: 'Paid' }, { column: 'f2', operator: 'greater than', value: '5', logic: 'AND' }], t2: [] },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/base\/b1\/export$/);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.include_data).toBe(true);
    expect(body.include_attachments).toBe(false);
    expect(body.tables).toEqual(['t1']);
    // a table with no conditions is not sent
    expect(Object.keys(body.filters)).toEqual(['t1']);
    expect(body.filters.t1.conditions).toHaveLength(2);
  });

  it('shows what is wrong with a filter the server refused', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'the export filters are not valid' }, data: ['"abc" is not a number'] }), { status: 422 }),
    );
    await expect(
      exportBaseAsSbase('b1', { includeData: true, filters: { t1: [{ column: 'f1', operator: 'is equal', value: 'abc' }] } }),
    ).rejects.toThrow('the export filters are not valid: "abc" is not a number');
  });
});

describe('getExportDependencies', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns the tables with their fields and the dependencies', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { tables: [{ id: 't1', title: 'A', fields: [{ id: 'f1', title: 'Name', uidt: 'text' }] }], dependencies: [] } }), { status: 200 }),
    );
    const res = await getExportDependencies('b1');
    expect(res.tables[0].fields?.[0].title).toBe('Name');
    expect(res.dependencies).toEqual([]);
  });
});
