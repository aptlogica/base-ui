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
vi.mock('../../components/modals/ExportProgressModal', () => ({
  ExportProgressModal: ({ state, baseTitle, onClose }: { state: string; baseTitle: string; onClose: () => void }) => (
    <div>
      <span>{`progress ${baseTitle} ${state}`}</span>
      <button onClick={onClose}>close progress</button>
    </div>
  ),
}));

import { useBaseExport } from '../useBaseExport';

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

type Done = { resolve: () => void; reject: (e: Error) => void };
const runs: Done[] = [];

describe('useBaseExport runs exports in the background', () => {
  beforeEach(() => {
    runs.length = 0;
    exportMock.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    exportMock.mockImplementation(() => new Promise<void>((resolve, reject) => runs.push({ resolve, reject })));
  });

  const startExport = (label: string) => {
    fireEvent.click(screen.getByText(label));
    fireEvent.click(screen.getByText('start export sbase'));
  };

  it('closing a running export frees the way for another one', () => {
    render(<Host />);
    startExport('export first');
    expect(screen.getByText('progress First running')).toBeTruthy();

    fireEvent.click(screen.getByText('close progress'));
    expect(screen.queryByText('progress First running')).toBeNull();

    startExport('export second');
    expect(exportMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText('progress Second running')).toBeTruthy();
  });

  it('an export that was closed still downloads and reports with a message', async () => {
    render(<Host />);
    startExport('export first');
    fireEvent.click(screen.getByText('close progress'));
    await act(async () => runs[0].resolve());
    expect(toast.success).toHaveBeenCalledWith('Export of “First” is ready. The download has started.');
  });

  it('a closed export that fails is reported as an error', async () => {
    render(<Host />);
    startExport('export first');
    fireEvent.click(screen.getByText('close progress'));
    await act(async () => runs[0].reject(new Error('boom')));
    expect(toast.error).toHaveBeenCalledWith('Export of “First” failed: boom');
  });

  it('the end of a closed export does not change the dialog of the next one', async () => {
    render(<Host />);
    startExport('export first');
    fireEvent.click(screen.getByText('close progress'));
    startExport('export second');
    await act(async () => runs[0].resolve());
    expect(screen.getByText('progress Second running')).toBeTruthy();
    expect(screen.queryByText('progress First done')).toBeNull();
  });

  it('an export whose dialog stays open shows its own result', async () => {
    render(<Host />);
    startExport('export first');
    await act(async () => runs[0].resolve());
    expect(screen.getByText('progress First done')).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('CSV opens the same dialog in csv format, and the export runs with that format', () => {
    render(<Host />);
    fireEvent.click(screen.getByText('export csv'));
    fireEvent.click(screen.getByText('start export csv'));
    expect(exportMock).toHaveBeenCalledWith('b3', expect.objectContaining({ format: 'csv' }), expect.any(Function));
  });

  it('Excel opens the same dialog in xlsx format, and the export runs with that format', () => {
    render(<Host />);
    fireEvent.click(screen.getByText('export excel'));
    fireEvent.click(screen.getByText('start export xlsx'));
    expect(exportMock).toHaveBeenCalledWith('b4', expect.objectContaining({ format: 'xlsx' }), expect.any(Function));
  });

  it('JSON opens the same dialog in json format, and the export runs with that format', () => {
    render(<Host />);
    fireEvent.click(screen.getByText('export json'));
    expect(toast.info).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('start export json'));
    expect(exportMock).toHaveBeenCalledWith('b5', expect.objectContaining({ format: 'json' }), expect.any(Function));
  });
});
