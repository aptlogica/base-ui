import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const { importMock, toast } = vi.hoisted(() => ({
  importMock: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('../../../service/baseExportService', () => ({ importBaseFromSbase: importMock }));
vi.mock('../../common/Toast', () => ({ useToast: () => toast }));
const { download } = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock('../importer/importDownload', () => ({ downloadTextContent: download, downloadLinkedFile: vi.fn() }));

import { ImportSbaseModal } from '../ImportSbaseModal';

type Resolve = (job: unknown) => void;
const resolvers: Resolve[] = [];

const pickAndStart = (container: HTMLElement, name = 'a.sbase.zip') => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [new File(['x'], name)] } });
  fireEvent.click(screen.getByText('Import Base'));
};

describe('ImportSbaseModal runs imports in the background', () => {
  beforeEach(() => {
    resolvers.length = 0;
    importMock.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    importMock.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)));
  });

  const open = (onImported = vi.fn()) => {
    const utils = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={onImported} />);
    return { ...utils, onImported };
  };

  it('shows the background message while an import runs', () => {
    const { container } = open();
    pickAndStart(container);
    expect(screen.getByText('The import is running in the background.')).toBeTruthy();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('closing a running import gives a fresh form, so another import can be started', () => {
    const onClose = vi.fn();
    const { container, rerender } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={onClose} onImported={vi.fn()} />);
    pickAndStart(container);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();

    // the parent hides the dialog and shows it again for the next import
    rerender(<ImportSbaseModal isOpen={false} workspaceId="ws" onClose={onClose} onImported={vi.fn()} />);
    rerender(<ImportSbaseModal isOpen workspaceId="ws" onClose={onClose} onImported={vi.fn()} />);
    expect(screen.queryByText('The import is running in the background.')).toBeNull();
    expect(screen.getByText('Name of Base')).toBeTruthy();

    // a second import starts while the first is still running
    pickAndStart(container, 'b.sbase.zip');
    expect(importMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText('The import is running in the background.')).toBeTruthy();
  });

  it('an import that was closed still reports its result with a message and refreshes the list', async () => {
    const { container, rerender, onImported } = open();
    pickAndStart(container);
    fireEvent.click(screen.getByLabelText('Close'));
    rerender(<ImportSbaseModal isOpen={false} workspaceId="ws" onClose={vi.fn()} onImported={onImported} />);

    await act(async () => {
      resolvers[0]({ id: 'j1', status: 'completed', progress: 100, base_title: 'My copy' });
    });
    expect(toast.success).toHaveBeenCalledWith('“My copy” was imported.');
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it('a closed import that fails is reported as an error', async () => {
    const { container, rerender } = open();
    pickAndStart(container);
    fireEvent.click(screen.getByLabelText('Close'));
    rerender(<ImportSbaseModal isOpen={false} workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);

    await act(async () => {
      resolvers[0]({ id: 'j1', status: 'failed', progress: 10, error: 'the file is not valid' });
    });
    expect(toast.error).toHaveBeenCalledWith('Import failed: the file is not valid');
  });

  it('the result of a closed import never changes the dialog of the next one', async () => {
    const { container } = open();
    pickAndStart(container);
    fireEvent.click(screen.getByLabelText('Close'));
    pickAndStart(container, 'b.sbase.zip');
    // the first import finishes while the second is shown
    await act(async () => {
      resolvers[0]({ id: 'j1', status: 'completed', progress: 100, base_title: 'First' });
    });
    expect(screen.getByText('The import is running in the background.')).toBeTruthy();
    expect(screen.queryByText(/Created/)).toBeNull();
  });

  it('an import that is still open shows its own result', async () => {
    const { container } = open();
    pickAndStart(container);
    await act(async () => {
      resolvers[0]({ id: 'j1', status: 'completed', progress: 100, base_title: 'Same' });
    });
    // the same popup as for a CSV import
    expect(screen.getByText('Data Imported Successfully')).toBeTruthy();
    expect(screen.getByText('Your import is complete for "Same".')).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('the success popup shows what was created (no files, no notes), and Okay closes it', async () => {
    const onClose = vi.fn();
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={onClose} onImported={vi.fn()} />);
    pickAndStart(container);
    await act(async () => {
      resolvers[0]({
        id: 'j1', status: 'completed', progress: 100, base_title: 'Sales',
        result: { tables: 3, fields: 20, views: 5, rows: 1200, attachments: 4, warnings: ['cover image was not imported'] },
      });
    });
    for (const label of ['Tables', 'Fields', 'Views', 'Rows']) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText('1,200')).toBeTruthy();
    // the files and the warnings are not shown
    expect(screen.queryByText('Files')).toBeNull();
    expect(screen.queryByText('Import Notes')).toBeNull();
    expect(screen.queryByText('Data Quality')).toBeNull();
    expect(screen.queryByText('cover image was not imported')).toBeNull();
    expect(screen.queryByText('View data import log')).toBeNull();
    fireEvent.click(screen.getByText('Okay'));
    expect(onClose).toHaveBeenCalled();
  });

  describe('a name that is already used', () => {
    const bases = [{ id: 'b1', title: 'Sales CRM' }];

    const typeName = (container: HTMLElement, value: string) => {
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [new File(['x'], 'a.sbase.zip')] } });
      fireEvent.change(screen.getByLabelText('Name of Base'), { target: { value } });
    };

    it('shows an error and cannot import while the name is used (case does not matter)', () => {
      const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" existingBases={bases} onClose={vi.fn()} onImported={vi.fn()} />);
      typeName(container, 'sales crm');
      expect(screen.getByRole('alert').textContent).toBe('Base name already exists');
      const button = screen.getByText('Import Base') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      fireEvent.click(button);
      expect(importMock).not.toHaveBeenCalled();
    });

    it('a free name has no error and can be imported', () => {
      const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" existingBases={bases} onClose={vi.fn()} onImported={vi.fn()} />);
      typeName(container, 'Sales CRM 2');
      expect(screen.queryByRole('alert')).toBeNull();
      fireEvent.click(screen.getByText('Import Base'));
      expect(importMock).toHaveBeenCalledTimes(1);
    });

    it('an empty name is fine: the name in the file is used', () => {
      const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" existingBases={bases} onClose={vi.fn()} onImported={vi.fn()} />);
      typeName(container, '   ');
      expect(screen.queryByRole('alert')).toBeNull();
      expect((screen.getByText('Import Base') as HTMLButtonElement).disabled).toBe(false);
    });
  });
});

