import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoizedTableRow } from '../components/TableRow';
import type { GridRecord, GridColumn } from '../../../types/grid.types';

// Like the real field editors, the cell keeps what was typed until its saved value changes
vi.mock('../../../../../components/shared/table/EditableTableCell', () => ({
  EditableTableCell: ({ column, value, onChange }: any) => {
    const [text, setText] = useState(value ?? '');
    return (
      <input
        data-testid={`input-${column.column_name}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
      />
    );
  },
}));

const columns: GridColumn[] = [
  { id: 'col-1', key: 'code', title: 'Code', type: 'text' },
  { id: 'col-2', key: 'notes', title: 'Notes', type: 'text' },
];

const row: GridRecord = {
  id: 'row-1',
  _meta: { id: 'row-1', created_at: '2023-01-01', updated_at: '2023-01-02', deleted_at: null, position: 1 },
  data: { code: 'OPS', notes: 'n' },
};

const renderRow = (cellResets?: Record<string, number>) => (
  <MemoizedTableRow
    row={row}
    rowIndex={0}
    columns={columns}
    columnWidths={[150, 150]}
    isSelected={false}
    onSelect={vi.fn()}
    onCellChange={vi.fn()}
    cellResets={cellResets}
  />
);

describe('TableRow cell reset after a rejected save', () => {
  it('shows the saved value again in the rejected cell only', () => {
    const { rerender } = render(renderRow());

    fireEvent.change(screen.getByTestId('input-code'), { target: { value: 'HR' } });
    fireEvent.change(screen.getByTestId('input-notes'), { target: { value: 'typed' } });
    expect(screen.getByTestId('input-code')).toHaveValue('HR');

    // The save of Code was rejected (e.g. HR is already used by another record)
    rerender(renderRow({ code: 1 }));

    expect(screen.getByTestId('input-code')).toHaveValue('OPS');
    expect(screen.getByTestId('input-notes')).toHaveValue('typed');
  });
});
