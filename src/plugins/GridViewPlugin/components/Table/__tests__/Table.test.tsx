import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
let ToastProvider: React.ComponentType<{ children: React.ReactNode }>;
let Table: typeof import('../Table').Table;
const originalHandleContextMenuMock = vi.fn();
const handleCloseContextMenuMock = vi.fn();
const handleColContextMenuMock = vi.fn();
const tableModalsState = {
  contextMenu: { open: false, rowId: null as string | null, x: 0, y: 0 },
  colMenu: { open: false, colIndex: null as number | null, x: 0, y: 0 },
};

const baseAccess = {
  isBaseReadOnly: vi.fn(),
  canCreateColumn: vi.fn(),
  canDeleteRecord: vi.fn(),
  canUpdateRecord: vi.fn(),
  canCreateRecord: vi.fn(),
  canUpdateColumn: vi.fn(),
  canDeleteColumn: vi.fn(),
};

const toast = { success: vi.fn(), error: vi.fn() };
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

const applyFiltersMock = vi.fn((rows: any[]) => rows);
const sortRowsByDataKeyMock = vi.fn((_cols: any, _sorts: any, rows: any[]) => rows);

vi.mock('../../../../../components/common/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => toast,
}));

vi.mock('../../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: () => baseAccess,
}));

vi.mock('../../../../../hooks/useApi', () => ({
  useAllViews: () => ({ data: [] }),
}));

vi.mock('../../../../../utils/filterUtils', () => ({
  applyFilters: (...args: any[]) => applyFiltersMock(...args),
}));

vi.mock('../../../../../utils/sortUtils', () => ({
  sortRowsByDataKey: (...args: any[]) => sortRowsByDataKeyMock(...args),
}));

const tableViewConfigState = {
  viewConfigState: { filters: [], sorts: [], groupBy: [], columnWidths: {} },
  setViewConfigState: vi.fn(),
  searchTerm: '',
  setSearchTerm: vi.fn(),
  selectedSearchField: null as any,
  setSelectedSearchField: vi.fn(),
  realTimeFilter: null as any,
  localFieldConfig: [],
  visibleColumns: [
    { key: 'title', title: 'Title', type: 'text', isSystem: false, system: false, width: 235 },
    { key: 'status', title: 'Status', type: 'select', isSystem: false, system: false, width: 235 },
  ],
  handleAddFilter: vi.fn(),
  handleRemoveFilter: vi.fn(),
  handleUpdateFilter: vi.fn(),
  handleGroupByChange: vi.fn(),
  handleSortChange: vi.fn(),
  handleEnsureAllFieldsRegistered: vi.fn(),
  handleFieldToggle: vi.fn(),
  handleFieldOrderChange: vi.fn(),
  updateViewConfigBackend: vi.fn(),
};

vi.mock('../../../hooks/useTableViewConfig', () => ({
  useTableViewConfig: () => tableViewConfigState,
}));

