import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../../../../../components/common/Toast';
import { applyFilters } from '../../../../../utils/filterUtils';
import { sortRowsByDataKey } from '../../../../../utils/sortUtils';
let Table: typeof import('../Table').Table;
const mockToastError = vi.fn();

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

vi.mock('../../../../../utils/filterUtils', () => ({
  applyFilters: vi.fn((rows: any[]) => rows),
}));

vi.mock('../../../../../utils/sortUtils', () => ({
  sortRowsByDataKey: vi.fn((_: any, __: any, rows: any[]) => rows),
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
  Search: ({ onSearch }: any) => (
    <button type="button" onClick={() => onSearch?.('Row', { key: 'name' })}>
      Search
    </button>
  ),
}));

vi.mock('../components/ContextMenu', () => ({
  ContextMenu: () => <div data-testid="context-menu" />,
}));

vi.mock('../components/ColumnContextMenu', () => ({
  ColumnContextMenu: () => <div data-testid="column-context-menu" />,
}));

vi.mock('../components/VirtualizedTableBody', () => ({
  VirtualizedTableBody: ({ data, groupedData, onRowSelect, onContextMenu, onScroll }: any) => (
    <div data-testid="virtualized-body">
      <div data-testid="row-count">{data?.length ?? 0}</div>
      <div data-testid="grouped-flag">{groupedData ? 'yes' : 'no'}</div>
      <button type="button" onClick={() => onRowSelect?.('1', true)}>
        Select Row
      </button>
      <button type="button" onClick={(e) => onContextMenu?.(e as any, '1')}>
        Open Context
      </button>
      <button type="button" onClick={() => onScroll?.(0)}>
        Scroll
      </button>
    </div>
  ),
}));

