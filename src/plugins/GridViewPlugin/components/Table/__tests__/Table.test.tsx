import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '../../../../../components/common/Toast';
let Table: typeof import('../Table').Table;

const mockUseAllViews = vi.fn();
const mockUseTableViewConfig = vi.fn();
const mockUseFrontendPagination = vi.fn();
const mockUseCellEditing = vi.fn();
const mockUseColumnManagement = vi.fn();
const mockUseTableModals = vi.fn();
const mockUseBaseAccess = vi.fn();

vi.mock('../../../../../hooks/useApi', () => ({
  useAllViews: mockUseAllViews,
}));

vi.mock('../../../hooks/useTableViewConfig', () => ({
  useTableViewConfig: mockUseTableViewConfig,
}));

vi.mock('../../../../../hooks/useFrontendPagination', () => ({
  useFrontendPagination: mockUseFrontendPagination,
}));

vi.mock('../../../hooks/useCellEditing', () => ({
  useCellEditing: mockUseCellEditing,
}));

vi.mock('../../../hooks/useColumnManagement', () => ({
  useColumnManagement: mockUseColumnManagement,
}));

vi.mock('../../../hooks/useTableModals', () => ({
  useTableModals: mockUseTableModals,
}));

vi.mock('../../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: mockUseBaseAccess,
}));


vi.mock('../../../../../components/shared/table/FilterPopover', () => ({
  FilterPopover: () => <div data-testid="filter-popover" />,
}));

vi.mock('../../../../../components/shared/table/FieldsPopover', () => ({
  FieldsPopover: () => <div data-testid="fields-popover" />,
}));

vi.mock('../../../../../components/shared/table/GroupPopover', () => ({
  GroupPopover: () => <div data-testid="group-popover" />,
}));

vi.mock('../../../../../components/shared/table/SortPopover', () => ({
  SortPopover: () => <div data-testid="sort-popover" />,
}));

vi.mock('../../../../../components/shared/table/Search', () => ({
  Search: () => <div data-testid="search" />,
}));

vi.mock('../components/ContextMenu', () => ({
  ContextMenu: () => <div data-testid="context-menu" />,
}));

vi.mock('../components/ColumnContextMenu', () => ({
  ColumnContextMenu: () => <div data-testid="column-context-menu" />,
}));

vi.mock('../components/VirtualizedTableBody', () => ({
  VirtualizedTableBody: ({ onRowSelect }: any) => (
    <div data-testid="virtualized-body">
      <button type="button" onClick={() => onRowSelect?.('1', true)}>
        Select Row
      </button>
    </div>
  ),
}));

vi.mock('../components/ColumnDropdown', () => ({
  ColumnDropdown: () => <div data-testid="column-dropdown" />,
}));

vi.mock('../modals/NewColumnModalPortal', () => ({
  NewColumnModalPortal: React.forwardRef(() => <div data-testid="new-column-modal-portal" />),
}));

vi.mock('../../../../../components/modals/DeleteConfirmModal', () => ({
  __esModule: true,
  default: () => <div data-testid="delete-confirm-modal" />,
}));

vi.mock('../../../../../components/modals/EditRecordModal', () => ({
  __esModule: true,
  default: () => <div data-testid="edit-record-modal" />,
}));

vi.mock('../../../../../components/modals/UpdateFieldConfirmModal', () => ({
  __esModule: true,
  default: () => <div data-testid="update-field-confirm-modal" />,
}));

vi.mock('../../../../../components/modals/NewColumnModal', () => ({
  __esModule: true,
  NewColumnModal: () => <div data-testid="new-column-modal" />,
}));

vi.mock('../../../../../components/ui/Loader', () => ({
  Loader: () => <div data-testid="loader" />,
}));

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

const tableData = {
  model: { id: 'tbl-1', base_id: 'base-1' },
  columns: [
    { id: 'col-1', title: 'Name', column_name: 'name', uidt: 'text', order_index: 0 },
    { id: 'col-2', title: 'Value', column_name: 'value', uidt: 'number', order_index: 1 },
  ],
  records: [
    { id: '1', name: 'Row 1', value: 10, created_at: '2026-01-01', updated_at: '2026-01-02' },
  ],
  views: [{ id: 'view-1', type: 'grid', meta: {} }],
};

const setupDefaultMocks = () => {
  mockUseAllViews.mockReturnValue({ data: [] });
  mockUseBaseAccess.mockReturnValue({
    isBaseReadOnly: () => false,
    canCreateColumn: () => true,
    canDeleteRecord: () => true,
    canUpdateRecord: () => true,
    canCreateRecord: () => true,
    canUpdateColumn: () => true,
    canDeleteColumn: () => true,
  });

  mockUseTableViewConfig.mockReturnValue({
    viewConfigState: { filters: [], sorts: [], groupBy: [], columnWidths: {} },
    setViewConfigState: vi.fn(),
    searchTerm: '',
    setSearchTerm: vi.fn(),
    selectedSearchField: null,
    setSelectedSearchField: vi.fn(),
    realTimeFilter: null,
    localFieldConfig: {},
    visibleColumns: [
      { id: 'col-1', key: 'name', column_name: 'name', title: 'Name', type: 'text', isSystem: false, system: false },
      { id: 'col-2', key: 'value', column_name: 'value', title: 'Value', type: 'number', isSystem: false, system: false },
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
  });

  mockUseFrontendPagination.mockReturnValue({
    allLoadedData: [
      { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
    ],
    loadNextPage: vi.fn(),
    hasMore: false,
    isLoadingMore: false,
  });

  mockUseCellEditing.mockReturnValue({ handleCellChange: vi.fn() });

  mockUseColumnManagement.mockReturnValue({
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
  });

  mockUseTableModals.mockReturnValue({
    contextMenu: { open: false, rowId: null, x: 0, y: 0 },
    handleContextMenu: vi.fn(),
    handleCloseContextMenu: vi.fn(),
    colMenu: { open: false, colIndex: null, x: 0, y: 0 },
    handleColContextMenu: vi.fn(),
    handleCloseColMenu: vi.fn(),
  });
};

const renderWithToast = (ui: React.ReactElement) =>
  render(<ToastProvider>{ui}</ToastProvider>);

describe('Table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    (globalThis as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  beforeEach(async () => {
    if (!Table) {
      ({ Table } = await import('../Table'));
    }
  });

  it('renders add row button and selection checkbox when editable', () => {
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getAllByRole('button', { name: /add row/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('hides add row button when read-only', () => {
    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: () => true,
      canCreateColumn: () => false,
      canDeleteRecord: () => false,
      canUpdateRecord: () => false,
      canCreateRecord: () => false,
      canUpdateColumn: () => false,
      canDeleteColumn: () => false,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /add row/i })).not.toBeInTheDocument();
  });

  it('renders context menu when open and allowed', () => {
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: '1', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('context-menu')).toBeInTheDocument();
  });

  it('shows selected count after selecting a row', () => {
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /select row/i }));
    expect(screen.getByText(/selected/)).toBeInTheDocument();
  });

  it('shows paging text when hasMore is true', () => {
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
      ],
      loadNextPage: vi.fn(),
      hasMore: true,
      isLoadingMore: false,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByText(/showing/i)).toBeInTheDocument();
  });
});
