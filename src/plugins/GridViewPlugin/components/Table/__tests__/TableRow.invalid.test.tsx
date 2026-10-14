import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoizedTableRow } from '../components/TableRow';
import type { GridRecord, GridColumn } from '../../../types/grid.types';

vi.mock('../../../../../components/shared/table/EditableTableCell', () => ({
  EditableTableCell: ({ column, allowEdit }: any) => (
    <span data-testid={`cell-${column.column_name}`} data-allow-edit={String(allowEdit)} />
  ),
}));

const columns: GridColumn[] = [
  { id: 'col-1', key: 'code', title: 'Code', type: 'text' },
  { id: 'col-2', key: 'emps', title: 'Employees', type: 'text' as any, uidt: 'links' },
];

const row = (id: string): GridRecord => ({
  id,
  _meta: { id, created_at: '', updated_at: '', deleted_at: null, position: 1 },
  data: { code: '', emps: [] },
});

const renderRow = (id: string, invalidCells?: Record<string, string>, activeCell?: { rowId: string; colKey: string }) => render(
  <MemoizedTableRow
    row={row(id)}
    rowIndex={0}
    columns={columns}
    columnWidths={[150, 150]}
    isSelected={false}
    onSelect={vi.fn()}
    onCellChange={vi.fn()}
    invalidCells={invalidCells}
    activeCell={activeCell}
  />,
);

describe('TableRow primary key cells', () => {
  it('shows invalid cells in red with the reason', () => {
    renderRow('draft-1', { code: 'Required: part of the primary key' });

    const cell = screen.getByTestId('cell-code').closest('[role="gridcell"]') as HTMLElement;
    expect(cell).toHaveAttribute('data-invalid', 'true');
    expect(cell).toHaveAttribute('title', 'Required: part of the primary key');
    expect(cell.className).toContain('border-red-500');
    // The editor inside paints its own background, so the red is forced onto it
    expect(cell.className).toContain('[&>div]:!bg-red-50');
    expect(screen.getByTestId('cell-emps').closest('[role="gridcell"]')).not.toHaveAttribute('data-invalid');
  });

  it('stays red when the row or the cell is clicked', () => {
    renderRow('12', { code: 'Already used by record #4' }, { rowId: '12', colKey: 'code' });
    const code = screen.getByTestId('cell-code').closest('[role="gridcell"]') as HTMLElement;
    expect(code.className).toContain('border-red-500');
    expect(code.className).not.toContain('color-brand-600');

    // Other cells of the clicked row keep the row highlight
    const emps = screen.getByTestId('cell-emps').closest('[role="gridcell"]') as HTMLElement;
    expect(emps.className).toContain('color-blue-50');
  });

  it('keeps link cells of a draft read-only until it is saved', () => {
    renderRow('draft-1');
    expect(screen.getByTestId('cell-code')).toHaveAttribute('data-allow-edit', 'true');
    expect(screen.getByTestId('cell-emps')).toHaveAttribute('data-allow-edit', 'false');
  });

  it('leaves saved rows editable', () => {
    renderRow('12');
    expect(screen.getByTestId('cell-emps')).toHaveAttribute('data-allow-edit', 'true');
  });
});
