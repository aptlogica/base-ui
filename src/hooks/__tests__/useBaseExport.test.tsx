import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const { exportMock, toast } = vi.hoisted(() => ({
  exportMock: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('../../service/baseExportService', () => ({ exportBaseAsSbase: exportMock }));
vi.mock('../../components/common/Toast', () => ({ useToast: () => toast }));
vi.mock('../../components/modals/ExportSbaseModal', () => ({
  ExportSbaseModal: ({ onExport, format }: { onExport: (o: object) => void; format?: string }) => (
    <button onClick={() => onExport({ includeData: true })}>{`start export ${format ?? ''}`.trim()}</button>
  ),
}));
import { useBaseExport } from '../useBaseExport';
import { JOBS_FLY_EVENT, claimFinishedJobs, clearTrackedJobs } from '../../service/jobsEvents';

const Host = () => {
  const { exportBase, exportProgressModal } = useBaseExport();
  return (
    <>
      <button onClick={() => exportBase({ id: 'b1', title: 'First' }, 'sbase')}>export first</button>
      <button onClick={() => exportBase({ id: 'b2', title: 'Second' }, 'sbase')}>export second</button>
      <button onClick={() => exportBase({ id: 'b3', title: 'Third' }, 'csv')}>export csv</button>
      <button onClick={() => exportBase({ id: 'b4', title: 'Fourth' }, 'excel')}>export excel</button>
      <button onClick={() => exportBase({ id: 'b5', title: 'Fifth' }, 'json')}>export json</button>
      {exportProgressModal}
    </>
  );
};

type Started = { kind: 'file' } | { kind: 'job'; job: { id: string; file_name?: string }; fallbackFileName: string };
type Done = { resolve: (started?: Started) => void; reject: (e: Error) => void };
const runs: Done[] = [];

describe('useBaseExport runs exports in the background', () => {
  beforeEach(() => {
    runs.length = 0;
    clearTrackedJobs();
    exportMock.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    exportMock.mockImplementation(() => new Promise<Started | undefined>((resolve, reject) => runs.push({ resolve, reject })));
  });

  const startExport = (label: string) => {
    fireEvent.click(screen.getByText(label));
    fireEvent.click(screen.getByText('start export sbase'));
  };

  it('starting an export shows no progress dialog: an icon flies to the Jobs button instead', () => {
    const flew = vi.fn();
    window.addEventListener(JOBS_FLY_EVENT, flew);
    try {
      render(<Host />);
      startExport('export first');
      expect(exportMock).toHaveBeenCalledTimes(1);
      expect(flew).toHaveBeenCalledTimes(1);
      expect((flew.mock.calls[0][0] as CustomEvent).detail.kind).toBe('export');
      expect(screen.queryByText(/progress/)).toBeNull();
    } finally {
      window.removeEventListener(JOBS_FLY_EVENT, flew);
    }
  });

  it('another export can be started while the first one runs', () => {
    render(<Host />);
    startExport('export first');
    startExport('export second');
    expect(exportMock).toHaveBeenCalledTimes(2);
  });

  it('an export that is a file at once reports with a message', async () => {
    render(<Host />);
    startExport('export first');
    await act(async () => runs[0].resolve({ kind: 'file' }));
    expect(toast.success).toHaveBeenCalledWith('Export of “First” is ready. The download has started.');
  });

  it('an export that is a background job is handed to the Jobs panel: no message yet, and the job is followed', async () => {
    render(<Host />);
    startExport('export first');
    await act(async () => runs[0].resolve({ kind: 'job', job: { id: 'job-1' }, fallbackFileName: 'First.sbase.zip' }));
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    // the Jobs panel finds it when the list says it is done
    const ended = claimFinishedJobs([{ id: 'job-1', status: 'completed' }]);
    expect(ended).toHaveLength(1);
    expect(ended[0].tracked).toMatchObject({ id: 'job-1', type: 'export', title: 'First', fileName: 'First.sbase.zip' });
  });

  it('keeps the file name the server gave for the job', async () => {
    render(<Host />);
    startExport('export first');
    await act(async () => runs[0].resolve({ kind: 'job', job: { id: 'job-2', file_name: 'Server.zip' }, fallbackFileName: 'First.sbase.zip' }));
    expect(claimFinishedJobs([{ id: 'job-2', status: 'completed' }])[0].tracked.fileName).toBe('Server.zip');
  });

  it('a failed export is reported as an error', async () => {
    render(<Host />);
    startExport('export first');
    await act(async () => runs[0].reject(new Error('boom')));
    expect(toast.error).toHaveBeenCalledWith('Export of “First” failed: boom');
  });

  it('CSV opens the same dialog in csv format, and the export runs with that format', () => {
    render(<Host />);
    fireEvent.click(screen.getByText('export csv'));
    fireEvent.click(screen.getByText('start export csv'));
    expect(exportMock).toHaveBeenCalledWith('b3', expect.objectContaining({ format: 'csv' }));
  });

  it('Excel opens the same dialog in xlsx format, and the export runs with that format', () => {
    render(<Host />);
    fireEvent.click(screen.getByText('export excel'));
    fireEvent.click(screen.getByText('start export xlsx'));
    expect(exportMock).toHaveBeenCalledWith('b4', expect.objectContaining({ format: 'xlsx' }));
  });

  it('JSON opens the same dialog in json format, and the export runs with that format', () => {
    render(<Host />);
    fireEvent.click(screen.getByText('export json'));
    expect(toast.info).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('start export json'));
    expect(exportMock).toHaveBeenCalledWith('b5', expect.objectContaining({ format: 'json' }));
  });
});
