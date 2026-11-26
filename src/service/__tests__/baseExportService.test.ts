import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const m = vi.hoisted(() => ({
  exportBase: vi.fn(),
  getExportJob: vi.fn(),
  downloadExportJob: vi.fn(),
  getDeps: vi.fn(),
  importBase: vi.fn(),
  getImportJob: vi.fn(),
  downloadLog: vi.fn(),
}));
vi.mock('../clientService', () => ({
  exportBaseService: m.exportBase,
  getExportJobService: m.getExportJob,
  downloadExportJobService: m.downloadExportJob,
  getExportDependenciesService: m.getDeps,
  importBaseService: m.importBase,
  getImportJobService: m.getImportJob,
  downloadImportLogService: m.downloadLog,
}));

import { downloadExportJob, downloadImportLog, exportBaseAsSbase, getExportDependencies, importBaseFromSbase } from '../baseExportService';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const fileResult = (type = 'application/zip') => ({ kind: 'file', blob: new Blob(['x'], { type }), contentType: type });
/** An error as the SDK makes it: the message and the code of the server */
const apiError = (message: string, extra: Record<string, unknown> = {}) => Object.assign(new Error(message), { code: 'ERR_1', ...extra });

/** Records the names a saved file is given, without navigating */
const recordDownloads = () => {
  const names: string[] = [];
  const create = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    const el = create(tag);
    if (tag === 'a') Object.defineProperty(el, 'download', { set: (v: string) => names.push(v), get: () => names[names.length - 1] });
    return el;
  }) as typeof document.createElement);
  return names;
};

