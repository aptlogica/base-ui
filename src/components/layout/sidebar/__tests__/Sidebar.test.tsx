import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Sidebar from '../Sidebar';

const mockOnClose = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

const mockCurrentWorkspace = { id: 'ws-1', title: 'Workspace 1' };
const mockSelectedBase = {
  id: 'base-1',
  title: 'Base 1',
  meta: { pinnedTables: {} },
};
const mockBaseTablesData = [
  {
    model: {
      id: 'table-1',
      base_id: 'base-1',
      workspace_id: 'ws-1',
      title: 'Table 1',
    },
  },
];
const mockBaseTables = { data: mockBaseTablesData };

const mockSetShowCreateBaseWorkspaceId = vi.fn();
const mockSetShowCreateTableBaseId = vi.fn();
const mockSetShowCreateViewModal = vi.fn();
const mockSetPopoverRef = vi.fn();
const mockToggleTableExpansion = vi.fn();
const mockNavigateToTable = vi.fn();
const mockNavigateToView = vi.fn();
const mockHandleCreateBaseForWorkspace = vi.fn();
const mockHandleEditTable = vi.fn();
const mockHandleDeleteTable = vi.fn();
const mockHandleDeleteView = vi.fn();
const mockIsTableActive = vi.fn().mockReturnValue(false);
const mockIsViewActive = vi.fn().mockReturnValue(false);
const mockCreateTableMutateAsync = vi.fn();
const mockCreateViewMutateAsync = vi.fn();
const mockUpdateBaseMutate = vi.fn();
const mockUpdateBaseMutateAsync = vi.fn();

vi.mock('../../common/Toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../../hooks/workspace/useWorkspaceBusinessLogic', () => ({
  useWorkspaceBusinessLogic: vi.fn(),
}));

vi.mock('../../../hooks/useBaseAccess', () => ({
  useBaseAccess: vi.fn(),
}));

vi.mock('../../../hooks/useApi', () => ({
  useUpdateBase: () => ({
    mutate: mockUpdateBaseMutate,
    mutateAsync: mockUpdateBaseMutateAsync,
  }),
}));

vi.mock('../../modals/CreateTableModal', () => ({
  CreateTableModal: () => <div data-testid="create-table-modal">Create Table Modal</div>,
}));

