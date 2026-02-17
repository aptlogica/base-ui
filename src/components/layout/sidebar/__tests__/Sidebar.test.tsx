import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('../../../common/Toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../../../hooks/workspace/useWorkspaceBusinessLogic', () => ({
  useWorkspaceBusinessLogic: vi.fn(),
}));

vi.mock('../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: vi.fn(),
}));

vi.mock('../../../../hooks/useApi', () => ({
  useUpdateBase: () => ({
    mutate: mockUpdateBaseMutate,
    mutateAsync: mockUpdateBaseMutateAsync,
  }),
}));

vi.mock('../../../modals/CreateTableModal', () => ({
  CreateTableModal: ({
    isOpen,
    onClose,
    onCreate,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (payload: { name: string; description?: string }) => Promise<void>;
  }) =>
    isOpen ? (
      <div data-testid="create-table-modal">
        Create Table Modal
        <button type="button" onClick={() => onCreate({ name: 'Created Table', description: 'Desc' })}>
          Submit Create Table
        </button>
        <button type="button" onClick={onClose}>
          Close Create Table
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../modals/ImportModal', () => ({
  ImportModal: ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => (
    <div data-testid="import-modal">
      Import Modal
      <button type="button" onClick={onClose}>
        Close Import Modal
      </button>
      <button type="button" onClick={() => onSuccess?.()}>
        Import Success
      </button>
    </div>
  ),
}));

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock('../../../modals/CreateBaseModal', () => ({
  CreateBaseModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="create-base-modal">
        <button type="button" onClick={onClose}>
          Close Base Modal
        </button>
      </div>
    ) : null,
}));

vi.mock('../../../tables/TableOptionsMenu', () => ({
  default: ({ onPinToggle, isPinned, table }: { onPinToggle?: (id: string, status: boolean) => void; isPinned?: boolean; table: { id: string } }) => (
    <div data-testid="table-options-menu">
      Table Options
      <button type="button" onClick={() => onPinToggle?.(table.id, !isPinned)}>
        Toggle Pin
      </button>
    </div>
  ),
}));

vi.mock('../components/TableViewsWithData', () => ({
  TableViewsWithData: () => <div data-testid="table-views-with-data">Table Views</div>,
}));

vi.mock('../components/CreateViewModalWrapper', () => ({
  CreateViewModalWrapper: ({
    onClose,
    onCreate,
  }: {
    onClose: () => void;
    onCreate: (payload: {
      name: string;
      description?: string;
      type: string;
      fieldId?: string | { value: string } | null;
      startDateFieldId?: string | { value: string } | null;
      endDateFieldId?: string | { value: string } | null;
    }) => Promise<void>;
  }) => (
    <div data-testid="create-view-modal-wrapper">
      <button type="button" onClick={onClose}>
        Close View Modal
      </button>
      <button
        type="button"
        onClick={() =>
          onCreate({
            name: 'Calendar View',
            type: 'calendar',
            fieldId: { value: 'date-col' },
          })
        }
      >
        Submit Calendar View
      </button>
      <button
        type="button"
        onClick={() =>
          onCreate({
            name: 'Gantt View',
            type: 'ganttchart',
            startDateFieldId: { value: 'start-col' },
            endDateFieldId: { value: 'end-col' },
          })
        }
      >
        Submit Gantt View
      </button>
    </div>
  ),
}));

vi.mock('../../../ui/Loader', () => ({
  Loader: () => <div data-testid="loader">Loading</div>,
}));

vi.mock('../../../common/Skeleton/SidebarSkeleton', () => ({
  SidebarSkeleton: ({ itemCount }: { itemCount: number }) => (
    <div data-testid="sidebar-skeleton" data-item-count={itemCount}>
      Skeleton {itemCount}
    </div>
  ),
}));