beforeEach(() => {
  Object.values(m).forEach((fn) => fn.mockReset());
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('exportBaseAsSbase', () => {
  it('passes the options to the SDK and saves a direct file under the base title', async () => {
    m.exportBase.mockResolvedValue(fileResult());
    const names = recordDownloads();
    const progress = vi.fn();
    const filters = { t1: [{ column: 'f1', operator: 'is equal', value: 'Paid' }] };
    await exportBaseAsSbase('b1', { includeData: false, format: 'csv', delimiter: 'tab', tables: ['t1'], filters, title: 'Sales CRM' }, progress);
    expect(m.exportBase).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({ includeData: false, format: 'csv', delimiter: 'tab', tables: ['t1'], filters }),
      undefined,
    );
    expect(names).toEqual(['Sales_CRM.csv.zip']);
    expect(progress).toHaveBeenCalledWith(100);
  });

  it('does not send the title to the server', async () => {
    m.exportBase.mockResolvedValue(fileResult());
    await exportBaseAsSbase('b1', { title: 'T' });
    expect(m.exportBase.mock.calls[0][1]).not.toHaveProperty('title');
  });

  it('an xlsx export is a plain .xlsx, or a .xlsx.zip when the file is a zip', async () => {
    const names = recordDownloads();
    m.exportBase.mockResolvedValueOnce(fileResult(XLSX));
    await exportBaseAsSbase('b1', { format: 'xlsx', title: 'Sales CRM' });
    m.exportBase.mockResolvedValueOnce(fileResult());
    await exportBaseAsSbase('b1', { format: 'xlsx', title: 'Sales CRM' });
    expect(names).toEqual(['Sales_CRM.xlsx', 'Sales_CRM.xlsx.zip']);
  });

  it('a background job is returned at once, and no request is made to follow it', async () => {
    m.exportBase.mockResolvedValue({ kind: 'job', job: { id: 'j1', status: 'queued', progress: 0 } });
    const started = await exportBaseAsSbase('b1', { format: 'csv', title: 'Sales CRM' });
    expect(started).toEqual({
      kind: 'job',
      job: { id: 'j1', status: 'queued', progress: 0 },
      fallbackFileName: 'Sales_CRM.csv.zip',
    });
    // the Jobs panel follows it: nothing asks for the job here, and nothing downloads
    expect(m.getExportJob).not.toHaveBeenCalled();
    expect(m.downloadExportJob).not.toHaveBeenCalled();
  });

  it('the fallback name of a job is a .xlsx.zip when files are included, and a .xlsx when they are not', async () => {
    m.exportBase.mockResolvedValue({ kind: 'job', job: { id: 'j1', status: 'queued', progress: 0 } });
    expect(await exportBaseAsSbase('b1', { format: 'xlsx', includeAttachments: false, title: 'S' })).toMatchObject({ fallbackFileName: 'S.xlsx' });
    expect(await exportBaseAsSbase('b1', { format: 'xlsx', title: 'S' })).toMatchObject({ fallbackFileName: 'S.xlsx.zip' });
  });

  it('shows what is wrong with a filter the server refused', async () => {
    m.exportBase.mockRejectedValue(apiError('the export filters are not valid', { data: ['"abc" is not a number'] }));
    await expect(exportBaseAsSbase('b1', { filters: { t1: [{ column: 'f1', operator: 'is equal', value: 'abc' }] } })).rejects.toThrow(
      'the export filters are not valid: "abc" is not a number',
    );
  });

  it('uses a plain message when the failure has no message of the server', async () => {
    m.exportBase.mockRejectedValue(new Error('Request failed with status code 500'));
    await expect(exportBaseAsSbase('b1')).rejects.toThrow('Export failed');
  });

  it('fails as an AbortError when it was cancelled', async () => {
    const controller = new AbortController();
    m.exportBase.mockImplementation(async () => {
      controller.abort();
      throw Object.assign(new Error('canceled'), { code: 'ERR_CANCELED' });
    });
    await expect(exportBaseAsSbase('b1', undefined, undefined, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('getExportDependencies', () => {
  it('returns the tables with their fields and the dependencies', async () => {
    m.getDeps.mockResolvedValue({ data: { tables: [{ id: 't1', title: 'A', fields: [{ id: 'f1', title: 'Name', uidt: 'text' }] }] } });
    const res = await getExportDependencies('b1');
    expect(m.getDeps).toHaveBeenCalledWith('b1', undefined);
    expect(res.tables[0].fields?.[0].title).toBe('Name');
    expect(res.dependencies).toEqual([]);
  });

  it('says so when the tables cannot be loaded', async () => {
    m.getDeps.mockRejectedValue(new Error('Request failed with status code 500'));
    await expect(getExportDependencies('b1')).rejects.toThrow('Could not load the tables');
    m.getDeps.mockRejectedValue(apiError('no access'));
    await expect(getExportDependencies('b1')).rejects.toThrow('no access');
  });
});

describe('importBaseFromSbase', () => {
  it('passes the file, the options and the signal to the SDK and returns the finished job', async () => {
    m.importBase.mockResolvedValue({ data: { id: 'j1', status: 'completed', progress: 100 } });
    const file = new File(['x'], 'a.csv.zip');
    const controller = new AbortController();
    const job = await importBaseFromSbase('ws1', file, { format: 'csv', includeAutomations: true }, undefined, controller.signal);
    expect(m.importBase).toHaveBeenCalledWith('ws1', file, { format: 'csv', includeAutomations: true }, controller.signal);
    expect(job.status).toBe('completed');
  });

  it('sends several csv files as they are', async () => {
    m.importBase.mockResolvedValue({ data: { id: 'j1', status: 'completed', progress: 100 } });
    const files = [new File(['a'], 'a.csv'), new File(['b'], 'b.csv')];
    await importBaseFromSbase('ws1', files, { format: 'csv' });
    expect(m.importBase.mock.calls[0][1]).toBe(files);
  });

  it('follows the job until it is finished, reporting the progress', async () => {
    vi.useFakeTimers();
    m.importBase.mockResolvedValue({ data: { id: 'j1', status: 'queued', progress: 0 } });
    m.getImportJob
      .mockResolvedValueOnce({ data: { id: 'j1', status: 'running', progress: 40 } })
      .mockResolvedValueOnce({ data: { id: 'j1', status: 'failed', progress: 40, error: 'bad row' } });
    const progress = vi.fn();
    const run = importBaseFromSbase('ws1', new File(['x'], 'a.zip'), { format: 'csv' }, progress);
    await vi.advanceTimersByTimeAsync(1500);
    await vi.advanceTimersByTimeAsync(1500);
    const job = await run;
    vi.useRealTimers();
    expect(job).toMatchObject({ status: 'failed', error: 'bad row' });
    expect(progress.mock.calls.map((c) => c[0])).toEqual([0, 40, 40]);
  });

  it('tells which job was started, before it is followed', async () => {
    m.importBase.mockResolvedValue({ data: { id: 'j1', status: 'completed', progress: 100 } });
    const started = vi.fn();
    await importBaseFromSbase('ws1', new File(['x'], 'a.zip'), {}, undefined, undefined, started);
    expect(started).toHaveBeenCalledWith({ id: 'j1', status: 'completed', progress: 100 });
  });

  it('stops asking for the job once it is cancelled, with no more requests', async () => {
    vi.useFakeTimers();
    m.importBase.mockResolvedValue({ data: { id: 'j1', status: 'running', progress: 10 } });
    m.getImportJob.mockResolvedValue({ data: { id: 'j1', status: 'running', progress: 20 } });
    const controller = new AbortController();
    const run = importBaseFromSbase('ws1', new File(['x'], 'a.zip'), {}, undefined, controller.signal, () => controller.abort());
    const assertion = expect(run).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    vi.useRealTimers();
    expect(m.getImportJob).not.toHaveBeenCalled();
  });

  it('an import refused at once carries the list of what is wrong', async () => {
    m.importBase.mockRejectedValue(apiError('the base file is not valid', { data: ['table A has no fields'] }));
    await expect(importBaseFromSbase('ws1', new File(['x'], 'a.zip'), {})).rejects.toMatchObject({
      message: 'the base file is not valid',
      problems: ['table A has no fields'],
    });
  });

  it('takes the list from the details when there is no data', async () => {
    m.importBase.mockRejectedValue(apiError('invalid', { details: ['p1'] }));
    await expect(importBaseFromSbase('ws1', new File(['x'], 'a.zip'), {})).rejects.toMatchObject({ problems: ['p1'] });
  });

  it('a failure with no message of the server says "Import failed"', async () => {
    m.importBase.mockRejectedValue(new Error('Network Error'));
    await expect(importBaseFromSbase('ws1', new File(['x'], 'a.zip'), {})).rejects.toMatchObject({ message: 'Import failed' });
  });

  it('stops following a job that was cancelled', async () => {
    vi.useFakeTimers();
    m.importBase.mockResolvedValue({ data: { id: 'j1', status: 'queued', progress: 0 } });
    const controller = new AbortController();
    const run = importBaseFromSbase('ws1', new File(['x'], 'a.zip'), {}, undefined, controller.signal);
    const assertion = expect(run).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await vi.advanceTimersByTimeAsync(1500);
    await assertion;
    vi.useRealTimers();
  });
});

describe('downloadImportLog', () => {
  it('saves the log text under the name the server gives, or a default name', async () => {
    const names = recordDownloads();
    m.downloadLog.mockResolvedValueOnce({ text: 'Import Issues Report', fileName: 'Sales_import_error_rows_report.txt' });
    await downloadImportLog('j1');
    m.downloadLog.mockResolvedValueOnce({ text: 'x' });
    await downloadImportLog('j1');
    expect(m.downloadLog).toHaveBeenCalledWith('j1');
    expect(names).toEqual(['Sales_import_error_rows_report.txt', 'import_error_rows_report.txt']);
  });

  it('says so when the log is not there', async () => {
    m.downloadLog.mockRejectedValue(apiError('job not found'));
    await expect(downloadImportLog('j1')).rejects.toThrow('job not found');
    m.downloadLog.mockRejectedValue(new Error('Request failed with status code 404'));
    await expect(downloadImportLog('j1')).rejects.toThrow('The error log could not be downloaded');
  });
});

describe('downloadExportJob', () => {
  it('saves the file of the job under the given name, or export.zip', async () => {
    const names = recordDownloads();
    m.downloadExportJob.mockResolvedValue({ blob: new Blob(['x']), contentType: 'application/zip' });
    await downloadExportJob('j1', 'Base.sbase.zip');
    await downloadExportJob('j1');
    expect(names).toEqual(['Base.sbase.zip', 'export.zip']);
  });

  it('says so when the file cannot be downloaded', async () => {
    m.downloadExportJob.mockRejectedValue(apiError('the export has expired'));
    await expect(downloadExportJob('j1')).rejects.toThrow('the export has expired');
    m.downloadExportJob.mockRejectedValue(new Error('Network Error'));
    await expect(downloadExportJob('j1')).rejects.toThrow('Could not download the export');
  });
});