vi.mock('../components/ColumnDropdown', () => ({
  ColumnDropdown: ({ onEdit, onDelete, onOpenChange }: any) => (
    <div data-testid="column-dropdown">
      <button type="button" onClick={() => onOpenChange?.(true)}>
        Open Dropdown
      </button>
      <button type="button" onClick={() => onEdit?.(document.body)}>
        Edit Column
      </button>
      <button type="button" onClick={() => onDelete?.()}>
        Delete Column
      </button>
    </div>
  ),
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

vi.mock('../../../../../components/common/Toast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../components/common/Toast')>();
  return {
    ...actual,
    useToast: () => ({
      success: vi.fn(),
      error: mockToastError,
      info: vi.fn(),
      warning: vi.fn(),
    }),
  };
});

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
    mockToastError.mockClear();
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

  it('hides add row button when create record permission is false', () => {
    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: () => false,
      canCreateColumn: () => true,
      canDeleteRecord: () => true,
      canUpdateRecord: () => true,
      canCreateRecord: () => false,
      canUpdateColumn: () => true,
      canDeleteColumn: () => true,
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

  it('filters rows by search term and triggers filters/sorts', () => {
    mockUseFrontendPagination.mockImplementation(({ data }: any) => ({
      allLoadedData: data,
      loadNextPage: vi.fn(),
      hasMore: false,
      isLoadingMore: false,
    }));
    mockUseTableViewConfig.mockReturnValue({
      viewConfigState: { filters: [{ field: 'name', op: 'is', value: 'Row 1' }], sorts: [{ key: 'name', direction: 'asc' }], groupBy: [], columnWidths: {} },
      setViewConfigState: vi.fn(),
      searchTerm: 'missing',
      setSearchTerm: vi.fn(),
      selectedSearchField: { key: 'name' },
      setSelectedSearchField: vi.fn(),
      realTimeFilter: { field: 'name', op: 'is', value: 'Row 1' },
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('row-count')).toHaveTextContent('0');
    expect(applyFilters).toHaveBeenCalled();
    expect(sortRowsByDataKey).toHaveBeenCalled();
  });

  it('selects all visible rows via the header checkbox', () => {
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(screen.getByText(/selected/)).toBeInTheDocument();
  });

  it('builds grouped data when groupBy is configured', () => {
    mockUseTableViewConfig.mockReturnValue({
      viewConfigState: { filters: [], sorts: [], groupBy: [{ column: 'name', direction: 'asc' }], columnWidths: {} },
      setViewConfigState: vi.fn(),
      searchTerm: '',
      setSearchTerm: vi.fn(),
      selectedSearchField: null,
      setSelectedSearchField: vi.fn(),
      realTimeFilter: null,
      localFieldConfig: {},
      visibleColumns: [
        { id: 'col-1', key: 'name', column_name: 'name', title: 'Name', type: 'text', isSystem: false, system: false },
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('grouped-flag')).toHaveTextContent('yes');
  });

  it('does not open row context menu when read-only', () => {
    const handleContextMenu = vi.fn();
    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: () => true,
      canCreateColumn: () => false,
      canDeleteRecord: () => false,
      canUpdateRecord: () => false,
      canCreateRecord: () => false,
      canUpdateColumn: () => false,
      canDeleteColumn: () => false,
    });
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: false, rowId: null, x: 0, y: 0 },
      handleContextMenu,
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /open context/i }));
    expect(handleContextMenu).not.toHaveBeenCalled();
  });

  it('hides column dropdown for system columns', () => {
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
        { id: 'col-1', key: 'name', column_name: 'name', title: 'Name', type: 'text', isSystem: true, system: true },
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.queryByTestId('column-dropdown')).not.toBeInTheDocument();
  });

  it('hides column dropdown when read-only or no column permissions', () => {
    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: () => true,
      canCreateColumn: () => false,
      canDeleteRecord: () => false,
      canUpdateRecord: () => false,
      canCreateRecord: () => false,
      canUpdateColumn: () => false,
      canDeleteColumn: () => false,
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.queryByTestId('column-dropdown')).not.toBeInTheDocument();
  });

  it('renders new column highlight when column is marked as new', () => {
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
        { id: 'col-1', key: 'name', column_name: 'name', title: 'Name', type: 'text', isSystem: false, system: false, isNew: true },
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    const header = screen.getByRole('columnheader');
    expect(header.className).toContain('ring-2');
    expect(header.className).toContain('bg-yellow-50');
  });

  it('sets header checkbox indeterminate when some rows are selected', () => {
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
        { id: '2', _meta: { id: '2' }, data: { name: 'Row 2', value: 20 } },
      ],
      loadNextPage: vi.fn(),
      hasMore: false,
      isLoadingMore: false,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /select row/i }));

    const headerCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(headerCheckbox.indeterminate).toBe(true);
  });

  it('shows column dropdown when delete permission is allowed', () => {
    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: () => false,
      canCreateColumn: () => false,
      canDeleteRecord: () => false,
      canUpdateRecord: () => false,
      canCreateRecord: () => false,
      canUpdateColumn: () => false,
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('column-dropdown')).toBeInTheDocument();
  });

  it('shows singular row count when only one row and no paging', () => {
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
      ],
      loadNextPage: vi.fn(),
      hasMore: false,
      isLoadingMore: false,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByText(/1 row/i)).toBeInTheDocument();
  });

  it('toggles add column modal when clicking add column button', () => {
    const setIsColumnModalOpen = vi.fn();
    mockUseColumnManagement.mockReturnValue({
      isColumnModalOpen: false,
      setIsColumnModalOpen,
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByTitle('Add column'));
    expect(setIsColumnModalOpen).toHaveBeenCalledTimes(1);
  });

  it('invokes column dropdown edit/delete handlers', () => {
    const handleEditColumn = vi.fn();
    const handleDeleteColumn = vi.fn();
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
      handleEditColumn,
      handleSaveEditColumn: vi.fn(),
      handleConfirmUpdateField: vi.fn(),
      handleDeleteColumn,
      handleConfirmDeleteColumn: vi.fn(),
      handleColumnDragStart: vi.fn(),
      handleColumnDragEnter: vi.fn(),
      handleColumnDragEnd: vi.fn(),
      setEditColumn: vi.fn(),
      setEditColumnIndex: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getAllByRole('button', { name: /edit column/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /delete column/i })[0]);

    expect(handleEditColumn).toHaveBeenCalled();
    expect(handleDeleteColumn).toHaveBeenCalled();
  });

  it('wires column drag events to handlers', () => {
    const handleColumnDragStart = vi.fn();
    const handleColumnDragEnter = vi.fn();
    const handleColumnDragEnd = vi.fn();
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
      handleColumnDragStart,
      handleColumnDragEnter,
      handleColumnDragEnd,
      setEditColumn: vi.fn(),
      setEditColumnIndex: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    const headers = screen.getAllByRole('columnheader');
    fireEvent.dragStart(headers[0]);
    fireEvent.dragEnter(headers[0]);
    fireEvent.dragEnd(headers[0]);

    expect(handleColumnDragStart).toHaveBeenCalled();
    expect(handleColumnDragEnter).toHaveBeenCalled();
    expect(handleColumnDragEnd).toHaveBeenCalled();
  });

  it('opens column context menu on header right-click', () => {
    const handleColContextMenu = vi.fn();
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: false, rowId: null, x: 0, y: 0 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu,
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    const headers = screen.getAllByRole('columnheader');
    fireEvent.contextMenu(headers[0]);
    expect(handleColContextMenu).toHaveBeenCalledTimes(1);
  });

  it('renders delete and update confirmation modals when open', () => {
    mockUseColumnManagement.mockReturnValue({
      isColumnModalOpen: false,
      setIsColumnModalOpen: vi.fn(),
      editColumn: null,
      editColumnIndex: null,
      editModalOpen: false,
      setEditModalOpen: vi.fn(),
      editModalPosition: null,
      deleteConfirmModalOpen: true,
      setDeleteConfirmModalOpen: vi.fn(),
      columnToDelete: 'col-1',
      updateFieldConfirmModalOpen: true,
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByTestId('update-field-confirm-modal')).toBeInTheDocument();
  });

  it('renders edit column modal fallback when open', () => {
    mockUseColumnManagement.mockReturnValue({
      isColumnModalOpen: false,
      setIsColumnModalOpen: vi.fn(),
      editColumn: { id: 'col-1', key: 'name', title: 'Name', type: 'text' },
      editColumnIndex: 0,
      editModalOpen: true,
      setEditModalOpen: vi.fn(),
      editModalPosition: { top: 10, left: 10 },
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('loads next page on scroll when more data is available', () => {
    const loadNextPage = vi.fn();
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
      ],
      loadNextPage,
      hasMore: true,
      isLoadingMore: false,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /scroll/i }));
    expect(loadNextPage).toHaveBeenCalledTimes(1);
  });

  it('adds a row via mutation when clicking add row', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);

    renderWithToast(
      <Table
        tableData={tableData as any}
        onRefresh={vi.fn()}
        actions={{ addRow: { mutateAsync } } as any}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: /add row/i });
    fireEvent.click(addButtons[0]);

    expect(mutateAsync).toHaveBeenCalledWith({ model_id: 'tbl-1' });
  });

  it('invokes search handler to update search state', () => {
    const setSearchTerm = vi.fn();
    const setSelectedSearchField = vi.fn();
    mockUseTableViewConfig.mockReturnValue({
      viewConfigState: { filters: [], sorts: [], groupBy: [], columnWidths: {} },
      setViewConfigState: vi.fn(),
      searchTerm: '',
      setSearchTerm,
      selectedSearchField: null,
      setSelectedSearchField,
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.click(screen.getAllByRole('button', { name: /search/i })[0]);
    expect(setSearchTerm).toHaveBeenCalledWith('Row');
    expect(setSelectedSearchField).toHaveBeenCalledWith({ key: 'name' });
  });

  it('shows error toast when add row mutation fails', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'));

    renderWithToast(
      <Table
        tableData={tableData as any}
        onRefresh={vi.fn()}
        actions={{ addRow: { mutateAsync } } as any}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /add row/i })[0]);
    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
  });

  it('renders delete confirm modal when column delete is pending', () => {
    mockUseColumnManagement.mockReturnValue({
      isColumnModalOpen: false,
      setIsColumnModalOpen: vi.fn(),
      editColumn: null,
      editColumnIndex: null,
      editModalOpen: false,
      setEditModalOpen: vi.fn(),
      editModalPosition: null,
      deleteConfirmModalOpen: true,
      setDeleteConfirmModalOpen: vi.fn(),
      columnToDelete: 'col-1',
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
  });

  it('renders update field confirm modal when flag is set', () => {
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
      updateFieldConfirmModalOpen: true,
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

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('update-field-confirm-modal')).toBeInTheDocument();
  });

  it('renders column context menu overlay when colMenu is open', () => {
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: false, rowId: null, x: 0, y: 0 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: true, colIndex: 0, x: 10, y: 10 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('column-context-menu')).toBeInTheDocument();
  });

  it('shows loader at bottom when loading more', () => {
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
      ],
      loadNextPage: vi.fn(),
      hasMore: true,
      isLoadingMore: true,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});
