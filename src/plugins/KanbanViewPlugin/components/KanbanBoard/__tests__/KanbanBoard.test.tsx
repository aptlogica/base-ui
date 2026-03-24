import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ToastProvider } from '../../../../../components/common/Toast';
let KanbanBoard: typeof import('../KanbanBoard').default;

const mockUseKanbanViewConfig = vi.fn();
const mockUseKanbanModals = vi.fn();
const mockUseKanbanStacks = vi.fn();
const mockUseBaseAccess = vi.fn();
let lastCreateRecordProps: any = null;
let lastEditRecordProps: any = null;

vi.mock('../../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: mockUseBaseAccess,
}));


vi.mock('../../../hooks/useKanbanViewConfig', () => ({
  useKanbanViewConfig: mockUseKanbanViewConfig,
}));

vi.mock('../../../hooks/useKanbanModals', () => ({
  useKanbanModals: mockUseKanbanModals,
}));

vi.mock('../../../hooks/useKanbanStacks', () => ({
  useKanbanStacks: mockUseKanbanStacks,
}));

vi.mock('../../../../../components/shared/table/FilterPopover', () => ({
  FilterPopover: () => <div data-testid="filter-popover" />,
}));

vi.mock('../../../../../components/shared/table/FieldsPopover', () => ({
  FieldsPopover: () => <div data-testid="fields-popover" />,
}));

vi.mock('../../../../../components/shared/table/SortPopover', () => ({
  SortPopover: () => <div data-testid="sort-popover" />,
}));

vi.mock('../../../../../components/shared/table/Search', () => ({
  Search: ({ onSearch }: any) => (
    <button type="button" onClick={() => onSearch?.('', null)}>
      Search
    </button>
  ),
}));

vi.mock('../../KanbanFieldSelector', () => ({
  KanbanFieldConfiguration: () => <div data-testid="kanban-field-config" />,
}));

vi.mock('../KanbanStack', () => ({
  __esModule: true,
  default: ({ stack, onCardCreate, onCardEdit, onCardDelete, onStackDrop, onStackEdit, onStackDelete }: any) => (
    <div data-testid={`stack-${stack.id}`}>
      <span>{stack.name}</span>
      <button type="button" onClick={() => onCardCreate?.(stack.id)}>create-card</button>
      <button type="button" onClick={() => onCardEdit?.(stack.id)}>edit-card</button>
      <button type="button" onClick={() => onCardDelete?.(stack.id)}>delete-card</button>
      <button
        type="button"
        onClick={() => {
          const e = {
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
            dataTransfer: { getData: () => 'Todo' },
          } as any;
          onStackDrop?.(stack.id, e);
        }}
      >
        drop-stack
      </button>
      <button type="button" onClick={() => onStackEdit?.('Todo', 'Done')}>edit-stack</button>
      <button type="button" onClick={() => onStackDelete?.('Todo')}>delete-stack</button>
    </div>
  ),
}));

vi.mock('../../../../../components/modals/CreateRecordModal', () => ({
  __esModule: true,
  default: (props: any) => {
    lastCreateRecordProps = props;
    return <div data-testid="create-record-modal" />;
  },
}));

vi.mock('../../../../../components/modals/EditRecordModal', () => ({
  __esModule: true,
  default: (props: any) => {
    lastEditRecordProps = props;
    return <div data-testid="edit-record-modal" />;
  },
}));

vi.mock('../../../../../components/modals/DeleteConfirmModal', () => ({
  __esModule: true,
  default: () => <div data-testid="delete-confirm-modal" />,
}));

const baseTableData = {
  model: { id: 'tbl-1', base_id: 'base-1', title: 'Table' },
  columns: [
    { id: 'col-1', title: 'Status', column_name: 'status', uidt: 'select', meta: { options: ['Todo', 'Done'] } },
    { id: 'col-2', title: 'Title', column_name: 'title', uidt: 'text' },
  ],
  records: [
    { id: 'r1', status: 'Todo', title: 'Task 1' },
    { id: 'r2', status: 'Done', title: 'Task 2' },
  ],
  views: [{ id: 'v1', type: 'kanban', meta: { view_target_field: 'col-1', stackOrder: ['Uncategorized', 'Todo', 'Done'] } }],
};

