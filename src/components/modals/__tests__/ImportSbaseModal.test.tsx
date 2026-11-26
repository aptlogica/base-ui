import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

const { importMock, toast } = vi.hoisted(() => ({
  importMock: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock('../../../service/baseExportService', () => ({ importBaseFromSbase: importMock }));
vi.mock('../../common/Toast', () => ({ useToast: () => toast }));
const { download } = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock('../importer/importDownload', () => ({ downloadTextContent: download, downloadLinkedFile: vi.fn() }));

import { ImportSbaseModal } from '../ImportSbaseModal';
import { JOBS_FLY_EVENT, claimFinishedJobs, clearTrackedJobs } from '../../../service/jobsEvents';

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
    fireEvent.click(screen.getByLabelText('Minimize'));
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
    fireEvent.click(screen.getByLabelText('Minimize'));
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
    fireEvent.click(screen.getByLabelText('Minimize'));
    rerender(<ImportSbaseModal isOpen={false} workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);

    await act(async () => {
      resolvers[0]({ id: 'j1', status: 'failed', progress: 10, error: 'the file is not valid' });
    });
    expect(toast.error).toHaveBeenCalledWith('Import failed: the file is not valid');
  });

  it('the result of a closed import never changes the dialog of the next one', async () => {
    const { container } = open();
    pickAndStart(container);
    fireEvent.click(screen.getByLabelText('Minimize'));
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

  it('the success popup shows what was created and the Data Quality counts, and Okay closes it', async () => {
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
    // the same Data Quality section as the import of a table from a CSV, with a line for the warnings
    expect(screen.getByText('Data Quality')).toBeTruthy();
    expect(screen.getByText('0 rows with errors')).toBeTruthy();
    expect(screen.getByText('1 warning')).toBeTruthy();
    expect(screen.queryByText('Files')).toBeNull();
    expect(screen.queryByText('cover image was not imported')).toBeNull();
    // no log came with the job, so there is nothing to view
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

describe('ImportSbaseModal in xlsx format', () => {
  beforeEach(() => {
    importMock.mockReset();
    importMock.mockImplementation(() => new Promise(() => {}));
  });

  it('says it imports a workbook, and hides triggers and system columns', () => {
    render(<ImportSbaseModal isOpen workspaceId="ws" format="xlsx" onClose={vi.fn()} onImported={vi.fn()} />);
    expect(screen.getByText('Import Sereni Base Excel')).toBeTruthy();
    expect(screen.getByText('Create a new base from an .xlsx file or a .zip of it.')).toBeTruthy();
    expect(screen.queryByText('Import triggers and functions')).toBeNull();
    expect(screen.queryByText('Import system columns')).toBeNull();
  });

  it('takes an .xlsx or a .zip, and sends format xlsx without automations or system columns', () => {
    for (const name of ['Sales.xlsx', 'Sales.xlsx.zip']) {
      importMock.mockClear();
      const { container, unmount } = render(<ImportSbaseModal isOpen workspaceId="ws" format="xlsx" onClose={vi.fn()} onImported={vi.fn()} />);
      expect((container.querySelector('input[type="file"]') as HTMLInputElement).accept).toBe('.xlsx,.zip');
      pickAndStart(container, name);
      expect(importMock).toHaveBeenCalledTimes(1);
      const [, file, options] = importMock.mock.calls[0];
      expect((file as File).name).toBe(name);
      expect(options).toMatchObject({ format: 'xlsx', includeData: true, includeAutomations: false, includeSystemColumns: false });
      unmount();
    }
  });

  it('refuses any other file', () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="xlsx" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container, 'Sales.csv');
    expect(screen.getByText('Only .xlsx or .zip files are supported.')).toBeTruthy();
    expect(importMock).not.toHaveBeenCalled();
  });

  it('an .xlsx is not a file of the other formats', () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container, 'Sales.xlsx');
    expect(screen.getByText('Only .zip files are supported.')).toBeTruthy();
    expect(importMock).not.toHaveBeenCalled();
  });
});

describe('ImportSbaseModal hands a minimized import to the Jobs panel', () => {
  beforeEach(() => {
    importMock.mockReset();
    clearTrackedJobs();
  });

  const open = () => render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);

  it('minimizing stops this dialog from asking for the job, and the Jobs panel follows it', () => {
    let signal: AbortSignal | undefined;
    importMock.mockImplementation((_ws, _file, _opts, _progress, sig: AbortSignal, onStarted: (job: { id: string }) => void) => {
      signal = sig;
      onStarted({ id: 'job-1' });
      return new Promise(() => {});
    });
    const { container } = open();
    pickAndStart(container, 'a.sbase.zip');
    expect(signal?.aborted).toBe(false);

    fireEvent.click(screen.getByLabelText('Minimize'));
    expect(signal?.aborted).toBe(true);
    const ended = claimFinishedJobs([{ id: 'job-1', status: 'completed' }]);
    expect(ended).toHaveLength(1);
    expect(ended[0].tracked).toMatchObject({ id: 'job-1', type: 'import', title: 'a.sbase.zip' });
  });

  it('minimizing before the server has started the job lets the upload go on, and hands the job over when it starts', () => {
    let signal: AbortSignal | undefined;
    let started: ((job: { id: string }) => void) | undefined;
    importMock.mockImplementation((_ws, _file, _opts, _progress, sig: AbortSignal, onStarted: (job: { id: string }) => void) => {
      signal = sig;
      started = onStarted;
      return new Promise(() => {});
    });
    const { container } = open();
    pickAndStart(container, 'a.sbase.zip');
    fireEvent.click(screen.getByLabelText('Minimize'));
    // no job yet: nothing is aborted, so the file is not lost
    expect(signal?.aborted).toBe(false);
    expect(claimFinishedJobs([{ id: 'job-2', status: 'completed' }])).toHaveLength(0);

    started?.({ id: 'job-2' });
    expect(signal?.aborted).toBe(true);
    expect(claimFinishedJobs([{ id: 'job-2', status: 'completed' }])).toHaveLength(1);
  });

  it('an import that is not minimized is followed by the dialog, which tells the result itself', async () => {
    importMock.mockResolvedValue({ id: 'j1', status: 'completed', progress: 100, base_title: 'Sales', result: { tables: 1 } });
    const { container } = open();
    pickAndStart(container, 'a.sbase.zip');
    await screen.findByText('Data Imported Successfully');
    expect(claimFinishedJobs([{ id: 'j1', status: 'completed' }])).toHaveLength(0);
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
    expect(screen.getByText('Create a new base from a .zip of CSV files.')).toBeTruthy();
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

  const pickMany = (container: HTMLElement, files: File[]) => {
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    return act(async () => {
      fireEvent.change(input, { target: { files } });
    });
  };

  it('takes several csv files, lists them, and sends them all', async () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    await pickMany(container, [new File(['Name\nA\n'], 'a.csv'), new File(['No\n1\n'], 'b.csv')]);
    await waitFor(() => expect(screen.getByText('b.csv')).toBeTruthy());
    expect(screen.getByText('a.csv')).toBeTruthy();
    expect(screen.getByText(/2 files/)).toBeTruthy();
    expect(screen.getByText('Leave empty to use “Imported CSV”.')).toBeTruthy();
    expect((screen.getByLabelText(/Import attachment/) as HTMLInputElement).disabled).toBe(true);

    fireEvent.click(screen.getByText('Import Base'));
    const [, files, options] = importMock.mock.calls[0];
    expect((files as File[]).map((f) => f.name)).toEqual(['a.csv', 'b.csv']);
    expect(options).toMatchObject({ format: 'csv' });
  });

  it('refuses a file that is not a csv with a message naming it, and does not list it', async () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    await pickMany(container, [new File(['x'], 'sheet.xlsx')]);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('sheet.xlsx is not a CSV file'));
    expect(screen.queryByLabelText('Chosen CSV files')).toBeNull();
    expect((screen.getByText('Import Base') as HTMLButtonElement).disabled).toBe(true);
  });

  it('lets csv files replace a zip that was chosen first', async () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    await pickMany(container, [new File(['x'], 'all.zip')]);
    expect(screen.getByText('all.zip')).toBeTruthy();
    await pickMany(container, [new File(['Name\nA\n'], 'a.csv')]);
    await waitFor(() => expect(screen.getByText('a.csv')).toBeTruthy());
    expect(screen.queryByText('all.zip')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each(['csv', 'xlsx', 'json'] as const)('turns Import attachment off while table data is off, in the %s format', (format) => {
    render(<ImportSbaseModal isOpen workspaceId="ws" format={format} onClose={vi.fn()} onImported={vi.fn()} />);
    const attachment = screen.getByLabelText(/Import attachment/) as HTMLInputElement;
    expect(attachment.disabled).toBe(false);
    fireEvent.click(screen.getByLabelText(/Import table data/));
    expect(attachment.disabled).toBe(true);
    expect(attachment.checked).toBe(false);
    fireEvent.click(screen.getByLabelText(/Import table data/));
    expect(attachment.disabled).toBe(false);
  });

  it('keeps Import attachment usable without table data for Sereni Base', () => {
    render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/Import table data/));
    expect((screen.getByLabelText(/Import attachment/) as HTMLInputElement).disabled).toBe(false);
  });

  it.each([
    ['csv', 'Sales 2026.csv.zip', 'Sales 2026'],
    ['xlsx', 'Budget.xlsx', 'Budget'],
    ['json', 'Orders.json', 'Orders'],
    ['json', 'Orders.json.zip', 'Orders'],
  ] as const)('names the base after the %s file without its extension: %s', (format, fileName, expected) => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format={format} onClose={vi.fn()} onImported={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], fileName)] } });
    expect(screen.getByText(`Leave empty to use “${expected}”.`)).toBeTruthy();
  });

  it('names the base after the one csv file without .csv, and "Imported CSV" for several', async () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => { fireEvent.change(input, { target: { files: [new File(['Name\nA\n'], 'xyz.csv')] } }); });
    await waitFor(() => expect(screen.getByText('Leave empty to use “xyz”.')).toBeTruthy());
    await act(async () => { fireEvent.change(input, { target: { files: [new File(['No\n1\n'], 'b.csv')] } }); });
    await waitFor(() => expect(screen.getByText('Leave empty to use “Imported CSV”.')).toBeTruthy());
  });

  it('removes a listed csv file', async () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    await pickMany(container, [new File(['Name\nA\n'], 'a.csv'), new File(['No\n1\n'], 'b.csv')]);
    await waitFor(() => expect(screen.getByLabelText('Remove a.csv')).toBeTruthy());
    fireEvent.click(screen.getByLabelText('Remove a.csv'));
    expect(screen.queryByText('a.csv')).toBeNull();
    expect(screen.getByText('b.csv')).toBeTruthy();
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
    // the Data Quality section of the import of a table from a CSV
    expect(screen.getByText('Data Quality')).toBeTruthy();
    expect(screen.getByText('2 rows with errors')).toBeTruthy();
    expect(screen.getByText('3 empty rows found')).toBeTruthy();
    expect(screen.getByText('1 duplicate rows found')).toBeTruthy();

    fireEvent.click(screen.getByText(/View data import log/));
    expect(download).toHaveBeenCalledTimes(1);
    expect(download.mock.calls[0][0]).toContain('Orders.csv, line 3');
    expect(download.mock.calls[0][1]).toMatch(/\.txt$/);
  });

  it('a log with only warnings (no row was left out) still has the link', async () => {
    importMock.mockResolvedValue(finished({ tables: 1, fields: 2, rows: 5, warnings: ['a', 'b'], error_log: 'Import Issues Report\nWARNINGS:\n- a\n- b' }));
    startCsv();
    expect(await screen.findByText('2 warnings')).toBeTruthy();
    fireEvent.click(screen.getByText(/View data import log/));
    expect(download.mock.calls[0][0]).toContain('WARNINGS:');
  });

  it('without an error there is no log and no notice', async () => {
    importMock.mockResolvedValue(finished({ tables: 1, fields: 2, rows: 5, empty_rows: 2, duplicate_rows: 1 }));
    startCsv();
    expect(await screen.findByText('Data Imported Successfully')).toBeTruthy();
    expect(screen.getByText('0 rows with errors')).toBeTruthy();
    expect(screen.queryByText(/View data import log/)).toBeNull();
  });

  it('a Sereni Base import is as before', async () => {
    importMock.mockResolvedValue(finished({ tables: 1, fields: 2, rows: 5 }));
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container);
    expect(await screen.findByText('Data Imported Successfully')).toBeTruthy();
    expect(screen.queryByText(/not imported/)).toBeNull();
  });
});

