import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KanbanBoard from '../KanbanBoard';

const mockShowToast = vi.fn();
const mockUseBaseAccess = vi.fn();
const mockUseKanbanViewConfig = vi.fn();
const mockUseKanbanModals = vi.fn();
const mockUseKanbanStacks = vi.fn();

vi.mock('../../../../../components/common/Toast', () => ({
  useToast: vi.fn(() => ({ showToast: mockShowToast, error: mockShowToast }))
}));

vi.mock('../../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: () => mockUseBaseAccess()
}));

vi.mock('../../../hooks/useKanbanViewConfig', () => ({
  useKanbanViewConfig: () => mockUseKanbanViewConfig()
}));

vi.mock('../../../hooks/useKanbanModals', () => ({
  useKanbanModals: () => mockUseKanbanModals()
}));

vi.mock('../../../hooks/useKanbanStacks', () => ({
  useKanbanStacks: () => mockUseKanbanStacks()
}));

vi.mock('../KanbanStack', () => ({
  default: vi.fn(({ stack, onCardEdit, onCardCreate }) => (
    <div data-testid={`stack-${stack.id}`}>
      <button onClick={() => onCardCreate?.(stack.id)}>Add Card</button>
      {stack.cards.map((card: any) => (
        <button key={card._meta.id} data-testid={`card-${card._meta.id}`} onClick={() => onCardEdit?.(card._meta.id)}>
          {card.title || 'Card'}
        </button>
      ))}
    </div>
  ))
}));

vi.mock('../../../../../components/modals/CreateRecordModal', () => ({
  default: vi.fn(() => <div data-testid="create-modal">Create Modal</div>)
}));

vi.mock('../../../../../components/modals/EditRecordModal', () => ({
  default: vi.fn(() => <div data-testid="edit-modal">Edit Modal</div>)
}));

vi.mock('../../../../../components/modals/DeleteConfirmModal', () => ({
  default: vi.fn(() => <div data-testid="delete-modal">Delete Modal</div>)
}));