vi.mock('../../modals/ImportModal', () => ({
  ImportModal: () => <div data-testid="import-modal">Import Modal</div>,
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('../../modals/CreateBaseModal', () => ({
  CreateBaseModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="create-base-modal">
        <button type="button" onClick={onClose}>
          Close Base Modal
        </button>
      </div>
    ) : null,
}));

vi.mock('../../tables/TableOptionsMenu', () => ({
  default: () => <div data-testid="table-options-menu">Table Options</div>,
}));

vi.mock('../components/TableViewsWithData', () => ({
  TableViewsWithData: () => <div data-testid="table-views-with-data">Table Views</div>,
}));

vi.mock('../components/CreateViewModalWrapper', () => ({
  CreateViewModalWrapper: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="create-view-modal-wrapper">
      <button type="button" onClick={onClose}>
        Close View Modal
      </button>
    </div>
  ),
}));

vi.mock('../../ui/Loader', () => ({
  Loader: () => <div data-testid="loader">Loading</div>,
}));

vi.mock('../../common/Skeleton/SidebarSkeleton', () => ({
  SidebarSkeleton: ({ itemCount }: { itemCount: number }) => (
    <div data-testid="sidebar-skeleton" data-item-count={itemCount}>
      Skeleton {itemCount}
    </div>
  ),
}));

import { useWorkspaceBusinessLogic } from '../../../hooks/workspace/useWorkspaceBusinessLogic';
import { useBaseAccess } from '../../../hooks/useBaseAccess';

const useWorkspaceBusinessLogicMock = vi.mocked(useWorkspaceBusinessLogic);
const useBaseAccessMock = vi.mocked(useBaseAccess);

const SIDEBAR_SKELETON_ITEM_COUNT = 5;

function getDefaultWorkspaceState() {
  return {
    currentWorkspace: mockCurrentWorkspace,
    selectedBase: mockSelectedBase,
    baseTables: mockBaseTables,
    loading: false,
    error: null,
    selectedWorkspaceId: 'ws-1',
    selectedBaseId: 'base-1',
    expandedTables: [] as string[],
    showCreateBaseWorkspaceId: null as string | null,
    setShowCreateBaseWorkspaceId: mockSetShowCreateBaseWorkspaceId,
    showCreateTableBaseId: null as string | null,
    setShowCreateTableBaseId: mockSetShowCreateTableBaseId,
    showCreateViewModal: null as { tableId: string; viewType: string } | null,
    setShowCreateViewModal: mockSetShowCreateViewModal,
    popoverRef: null as HTMLDivElement | null,
    setPopoverRef: mockSetPopoverRef,
    toggleTableExpansion: mockToggleTableExpansion,
    navigateToTable: mockNavigateToTable,
    navigateToView: mockNavigateToView,
    handleCreateBaseForWorkspace: mockHandleCreateBaseForWorkspace,
    handleEditTable: mockHandleEditTable,
    handleDeleteTable: mockHandleDeleteTable,
    handleDeleteView: mockHandleDeleteView,
    isTableActive: mockIsTableActive,
    isViewActive: mockIsViewActive,
    createTableMutation: { mutateAsync: mockCreateTableMutateAsync },
    createViewMutation: { mutateAsync: mockCreateViewMutateAsync },
    flyoutOpen: true,
  };
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateBaseMutateAsync.mockResolvedValue(undefined);
    useWorkspaceBusinessLogicMock.mockReturnValue(
      getDefaultWorkspaceState() as ReturnType<typeof useWorkspaceBusinessLogicMock>
    );
    useBaseAccessMock.mockReturnValue({
      canCreateTable: vi.fn().mockReturnValue(true),
    } as ReturnType<typeof useBaseAccessMock>);
  });

  describe('Rendering', () => {
    it('should render nothing when flyoutOpen is false', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        flyoutOpen: false,
      } as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.queryByText('Table 1')).not.toBeInTheDocument();
    });

    it('should render SidebarSkeleton when loading', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        loading: true,
      } as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      const skeleton = screen.getByTestId('sidebar-skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveAttribute(
        'data-item-count',
        String(SIDEBAR_SKELETON_ITEM_COUNT)
      );
    });

    it('should render error message when error is set', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        error: 'Something went wrong',
      } as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      const { container } = render(<Sidebar />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(container.querySelector('.flyout-error')).toBeInTheDocument();
    });

    it('should render Please select a workspace when no currentWorkspace', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        currentWorkspace: null,
      } as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.getByText('Please select a workspace')).toBeInTheDocument();
    });

    it('should render Please select a base when no selectedBase', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        selectedBase: null,
      } as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.getByText('Please select a base to view tables')).toBeInTheDocument();
    });

    it('should render table list when workspace base and tables exist', () => {
      render(<Sidebar />);
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });

    it('should render No tables message when sortedTables is empty', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        baseTables: { data: [] },
      } as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(
        screen.getByText('No tables in this base. Create your first table to get started.')
      ).toBeInTheDocument();
    });

    it('should render Create Table button when canCreateTable', () => {
      render(<Sidebar />);
      expect(screen.getByRole('button', { name: /create table/i })).toBeInTheDocument();
    });

    it('should render Import Table button when canCreateTable', () => {
      render(<Sidebar />);
      expect(screen.getByRole('button', { name: /import table/i })).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('should call navigateToTable when table name is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      const tableButton = screen.getByRole('button', { name: /navigate to table 1/i });

      await user.click(tableButton);

      expect(mockNavigateToTable).toHaveBeenCalledWith('ws-1', 'base-1', 'table-1');
    });

    it('should call onClose when table is clicked in non-layout mode', async () => {
      const user = userEvent.setup();
      render(<Sidebar onClose={mockOnClose} />);
      const tableButton = screen.getByRole('button', { name: /navigate to table 1/i });

      await user.click(tableButton);

      expect(mockNavigateToTable).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call setShowCreateTableBaseId when Create Table is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      const createTableButton = screen.getByRole('button', { name: /create table/i });

      await user.click(createTableButton);

      expect(mockSetShowCreateTableBaseId).toHaveBeenCalledWith('base-1');
    });

    it('should call toggleTableExpansion when chevron is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);
      const expandButtons = screen.getAllByRole('button', {
        name: /expand table|collapse table/i,
      });

      await user.click(expandButtons[0]);

      expect(mockToggleTableExpansion).toHaveBeenCalledWith('table-1');
    });
  });

  describe('selectedWorkspace prop', () => {
    it('should use propSelectedWorkspace when provided', () => {
      const propWorkspace = { id: 'ws-prop', title: 'Prop Workspace' };
      render(<Sidebar selectedWorkspace={propWorkspace} />);
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should not render Create Table when selectedBase is null', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        selectedBase: null,
      } as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.queryByRole('button', { name: /create table/i })).not.toBeInTheDocument();
    });

    it('should not render Create Table when cannot create table', () => {
      useBaseAccessMock.mockReturnValue({
        canCreateTable: vi.fn().mockReturnValue(false),
      } as ReturnType<typeof useBaseAccessMock>);
      render(<Sidebar />);
      expect(screen.queryByRole('button', { name: /create table/i })).not.toBeInTheDocument();
    });

    it('should render TableViewsWithData when table is expanded', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        expandedTables: ['table-1'],
      } as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.getByTestId('table-views-with-data')).toBeInTheDocument();
    });

    it('should render TableOptionsMenu for each table', () => {
      render(<Sidebar />);
      expect(screen.getByTestId('table-options-menu')).toBeInTheDocument();
    });
  });
});