describe('ImportSbaseModal in json format', () => {
  beforeEach(() => {
    importMock.mockReset();
    importMock.mockImplementation(() => new Promise(() => {}));
  });

  it('takes a .zip or one .json file, and sends format json without automations or system columns', () => {
    for (const name of ['Sales.json.zip', 'Customers.json']) {
      importMock.mockClear();
      const { container, unmount } = render(<ImportSbaseModal isOpen workspaceId="ws" format="json" onClose={vi.fn()} onImported={vi.fn()} />);
      expect((container.querySelector('input[type="file"]') as HTMLInputElement).accept).toBe('.json,.zip');
      pickAndStart(container, name);
      expect(importMock).toHaveBeenCalledTimes(1);
      const [, file, options] = importMock.mock.calls[0];
      expect((file as File).name).toBe(name);
      expect(options).toMatchObject({ format: 'json', includeData: true, includeAutomations: false, includeSystemColumns: false });
      unmount();
    }
  });

  it('refuses any other file', () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="json" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container, 'Sales.xlsx');
    expect(screen.getByText('Only .zip or .json files are supported.')).toBeTruthy();
    expect(importMock).not.toHaveBeenCalled();
  });

  it('a .json is not a file of the sbase format', () => {
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container, 'Customers.json');
    expect(screen.getByText('Only .zip files are supported.')).toBeTruthy();
    expect(importMock).not.toHaveBeenCalled();
  });
});

