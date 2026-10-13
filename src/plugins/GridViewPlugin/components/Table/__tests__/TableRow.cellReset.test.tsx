import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { MemoizedTableRow } from '../components/TableRow';
import type { GridColumn, GridRecord } from '../../../types/grid.types';

// Like the real field components, this cell keeps what was typed in its own state and only
// takes the value prop when it mounts
vi.mock('../../../../../components/shared/table/EditableTableCell', () => ({
  EditableTableCell: ({ column, value }: any) => {
    const [text, setText] = useState(value ?? '');
    return <input data-testid={`input-${column.column_name}`} value={text} onChange={e => setText(e.target.value)} />;
  },
}));

const columns: GridColumn[] = [{ id: 'col-1', key: 'customer_id', title: 'Customer Id', type: 'text' }];

const row: GridRecord = {
  id: '7',
  _meta: { id: '7', created_at: '2020-01-01', updated_at: '2020-01-01', deleted_at: null, position: 1 },
  data: { customer_id: 'abc-1' },
};

const props = {
  row,
  rowIndex: 0,
  columns,
  columnWidths: [200],
  isSelected: false,
  onSelect: vi.fn(),
  onCellChange: vi.fn(),
  tableId: 'tbl-1',
};

describe('TableRow cell reset after a rejected save', () => {
  const input = () => screen.getByTestId('input-customer_id') as HTMLInputElement;

  it('shows the saved value again when the cell is reset', () => {
    const { rerender } = render(<MemoizedTableRow {...props} cellResets={{}} />);
    fireEvent.change(input(), { target: { value: 'abc' } });
    expect(input().value).toBe('abc');

    // The save failed: Table bumps this cell's counter
    rerender(<MemoizedTableRow {...props} cellResets={{ '7-customer_id': 1 }} />);
    expect(input().value).toBe('abc-1');
  });

  it('leaves other cells alone', () => {
    const { rerender } = render(<MemoizedTableRow {...props} cellResets={{}} />);
    fireEvent.change(input(), { target: { value: 'typed' } });

    rerender(<MemoizedTableRow {...props} cellResets={{ '8-customer_id': 1 }} />);
    expect(input().value).toBe('typed');
  });
});

describe('TableRow save error highlight', () => {
  const cell = () => screen.getByTestId('input-customer_id').closest('[role="gridcell"]') as HTMLElement;

  it('boxes the failed cell in red, even when it is the active cell', () => {
    render(<MemoizedTableRow {...props} activeCell={{ rowId: '7', colKey: 'customer_id' }} saveErrorCells={new Set(['7-customer_id'])} />);
    expect(cell().className).toContain('border-red-500');
    expect(cell().className).not.toContain('brand-600');
  });

  it('goes back to the normal border once the error clears', () => {
    const { rerender } = render(<MemoizedTableRow {...props} saveErrorCells={new Set(['7-customer_id'])} />);
    rerender(<MemoizedTableRow {...props} saveErrorCells={new Set()} />);
    expect(cell().className).not.toContain('border-red-500');
  });
});
