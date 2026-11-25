import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../clientService', () => ({ getStoredToken: vi.fn(async () => 'token') }));

import { downloadImportLog, exportBaseAsSbase, getExportDependencies, importBaseFromSbase } from '../baseExportService';

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

  it('a csv GET sends the format and the delimiter, and the file is a .csv.zip', async () => {
    fetchMock.mockResolvedValue(fileResponse());
    const names: string[] = [];
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
      if (tag === 'a') Object.defineProperty(el, 'download', { set: (v: string) => names.push(v), get: () => '' });
      return el;
    }) as typeof document.createElement);
    await exportBaseAsSbase('b1', { includeData: false, format: 'csv', delimiter: 'tab', title: 'Sales CRM' });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('format=csv');
    expect(String(url)).toContain('delimiter=tab');
    expect(names).toEqual(['Sales_CRM.csv.zip']);
    vi.restoreAllMocks();
  });

  it('an xlsx export is a plain .xlsx, or a .xlsx.zip when the file is a zip', async () => {
    const names: string[] = [];
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLElement;
      if (tag === 'a') Object.defineProperty(el, 'download', { set: (v: string) => names.push(v), get: () => '' });
      return el;
    }) as typeof document.createElement);
    const xlsxType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    fetchMock.mockResolvedValueOnce(new Response(new Blob(['x'], { type: xlsxType }), { status: 200, headers: { 'Content-Type': xlsxType } }));
    await exportBaseAsSbase('b1', { includeData: false, format: 'xlsx', title: 'Sales CRM' });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('format=xlsx');
    expect(String(url)).not.toContain('delimiter');

    fetchMock.mockResolvedValueOnce(fileResponse());
    await exportBaseAsSbase('b1', { includeData: false, format: 'xlsx', includeAttachments: true, title: 'Sales CRM' });
    expect(names).toEqual(['Sales_CRM.xlsx', 'Sales_CRM.xlsx.zip']);
    vi.restoreAllMocks();
  });

  it('a csv POST sends the format and the delimiter with the filters; sbase sends neither', async () => {
    fetchMock.mockImplementation(async () => fileResponse());
    const filters = { t1: [{ column: 'f1', operator: 'is equal', value: 'Paid' }] };
    await exportBaseAsSbase('b1', { includeData: true, format: 'csv', delimiter: 'pipe', filters });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ format: 'csv', delimiter: 'pipe' });

    fetchMock.mockClear();
    await exportBaseAsSbase('b1', { includeData: true, format: 'sbase', delimiter: 'pipe', filters });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.format).toBeUndefined();
    expect(body.delimiter).toBeUndefined();
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

describe('importBaseFromSbase', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () =>
      new Response(JSON.stringify({ data: { id: 'j1', status: 'completed', progress: 100 } }), { status: 202 }));
  });
  afterEach(() => vi.unstubAllGlobals());

  const sent = () => {
    const [url, init] = fetchMock.mock.calls[0];
    return { url: String(url), form: init.body as FormData };
  };

  it('a csv import sends the format and no triggers or system columns', async () => {
    await importBaseFromSbase('ws1', new File(['x'], 'a.csv.zip'), { format: 'csv', includeAutomations: true, includeSystemColumns: true });
    const { url, form } = sent();
    expect(url).toContain('/workspace/ws1/import-base');
    expect(form.get('format')).toBe('csv');
    expect(form.get('include_automations')).toBeNull();
    expect(form.get('include_system_columns')).toBeNull();
    expect(form.get('include_data')).toBe('true');
  });

  it('an xlsx import sends the format and no triggers or system columns', async () => {
    await importBaseFromSbase('ws1', new File(['x'], 'a.xlsx'), { format: 'xlsx', includeAutomations: true, includeSystemColumns: true });
    const { form } = sent();
    expect(form.get('format')).toBe('xlsx');
    expect(form.get('include_automations')).toBeNull();
    expect(form.get('include_system_columns')).toBeNull();
    expect(form.get('include_data')).toBe('true');
  });

  it('an sbase import is as before: no format, with automations and system columns', async () => {
    await importBaseFromSbase('ws1', new File(['x'], 'a.sbase.zip'), { includeAutomations: true, includeSystemColumns: true });
    const { form } = sent();
    expect(form.get('format')).toBeNull();
    expect(form.get('include_automations')).toBe('true');
    expect(form.get('include_system_columns')).toBe('true');
  });
});

describe('downloadImportLog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it('fetches the log of the job as text and saves it under the name the server gives', async () => {
    fetchMock.mockResolvedValue(new Response('Import Issues Report', {
      status: 200,
      headers: { 'Content-Type': 'text/plain', 'Content-Disposition': 'attachment; filename="Sales_import_error_rows_report.txt"' },
    }));
    const saved: string[] = [];
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = create(tag);
      if (tag === 'a') Object.defineProperty(el, 'download', { set: (v: string) => saved.push(v), get: () => saved[saved.length - 1] });
      return el;
    });
    await downloadImportLog('j1');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/import-job/j1/log');
    expect(saved).toEqual(['Sales_import_error_rows_report.txt']);
  });

  it('says so when the log is not there', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: 'job not found' } }), { status: 404 }));
    await expect(downloadImportLog('j1')).rejects.toThrow('job not found');
  });
});