describe('ImportSbaseModal in csv format', () => {
  beforeEach(() => {
    importMock.mockReset();
    importMock.mockImplementation(() => new Promise(() => {}));
  });

  it('says it imports a zip of CSV files, and hides triggers and system columns', () => {
    render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    expect(screen.getByText('Import Sereni Base CSV')).toBeTruthy();
    expect(screen.getByText(/one table per file/)).toBeTruthy();
    expect(screen.getByText('Import table data')).toBeTruthy();
    expect(screen.getByText('Import attachment')).toBeTruthy();
    expect(screen.queryByText('Import triggers and functions')).toBeNull();
    expect(screen.queryByText('Import system columns')).toBeNull();
  });

  it('imports with format csv and without automations or system columns', () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container, 'Sales.csv.zip');
    expect(importMock).toHaveBeenCalledTimes(1);
    const [workspace, file, options] = importMock.mock.calls[0];
    expect(workspace).toBe('ws');
    expect((file as File).name).toBe('Sales.csv.zip');
    expect(options).toMatchObject({ format: 'csv', includeData: true, includeAutomations: false, includeSystemColumns: false });
  });

  it('puts the descriptions of the import options behind an info icon', () => {
    render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    for (const name of [/About import table data/, /About import attachment/, /About import triggers and functions/, /About import system columns/]) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(screen.getByRole('button', { name: /About import table data/ }));
    expect(screen.getByRole('tooltip').textContent).toContain('Off creates empty tables.');
  });

  it('the default dialog is unchanged: sbase, with triggers and system columns', () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    expect(screen.getByText('Import Sereni Base')).toBeTruthy();
    expect(screen.getByText('Import triggers and functions')).toBeTruthy();
    expect(screen.getByText('Import system columns')).toBeTruthy();
    pickAndStart(container);
    expect(importMock.mock.calls[0][2]).toMatchObject({ format: 'sbase' });
  });
});

describe('ImportSbaseModal shows what a csv import skipped', () => {
  const finished = (result: object) => ({ id: 'j1', status: 'completed', progress: 100, base_title: 'Shop', result });
  const startCsv = () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container, 'Shop.csv.zip');
  };

  beforeEach(() => {
    importMock.mockReset();
    download.mockReset();
  });

  it('is the Sereni Base popup, and offers the error log as a text file when rows were skipped', async () => {
    importMock.mockResolvedValue(finished({
      tables: 2, fields: 5, rows: 98, skipped_rows: 2, empty_rows: 3, duplicate_rows: 1,
      error_log: 'Import Issues Report\n[Error 1] Orders.csv, line 3\nReason: value out of range for type integer',
    }));
    startCsv();

    expect(await screen.findByText('Data Imported Successfully')).toBeTruthy();
    for (const label of ['Tables', 'Fields', 'Views', 'Rows']) expect(screen.getByText(label)).toBeTruthy();
    // not the pattern of the old CSV import
    expect(screen.queryByText('Data Quality')).toBeNull();
    expect(screen.queryByText(/empty rows found/)).toBeNull();
    expect(screen.queryByText(/View data import log/)).toBeNull();

    expect(screen.getByText('2 rows were not imported.')).toBeTruthy();
    fireEvent.click(screen.getByText(/Download error log/));
    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0][0]).toContain('Orders.csv, line 3');
    expect(download.mock.calls[0][1]).toMatch(/\.txt$/);
  });

  it('says "1 row was" for one skipped row', async () => {
    importMock.mockResolvedValue(finished({ tables: 1, fields: 2, rows: 5, skipped_rows: 1, error_log: 'log' }));
    startCsv();
    expect(await screen.findByText('1 row was not imported.')).toBeTruthy();
  });

  it('without an error there is no log and no notice', async () => {
    importMock.mockResolvedValue(finished({ tables: 1, fields: 2, rows: 5, empty_rows: 2, duplicate_rows: 1 }));
    startCsv();
    expect(await screen.findByText('Data Imported Successfully')).toBeTruthy();
    expect(screen.queryByText(/not imported/)).toBeNull();
    expect(screen.queryByText(/Download error log/)).toBeNull();
  });

  it('a Sereni Base import is as before', async () => {
    importMock.mockResolvedValue(finished({ tables: 1, fields: 2, rows: 5 }));
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container);
    expect(await screen.findByText('Data Imported Successfully')).toBeTruthy();
    expect(screen.queryByText(/not imported/)).toBeNull();
  });
});
