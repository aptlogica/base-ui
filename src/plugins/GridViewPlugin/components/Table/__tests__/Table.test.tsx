import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider } from '../../../../../components/common/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { applyFilters } from '../../../../../utils/filterUtils';
import { sortRowsByDataKey } from '../../../../../utils/sortUtils';
let Table: typeof import('../Table').Table;
import { clearDraftCache } from '../../../hooks/useDraftRows';
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockCellEditClick = vi.fn();

const mockUseAllViews = vi.fn();
const mockUsePrimaryKey = vi.fn();
const mockUpsertRow = vi.fn();
const mockHandleCellChange = vi.fn();
const mockUseTableViewConfig = vi.fn();
const mockUseFrontendPagination = vi.fn();
const mockUseCellEditing = vi.fn();
const mockUseColumnManagement = vi.fn();
const mockUseTableModals = vi.fn();
const mockUseBaseAccess = vi.fn();
const mockUseGridDataOperationModal = vi.fn();

vi.mock('../../../../../hooks/useApi', () => ({
  useAllViews: mockUseAllViews,
  usePrimaryKey: (...args: unknown[]) => mockUsePrimaryKey(...args),
  useUpsertRow: () => ({ mutateAsync: mockUpsertRow }),
  useCaseNormalize: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
  useExtractSubstring: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
  useFindReplace: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
  useMergeColumns: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
  useRemoveDuplicates: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
  useRemoveSpecialCharacters: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
  useRemoveFormatting: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
  useTrimWhitespace: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
  useSplitColumn: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), mutate: vi.fn(), isLoading: false }),
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
  FilterPopover: ({ onUpdateFilter }: any) => (
    <div data-testid="filter-popover">
      <button type="button" onClick={() => onUpdateFilter?.(0, { value: 'updated' })}>
        Update Filter
      </button>
    </div>
  ),
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
  ContextMenu: ({ onDelete, onEdit, onClose }: any) => (
    <div data-testid="context-menu">
      <button type="button" onClick={() => onDelete?.()}>
        Context Delete
      </button>
      <button type="button" onClick={() => onEdit?.()}>
        Context Edit
      </button>
      <button type="button" onClick={() => onClose?.()}>
        Context Close
      </button>
    </div>
  ),
}));

vi.mock('../components/ColumnContextMenu', () => ({
  ColumnContextMenu: ({ onEdit, onDelete, onClose }: any) => (
    <div data-testid="column-context-menu">
      <button type="button" onClick={() => onEdit?.(document.body)}>
        Col Menu Edit
      </button>
      <button type="button" onClick={() => onDelete?.()}>
        Col Menu Delete
      </button>
      <button type="button" onClick={() => onClose?.()}>
        Col Menu Close
      </button>
    </div>
  ),
}));

vi.mock('../../toolbar/GridActionsBar', () => ({
  GridActionsBar: ({ onActionSelect }: any) => (
    <button type="button" onClick={() => onActionSelect?.({ id: 'find_replace', label: 'Find' })}>
      Open Grid Action
    </button>
  ),
}));

vi.mock('../../../hooks/useGridDataOperationModal', () => ({
  useGridDataOperationModal: () => mockUseGridDataOperationModal(),
}));

vi.mock('../../modal/GridDataOperationModal', () => ({
  GridDataOperationModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="grid-data-op-modal">
        <button type="button" onClick={() => onClose?.()}>
          Close Grid Op
        </button>
      </div>
    ) : null,
}));

vi.mock('../components/VirtualizedTableBody', () => ({
  VirtualizedTableBody: ({
    data,
    groupedData,
    onRowSelect,
    onContextMenu,
    onScroll,
    setActiveCell,
    setExpandedGroups,
    onCellChange,
    invalidCells,
  }: any) => (
    <div data-testid="virtualized-body">
      <div data-testid="row-count">{data?.length ?? 0}</div>
      <div data-testid="invalid-cells">{JSON.stringify(invalidCells ?? {})}</div>
      <button type="button" onClick={() => onCellChange?.(data?.[data.length - 1]?.id, 'name', 'HR')}>
        Fill Last Name
      </button>
      <button type="button" onClick={() => onCellChange?.('1', 'name', '')}>
        Clear First Name
      </button>
      <button type="button" onClick={() => onCellChange?.('2', 'name', 'Row 1')}>
        Copy First Name To Second
      </button>
      {(data ?? []).map((row: any) => {
        const rowId = String(row?._meta?.id || row?.id || '');
        return (
          <div key={rowId} data-row-id={rowId}>
            <div data-col-key="name">
              <span role="button" tabIndex={0} aria-label={`edit-name-${rowId}`} onClick={() => mockCellEditClick(rowId, 'name')} onKeyDown={() => {}} />
              <input type="text" aria-label={`input-name-${rowId}`} />
              <input type="color" aria-label={`color-name-${rowId}`} />
            </div>
            <div data-col-key="value" tabIndex={-1} aria-label={`cell-value-${rowId}`} />
          </div>
        );
      })}
      <div data-testid="grouped-flag">{groupedData ? 'yes' : 'no'}</div>
      <button type="button" onClick={() => onRowSelect?.('1', true)}>
        Select First Row
      </button>
      <button type="button" onClick={() => onRowSelect?.('1', false)}>
        Deselect First Row
      </button>
      <button type="button" onClick={() => onRowSelect?.('2', true)}>
        Select Second Row
      </button>
      <button type="button" onClick={(e) => onContextMenu?.(e as any, '1')}>
        Open Context
      </button>
      <button type="button" onClick={() => onScroll?.(0)}>
        Trigger Scroll
      </button>
      <button type="button" onClick={() => onScroll?.(999999)}>
        Trigger Scroll Far
      </button>
      <button type="button" onClick={() => setActiveCell?.({ rowId: '1', colKey: 'name' })}>
        Set Active Cell
      </button>
      <button
        type="button"
        onClick={() => setExpandedGroups?.(new Set(['name-Row 1-0', 'name-(Empty)-0']))}
      >
        Expand Groups
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
      <button type="button" onClick={() => onOpenChange?.(false)}>
        Close Dropdown
      </button>
      <button type="button" onClick={() => onEdit?.(document.body)}>
        Edit Column
      </button>
      <button type="button" onClick={() => onEdit?.(undefined)}>
        Edit Column No Anchor
      </button>
      <button type="button" onClick={() => onDelete?.()}>
        Delete Column
      </button>
    </div>
  ),
}));