import { useWorkspaceBusinessLogic } from '../../../../hooks/workspace/useWorkspaceBusinessLogic';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';

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
    mockCreateTableMutateAsync.mockResolvedValue({ data: { id: 'new-table-id' } });
    mockCreateViewMutateAsync.mockResolvedValue({ data: { id: 'new-view-id' } });
    useWorkspaceBusinessLogicMock.mockReturnValue(
      getDefaultWorkspaceState() as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>
    );
    useBaseAccessMock.mockReturnValue({
      canCreateTable: vi.fn().mockReturnValue(true),
    } as unknown as ReturnType<typeof useBaseAccessMock>);
  });

  describe('Rendering', () => {
    it('should render nothing when flyoutOpen is false', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        flyoutOpen: false,
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.queryByText('Table 1')).not.toBeInTheDocument();
    });

    it('should render SidebarSkeleton when loading', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        loading: true,
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
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
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      const { container } = render(<Sidebar />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(container.querySelector('.flyout-error')).toBeInTheDocument();
    });

    it('should render Please select a workspace when no currentWorkspace', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        currentWorkspace: null,
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.getByText('Please select a workspace')).toBeInTheDocument();
    });

    it('should render Please select a base when no selectedBase', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        selectedBase: null,
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
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
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
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

    it('should disable Import Table button when selectedBase is null', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        selectedBase: null,
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.getByRole('button', { name: /import table/i })).toBeDisabled();
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

    it('opens import modal when Import Table is clicked', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      await user.click(screen.getByRole('button', { name: /import table/i }));

      expect(await screen.findByTestId('import-modal')).toBeInTheDocument();
    });

    it('closes import modal when import modal onClose is triggered', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      await user.click(screen.getByRole('button', { name: /import table/i }));
      expect(await screen.findByTestId('import-modal')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /close import modal/i }));
      expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();
    });

    it('closes import modal and shows success toast on import success', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      await user.click(screen.getByRole('button', { name: /import table/i }));
      expect(await screen.findByTestId('import-modal')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /import success/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();
      });
      expect(mockToast.success).toHaveBeenCalledWith('Table imported successfully');
    });

    it('persists pinned state when toggled from table options', async () => {
      const user = userEvent.setup();
      render(<Sidebar />);

      await user.click(screen.getByRole('button', { name: /toggle pin/i }));

      await waitFor(() => {
        expect(mockUpdateBaseMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            baseId: 'base-1',
            updates: expect.objectContaining({
              meta: expect.objectContaining({
                pinnedTables: { 'table-1': true },
              }),
            }),
          })
        );
      });
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
    it('should render disabled Create Table button when selectedBase is null', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        selectedBase: null,
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      const createTableButton = screen.getByRole('button', { name: /create table/i });
      expect(createTableButton).toBeDisabled();
    });

    it('should not render Create Table when cannot create table', () => {
      useBaseAccessMock.mockReturnValue({
        canCreateTable: vi.fn().mockReturnValue(false),
      } as unknown as ReturnType<typeof useBaseAccessMock>);
      render(<Sidebar />);
      expect(screen.queryByRole('button', { name: /create table/i })).not.toBeInTheDocument();
    });

    it('should render TableViewsWithData when table is expanded', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        expandedTables: ['table-1'],
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);
      expect(screen.getByTestId('table-views-with-data')).toBeInTheDocument();
    });

    it('should render TableOptionsMenu for each table', () => {
      render(<Sidebar />);
      expect(screen.getByTestId('table-options-menu')).toBeInTheDocument();
    });

    it('renders create base modal when requested and closes it', async () => {
      const user = userEvent.setup();
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        showCreateBaseWorkspaceId: 'ws-1',
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);

      expect(screen.getByTestId('create-base-modal')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /close base modal/i }));
      expect(mockSetShowCreateBaseWorkspaceId).toHaveBeenCalledWith(null);
    });

    it('cleans orphaned pinned table ids and persists cleaned meta', async () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        selectedBase: {
          ...mockSelectedBase,
          meta: { pinnedTables: { 'table-1': true, orphan: true } },
        },
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);

      render(<Sidebar />);

      await waitFor(() => {
        expect(mockUpdateBaseMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            baseId: 'base-1',
            updates: expect.objectContaining({
              meta: expect.objectContaining({
                pinnedTables: { 'table-1': true },
              }),
            }),
          })
        );
      });
    });

    it('shows pinned indicator when table is pinned', () => {
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        selectedBase: {
          ...mockSelectedBase,
          meta: { pinnedTables: { 'table-1': true } },
        },
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      const { container } = render(<Sidebar />);
      const pinIcon = container.querySelector('svg.lucide-pin');
      expect(pinIcon).toBeInTheDocument();
    });

    it('creates table from create-table modal and navigates to new table', async () => {
      const user = userEvent.setup();
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        showCreateTableBaseId: 'base-1',
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);

      expect(await screen.findByTestId('create-table-modal')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /submit create table/i }));

      await waitFor(() => {
        expect(mockCreateTableMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            base_id: 'base-1',
            workspace_id: 'ws-1',
            title: 'Created Table',
            description: 'Desc',
          })
        );
      });
      expect(mockNavigateToTable).toHaveBeenCalledWith('ws-1', 'base-1', 'new-table-id');
      expect(mockSetShowCreateTableBaseId).toHaveBeenCalledWith(null);
    });

    it('handles create table mutation failure with error toast', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateTableMutateAsync.mockRejectedValueOnce(new Error('fail'));
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        showCreateTableBaseId: 'base-1',
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);

      expect(await screen.findByTestId('create-table-modal')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /submit create table/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to create table. Please try again.', { title: 'Error' });
      });
      consoleErrorSpy.mockRestore();
    });

    it('creates calendar view with normalized fieldId meta and closes modal', async () => {
      const user = userEvent.setup();
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        showCreateViewModal: { tableId: 'table-1', viewType: 'calendar' },
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);

      expect(await screen.findByTestId('create-view-modal-wrapper')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /submit calendar view/i }));

      await waitFor(() => {
        expect(mockCreateViewMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            model_id: 'table-1',
            base_id: 'base-1',
            type: 'calendar',
            meta: { date_field_id: 'date-col' },
          })
        );
      });
      expect(mockSetShowCreateViewModal).toHaveBeenCalledWith(null);
      expect(mockToast.success).toHaveBeenCalledWith('View created successfully');
    });

    it('shows error when creating view without base id', async () => {
      const user = userEvent.setup();
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        selectedBaseId: null,
        baseTables: { data: [{ model: { id: 'table-1', base_id: null, workspace_id: 'ws-1', title: 'Table 1' } }] },
        showCreateViewModal: { tableId: 'table-1', viewType: 'calendar' },
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);

      expect(await screen.findByTestId('create-view-modal-wrapper')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /submit calendar view/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Base ID is required to create a view', { title: 'Error' });
      });
    });

    it('creates gantt view with normalized start/end meta', async () => {
      const user = userEvent.setup();
      useWorkspaceBusinessLogicMock.mockReturnValue({
        ...getDefaultWorkspaceState(),
        showCreateViewModal: { tableId: 'table-1', viewType: 'ganttchart' },
      } as unknown as ReturnType<typeof useWorkspaceBusinessLogicMock>);
      render(<Sidebar />);

      expect(await screen.findByTestId('create-view-modal-wrapper')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /submit gantt view/i }));

      await waitFor(() => {
        expect(mockCreateViewMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            model_id: 'table-1',
            base_id: 'base-1',
            type: 'ganttchart',
            meta: {
              start_date_field_id: 'start-col',
              end_date_field_id: 'end-col',
            },
          })
        );
      });
    });
  });
});