describe('ImportSbaseModal when the import fails', () => {
  beforeEach(() => {
    importMock.mockReset();
    download.mockReset();
  });

  it('a file the server refuses at once shows the popup with one error, and the log is written in the browser', async () => {
    importMock.mockRejectedValue(Object.assign(new Error('the zip has no base.sbase.json'), {}));
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container, 'Sales.sbase.zip');

    expect(await screen.findByText('Import Failed')).toBeTruthy();
    expect(screen.getByText('Your import of "Sales.sbase.zip" did not finish.')).toBeTruthy();
    expect(screen.getByText('1 error')).toBeTruthy();
    expect(screen.getByText('the zip has no base.sbase.json')).toBeTruthy();
    expect(screen.getByText('0 rows imported')).toBeTruthy();

    fireEvent.click(screen.getByText(/View data import log/));
    expect(download).toHaveBeenCalledTimes(1);
    const [text, name] = download.mock.calls[0];
    expect(text).toContain('Import Issues Report');
    expect(text).toContain('Format: Sereni Base      File: Sales.sbase.zip');
    expect(text).toContain('ERROR:\nthe zip has no base.sbase.json');
    expect(name).toMatch(/\.txt$/);
  });

  it('lists the first three problems and counts the rest, and the log has them all', async () => {
    const problems = ['p1', 'p2', 'p3', 'p4', 'p5'];
    importMock.mockRejectedValue(Object.assign(new Error('the base file is not valid'), { problems }));
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container, 'Shop.csv.zip');

    expect(await screen.findByText('5 errors')).toBeTruthy();
    for (const p of ['p1', 'p2', 'p3']) expect(screen.getByText(p)).toBeTruthy();
    expect(screen.queryByText('p4')).toBeNull();
    expect(screen.getByText('… 2 more (all of them are in the log)')).toBeTruthy();
    fireEvent.click(screen.getByText(/View data import log/));
    const text = download.mock.calls[0][0] as string;
    expect(text).toContain('Format: CSV      File: Shop.csv.zip');
    expect(text).toContain('PROBLEMS (5):');
    expect(text).toContain('5. p5');
  });

  it('a job that failed brings its own log, which is the one downloaded', async () => {
    importMock.mockResolvedValue({
      id: 'j1', status: 'failed', progress: 10, error: 'the base file is not valid',
      result: { problems: ['bad row'], error_log: 'LOG FROM THE SERVER' },
    });
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
    pickAndStart(container);
    expect(await screen.findByText('Import Failed')).toBeTruthy();
    expect(screen.getByText('1 error')).toBeTruthy();
    expect(screen.getByText('bad row')).toBeTruthy();
    fireEvent.click(screen.getByText(/View data import log/));
    expect(download.mock.calls[0][0]).toBe('LOG FROM THE SERVER');
  });

  it('Try again goes back to the file picker, and Close closes the dialog', async () => {
    importMock.mockRejectedValue(new Error('nope'));
    const onClose = vi.fn();
    const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={onClose} onImported={vi.fn()} />);
    pickAndStart(container);
    await screen.findByText('Import Failed');

    fireEvent.click(screen.getByText('Try again'));
    expect(screen.getByText('Import Sereni Base')).toBeTruthy();
    expect(screen.getByText('Import Base')).toBeTruthy();

    pickAndStart(container);
    await screen.findByText('Import Failed');
    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ImportSbaseModal tells the Jobs icon when it is closed on a running import', () => {
  beforeEach(() => {
    importMock.mockReset();
    importMock.mockImplementation(() => new Promise(() => {}));
  });

  it('closing a running import sends the event; closing the picker does not', () => {
    const flew = vi.fn();
    window.addEventListener(JOBS_FLY_EVENT, flew);
    try {
      const picker = render(<ImportSbaseModal isOpen workspaceId="ws" onClose={vi.fn()} onImported={vi.fn()} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(flew).not.toHaveBeenCalled();
      picker.unmount();

      const { container } = render(<ImportSbaseModal isOpen workspaceId="ws" format="csv" onClose={vi.fn()} onImported={vi.fn()} />);
      pickAndStart(container, 'a.csv.zip');
      fireEvent.click(screen.getByLabelText('Minimize'));
      expect(flew).toHaveBeenCalledTimes(1);
      expect((flew.mock.calls[0][0] as CustomEvent).detail.kind).toBe('import');
    } finally {
      window.removeEventListener(JOBS_FLY_EVENT, flew);
    }
  });
});