vi.mock('../modals/NewColumnModalPortal', () => ({
  NewColumnModalPortal: React.forwardRef(({ isOpen, onClose }: any, ref: any) =>
    isOpen ? (
      <div data-testid="new-column-modal-portal" ref={ref}>
        <button type="button" onClick={() => onClose?.()}>
          Close New Column Portal
        </button>
      </div>
    ) : null
  ),
}));

vi.mock('../../../../../components/modals/DeleteConfirmModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onConfirm, message }: any) =>
    isOpen ? (
      <div data-testid="delete-confirm-modal">
        <span data-testid="delete-confirm-message">{message}</span>
        <button type="button" onClick={() => onClose?.()}>
          Close Delete Confirm
        </button>
        <button type="button" onClick={() => onConfirm?.()}>
          Confirm Delete Column
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../../../components/modals/EditRecordModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess, onDelete }: any) =>
    isOpen ? (
      <div data-testid="edit-record-modal">
        <button type="button" onClick={() => onClose?.()}>
          Close Edit Record
        </button>
        <button type="button" onClick={() => onSuccess?.()}>
          Success Edit Record
        </button>
        <button type="button" onClick={() => onDelete?.('1')}>
          Delete From Edit Record
        </button>
        <button type="button" onClick={() => onDelete?.('invalid-id')}>
          Delete Invalid From Edit
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../../../components/modals/UpdateFieldConfirmModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onConfirm }: any) =>
    isOpen ? (
      <div data-testid="update-field-confirm-modal">
        <button type="button" onClick={() => onClose?.()}>
          Close Update Field Confirm
        </button>
        <button type="button" onClick={() => onConfirm?.()}>
          Confirm Update Field
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../../../components/modals/NewColumnModal', () => ({
  __esModule: true,
  NewColumnModal: ({ onClose }: any) => (
    <div data-testid="new-column-modal">
      <button type="button" onClick={() => onClose?.()}>
        Close New Column Modal
      </button>
    </div>
  ),
}));

vi.mock('../../../../../utils/initialValues', () => ({
  buildInitialValuesForEdit: vi.fn(() => ({ name: 'Row 1' })),
}));

vi.mock('../../../../../components/ui/Loader', () => ({
  Loader: () => <div data-testid="loader" />,
}));

vi.mock('../../../../../components/common/Toast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../components/common/Toast')>();
  return {
    ...actual,
    useToast: () => ({
      success: mockToastSuccess,
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
    // Keep portals in the test document so callbacks remain reachable
    createPortal: (node: React.ReactNode, container?: Element | DocumentFragment) =>
      actual.createPortal(node, container ?? document.body),
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
  mockUsePrimaryKey.mockReturnValue({ data: undefined });
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

  mockUseCellEditing.mockReturnValue({ handleCellChange: mockHandleCellChange });

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
    formulaUsageWarning: null,
    setFormulaUsageWarning: vi.fn(),
  });

  mockUseTableModals.mockReturnValue({
    contextMenu: { open: false, rowId: null, x: 0, y: 0 },
    handleContextMenu: vi.fn(),
    handleCloseContextMenu: vi.fn(),
    colMenu: { open: false, colIndex: null, x: 0, y: 0 },
    handleColContextMenu: vi.fn(),
    handleCloseColMenu: vi.fn(),
  });

  mockUseGridDataOperationModal.mockReturnValue({
    activeAction: null,
    isOpen: false,
    openActionModal: vi.fn(),
    closeActionModal: vi.fn(),
    resetActionModal: vi.fn(),
  });
};

const renderWithToast = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>
  );
};

