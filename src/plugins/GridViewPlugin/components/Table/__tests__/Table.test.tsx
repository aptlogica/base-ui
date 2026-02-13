import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
let ToastProvider: React.ComponentType<{ children: React.ReactNode }>;
let Table: typeof import('../Table').Table;

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

vi.mock('../../../hooks/useTableViewConfig', () => ({
  useTableViewConfig: () => ({
    viewConfigState: { filters: [], sorts: [], groupBy: [], columnWidths: {} },
    setViewConfigState: vi.fn(),
    searchTerm: '',
    setSearchTerm: vi.fn(),
    selectedSearchField: null,
    setSelectedSearchField: vi.fn(),
    realTimeFilter: null,
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
  }),
}));

vi.mock('../../../hooks/useTableModals', () => ({
  useTableModals: () => ({
    contextMenu: { open: false, rowId: null, x: 0, y: 0 },
    handleContextMenu: vi.fn(),
    handleCloseContextMenu: vi.fn(),
    colMenu: { open: false, colIndex: null, x: 0, y: 0 },
    handleColContextMenu: vi.fn(),
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

vi.mock('../../../../../hooks/useFrontendPagination', () => ({
  useFrontendPagination: () => ({
    allLoadedData: [
      { id: '1', _meta: { id: '1' }, data: { title: 'Row 1', status: 'Open' } },
      { id: '2', _meta: { id: '2' }, data: { title: 'Row 2', status: 'Closed' } },
    ],
    loadNextPage: vi.fn(),
    hasMore: false,
    isLoadingMore: false,
  }),
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
  FilterPopover: () => <div data-testid="filter-popover" />,
}));
vi.mock('../../../../../components/shared/table/FieldsPopover', () => ({
  FieldsPopover: () => <div data-testid="fields-popover" />,
}));
vi.mock('../../../../../components/shared/table/Search', () => ({
  Search: () => <div data-testid="search" />,
}));
vi.mock('../components/VirtualizedTableBody', () => ({
  VirtualizedTableBody: () => <div data-testid="virtualized-body" />,
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
  default: () => <div data-testid="edit-record-modal" />,
}));
vi.mock('../../../../../components/modals/DeleteConfirmModal', () => ({
  default: () => <div data-testid="delete-confirm-modal" />,
}));
vi.mock('../../../../../components/modals/UpdateFieldConfirmModal', () => ({
  default: () => <div data-testid="update-field-confirm-modal" />,
}));

describe('Table', () => {
  beforeEach(async () => {
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
});
