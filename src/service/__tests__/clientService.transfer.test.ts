import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  client,
  deleteTransferJobService,
  downloadExportJobService,
  downloadImportLogService,
  exportBaseService,
  getExportDependenciesService,
  getExportJobService,
  getImportJobService,
  importBaseService,
  listTransferJobsService,
} from '../clientService';

const ok = { success: true, data: 'ok' };
const signal = new AbortController().signal;

describe('transfer services (the SDK transferService)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    const t = client.transferService;
    vi.spyOn(t, 'getExportDependencies').mockResolvedValue(ok as any);
    vi.spyOn(t, 'exportBase').mockResolvedValue(ok as any);
    vi.spyOn(t, 'getExportJob').mockResolvedValue(ok as any);
    vi.spyOn(t, 'downloadExportJob').mockResolvedValue(ok as any);
    vi.spyOn(t, 'importBase').mockResolvedValue(ok as any);
    vi.spyOn(t, 'getImportJob').mockResolvedValue(ok as any);
    vi.spyOn(t, 'downloadImportLog').mockResolvedValue(ok as any);
    vi.spyOn(t, 'listJobs').mockResolvedValue(ok as any);
    vi.spyOn(t, 'deleteJob').mockResolvedValue(ok as any);
  });
  afterEach(() => vi.restoreAllMocks());

  it('is part of the client', () => {
    expect(client.transferService).toBeDefined();
  });

  it('reads the dependencies of a base', async () => {
    await getExportDependenciesService('b1', signal);
    expect(client.transferService.getExportDependencies).toHaveBeenCalledWith('b1', { signal });
  });

  it('starts an export with its options', async () => {
    await exportBaseService('b1', { includeData: false, format: 'csv' }, signal);
    expect(client.transferService.exportBase).toHaveBeenCalledWith('b1', { includeData: false, format: 'csv' }, { signal });
  });

  it('reads and downloads an export job', async () => {
    await getExportJobService('j1', signal);
    await downloadExportJobService('j1', signal);
    expect(client.transferService.getExportJob).toHaveBeenCalledWith('j1', { signal });
    expect(client.transferService.downloadExportJob).toHaveBeenCalledWith('j1', { signal });
  });

  it('imports one file or several, with the options', async () => {
    const files = [new File(['a'], 'a.csv'), new File(['b'], 'b.csv')];
    await importBaseService('ws1', files, { format: 'csv' }, signal);
    expect(client.transferService.importBase).toHaveBeenCalledWith('ws1', files, { format: 'csv' }, { signal });
  });

  it('reads an import job and its log', async () => {
    await getImportJobService('j1', signal);
    await downloadImportLogService('j1', signal);
    expect(client.transferService.getImportJob).toHaveBeenCalledWith('j1', { signal });
    expect(client.transferService.downloadImportLog).toHaveBeenCalledWith('j1', { signal });
  });

  it('lists and removes jobs', async () => {
    await listTransferJobsService('ws1', signal);
    await deleteTransferJobService({ id: 'j1', type: 'export' }, signal);
    expect(client.transferService.listJobs).toHaveBeenCalledWith('ws1', { signal });
    expect(client.transferService.deleteJob).toHaveBeenCalledWith({ id: 'j1', type: 'export' }, { signal });
  });
});