describe('Table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
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
  }, 30000);

  it('titles a rejected cell save that repeats a unique key, and shows the server message', () => {
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    const { onSaveError } = mockUseCellEditing.mock.calls.at(-1)![0];

    act(() => {
      onSaveError({
        rowId: '1',
        columnKey: 'name',
        error: Object.assign(new Error('A record with Customer Id = abc already exists'), { code: 'TCN_1012' }),
      });
    });

    expect(mockToastError).toHaveBeenCalledWith(
      'A record with Customer Id = abc already exists',
      expect.objectContaining({ title: 'Duplicate value not allowed' })
    );
  });

  it('uses a general heading for other rejected cell saves', () => {
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    const { onSaveError } = mockUseCellEditing.mock.calls.at(-1)![0];

    act(() => {
      onSaveError({ rowId: '1', columnKey: 'name', error: new Error('Something went wrong') });
    });

    expect(mockToastError).toHaveBeenCalledWith('Something went wrong', expect.objectContaining({ title: 'Not saved' }));
  });

  it('renders add row button and selection checkbox when editable', () => {
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getAllByRole('button', { name: /add row/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('marks primary key columns with a key icon', () => {
    mockUsePrimaryKey.mockReturnValue({ data: { column_ids: ['col-1'] } });
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(mockUsePrimaryKey).toHaveBeenCalledWith('tbl-1');
    expect(screen.getByTestId('primary-key-icon-col-1')).toHaveAttribute('title', 'Primary key');
    expect(screen.queryByTestId('primary-key-icon-col-2')).not.toBeInTheDocument();
  });

  it('numbers the fields of a composite primary key', () => {
    mockUsePrimaryKey.mockReturnValue({ data: { column_ids: ['col-2', 'col-1'] } });
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(screen.getByTestId('primary-key-icon-col-2')).toHaveAttribute('title', 'Primary key field 1 of 2');
    expect(screen.getByTestId('primary-key-icon-col-1')).toHaveAttribute('title', 'Primary key field 2 of 2');
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

    fireEvent.click(screen.getByRole('button', { name: /^select first row$/i }));
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

    fireEvent.click(screen.getByRole('button', { name: /^select first row$/i }));

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

  it('renders edit column modal when open', async () => {
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
      formulaUsageWarning: null,
      setFormulaUsageWarning: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    expect(
      (await screen.findByTestId('new-column-modal')) || screen.getByTestId('loader')
    ).toBeTruthy();
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

    fireEvent.click(screen.getByRole('button', { name: /^trigger scroll$/i }));
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

  describe('custom primary key', () => {
    beforeEach(() => {
      clearDraftCache();
      // Key: Name (col-1)
      mockUsePrimaryKey.mockReturnValue({ data: { column_ids: ['col-1'] } });
    });

    it('adds a draft row in the grid instead of creating a record', () => {
      const mutateAsync = vi.fn();
      renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} actions={{ addRow: { mutateAsync } } as any} />);
      const before = Number(screen.getByTestId('row-count').textContent);

      fireEvent.click(screen.getAllByRole('button', { name: /add row/i })[0]);

      expect(mutateAsync).not.toHaveBeenCalled();
      expect(Number(screen.getByTestId('row-count').textContent)).toBe(before + 1);
      // The empty key cell of the draft is shown in red
      expect(screen.getByTestId('invalid-cells').textContent).toContain('"name":"Required: part of the primary key"');
    });

    it('inserts the draft once its key cells are filled in', async () => {
      vi.useFakeTimers();
      try {
      mockUpsertRow.mockResolvedValue({ data: { record: { id: 7 } } });
      const onRefresh = vi.fn();
      renderWithToast(<Table tableData={tableData as any} onRefresh={onRefresh} actions={{ addRow: { mutateAsync: vi.fn() } } as any} />);

      fireEvent.click(screen.getAllByRole('button', { name: /add row/i })[0]);
      fireEvent.click(screen.getByRole('button', { name: 'Fill Last Name' }));
      expect(screen.getByTestId('invalid-cells').textContent).toBe('{}');
      await act(async () => { vi.advanceTimersByTime(600); });

      expect(mockUpsertRow).toHaveBeenCalledWith({ model_id: 'tbl-1', values: { 'col-1': 'HR' } });
      expect(onRefresh).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not send a key value that repeats another row', () => {
      const twoRows = { ...tableData, records: [...tableData.records, { id: '2', name: 'Row 2', value: 20 }] };
      renderWithToast(<Table tableData={twoRows as any} onRefresh={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: 'Copy First Name To Second' }));

      expect(mockHandleCellChange).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('Name = "Row 1" is already used by record #1.', expect.anything());
    });

    it('does not send an emptied key cell of a saved row', () => {
      renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: 'Clear First Name' }));

      expect(mockHandleCellChange).not.toHaveBeenCalled();
    });
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

  it('closes column context menu when overlay is clicked', () => {
    const handleCloseColMenu = vi.fn();
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: false, rowId: null, x: 0, y: 0 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: true, colIndex: 0, x: 10, y: 10 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu,
    });

    const { container } = renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    const overlay = container.querySelector('div[style*="position: fixed"]');
    expect(overlay).toBeInTheDocument();
    fireEvent.mouseDown(overlay as HTMLElement);
    expect(handleCloseColMenu).toHaveBeenCalled();
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

  const columnMgmt = (overrides: Record<string, unknown> = {}) => ({
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
    formulaUsageWarning: null,
    setFormulaUsageWarning: vi.fn(),
    ...overrides,
  });

  it('resolves view by viewId when provided', () => {
    const data = {
      ...tableData,
      views: [
        { id: 'view-1', type: 'grid', meta: { a: 1 } },
        { id: 'view-2', type: 'grid', meta: { b: 2 } },
      ],
    };
    renderWithToast(<Table tableData={data as any} viewId="view-2" onRefresh={vi.fn()} />);
    expect(screen.getByTestId('virtualized-body')).toBeInTheDocument();
  });

  it('falls back when viewId is not found and when tableData is missing', () => {
    renderWithToast(<Table tableData={tableData as any} viewId="missing" onRefresh={vi.fn()} />);
    expect(screen.getByTestId('virtualized-body')).toBeInTheDocument();

    renderWithToast(<Table onRefresh={vi.fn()} />);
    expect(screen.getAllByTestId('virtualized-body').length).toBeGreaterThan(0);
  });

  it('uses tableData.view when views array is absent', () => {
    const data = {
      model: { id: 'tbl-1', base_id: 'base-1' },
      columns: tableData.columns,
      records: tableData.records,
      view: { id: 'direct-view', type: 'grid', meta: {} },
    };
    renderWithToast(<Table tableData={data as any} onRefresh={vi.fn()} />);
    expect(screen.getByTestId('virtualized-body')).toBeInTheDocument();
  });

  it('invokes filter update handler from FilterPopover', () => {
    const handleUpdateFilter = vi.fn();
    mockUseTableViewConfig.mockReturnValue({
      viewConfigState: { filters: [{ field: 'name', op: 'is', value: 'x' }], sorts: [], groupBy: [], columnWidths: {} },
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
      handleUpdateFilter,
      handleGroupByChange: vi.fn(),
      handleSortChange: vi.fn(),
      handleEnsureAllFieldsRegistered: vi.fn(),
      handleFieldToggle: vi.fn(),
      handleFieldOrderChange: vi.fn(),
      updateViewConfigBackend: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /update filter/i }));
    expect(handleUpdateFilter).toHaveBeenCalledWith(0, { value: 'updated' });
  });

  it('opens row context menu when editable and allowed', () => {
    const handleContextMenu = vi.fn();
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
    expect(handleContextMenu).toHaveBeenCalled();
  });

  it('deselects a row and clears select-all checkbox', () => {
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

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(screen.getByText(/selected/)).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^select first row$/i }));
    expect(screen.getByText(/selected/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /deselect first row/i }));
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it('deletes a single row from context menu', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const handleCloseContextMenu = vi.fn();
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: '1', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu,
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(
      <Table
        tableData={tableData as any}
        onRefresh={onRefresh}
        actions={{ deleteRecord: { mutateAsync } } as any}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /context delete/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ model_id: 'tbl-1', row_id: 1 }));
    expect(mockToastSuccess).toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalled();
    expect(handleCloseContextMenu).toHaveBeenCalled();
  });

  it('shows error toast when delete has invalid row id', async () => {
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: 'not-a-number', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(
      <Table
        tableData={tableData as any}
        onRefresh={vi.fn()}
        actions={{ deleteRecord: { mutateAsync: vi.fn() } } as any}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /context delete/i }));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Unable to delete record: invalid row id',
        expect.any(Object)
      )
    );
  });

  it('shows the reason in a toast, not an alert, when delete fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    mockToastError.mockClear();
    const mutateAsync = vi.fn().mockRejectedValue(new Error('boom'));
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: '1', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(
      <Table
        tableData={tableData as any}
        onRefresh={vi.fn()}
        actions={{ deleteRecord: { mutateAsync } } as any}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /context delete/i }));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith('boom', expect.objectContaining({ title: 'Failed to delete record' }))
    );
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('bulk deletes when multiple selected rows include context row', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn(() => {
      throw new Error('refresh failed');
    });
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
        { id: '2', _meta: { id: '2' }, data: { name: 'Row 2', value: 20 } },
      ],
      loadNextPage: vi.fn(),
      hasMore: false,
      isLoadingMore: false,
    });
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: '1', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(
      <Table
        tableData={
          {
            ...tableData,
            records: [
              { id: '1', name: 'Row 1', value: 10, created_at: '2026-01-01', updated_at: '2026-01-02' },
              { id: '2', name: 'Row 2', value: 20, created_at: '2026-01-01', updated_at: '2026-01-02' },
            ],
          } as any
        }
        onRefresh={onRefresh}
        actions={{ bulkDeleteRecords: { mutateAsync } } as any}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^select first row$/i }));
    fireEvent.click(screen.getByRole('button', { name: /select second row/i }));
    fireEvent.click(screen.getByRole('button', { name: /context delete/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({ model_id: 'tbl-1', row_ids: [1, 2] })
    );
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('shows error when bulk delete finds no valid numeric ids', async () => {
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: 'abc', _meta: { id: 'abc' }, data: { name: 'Row A', value: 1 } },
        { id: 'def', _meta: { id: 'def' }, data: { name: 'Row B', value: 2 } },
      ],
      loadNextPage: vi.fn(),
      hasMore: false,
      isLoadingMore: false,
    });
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: 'abc', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(
      <Table
        tableData={
          {
            ...tableData,
            records: [
              { id: 'abc', name: 'Row A', value: 1, created_at: '', updated_at: '' },
              { id: 'def', name: 'Row B', value: 2, created_at: '', updated_at: '' },
            ],
          } as any
        }
        onRefresh={vi.fn()}
        actions={{ bulkDeleteRecords: { mutateAsync: vi.fn() } } as any}
      />
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /context delete/i }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'No valid rows selected for deletion',
        expect.any(Object)
      )
    );
  });

  it('shows error toast when bulk delete mutation fails', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('bulk fail'));
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
        { id: '2', _meta: { id: '2' }, data: { name: 'Row 2', value: 20 } },
      ],
      loadNextPage: vi.fn(),
      hasMore: false,
      isLoadingMore: false,
    });
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: '1', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(
      <Table
        tableData={
          {
            ...tableData,
            records: [
              { id: '1', name: 'Row 1', value: 10, created_at: '', updated_at: '' },
              { id: '2', name: 'Row 2', value: 20, created_at: '', updated_at: '' },
            ],
          } as any
        }
        onRefresh={vi.fn()}
        actions={{ bulkDeleteRecords: { mutateAsync } } as any}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^select first row$/i }));
    fireEvent.click(screen.getByRole('button', { name: /select second row/i }));
    fireEvent.click(screen.getByRole('button', { name: /context delete/i }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        'Failed to delete records. Please try again.',
        expect.any(Object)
      )
    );
  });

  it('opens edit record modal from context menu and handles success refresh errors', async () => {
    const onRefresh = vi.fn(() => {
      throw new Error('refresh boom');
    });
    const handleCloseContextMenu = vi.fn();
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: '1', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu,
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(
      <Table tableData={tableData as any} onRefresh={onRefresh} />
    );

    fireEvent.click(screen.getByRole('button', { name: /context edit/i }));
    expect(handleCloseContextMenu).toHaveBeenCalled();
    expect(screen.getByTestId('edit-record-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /success edit record/i }));
    expect(screen.queryByTestId('edit-record-modal')).not.toBeInTheDocument();
  });

  it('closes edit record modal via close button', () => {
    const handleCloseContextMenu = vi.fn();
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: '1', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu,
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /context edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /close edit record/i }));
    expect(screen.queryByTestId('edit-record-modal')).not.toBeInTheDocument();
  });

  it('deletes from edit record modal and closes', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: true, rowId: '1', x: 10, y: 10 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu: vi.fn(),
    });

    renderWithToast(
      <Table
        tableData={tableData as any}
        onRefresh={vi.fn()}
        actions={{ deleteRecord: { mutateAsync } } as any}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /context edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete from edit record/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('edit-record-modal')).not.toBeInTheDocument());
  });

  it('clears active cell when clicking outside table', () => {
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /set active cell/i }));
    fireEvent.click(document.body);
    // no throw; active cell cleared via document listener
    expect(screen.getByTestId('virtualized-body')).toBeInTheDocument();
  });

  it('applies column widths from column and view config', () => {
    mockUseTableViewConfig.mockReturnValue({
      viewConfigState: {
        filters: [],
        sorts: [],
        groupBy: [],
        columnWidths: { 'col-1': 300, value: 180 },
      },
      setViewConfigState: vi.fn(),
      searchTerm: '',
      setSearchTerm: vi.fn(),
      selectedSearchField: null,
      setSelectedSearchField: vi.fn(),
      realTimeFilter: null,
      localFieldConfig: {},
      visibleColumns: [
        { id: 'col-1', key: 'name', column_name: 'name', title: 'Name', type: 'text', width: 250, isSystem: false, system: false },
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
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0].getAttribute('style')).toContain('300px');
    expect(headers[1].getAttribute('style')).toContain('180px');
  });

  it('groups empty values and sorts groups descending', () => {
    mockUseTableViewConfig.mockReturnValue({
      viewConfigState: {
        filters: [],
        sorts: [],
        groupBy: [{ column: 'name', direction: 'desc' }],
        columnWidths: {},
      },
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

    renderWithToast(
      <Table
        tableData={
          {
            ...tableData,
            records: [
              { id: '1', name: 'Zed', value: 1, created_at: '', updated_at: '' },
              { id: '2', name: '', value: 2, created_at: '', updated_at: '' },
              { id: '3', name: 'Alpha', value: 3, created_at: '', updated_at: '' },
            ],
          } as any
        }
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByTestId('grouped-flag')).toHaveTextContent('yes');
  });

  it('estimates grouped item count when scrolling with expanded groups', () => {
    const loadNextPage = vi.fn();
    mockUseFrontendPagination.mockReturnValue({
      allLoadedData: [
        { id: '1', _meta: { id: '1' }, data: { name: 'Row 1', value: 10 } },
      ],
      loadNextPage,
      hasMore: true,
      isLoadingMore: false,
    });
    mockUseTableViewConfig.mockReturnValue({
      viewConfigState: {
        filters: [],
        sorts: [],
        groupBy: [{ column: 'name', direction: 'asc' }],
        columnWidths: {},
      },
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
    fireEvent.click(screen.getByRole('button', { name: /expand groups/i }));
    fireEvent.click(screen.getByRole('button', { name: /trigger scroll far/i }));
    expect(loadNextPage).toHaveBeenCalled();
  });

  it('ignores context menu on system column headers and handles drag over', () => {
    const handleColContextMenu = vi.fn();
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: false, rowId: null, x: 0, y: 0 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu,
      handleCloseColMenu: vi.fn(),
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
        { id: 'col-1', key: 'name', column_name: 'name', title: 'Name', type: 'text', isSystem: true, system: true },
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
    const headers = screen.getAllByRole('columnheader');
    fireEvent.contextMenu(headers[0]);
    expect(handleColContextMenu).not.toHaveBeenCalled();
    fireEvent.dragOver(headers[1]);
  });

  it('opens and closes column dropdown and closes col menu', () => {
    const handleCloseColMenu = vi.fn();
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: false, rowId: null, x: 0, y: 0 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: false, colIndex: null, x: 0, y: 0 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /open dropdown/i })[0]);
    expect(handleCloseColMenu).toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: /close dropdown/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /edit column no anchor/i })[0]);
  });

  it('invokes column context menu edit and delete handlers', () => {
    const handleEditColumn = vi.fn();
    const handleDeleteColumn = vi.fn();
    const handleCloseColMenu = vi.fn();
    mockUseColumnManagement.mockReturnValue(
      columnMgmt({ handleEditColumn, handleDeleteColumn })
    );
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: false, rowId: null, x: 0, y: 0 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: true, colIndex: 0, x: 10, y: 10 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /col menu edit/i }));
    expect(handleEditColumn).toHaveBeenCalled();
    expect(handleCloseColMenu).toHaveBeenCalled();
  });

  it('deletes column from column context menu', () => {
    const handleDeleteColumn = vi.fn();
    const handleCloseColMenu = vi.fn();
    mockUseColumnManagement.mockReturnValue(columnMgmt({ handleDeleteColumn }));
    mockUseTableModals.mockReturnValue({
      contextMenu: { open: false, rowId: null, x: 0, y: 0 },
      handleContextMenu: vi.fn(),
      handleCloseContextMenu: vi.fn(),
      colMenu: { open: true, colIndex: 0, x: 10, y: 10 },
      handleColContextMenu: vi.fn(),
      handleCloseColMenu,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /col menu delete/i }));
    expect(handleDeleteColumn).toHaveBeenCalledWith('col-1');
    expect(handleCloseColMenu).toHaveBeenCalled();
  });

  it('closes new column portal when open', () => {
    const setIsColumnModalOpen = vi.fn();
    mockUseColumnManagement.mockReturnValue(
      columnMgmt({ isColumnModalOpen: true, setIsColumnModalOpen })
    );

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /close new column portal/i }));
    expect(setIsColumnModalOpen).toHaveBeenCalledWith(false);
  });

  it('closes delete confirm modal and shows formula warning message', () => {
    const setDeleteConfirmModalOpen = vi.fn();
    const setFormulaUsageWarning = vi.fn();
    mockUseColumnManagement.mockReturnValue(
      columnMgmt({
        deleteConfirmModalOpen: true,
        columnToDelete: 'col-1',
        setDeleteConfirmModalOpen,
        formulaUsageWarning: ['Formula A', 'Formula B'],
        setFormulaUsageWarning,
      })
    );

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    expect(screen.getByTestId('delete-confirm-message').textContent).toMatch(/formula field/i);
    fireEvent.click(screen.getByRole('button', { name: /close delete confirm/i }));
    expect(setDeleteConfirmModalOpen).toHaveBeenCalledWith(false);
    expect(setFormulaUsageWarning).toHaveBeenCalledWith(null);
  });

  it('closes update field confirm modal', () => {
    const setUpdateFieldConfirmModalOpen = vi.fn();
    const setPendingEditColumnChanges = vi.fn();
    mockUseColumnManagement.mockReturnValue(
      columnMgmt({
        updateFieldConfirmModalOpen: true,
        setUpdateFieldConfirmModalOpen,
        setPendingEditColumnChanges,
      })
    );

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /close update field confirm/i }));
    expect(setUpdateFieldConfirmModalOpen).toHaveBeenCalledWith(false);
    expect(setPendingEditColumnChanges).toHaveBeenCalledWith(null);
  });

  it('opens grid data operation modal and closes it', async () => {
    const closeActionModal = vi.fn();
    const resetActionModal = vi.fn();
    mockUseGridDataOperationModal.mockReturnValue({
      activeAction: { id: 'find_replace', label: 'Find & Replace' },
      isOpen: true,
      openActionModal: vi.fn(),
      closeActionModal,
      resetActionModal,
    });

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    expect(screen.getByTestId('grid-data-op-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close grid op/i }));
    expect(closeActionModal).toHaveBeenCalled();
    expect(resetActionModal).toHaveBeenCalled();
  });

  it('closes edit column modal via backdrop and modal onClose', async () => {
    const setEditModalOpen = vi.fn();
    const setEditColumn = vi.fn();
    const setEditColumnIndex = vi.fn();
    mockUseColumnManagement.mockReturnValue(
      columnMgmt({
        editColumn: { id: 'col-1', key: 'name', title: 'Name', type: 'text' },
        editColumnIndex: 0,
        editModalOpen: true,
        editModalPosition: { top: 10, left: 10 },
        setEditModalOpen,
        setEditColumn,
        setEditColumnIndex,
      })
    );

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    const closeBtn = await screen.findByRole('button', { name: /close new column modal/i });
    fireEvent.click(closeBtn);
    expect(setEditModalOpen).toHaveBeenCalledWith(false);
    expect(setEditColumn).toHaveBeenCalledWith(null);
    expect(setEditColumnIndex).toHaveBeenCalledWith(null);

    // Re-open path: backdrop mousedown
    setEditModalOpen.mockClear();
    setEditColumn.mockClear();
    setEditColumnIndex.mockClear();
    const backdrop = Array.from(document.querySelectorAll('div')).find(
      (el) => el.className === 'fixed inset-0 z-50'
    );
    if (backdrop) {
      fireEvent.mouseDown(backdrop);
      expect(setEditModalOpen).toHaveBeenCalledWith(false);
    }
  });

  it('applies drag/hover header styles when indices match', () => {
    mockUseColumnManagement.mockReturnValue(
      columnMgmt({ dragColumnIndex: 0, hoverColumnIndex: 0 })
    );

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    const header = screen.getAllByRole('columnheader')[0];
    expect(header.className).toContain('opacity-50');
    expect(header.className).toContain('bg-blue-50');
  });

  it('does not reorder columns when read-only drag is attempted', () => {
    const handleColumnDragStart = vi.fn();
    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: () => true,
      canCreateColumn: () => false,
      canDeleteRecord: () => false,
      canUpdateRecord: () => false,
      canCreateRecord: () => false,
      canUpdateColumn: () => false,
      canDeleteColumn: () => false,
    });
    mockUseColumnManagement.mockReturnValue(columnMgmt({ handleColumnDragStart }));

    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);
    const headers = screen.getAllByRole('columnheader');
    fireEvent.dragStart(headers[0]);
    expect(handleColumnDragStart).not.toHaveBeenCalled();
  });
});