const setupDefaultMocks = () => {
  mockUseBaseAccess.mockReturnValue({
    isBaseReadOnly: () => false,
    canCreateRecord: () => true,
    canDeleteRecord: () => true,
    canUpdateRecord: () => true,
  });


  mockUseKanbanViewConfig.mockReturnValue({
    searchTerm: '',
    selectedSearchField: null,
    filters: [],
    sorts: [],
    draftFilter: null,
    localFieldConfig: {},
    handleSearch: vi.fn(),
    handleAddFilter: vi.fn(),
    handleRemoveFilter: vi.fn(),
    handleUpdateFilter: vi.fn(),
    handleSortChange: vi.fn(),
    handleFieldToggle: vi.fn(),
  });

  mockUseKanbanModals.mockReturnValue({
    modalState: {
      create: { isOpen: false, stackId: null },
      edit: { isOpen: false, recordId: null },
      delete: { isOpen: false, recordId: null },
    },
    handleOpenCreateRecord: vi.fn(),
    handleOpenEditRecord: vi.fn(),
    handleOpenDeleteRecord: vi.fn(),
    handleCloseCreateModal: vi.fn(),
    handleCloseEditModal: vi.fn(),
    handleCloseDeleteModal: vi.fn(),
    handleCreateSuccess: vi.fn(),
    handleEditSuccess: vi.fn(),
  });

  mockUseKanbanStacks.mockReturnValue({
    uiState: { isCreateStack: false, newOption: 'New Stack' },
    collapsedStacks: new Set<string>(),
    setUiState: vi.fn(),
    handleStackCollapse: vi.fn(),
    handleCreateStackClick: vi.fn(),
    handleNewOptionChange: vi.fn(),
    handleStackDragStart: vi.fn(),
  });
};

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastCreateRecordProps = null;
    lastEditRecordProps = null;
    setupDefaultMocks();
  });

  beforeEach(async () => {
    if (!KanbanBoard) {
      ({ default: KanbanBoard } = await import('../KanbanBoard'));
    }
  });

  it('renders stacks and actions when not read-only', () => {
    render(
      <ToastProvider>
        <KanbanBoard tableData={baseTableData as any} onRefresh={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByTestId('stack-Todo')).toBeInTheDocument();
    expect(screen.getByTestId('stack-Done')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new stack/i })).toBeInTheDocument();
  });

  it('hides add stack and card actions when read-only', () => {
    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: () => true,
      canCreateRecord: () => false,
      canDeleteRecord: () => false,
      canUpdateRecord: () => false,
    });

    render(
      <ToastProvider>
        <KanbanBoard tableData={baseTableData as any} onRefresh={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.queryByRole('button', { name: /add new stack/i })).not.toBeInTheDocument();
  });

  it('creates a new stack on Enter and handles duplicates', async () => {
    const updateFieldOptions = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const { unmount } = render(
      <ToastProvider>
        <KanbanBoard
          tableData={baseTableData as any}
          onRefresh={onRefresh}
          actions={{
            updateFieldOptions,
            changeGroupByColumn: vi.fn(),
            updateViewConfig: vi.fn(),
            deleteCard: vi.fn(),
            duplicateCard: vi.fn(),
            addRow: {} as any,
            insertRowData: { mutateAsync: vi.fn() } as any,
            deleteRecord: {} as any,
            updateField: {} as any,
            updateView: {} as any,
            updateViewMeta: { mutateAsync: vi.fn() } as any,
          }}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /add new stack/i }));
    const input = screen.getByPlaceholderText('Enter Stack Name');
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(updateFieldOptions).toHaveBeenCalled();
      expect(onRefresh).toHaveBeenCalled();
    });

    unmount();

    const duplicateData = {
      ...baseTableData,
      columns: [
        { id: 'col-1', title: 'Status', column_name: 'status', uidt: 'select', meta: { options: ['New Stack'] } },
      ],
    };

    render(
      <ToastProvider>
        <KanbanBoard
          tableData={duplicateData as any}
          onRefresh={vi.fn()}
          actions={{
            updateFieldOptions,
            changeGroupByColumn: vi.fn(),
            updateViewConfig: vi.fn(),
            deleteCard: vi.fn(),
            duplicateCard: vi.fn(),
            addRow: {} as any,
            insertRowData: { mutateAsync: vi.fn() } as any,
            deleteRecord: {} as any,
            updateField: {} as any,
            updateView: {} as any,
            updateViewMeta: { mutateAsync: vi.fn() } as any,
          }}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /add new stack/i }));
    const dupInput = screen.getByPlaceholderText('Enter Stack Name');
    fireEvent.keyDown(dupInput, { key: 'Enter' });

    expect(updateFieldOptions).toHaveBeenCalledTimes(1);
  });

  it('persists stack order on drop', async () => {
    const updateViewMeta = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    render(
      <ToastProvider>
        <KanbanBoard
          tableData={baseTableData as any}
          onRefresh={vi.fn()}
          actions={{
            updateFieldOptions: vi.fn(),
            changeGroupByColumn: vi.fn(),
            updateViewConfig: vi.fn(),
            deleteCard: vi.fn(),
            duplicateCard: vi.fn(),
            addRow: {} as any,
            insertRowData: { mutateAsync: vi.fn() } as any,
            deleteRecord: {} as any,
            updateField: {} as any,
            updateView: {} as any,
            updateViewMeta,
          }}
        />
      </ToastProvider>
    );

    fireEvent.click(screen.getAllByText('drop-stack')[0]);

    await waitFor(() => {
      expect(updateViewMeta.mutateAsync).toHaveBeenCalled();
    });
  });

  it('updates field options when deleting a stack', async () => {
    const insertRowData = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    const updateFieldOptions = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();

    render(
      <ToastProvider>
        <KanbanBoard
          tableData={baseTableData as any}
          onRefresh={onRefresh}
          actions={{
            updateFieldOptions,
            changeGroupByColumn: vi.fn(),
            updateViewConfig: vi.fn(),
            deleteCard: vi.fn(),
            duplicateCard: vi.fn(),
            addRow: {} as any,
            insertRowData,
            deleteRecord: {} as any,
            updateField: {} as any,
            updateView: {} as any,
            updateViewMeta: { mutateAsync: vi.fn() } as any,
          }}
        />
      </ToastProvider>
    );

    const stack = screen.getByTestId('stack-Todo');
    fireEvent.click(within(stack).getByText('delete-stack'));

    await waitFor(() => {
      expect(insertRowData.mutateAsync).toHaveBeenCalled();
      expect(updateFieldOptions).toHaveBeenCalled();
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('handles stack rename and duplicate name error', async () => {
    const updateFieldOptions = vi.fn().mockResolvedValue(undefined);
    const updateViewMeta = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    const insertRowData = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
    const renameData = {
      ...baseTableData,
      columns: [
        { id: 'col-1', title: 'Status', column_name: 'status', uidt: 'select', meta: { options: ['Todo'] } },
        { id: 'col-2', title: 'Title', column_name: 'title', uidt: 'text' },
      ],
      records: [{ id: 'r1', status: 'Todo', title: 'Task 1' }],
    };

    const { unmount } = render(
      <ToastProvider>
        <KanbanBoard
          tableData={renameData as any}
          onRefresh={vi.fn()}
          actions={{
            updateFieldOptions,
            changeGroupByColumn: vi.fn(),
            updateViewConfig: vi.fn(),
            deleteCard: vi.fn(),
            duplicateCard: vi.fn(),
            addRow: {} as any,
            insertRowData,
            deleteRecord: {} as any,
            updateField: {} as any,
            updateView: {} as any,
            updateViewMeta,
          }}
        />
      </ToastProvider>
    );

    const renameStack = screen.getByTestId('stack-Todo');
    fireEvent.click(within(renameStack).getByText('edit-stack'));

    await waitFor(() => {
      expect(updateFieldOptions).toHaveBeenCalled();
      expect(updateViewMeta.mutateAsync).toHaveBeenCalled();
      expect(insertRowData.mutateAsync).toHaveBeenCalled();
    });

    unmount();

    const duplicateOptionsData = {
      ...baseTableData,
      columns: [
        { id: 'col-1', title: 'Status', column_name: 'status', uidt: 'select', meta: { options: ['Todo', 'Done'] } },
      ],
    };

    render(
      <ToastProvider>
        <KanbanBoard
          tableData={duplicateOptionsData as any}
          onRefresh={vi.fn()}
          actions={{
            updateFieldOptions,
            changeGroupByColumn: vi.fn(),
            updateViewConfig: vi.fn(),
            deleteCard: vi.fn(),
            duplicateCard: vi.fn(),
            addRow: {} as any,
            insertRowData,
            deleteRecord: {} as any,
            updateField: {} as any,
            updateView: {} as any,
            updateViewMeta,
          }}
        />
      </ToastProvider>
    );

    const stack = screen.getByTestId('stack-Todo');
    fireEvent.click(within(stack).getByText('edit-stack'));
    expect(updateFieldOptions).toHaveBeenCalledTimes(1);
  });

  it('renders create modal with stack initial values', () => {
    mockUseKanbanModals.mockReturnValue({
      modalState: {
        create: { isOpen: true, stackId: 'Todo' },
        edit: { isOpen: false, recordId: null },
        delete: { isOpen: false, recordId: null },
      },
      handleOpenCreateRecord: vi.fn(),
      handleOpenEditRecord: vi.fn(),
      handleOpenDeleteRecord: vi.fn(),
      handleCloseCreateModal: vi.fn(),
      handleCloseEditModal: vi.fn(),
      handleCloseDeleteModal: vi.fn(),
      handleCreateSuccess: vi.fn(),
      handleEditSuccess: vi.fn(),
    });

    render(
      <ToastProvider>
        <KanbanBoard tableData={baseTableData as any} onRefresh={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByTestId('create-record-modal')).toBeInTheDocument();
    expect(lastCreateRecordProps?.initialValues?.['col-1']).toBe('Todo');
  });

  it('renders create modal with empty initial values for Uncategorized', () => {
    mockUseKanbanModals.mockReturnValue({
      modalState: {
        create: { isOpen: true, stackId: 'Uncategorized' },
        edit: { isOpen: false, recordId: null },
        delete: { isOpen: false, recordId: null },
      },
      handleOpenCreateRecord: vi.fn(),
      handleOpenEditRecord: vi.fn(),
      handleOpenDeleteRecord: vi.fn(),
      handleCloseCreateModal: vi.fn(),
      handleCloseEditModal: vi.fn(),
      handleCloseDeleteModal: vi.fn(),
      handleCreateSuccess: vi.fn(),
      handleEditSuccess: vi.fn(),
    });

    render(
      <ToastProvider>
        <KanbanBoard tableData={baseTableData as any} onRefresh={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByTestId('create-record-modal')).toBeInTheDocument();
    expect(lastCreateRecordProps?.initialValues?.['col-1']).toBe('');
  });

  it('renders edit and delete modals when open', () => {
    mockUseKanbanModals.mockReturnValue({
      modalState: {
        create: { isOpen: false, stackId: null },
        edit: { isOpen: true, recordId: 'r1' },
        delete: { isOpen: true, recordId: 'r1' },
      },
      handleOpenCreateRecord: vi.fn(),
      handleOpenEditRecord: vi.fn(),
      handleOpenDeleteRecord: vi.fn(),
      handleCloseCreateModal: vi.fn(),
      handleCloseEditModal: vi.fn(),
      handleCloseDeleteModal: vi.fn(),
      handleCreateSuccess: vi.fn(),
      handleEditSuccess: vi.fn(),
    });

    render(
      <ToastProvider>
        <KanbanBoard tableData={baseTableData as any} onRefresh={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByTestId('edit-record-modal')).toBeInTheDocument();
    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
  });

  it('calls handleSearch when using the search control', () => {
    const handleSearch = vi.fn();
    mockUseKanbanViewConfig.mockReturnValue({
      searchTerm: '',
      selectedSearchField: null,
      filters: [],
      sorts: [],
      draftFilter: null,
      localFieldConfig: {},
      handleSearch,
      handleAddFilter: vi.fn(),
      handleRemoveFilter: vi.fn(),
      handleUpdateFilter: vi.fn(),
      handleSortChange: vi.fn(),
      handleFieldToggle: vi.fn(),
    });

    render(
      <ToastProvider>
        <KanbanBoard tableData={baseTableData as any} onRefresh={vi.fn()} />
      </ToastProvider>
    );

    fireEvent.click(screen.getAllByText('Search')[0]);
    expect(handleSearch).toHaveBeenCalled();
  });
});