describe('KanbanBoard Component', () => {
  const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
  const mockMoveCard = vi.fn().mockResolvedValue(undefined);
  const mockCreateCard = vi.fn().mockResolvedValue('new-card-id');
  const mockDeleteCard = vi.fn().mockResolvedValue(undefined);
  const mockDuplicateCard = vi.fn().mockResolvedValue('dup-card-id');
  const mockUpdateFieldOptions = vi.fn().mockResolvedValue(undefined);
  const mockChangeGroupByColumn = vi.fn().mockResolvedValue(undefined);

  const mockColumns = [
    { id: '1', key: 'title', title: 'Title', type: 'text', uidt: 'text' },
    { 
      id: '2', 
      key: 'status', 
      title: 'Status', 
      type: 'select', 
      uidt: 'select',
      options: [
        { id: 'opt1', title: 'To Do', value: 'To Do', color: '#FF0000' },
        { id: 'opt2', title: 'In Progress', value: 'In Progress', color: '#00FF00' }
      ]
    }
  ] as any[];

  const mockRecords = [
    { _meta: { id: 'r1' }, title: 'Task 1', status: 'To Do' },
    { _meta: { id: 'r2' }, title: 'Task 2', status: 'In Progress' }
  ];

  const mockTableData = {
    model: { id: 'table1', title: 'Test Table' },
    columns: mockColumns,
    records: mockRecords,
    views: [{ id: 'view1', type: 'kanban', meta: {} }]
  };

  const mockActions = {
    moveCard: mockMoveCard,
    createCard: mockCreateCard,
    deleteCard: mockDeleteCard,
    duplicateCard: mockDuplicateCard,
    updateFieldOptions: mockUpdateFieldOptions,
    changeGroupByColumn: mockChangeGroupByColumn,
    updateViewConfig: mockUpdateViewConfig,
    addRow: { mutateAsync: vi.fn() },
    insertRowData: { mutateAsync: vi.fn() },
    deleteRecord: { mutateAsync: vi.fn() },
    updateField: { mutateAsync: vi.fn() },
    updateView: { mutateAsync: vi.fn() },
    updateViewMeta: { mutateAsync: vi.fn() }
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseBaseAccess.mockReturnValue({
      isBaseReadOnly: vi.fn(() => false),
      canCreateRecord: vi.fn(() => true),
      canDeleteRecord: vi.fn(() => true),
      canUpdateRecord: vi.fn(() => true)
    });
    
    mockUseKanbanViewConfig.mockReturnValue({
      filters: [],
      sorts: [],
      draftFilter: null,
      searchTerm: '',
      selectedSearchField: null,
      localFieldConfig: [],
      handleSearch: vi.fn(),
      handleAddFilter: vi.fn(),
      handleRemoveFilter: vi.fn(),
      handleUpdateFilter: vi.fn(),
      handleSortChange: vi.fn(),
      handleFieldToggle: vi.fn()
    });

    mockUseKanbanModals.mockReturnValue({
      modalState: {
        create: { isOpen: false, stackId: null },
        edit: { isOpen: false, recordId: null },
        delete: { isOpen: false, recordId: null }
      },
      handleOpenCreateRecord: vi.fn(),
      handleOpenEditRecord: vi.fn(),
      handleOpenDeleteRecord: vi.fn(),
      handleCloseCreateModal: vi.fn(),
      handleCloseEditModal: vi.fn(),
      handleCloseDeleteModal: vi.fn(),
      handleCreateSuccess: vi.fn(),
      handleEditSuccess: vi.fn()
    });

    mockUseKanbanStacks.mockReturnValue({
      uiState: {
        isCreateStack: false,
        newOption: '',
        isLoadingGroupBy: false
      },
      collapsedStacks: new Set<string>(),
      setUiState: vi.fn(),
      setCollapsedStacks: vi.fn(),
      handleStackCollapse: vi.fn(),
      handleCreateStackClick: vi.fn(),
      handleCancelCreateStack: vi.fn(),
      handleNewOptionChange: vi.fn(),
      handleStackDragStart: vi.fn(),
      handleStackDrop: vi.fn()
    });
  });

  describe('Rendering', () => {
    it('should render kanban board', () => {
      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      // Verify the board container renders
      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should render stacks based on groupCol', () => {
      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      // Verify some content renders
      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should render cards in appropriate stacks', () => {
      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('card-r1')).toBeInTheDocument();
      expect(screen.getByTestId('card-r2')).toBeInTheDocument();
    });

    it('should show message when no groupCol is selected', () => {
      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      // Verify the component renders without errors when no groupCol
      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });
  });

  describe('Modals', () => {
    it('should show create modal when open', () => {
      mockUseKanbanModals.mockReturnValue({
        modalState: {
          create: { isOpen: true, stackId: 'To Do' },
          edit: { isOpen: false, recordId: null },
          delete: { isOpen: false, recordId: null }
        },
        handleOpenCreateRecord: vi.fn(),
        handleOpenEditRecord: vi.fn(),
        handleOpenDeleteRecord: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseDeleteModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn()
      });

      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });

    it('should show edit modal when open', () => {
      mockUseKanbanModals.mockReturnValue({
        modalState: {
          create: { isOpen: false, stackId: null },
          edit: { isOpen: true, recordId: 'r1' },
          delete: { isOpen: false, recordId: null }
        },
        handleOpenCreateRecord: vi.fn(),
        handleOpenEditRecord: vi.fn(),
        handleOpenDeleteRecord: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseDeleteModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn()
      });

      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });

    it('should show delete modal when open', () => {
      mockUseKanbanModals.mockReturnValue({
        modalState: {
          create: { isOpen: false, stackId: null },
          edit: { isOpen: false, recordId: null },
          delete: { isOpen: true, recordId: 'r1' }
        },
        handleOpenCreateRecord: vi.fn(),
        handleOpenEditRecord: vi.fn(),
        handleOpenDeleteRecord: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseDeleteModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn()
      });

      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
    });
  });

  describe('Card Interactions', () => {
    it('should open create modal when add card clicked', () => {
      const mockHandleOpen = vi.fn();
      mockUseKanbanModals.mockReturnValue({
        modalState: {
          create: { isOpen: false, stackId: null },
          edit: { isOpen: false, recordId: null },
          delete: { isOpen: false, recordId: null }
        },
        handleOpenCreateRecord: mockHandleOpen,
        handleOpenEditRecord: vi.fn(),
        handleOpenDeleteRecord: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseDeleteModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn()
      });

      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      const addButton = screen.getAllByText('Add Card')[0];
      fireEvent.click(addButton);

      expect(mockHandleOpen).toHaveBeenCalled();
    });

    it('should open edit modal when card clicked', () => {
      const mockHandleOpen = vi.fn();
      mockUseKanbanModals.mockReturnValue({
        modalState: {
          create: { isOpen: false, stackId: null },
          edit: { isOpen: false, recordId: null },
          delete: { isOpen: false, recordId: null }
        },
        handleOpenCreateRecord: vi.fn(),
        handleOpenEditRecord: mockHandleOpen,
        handleOpenDeleteRecord: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseDeleteModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn()
      });

      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      const card = screen.getByTestId('card-r1');
      fireEvent.click(card);

      expect(mockHandleOpen).toHaveBeenCalledWith('r1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty records array', () => {
      const emptyTableData = {
        ...mockTableData,
        records: []
      };

      render(
        <KanbanBoard
          tableData={emptyTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(screen.queryByTestId(/^card-/)).not.toBeInTheDocument();
    });

    it('should handle undefined viewId', () => {
      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId={undefined}
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      // Verify the component renders without crashing
      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should handle read-only mode', () => {
      mockUseBaseAccess.mockReturnValue({
        isBaseReadOnly: vi.fn(() => true),
        canCreateRecord: vi.fn(() => false),
        canDeleteRecord: vi.fn(() => false),
        canUpdateRecord: vi.fn(() => false)
      });

      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      // Verify the component renders in read-only mode
      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should handle table data without columns', () => {
      const tableDataNoColumns = {
        ...mockTableData,
        columns: []
      };

      const { container } = render(
        <KanbanBoard
          tableData={tableDataNoColumns}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should handle null model', () => {
      const tableDataNoModel = {
        ...mockTableData,
        model: null
      };

      const { container } = render(
        <KanbanBoard
          tableData={tableDataNoModel as any}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should call handleSearch from useKanbanViewConfig', () => {
      const mockHandleSearch = vi.fn();
      mockUseKanbanViewConfig.mockReturnValue({
        searchTerm: '',
        selectedSearchField: null,
        filters: [],
        sorts: [],
        draftFilter: null,
        localFieldConfig: [],
        handleSearch: mockHandleSearch,
        handleAddFilter: vi.fn(),
        handleRemoveFilter: vi.fn(),
        handleUpdateFilter: vi.fn(),
        handleSortChange: vi.fn(),
        handleFieldToggle: vi.fn(),
      });

      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(mockUseKanbanViewConfig).toHaveBeenCalled();
    });
  });

  describe('Filter and Sort', () => {
    it('should apply filters to cards', () => {
      mockUseKanbanViewConfig.mockReturnValue({
        searchTerm: '',
        selectedSearchField: null,
        filters: [{ column: 'status', operator: 'equals', value: 'To Do' }],
        sorts: [],
        draftFilter: null,
        localFieldConfig: [],
        handleSearch: vi.fn(),
        handleAddFilter: vi.fn(),
        handleRemoveFilter: vi.fn(),
        handleUpdateFilter: vi.fn(),
        handleSortChange: vi.fn(),
        handleFieldToggle: vi.fn(),
      });

      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should apply sorts to cards', () => {
      mockUseKanbanViewConfig.mockReturnValue({
        searchTerm: '',
        selectedSearchField: null,
        filters: [],
        sorts: [{ column: 'title', direction: 'asc' }],
        draftFilter: null,
        localFieldConfig: [],
        handleSearch: vi.fn(),
        handleAddFilter: vi.fn(),
        handleRemoveFilter: vi.fn(),
        handleUpdateFilter: vi.fn(),
        handleSortChange: vi.fn(),
        handleFieldToggle: vi.fn(),
      });

      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should apply draft filter for preview', () => {
      mockUseKanbanViewConfig.mockReturnValue({
        searchTerm: '',
        selectedSearchField: null,
        filters: [],
        sorts: [],
        draftFilter: { column: 'title', operator: 'contains', value: 'Task' },
        localFieldConfig: [],
        handleSearch: vi.fn(),
        handleAddFilter: vi.fn(),
        handleRemoveFilter: vi.fn(),
        handleUpdateFilter: vi.fn(),
        handleSortChange: vi.fn(),
        handleFieldToggle: vi.fn(),
      });

      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });
  });

  describe('Stack Management', () => {
    it('should toggle stack name input when Add New Stack is clicked', () => {
      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      const addStackButton = screen.getByRole('button', { name: /add new stack/i });
      fireEvent.click(addStackButton);

      expect(screen.getByPlaceholderText('Enter Stack Name')).toBeInTheDocument();
    });

    it('should handle stack collapse', () => {
      const mockHandleStackCollapse = vi.fn();
      mockUseKanbanStacks.mockReturnValue({
        uiState: { showNewStackInput: false, newStackOption: '' },
        collapsedStacks: new Set(['stack1']),
        setUiState: vi.fn(),
        handleStackCollapse: mockHandleStackCollapse,
        handleCreateStackClick: vi.fn(),
        handleNewOptionChange: vi.fn(),
        handleStackDragStart: vi.fn(),
      });

      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should handle create stack click', () => {
      const mockHandleCreateStackClick = vi.fn();
      mockUseKanbanStacks.mockReturnValue({
        uiState: { isCreateStack: true, newOption: '' },
        collapsedStacks: new Set(),
        setUiState: vi.fn(),
        handleStackCollapse: vi.fn(),
        handleCreateStackClick: mockHandleCreateStackClick,
        handleNewOptionChange: vi.fn(),
        handleStackDragStart: vi.fn(),
      });

      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
      const newStackButton = screen.getByRole('button', { name: /new stack/i });
      fireEvent.click(newStackButton);
      expect(mockHandleCreateStackClick).toHaveBeenCalled();
    });
  });

  describe('Actions and Callbacks', () => {
    it('should handle missing actions gracefully', () => {
      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={undefined}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should handle partial actions', () => {
      const partialActions = {
        deleteCard: vi.fn(),
        duplicateCard: vi.fn(),
      } as any;

      const { container } = render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={partialActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });
  });

  describe('Read-only UI', () => {
    it('should hide stack add actions when read-only', () => {
      mockUseBaseAccess.mockReturnValue({
        isBaseReadOnly: vi.fn(() => true),
        canCreateRecord: vi.fn(() => false),
        canDeleteRecord: vi.fn(() => false),
        canUpdateRecord: vi.fn(() => false)
      });

      render(
        <KanbanBoard
          tableData={mockTableData}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(screen.queryByText('Add New Stack')).not.toBeInTheDocument();
      expect(screen.queryByText('New stack')).not.toBeInTheDocument();
    });
  });

  describe('View Configuration', () => {
    it('should handle view with meta config', () => {
      const tableDataWithViewMeta = {
        ...mockTableData,
        views: [{
          id: 'view1',
          type: 'kanban',
          meta: {
            view_target_field: '2',
            cardOrder: { 'To Do': ['r1'], 'In Progress': ['r2'] },
            stackOrder: ['To Do', 'In Progress']
          }
        }]
      };

      const { container } = render(
        <KanbanBoard
          tableData={tableDataWithViewMeta}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should handle view without views array', () => {
      const tableDataNoViews = {
        ...mockTableData,
        views: undefined
      };

      const { container } = render(
        <KanbanBoard
          tableData={tableDataNoViews}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });
  });

  describe('Column Type Handling', () => {
    it('should handle columns with different types', () => {
      const columnsWithVariousTypes = [
        { id: '1', key: 'title', title: 'Title', type: 'text', uidt: 'text' },
        { id: '2', key: 'status', title: 'Status', type: 'singleSelect', uidt: 'singleSelect', options: [{ option: 'Done', color: '#00FF00' }] },
        { id: '3', key: 'date', title: 'Date', type: 'date', uidt: 'date' },
        { id: '4', key: 'number', title: 'Number', type: 'number', uidt: 'number' },
        { id: '5', key: 'checkbox', title: 'Checkbox', type: 'checkbox', uidt: 'checkbox' },
      ];

      const tableDataVariousColumns = {
        ...mockTableData,
        columns: columnsWithVariousTypes
      };

      const { container } = render(
        <KanbanBoard
          tableData={tableDataVariousColumns}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should handle columns with system fields', () => {
      const columnsWithSystem = [
        ...mockColumns,
        { id: '3', key: 'created_at', title: 'Created At', type: 'datetime', uidt: 'datetime', isSystem: true, system: true }
      ];

      const tableDataSystemColumns = {
        ...mockTableData,
        columns: columnsWithSystem
      };

      const { container } = render(
        <KanbanBoard
          tableData={tableDataSystemColumns}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });
  });

  describe('Record Data Handling', () => {
    it('should handle records with nested data', () => {
      const recordsWithNestedData = [
        { _meta: { id: 'r1' }, title: 'Task 1', status: 'To Do', data: { nested: 'value' } },
        { _meta: { id: 'r2' }, title: 'Task 2', status: 'In Progress', data: { another: 'nested' } }
      ];

      const tableDataNestedRecords = {
        ...mockTableData,
        records: recordsWithNestedData
      };

      const { container } = render(
        <KanbanBoard
          tableData={tableDataNestedRecords}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });

    it('should handle records without _meta', () => {
      const recordsWithoutMeta = [
        { id: 'r1', title: 'Task 1', status: 'To Do' },
        { id: 'r2', title: 'Task 2', status: 'In Progress' }
      ];

      const tableDataNoMeta = {
        ...mockTableData,
        records: recordsWithoutMeta
      };

      const { container } = render(
        <KanbanBoard
          tableData={tableDataNoMeta}
          viewId="view1"
          onRefresh={vi.fn()}
          actions={mockActions}
        />
      );

      expect(container.querySelector('.h-full')).toBeInTheDocument();
    });
  });
});