describe('Table - Enter on last row adds a row', () => {
  const twoRecords = {
    ...tableData,
    records: [...tableData.records, { id: '2', name: 'Row 2', value: 20 }],
  };
  const columnsWithFirstKey = (key: string) => [
    { id: 'col-x', key, column_name: key, title: key, type: 'text', isSystem: false, system: false },
    { id: 'col-2', key: 'value', column_name: 'value', title: 'Value', type: 'number', isSystem: false, system: false },
  ];

  let loadNextPage: ReturnType<typeof vi.fn>;
  let scrollIntoView: ReturnType<typeof vi.fn>;

  const overrideViewConfig = (overrides: Record<string, unknown>) => {
    const base = mockUseTableViewConfig();
    mockUseTableViewConfig.mockReturnValue({ ...base, ...overrides });
  };

  const renderTable = (props: Record<string, unknown>) => {
    const qc = new QueryClient();
    const wrap = (p: Record<string, unknown>) => (
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <Table tableData={tableData as any} onRefresh={vi.fn()} {...p} />
        </ToastProvider>
      </QueryClientProvider>
    );
    const utils = render(wrap(props));
    return { ...utils, rerenderTable: (p: Record<string, unknown>) => utils.rerender(wrap(p)) };
  };

  const pressEnter = (label: string, init: Record<string, unknown> = {}) =>
    fireEvent.keyDown(screen.getByLabelText(label), { key: 'Enter', ...init });

  beforeEach(async () => {
    vi.clearAllMocks();
    setupDefaultMocks();
    (globalThis as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    if (!(globalThis as any).CSS?.escape) {
      (globalThis as any).CSS = { ...(globalThis as any).CSS, escape: (s: string) => s };
    }
    scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView as any;
    loadNextPage = vi.fn();
    mockUseFrontendPagination.mockImplementation(({ data }: any) => ({
      allLoadedData: data,
      loadNextPage,
      hasMore: false,
      isLoadingMore: false,
    }));
    if (!Table) {
      ({ Table } = await import('../Table'));
    }
  }, 30000);

  it('creates a row and opens the first cell of the new row for editing', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const { rerenderTable } = renderTable({ actions: { addRow: { mutateAsync } }, onRefresh });

    pressEnter('input-name-1');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ model_id: 'tbl-1' }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());

    rerenderTable({ tableData: twoRecords, actions: { addRow: { mutateAsync } }, onRefresh });

    await waitFor(() => expect(mockCellEditClick).toHaveBeenCalledWith('2', 'name'));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByLabelText('edit-name-2'));
  });

  it('focuses the cell itself when it has no edit trigger', async () => {
    overrideViewConfig({ visibleColumns: columnsWithFirstKey('value') });
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const { rerenderTable } = renderTable({ actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    rerenderTable({ tableData: twoRecords, actions: { addRow: { mutateAsync } } });

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('cell-value-2')));
    expect(mockCellEditClick).not.toHaveBeenCalled();
  });

  it('gives up after retrying when the new cell never renders', async () => {
    overrideViewConfig({ visibleColumns: columnsWithFirstKey('missing') });
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const { rerenderTable } = renderTable({ actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    rerenderTable({ tableData: twoRecords, actions: { addRow: { mutateAsync } } });

    await waitFor(() => expect(rafSpy.mock.calls.length).toBeGreaterThanOrEqual(11), { timeout: 3000 });
    expect(scrollIntoView).not.toHaveBeenCalled();
    rafSpy.mockRestore();
  });

  it('ignores Enter outside a text field of the last row', () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    renderTable({ tableData: twoRecords, actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1'); // not the last row
    pressEnter('input-name-2', { shiftKey: true });
    pressEnter('input-name-2', { isComposing: true });
    fireEvent.keyDown(screen.getByLabelText('input-name-2'), { key: 'a' });
    pressEnter('color-name-2'); // non-text input
    pressEnter('edit-name-2'); // not an input

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('ignores Enter when more rows remain to be loaded', () => {
    mockUseFrontendPagination.mockImplementation(({ data }: any) => ({
      allLoadedData: data,
      loadNextPage,
      hasMore: true,
      isLoadingMore: false,
    }));
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    renderTable({ actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['the base is read-only', { isBaseReadOnly: () => true }],
    ['the user cannot create records', { canCreateRecord: () => false }],
  ])('ignores Enter when %s', (_label, access) => {
    mockUseBaseAccess.mockReturnValue({ ...mockUseBaseAccess(), ...access });
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    renderTable({ actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('does not create a second row while one is pending', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    renderTable({ actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1');
    pressEnter('input-name-1');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
  });

  it('allows retrying after the add row request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'));
    renderTable({ actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1');
    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    pressEnter('input-name-1');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2));
  });

  it('does nothing when no add row action is provided', async () => {
    renderTable({});
    pressEnter('input-name-1');
    await waitFor(() => expect(mockToastSuccess).not.toHaveBeenCalled());
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('drops the pending row when it is hidden by the current search', async () => {
    overrideViewConfig({ searchTerm: 'Row', selectedSearchField: { key: 'name' } });
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const { rerenderTable } = renderTable({ actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());

    const hiddenRecord = { ...tableData, records: [...tableData.records, { id: '2', name: 'Other', value: 20 }] };
    rerenderTable({ tableData: hiddenRecord, actions: { addRow: { mutateAsync } } });
    // Pending state is cleared, so a later visible record is not auto-focused
    rerenderTable({
      tableData: { ...hiddenRecord, records: [...hiddenRecord.records, { id: '3', name: 'Row 3', value: 30 }] },
      actions: { addRow: { mutateAsync } },
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockCellEditClick).not.toHaveBeenCalled();
  });

  it('loads the next page when the new row is not loaded yet', async () => {
    mockUseFrontendPagination.mockImplementation(({ data }: any) => ({
      allLoadedData: data.slice(0, 1),
      loadNextPage,
      hasMore: data.length > 1,
      isLoadingMore: false,
    }));
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    const { rerenderTable } = renderTable({ actions: { addRow: { mutateAsync } } });

    pressEnter('input-name-1');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    rerenderTable({ tableData: twoRecords, actions: { addRow: { mutateAsync } } });

    await waitFor(() => expect(loadNextPage).toHaveBeenCalled());
    expect(mockCellEditClick).not.toHaveBeenCalled();
  });
});

describe('Table - column header double click', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setupDefaultMocks();
    (globalThis as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
    if (!Table) {
      ({ Table } = await import('../Table'));
    }
  }, 30000);

  const withColumnHandlers = () => {
    const handleEditColumn = vi.fn();
    const handleCloseColMenu = vi.fn();
    mockUseColumnManagement.mockReturnValue({ ...mockUseColumnManagement(), handleEditColumn });
    mockUseTableModals.mockReturnValue({ ...mockUseTableModals(), handleCloseColMenu });
    return { handleEditColumn, handleCloseColMenu };
  };

  it('opens the edit column popup anchored to the header', () => {
    const { handleEditColumn, handleCloseColMenu } = withColumnHandlers();
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    const header = screen.getAllByRole('columnheader')[0];
    fireEvent.doubleClick(header);

    expect(handleCloseColMenu).toHaveBeenCalled();
    expect(handleEditColumn).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'name' }),
      0,
      { target: header },
    );
  });

  it('ignores double clicks on buttons inside the header', () => {
    const { handleEditColumn } = withColumnHandlers();
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.doubleClick(screen.getAllByRole('button', { name: /open dropdown/i })[0]);
    expect(handleEditColumn).not.toHaveBeenCalled();
  });

  it('ignores double clicks when the user cannot update columns', () => {
    const { handleEditColumn } = withColumnHandlers();
    mockUseBaseAccess.mockReturnValue({ ...mockUseBaseAccess(), canUpdateColumn: () => false });
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.doubleClick(screen.getAllByRole('columnheader')[0]);
    expect(handleEditColumn).not.toHaveBeenCalled();
  });

  it('ignores double clicks on system columns', () => {
    const { handleEditColumn } = withColumnHandlers();
    const base = mockUseTableViewConfig();
    mockUseTableViewConfig.mockReturnValue({
      ...base,
      visibleColumns: base.visibleColumns.map((c: any, i: number) => (i === 0 ? { ...c, isSystem: true, system: true } : c)),
    });
    renderWithToast(<Table tableData={tableData as any} onRefresh={vi.fn()} />);

    fireEvent.doubleClick(screen.getAllByRole('columnheader')[0]);
    expect(handleEditColumn).not.toHaveBeenCalled();
  });
});
