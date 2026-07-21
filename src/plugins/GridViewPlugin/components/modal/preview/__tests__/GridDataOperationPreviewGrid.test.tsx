import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridDataOperationPreviewGrid } from '../GridDataOperationPreviewGrid';

const makeColumn = (overrides: Partial<any> = {}) => ({
  id: overrides.id,
  key: overrides.key,
  title: overrides.title ?? 'Column',
  uidt: overrides.uidt,
}) as any;

const makePreviewRow = (overrides: Partial<any> = {}) => ({
  id: overrides.id ?? `row-${Math.random()}`,
  rowState: overrides.rowState ?? 'unchanged',
  changedColumns: overrides.changedColumns ?? [],
  values: overrides.values ?? {},
  original: overrides.original ?? {},
});

describe('GridDataOperationPreviewGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the data preview title', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const preview = { actionId: 'a1', totalRows: 0, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText('Data preview')).toBeInTheDocument();
  });

  it('shows no preview rows message when previewRows is empty', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const preview = { actionId: 'a1', totalRows: 0, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText('No preview rows available.')).toBeInTheDocument();
  });

  it('renders provided column headers', () => {
    const columns = [makeColumn({ id: 'c1', title: 'First' }), makeColumn({ key: 'k2', title: 'Second' })];
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [makePreviewRow()] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText('First')).toBeInTheDocument();
  });

  it('hides columns with excluded uidt values', () => {
    const columns = [
      makeColumn({ id: 'c1', title: 'Name', uidt: 'text' }),
      makeColumn({ id: 'c2', title: 'Files', uidt: 'attachment' }),
      makeColumn({ id: 'c3', title: 'Owner', uidt: 'user' }),
      makeColumn({ id: 'c4', title: 'Related', uidt: 'links' }),
      makeColumn({ id: 'c5', title: 'Lookup', uidt: 'lookup' }),
      makeColumn({ id: 'c6', title: 'Total', uidt: 'formula' }),
    ];
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [makePreviewRow()] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.queryByText('Files')).toBeNull();
    expect(screen.queryByText('Owner')).toBeNull();
    expect(screen.queryByText('Related')).toBeNull();
    expect(screen.queryByText('Lookup')).toBeNull();
    expect(screen.queryByText('Total')).toBeNull();
  });

  it('renders a changed cell showing before and after texts', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const beforeValue = 'old';
    const afterValue = 'new';
    const row = makePreviewRow({
      values: { c1: afterValue },
      original: { c1: beforeValue },
      changedColumns: ['c1'],
    });
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 1, affectedCells: 1, affectedColumns: 1, previewRows: [row] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText(afterValue)).toBeInTheDocument();
  });

  it('renders a removed row with removed styling on the row element', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const row = makePreviewRow({ rowState: 'removed', values: { c1: 'deleted' } });
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 1, affectedCells: 1, affectedColumns: 1, previewRows: [row] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    const tr = screen.getByText('deleted').closest('tr');
    expect(tr).toHaveClass('bg-red-50/70');
  });

  it('stringifies Date values as ISO strings', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const date = new Date('2020-01-01T00:00:00.000Z');
    const row = makePreviewRow({ values: { c1: date } });
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [row] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText(date.toISOString())).toBeInTheDocument();
  });

  it('stringifies Symbol with description', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const sym = Symbol('t');
    const row = makePreviewRow({ values: { c1: sym } });
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [row] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText('Symbol(t)')).toBeInTheDocument();
  });

  it('stringifies named functions with function name', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    function myFn() { }
    const row = makePreviewRow({ values: { c1: myFn } });
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [row] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText('[Function myFn]')).toBeInTheDocument();
  });

  it('renders [Object] for circular objects that cannot be JSON.stringified', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const obj: any = {};
    obj.self = obj; // circular
    const row = makePreviewRow({ values: { c1: obj } });
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [row] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText('[Object]')).toBeInTheDocument();
  });

  it('truncates long cell text and shows ellipsis', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const long = 'x'.repeat(200);
    const row = makePreviewRow({ values: { c1: long } });
    const preview = { actionId: 'a1', totalRows: 1, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: [row] } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText((content) => content.endsWith('...'))).toBeTruthy();
  });

  it('shows pagination controls and initial page info', () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const rows = Array.from({ length: 25 }).map(() => makePreviewRow({ values: { c1: 'v' } }));
    const preview = { actionId: 'a1', totalRows: 25, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: rows } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('navigates to next page when Next is clicked', async () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const rows = Array.from({ length: 25 }).map(() => makePreviewRow({ values: { c1: 'v' } }));
    const preview = { actionId: 'a1', totalRows: 25, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: rows } as any;

    render(<GridDataOperationPreviewGrid columns={columns} preview={preview} />);

    const next = screen.getByRole('button', { name: /Next/i });
    await userEvent.click(next);

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  });

  it('resets to first page when preview.actionId changes', async () => {
    const columns = [makeColumn({ id: 'c1', title: 'Col1' })];
    const rows = Array.from({ length: 25 }).map(() => makePreviewRow({ values: { c1: 'v' } }));
    const { rerender } = render(<GridDataOperationPreviewGrid columns={columns} preview={{ actionId: 'a1', totalRows: 25, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: rows } as any} />);

    const next = screen.getByRole('button', { name: /Next/i });
    await userEvent.click(next);
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    rerender(<GridDataOperationPreviewGrid columns={columns} preview={{ actionId: 'a2', totalRows: 25, affectedRows: 0, affectedCells: 0, affectedColumns: 0, previewRows: rows } as any} />);

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });
});
