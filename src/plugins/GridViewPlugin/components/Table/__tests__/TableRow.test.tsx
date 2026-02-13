import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TableRow, MemoizedTableRow } from '../components/TableRow';
import type { GridRecord, GridColumn } from '../../../types/grid.types';

// Mock the EditableTableCell component
vi.mock('../../../../../components/shared/table/EditableTableCell', () => ({
  EditableTableCell: ({ column, value, onChange, allowEdit }: any) => (
    <div 
      data-testid={`cell-${column.column_name}`}
      data-value={value}
      data-allow-edit={allowEdit}
    >
      <input
        data-testid={`input-${column.column_name}`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!allowEdit}
      />
    </div>
  ),
}));

describe('TableRow', () => {
  const mockOnSelect = vi.fn();
  const mockOnCellChange = vi.fn();
  const mockOnContextMenu = vi.fn();
  const mockSetActiveCell = vi.fn();

  const defaultColumns: GridColumn[] = [
    { id: 'col-1', key: 'title', title: 'Title', type: 'text' },
    { id: 'col-2', key: 'description', title: 'Description', type: 'longText' },
    { id: 'col-3', key: 'status', title: 'Status', type: 'select', isSystem: true },
  ];

  const defaultRow: GridRecord = {
    id: 'row-1',
    _meta: {
      id: 'row-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-02',
      deleted_at: null,
      position: 1,
    },
    data: {
      title: 'Test Title',
      description: 'Test Description',
      status: 'active',
    },
  };

  const defaultProps = {
    row: defaultRow,
    rowIndex: 0,
    columns: defaultColumns,
    columnWidths: [200, 300, 150],
    isSelected: false,
    onSelect: mockOnSelect,
    onCellChange: mockOnCellChange,
    tableId: 'table-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render row with all cells', () => {
      render(<TableRow {...defaultProps} />);

      expect(screen.getByTestId('cell-title')).toBeInTheDocument();
      expect(screen.getByTestId('cell-description')).toBeInTheDocument();
      expect(screen.getByTestId('cell-status')).toBeInTheDocument();
    });

    it('should render row number', () => {
      render(<TableRow {...defaultProps} rowIndex={4} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // rowIndex + 1
    });

    it('should render custom display row number', () => {
      render(<TableRow {...defaultProps} displayRowNumber={10} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should render checkbox', () => {
      render(<TableRow {...defaultProps} />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should show checkbox checked when row is selected', () => {
      render(<TableRow {...defaultProps} isSelected={true} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should apply active row styling when selected', () => {
      render(<TableRow {...defaultProps} isSelected={true} />);

      const row = screen.getByRole('row');
      expect(row).toHaveClass('border-[var(--color-brand-600)]');
    });
    it('should apply right border to last cell when active row has multiple columns', () => {
      render(<TableRow {...defaultProps} isSelected={true} />);

      const cells = screen.getAllByRole('gridcell');
      const lastCell = cells[cells.length - 1];
      expect(lastCell).toHaveClass('border-r', 'border-[var(--color-brand-600)]');
    });
  });

  describe('cell interactions', () => {
    it('should call onCellChange when cell value changes', async () => {
      render(<TableRow {...defaultProps} />);

      const input = screen.getByTestId('input-title');
      await userEvent.clear(input);
      await userEvent.type(input, 'New Title');

      expect(mockOnCellChange).toHaveBeenCalled();
    });

    it('should call setActiveCell when cell is clicked', () => {
      render(<TableRow {...defaultProps} setActiveCell={mockSetActiveCell} />);

      const cell = screen.getByTestId('cell-title');
      fireEvent.click(cell);

      expect(mockSetActiveCell).toHaveBeenCalledWith({ rowId: 'row-1', colKey: 'title' });
    });

    it('should call setActiveCell on Enter key', () => {
      render(<TableRow {...defaultProps} setActiveCell={mockSetActiveCell} />);

      const cell = screen.getByTestId('cell-title').closest('[role="gridcell"]');
      fireEvent.keyDown(cell!, { key: 'Enter' });

      expect(mockSetActiveCell).toHaveBeenCalledWith({ rowId: 'row-1', colKey: 'title' });
    });

    it('should call setActiveCell on Space key', () => {
      render(<TableRow {...defaultProps} setActiveCell={mockSetActiveCell} />);

      const cell = screen.getByTestId('cell-title').closest('[role="gridcell"]');
      fireEvent.keyDown(cell!, { key: ' ' });

      expect(mockSetActiveCell).toHaveBeenCalledWith({ rowId: 'row-1', colKey: 'title' });
    });

    it('should clear active cell on Escape key', () => {
      render(<TableRow {...defaultProps} setActiveCell={mockSetActiveCell} />);

      const row = screen.getByRole('row');
      fireEvent.keyDown(row, { key: 'Escape' });

      expect(mockSetActiveCell).toHaveBeenCalledWith(null);
    });
  });

  describe('row selection', () => {
    it('should call onSelect when checkbox is changed', async () => {
      render(<TableRow {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(mockOnSelect).toHaveBeenCalledWith('row-1', true);
    });

    it('should call onSelect with false when unchecking', async () => {
      render(<TableRow {...defaultProps} isSelected={true} />);

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(mockOnSelect).toHaveBeenCalledWith('row-1', false);
    });
  });

  describe('context menu', () => {
    it('should call onContextMenu on right click', () => {
      render(<TableRow {...defaultProps} onContextMenu={mockOnContextMenu} />);

      const row = screen.getByRole('row');
      fireEvent.contextMenu(row);

      expect(mockOnContextMenu).toHaveBeenCalled();
    });
  });

  describe('active cell styling', () => {
    it('should highlight active cell', () => {
      const activeCell = { rowId: 'row-1', colKey: 'title' };
      render(<TableRow {...defaultProps} activeCell={activeCell} />);

      const row = screen.getByRole('row');
      expect(row).toHaveClass('border-[var(--color-brand-600)]');
    });

    it('should not highlight row when different row is active', () => {
      const activeCell = { rowId: 'row-2', colKey: 'title' };
      render(<TableRow {...defaultProps} activeCell={activeCell} />);

      const row = screen.getByRole('row');
      expect(row).not.toHaveClass('border border-[var(--color-brand-600)]');
    });
  });

  describe('canEdit prop', () => {
    it('should pass canEdit=true to cells by default', () => {
      render(<TableRow {...defaultProps} />);

      const cell = screen.getByTestId('cell-title');
      expect(cell).toHaveAttribute('data-allow-edit', 'true');
    });

    it('should pass canEdit=false to cells when disabled', () => {
      render(<TableRow {...defaultProps} canEdit={false} />);

      const cell = screen.getByTestId('cell-title');
      expect(cell).toHaveAttribute('data-allow-edit', 'false');
    });
  });

  describe('row data formats', () => {
    it('should handle flat row data format', () => {
      const flatRow: GridRecord = {
        id: 'row-2',
        title: 'Flat Title',
        description: 'Flat Description',
      };

      render(<TableRow {...defaultProps} row={flatRow} />);

      expect(screen.getByTestId('cell-title')).toHaveAttribute('data-value', 'Flat Title');
    });

    it('should handle _meta data format', () => {
      render(<TableRow {...defaultProps} />);

      expect(screen.getByTestId('cell-title')).toHaveAttribute('data-value', 'Test Title');
    });

    it('should handle row without _meta.id', () => {
      const rowWithoutMetaId: GridRecord = {
        id: 'row-3',
        data: { title: 'No Meta ID' },
      };

      render(<TableRow {...defaultProps} row={rowWithoutMetaId} />);

      expect(screen.getByTestId('cell-title')).toBeInTheDocument();
    });
  });

  describe('column widths', () => {
    it('should apply correct column widths', () => {
      render(<TableRow {...defaultProps} columnWidths={[100, 200, 300]} />);

      const row = screen.getByRole('row');
      expect(row).toHaveStyle({ gridTemplateColumns: '48px 100px 200px 300px 48px' });
    });
  });

  describe('system columns', () => {
    it('should mark system columns correctly', () => {
      render(<TableRow {...defaultProps} />);

      // The status column is marked as system
      expect(screen.getByTestId('cell-status')).toBeInTheDocument();
    });
  });
});

describe('MemoizedTableRow', () => {
  const defaultColumns: GridColumn[] = [
    { id: 'col-1', key: 'title', title: 'Title', type: 'text' },
  ];

  const defaultRow: GridRecord = {
    id: 'row-1',
    _meta: {
      id: 'row-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-02',
      deleted_at: null,
      position: 1,
    },
    data: { title: 'Test' },
  };

  const defaultProps = {
    row: defaultRow,
    rowIndex: 0,
    columns: defaultColumns,
    columnWidths: [200],
    isSelected: false,
    onSelect: vi.fn(),
    onCellChange: vi.fn(),
  };

  it('should render MemoizedTableRow', () => {
    render(<MemoizedTableRow {...defaultProps} />);

    expect(screen.getByTestId('cell-title')).toBeInTheDocument();
  });

  it('should not re-render when props are the same', () => {
    const { rerender } = render(<MemoizedTableRow {...defaultProps} />);

    rerender(<MemoizedTableRow {...defaultProps} />);

    // Component should not unmount/remount (memo working)
    expect(screen.getByTestId('cell-title')).toBeInTheDocument();
  });

  it('should re-render when row changes', () => {
    const { rerender } = render(<MemoizedTableRow {...defaultProps} />);

    const newRow: GridRecord = {
      ...defaultRow,
      data: { title: 'Updated Title' },
    };

    rerender(<MemoizedTableRow {...defaultProps} row={newRow} />);

    expect(screen.getByTestId('cell-title')).toHaveAttribute('data-value', 'Updated Title');
  });

  it('should re-render when selection changes', () => {
    const { rerender } = render(<MemoizedTableRow {...defaultProps} />);

    rerender(<MemoizedTableRow {...defaultProps} isSelected={true} />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});