vi.mock('../../../hooks/useTableModals', () => ({
  useTableModals: () => ({
    contextMenu: tableModalsState.contextMenu,
    handleContextMenu: originalHandleContextMenuMock,
    handleCloseContextMenu: handleCloseContextMenuMock,
    colMenu: tableModalsState.colMenu,
    handleColContextMenu: handleColContextMenuMock,
    handleCloseColMenu: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useColumnManagement', () => ({
  useColumnManagement: () => ({
    isColumnModalOpen: false,
    setIsColumnModalOpen: vi.fn(),
    editColumn: null,
    editColumnIndex: null,
    editModalOpen: false,
    setEditModalOpen: vi.fn(),
    editModalPosition: null,
    deleteConfirmModalOpen: false,
    setDeleteConfirmModalOpen: vi.fn(),
    columnToDelete: null,
    updateFieldConfirmModalOpen: false,
    setUpdateFieldConfirmModalOpen: vi.fn(),
    setPendingEditColumnChanges: vi.fn(),
    dragColumnIndex: null,
    hoverColumnIndex: null,
    handleAddColumn: vi.fn(),
    handleEditColumn: vi.fn(),
    handleSaveEditColumn: vi.fn(),
    handleConfirmUpdateField: vi.fn(),
    handleDeleteColumn: vi.fn(),
    handleConfirmDeleteColumn: vi.fn(),
    handleColumnDragStart: vi.fn(),
    handleColumnDragEnter: vi.fn(),
    handleColumnDragEnd: vi.fn(),
    setEditColumn: vi.fn(),
    setEditColumnIndex: vi.fn(),
  }),
}));

const paginationState = {
  allLoadedData: [
    { id: '1', _meta: { id: '1' }, data: { title: 'Row 1', status: 'Open' } },
    { id: '2', _meta: { id: '2' }, data: { title: 'Row 2', status: 'Closed' } },
  ],
  loadNextPage: vi.fn(),
  hasMore: false,
  isLoadingMore: false,
};

vi.mock('../../../../../hooks/useFrontendPagination', () => ({
  useFrontendPagination: () => paginationState,
}));

vi.mock('../../../hooks/useCellEditing', () => ({
  useCellEditing: () => ({ handleCellChange: vi.fn() }),
}));

vi.mock('../../../../../components/shared/table/GroupPopover', () => ({
  GroupPopover: () => <div data-testid="group-popover" />,
}));
vi.mock('../../../../../components/shared/table/SortPopover', () => ({
  SortPopover: () => <div data-testid="sort-popover" />,
}));
vi.mock('../../../../../components/shared/table/FilterPopover', () => ({
  FilterPopover: ({ onUpdateFilter }: any) => (
    <div data-testid="filter-popover">
      <button
        type="button"
        data-testid="filter-update"
        onClick={() => onUpdateFilter?.(0, { value: 'Open' })}
      >
        Update Filter
      </button>
    </div>
  ),
}));
vi.mock('../../../../../components/shared/table/FieldsPopover', () => ({
  FieldsPopover: () => <div data-testid="fields-popover" />,
}));
vi.mock('../../../../../components/shared/table/Search', () => ({
  Search: ({ onSearch }: any) => (
    <div data-testid="search">
      <button type="button" data-testid="search-trigger" onClick={() => onSearch?.('Row 1', { key: 'title', title: 'Title' })}>
        Trigger Search
      </button>
    </div>
  ),
}));
vi.mock('../components/ContextMenu', () => ({
  ContextMenu: ({ onDelete, onEdit, canDeleteRecord, canEditRecord }: any) => (
    <div data-testid="context-menu">
      <button type="button" onClick={onEdit} disabled={!canEditRecord}>
        Edit record
      </button>
      <button type="button" onClick={onDelete} disabled={!canDeleteRecord}>
        Delete record
      </button>
    </div>
  ),
}));
vi.mock('../components/VirtualizedTableBody', () => ({
  VirtualizedTableBody: ({ onContextMenu, setActiveCell, activeCell, groupedData }: any) => (
    <div data-testid="virtualized-body">
      <div data-testid="grouped-flag">{groupedData ? 'grouped' : 'ungrouped'}</div>
      <div data-testid="active-cell">{activeCell ? 'active' : 'inactive'}</div>
      <button
        type="button"
        data-testid="row-context-trigger"
        onClick={() => onContextMenu?.({ preventDefault: vi.fn(), stopPropagation: vi.fn() }, '1')}
      >
        Open Context
      </button>
      <button
        type="button"
        data-testid="activate-cell"
        onClick={() => setActiveCell?.({ rowId: '1', colKey: 'title' })}
      >
        Activate Cell
      </button>
    </div>
  ),
}));
vi.mock('../modals/NewColumnModalPortal', () => ({
  NewColumnModalPortal: React.forwardRef((_props: any, ref: any) => (
    <div ref={ref} data-testid="new-column-portal" />
  )),
}));
vi.mock('../components/ColumnDropdown', () => ({
  ColumnDropdown: () => <div data-testid="column-dropdown" />,
}));
vi.mock('../../../../../components/modals/EditRecordModal', () => ({
  default: ({ recordId, onDelete }: any) => (
    <div data-testid="edit-record-modal">
      <div data-testid="edit-record-id">{String(recordId)}</div>
      <button type="button" data-testid="edit-record-delete" onClick={() => onDelete?.(String(recordId))}>
        Delete From Modal
      </button>
    </div>
  ),
}));
vi.mock('../../../../../components/modals/DeleteConfirmModal', () => ({
  default: () => <div data-testid="delete-confirm-modal" />,
}));
vi.mock('../../../../../components/modals/UpdateFieldConfirmModal', () => ({
  default: () => <div data-testid="update-field-confirm-modal" />,
}));

describe('Table', () => {
  beforeEach(async () => {
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as any;
    applyFiltersMock.mockClear();
    sortRowsByDataKeyMock.mockClear();
    tableViewConfigState.viewConfigState = { filters: [], sorts: [], groupBy: [], columnWidths: {} };
    tableViewConfigState.searchTerm = '';
    tableViewConfigState.selectedSearchField = null;
    tableViewConfigState.realTimeFilter = null;
    tableViewConfigState.setSearchTerm.mockReset();
    tableViewConfigState.setSelectedSearchField.mockReset();
    tableViewConfigState.handleUpdateFilter.mockReset();
    paginationState.hasMore = false;
    paginationState.allLoadedData = [
      { id: '1', _meta: { id: '1' }, data: { title: 'Row 1', status: 'Open' } },
      { id: '2', _meta: { id: '2' }, data: { title: 'Row 2', status: 'Closed' } },
    ];
    tableModalsState.contextMenu = { open: false, rowId: null, x: 0, y: 0 };
    tableModalsState.colMenu = { open: false, colIndex: null, x: 0, y: 0 };
    originalHandleContextMenuMock.mockReset();
    handleCloseContextMenuMock.mockReset();
    handleColContextMenuMock.mockReset();
    baseAccess.isBaseReadOnly.mockReturnValue(false);
    baseAccess.canCreateColumn.mockReturnValue(true);
    baseAccess.canDeleteRecord.mockReturnValue(true);
    baseAccess.canUpdateRecord.mockReturnValue(true);
    baseAccess.canCreateRecord.mockReturnValue(true);
    baseAccess.canUpdateColumn.mockReturnValue(true);
    baseAccess.canDeleteColumn.mockReturnValue(true);
    ({ Table } = await import('../Table'));
    ({ ToastProvider } = await import('../../../../../components/common/Toast'));
  });

  it('renders column headers and row count', () => {
    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [
              { id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' },
              { id: 'c2', column_name: 'status', title: 'Status', uidt: 'select' },
            ],
            records: [
              { id: 1, title: 'Row 1', status: 'Open' },
              { id: 2, title: 'Row 2', status: 'Closed' },
            ],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('2 rows')).toBeInTheDocument();
    expect(screen.getByTitle('Add new row')).toBeInTheDocument();
  });

  it('hides add actions for read-only users', () => {
    baseAccess.isBaseReadOnly.mockReturnValue(true);

    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [
              { id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' },
            ],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.queryByTitle('Add new row')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Add column')).not.toBeInTheDocument();
  });

  it('calls addRow mutation when add row clicked', async () => {
    const addRow = { mutateAsync: vi.fn().mockResolvedValue({}) } as any;

    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [
              { id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' },
            ],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
          actions={{ addRow } as any}
        />
      </ToastProvider>
    );

    const addRowButton = screen.getByTitle('Add new row');
    fireEvent.click(addRowButton);

    await new Promise(r => setTimeout(r, 0));
    expect(addRow.mutateAsync).toHaveBeenCalledWith({ model_id: 't1' });
  });

  it('shows toast error when add row mutation fails', async () => {
    const addRow = { mutateAsync: vi.fn().mockRejectedValue(new Error('add failed')) } as any;
    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
          actions={{ addRow } as any}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTitle('Add new row'));
    await new Promise(r => setTimeout(r, 0));
    expect(toast.error).toHaveBeenCalled();
  });

  it('prevents row context menu open for readonly users', () => {
    baseAccess.isBaseReadOnly.mockReturnValue(true);
    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('row-context-trigger'));
    expect(originalHandleContextMenuMock).not.toHaveBeenCalled();
  });

  it('opens row context menu for editable users', () => {
    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('row-context-trigger'));
    expect(originalHandleContextMenuMock).toHaveBeenCalled();
  });

  it('opens edit record flow from row context menu', async () => {
    tableModalsState.contextMenu = { open: true, rowId: '1', x: 20, y: 20 };
    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit record/i }));
    await new Promise(r => setTimeout(r, 0));
    expect(screen.getByTestId('edit-record-modal')).toBeInTheDocument();
    expect(handleCloseContextMenuMock).toHaveBeenCalled();
  });

  it('deletes via modal when record id is valid numeric', async () => {
    const deleteRecord = { mutateAsync: vi.fn().mockResolvedValue({}) } as any;
    tableModalsState.contextMenu = { open: true, rowId: '1', x: 10, y: 10 };

    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
          actions={{ deleteRecord } as any}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit record/i }));
    await new Promise(r => setTimeout(r, 0));
    fireEvent.click(screen.getByTestId('edit-record-delete'));

    await new Promise(r => setTimeout(r, 0));
    expect(deleteRecord.mutateAsync).toHaveBeenCalledWith({ model_id: 't1', row_id: 1 });
  });

  it('shows error and skips delete when record id is invalid', async () => {
    const deleteRecord = { mutateAsync: vi.fn().mockResolvedValue({}) } as any;
    tableModalsState.contextMenu = { open: true, rowId: 'bad-id', x: 10, y: 10 };

    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
          actions={{ deleteRecord } as any}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /edit record/i }));
    await new Promise(r => setTimeout(r, 0));
    expect(screen.getByTestId('edit-record-id')).toHaveTextContent('bad-id');

    fireEvent.click(screen.getByTestId('edit-record-delete'));
    await new Promise(r => setTimeout(r, 0));

    expect(deleteRecord.mutateAsync).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('deletes single row from context menu when no multi-selection', async () => {
    const deleteRecord = { mutateAsync: vi.fn().mockResolvedValue({}) } as any;
    tableModalsState.contextMenu = { open: true, rowId: '1', x: 10, y: 10 };

    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }, { id: 2, title: 'Row 2' }],
          }}
          onRefresh={vi.fn()}
          actions={{ deleteRecord } as any}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /delete record/i }));
    await new Promise(r => setTimeout(r, 0));

    expect(deleteRecord.mutateAsync).toHaveBeenCalledWith({ model_id: 't1', row_id: 1 });
    expect(handleCloseContextMenuMock).toHaveBeenCalled();
  });

  it('updates search term and selected search field via Search component', () => {
    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getAllByTestId('search-trigger')[0]);
    expect(tableViewConfigState.setSearchTerm).toHaveBeenCalledWith('Row 1');
    expect(tableViewConfigState.setSelectedSearchField).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'title', title: 'Title' })
    );
  });

  it('invokes filter and sort utilities when config has filters and sorts', () => {
    tableViewConfigState.viewConfigState = {
      filters: [{ column: 'status', operator: 'equals', value: 'Open' }],
      sorts: [{ column: 'title', direction: 'asc' }],
      groupBy: [],
      columnWidths: {},
    };
    tableViewConfigState.searchTerm = 'Row';
    tableViewConfigState.selectedSearchField = { key: 'title', title: 'Title' } as any;
    tableViewConfigState.realTimeFilter = { column: 'status', operator: 'equals', value: 'Open' };

    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [
              { id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' },
              { id: 'c2', column_name: 'status', title: 'Status', uidt: 'select' },
            ],
            records: [
              { id: 1, title: 'Row 1', status: 'Open' },
              { id: 2, title: 'Row 2', status: 'Closed' },
            ],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    expect(applyFiltersMock).toHaveBeenCalled();
    expect(sortRowsByDataKeyMock).toHaveBeenCalled();
  });

  it('renders grouped data when groupBy is set', () => {
    tableViewConfigState.viewConfigState = {
      filters: [],
      sorts: [],
      groupBy: [{ column: 'status', direction: 'asc' }],
      columnWidths: {},
    };

    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [
              { id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' },
              { id: 'c2', column_name: 'status', title: 'Status', uidt: 'select' },
            ],
            records: [
              { id: 1, title: 'Row 1', status: 'Open' },
              { id: 2, title: 'Row 2', status: 'Closed' },
            ],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByTestId('grouped-flag')).toHaveTextContent('grouped');
  });

  it('shows paginated footer when hasMore is true', () => {
    paginationState.hasMore = true;
    paginationState.allLoadedData = [
      { id: '1', _meta: { id: '1' }, data: { title: 'Row 1', status: 'Open' } },
    ];

    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [
              { id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' },
              { id: 'c2', column_name: 'status', title: 'Status', uidt: 'select' },
            ],
            records: [
              { id: 1, title: 'Row 1', status: 'Open' },
              { id: 2, title: 'Row 2', status: 'Closed' },
            ],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText(/Showing 1 of 2 rows/i)).toBeInTheDocument();
  });

  it('clears active cell on outside document click', () => {
    render(
      <ToastProvider>
        <Table
          tableData={{
            model: { id: 't1', base_id: 'b1' },
            columns: [{ id: 'c1', column_name: 'title', title: 'Title', uidt: 'text' }],
            records: [{ id: 1, title: 'Row 1' }],
          }}
          onRefresh={vi.fn()}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('activate-cell'));
    expect(screen.getByTestId('active-cell')).toHaveTextContent('active');

    fireEvent.click(document.body);
    expect(screen.getByTestId('active-cell')).toHaveTextContent('inactive');
  });
});
