import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkspaceBusinessLogic } from '../useWorkspaceBusinessLogic';

const toastSuccess = vi.fn();
const toastError = vi.fn();
const navigateToBase = vi.fn();
const navigateToTable = vi.fn();
const navigateToView = vi.fn();
const handleTableDeletion = vi.fn();
const handleViewDeletion = vi.fn();

const createWorkspaceMutation = { mutateAsync: vi.fn() };
const createBaseMutation = { mutateAsync: vi.fn() };
const createTableMutation = { mutateAsync: vi.fn() };
const updateTableMutation = { mutateAsync: vi.fn() };
const deleteTableMutation = { mutateAsync: vi.fn() };
const createViewMutation = { mutateAsync: vi.fn() };
const deleteViewMutation = { mutateAsync: vi.fn() };

const workspacesQuery = { data: [], refetch: vi.fn() };
const workspaceByIdQuery = { data: { data: null } };
const workspaceBasesQuery = { data: [] };
const baseByIdQuery = { data: { data: null } };
const baseTablesQuery = { data: [] };
const tableByIdQuery = { data: { data: null } };
const tableViewsQuery = { data: [] };
const viewByIdQuery = { data: null };

const mockState = {
  authUser: { id: 'user-1' },
  currentUser: null,
  restoreCompleted: true,
  pluginStoreSelectedWorkspace: null,
  setPluginStoreSelectedWorkspace: vi.fn(),
  selectedWorkspaceId: null,
  selectedBaseId: null,
  selectedTableId: null,
  selectedViewId: null,
  expandedBases: [],
  expandedTables: [],
  toggleBaseExpansion: vi.fn(),
  toggleTableExpansion: vi.fn(),
  setWorkspace: vi.fn(),
  setSelectedWorkspace: vi.fn(),
  setBase: vi.fn(),
  setTable: vi.fn(),
  setView: vi.fn(),
  loadUserNavigation: vi.fn(),
  saveUserNavigation: vi.fn(),
  navigateToLastLocation: vi.fn(),
  navigateToFirstTableView: vi.fn(),
  navigateToFirstBase: vi.fn(),
  navigateAndPersist: vi.fn(),
  showCreateWorkspace: false,
  setShowCreateWorkspace: vi.fn(),
  showCreateBaseWorkspaceId: null,
  setShowCreateBaseWorkspaceId: vi.fn(),
  showCreateTableBaseId: null,
  setShowCreateTableBaseId: vi.fn(),
  showCreateViewModal: false,
  setShowCreateViewModal: vi.fn(),
  editingTableId: null,
  setEditingTableId: vi.fn(),
  editingViewId: null,
  setEditingViewId: vi.fn(),
  popoverRef: null,
  setPopoverRef: vi.fn(),
  navigate: vi.fn(),
  flyoutOpen: false,
};

vi.mock('../useWorkspaceDataService', () => ({
  useWorkspaceDataService: () => ({
    workspacesQuery,
    workspaceByIdQuery,
    workspaceBasesQuery,
    baseByIdQuery,
    baseTablesQuery,
    tableByIdQuery,
    tableViewsQuery,
    viewByIdQuery,
    workspacesLoading: false,
    basesLoading: false,
    tablesLoading: false,
    viewsLoading: false,
    workspacesError: null,
    basesError: null,
    tablesError: null,
    viewsError: null,
    createWorkspaceMutation,
    createBaseMutation,
    createTableMutation,
    updateTableMutation,
    deleteTableMutation,
    createViewMutation,
    deleteViewMutation,
  }),
}));

vi.mock('../useWorkspaceStateManager', () => ({
  useWorkspaceStateManager: () => mockState,
}));

vi.mock('../../../components/common/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

vi.mock('../../useNavigation', () => ({
  useNavigation: () => ({ navigateToBase, navigateToTable, navigateToView }),
}));

vi.mock('../../useNavigationActions', () => ({
  useNavigationActions: () => ({ handleTableDeletion, handleViewDeletion }),
}));

vi.mock('../useWorkspaceSelection', () => ({
  useWorkspaceSelection: () => undefined,
}));

describe('useWorkspaceBusinessLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    workspaceByIdQuery.data = { data: null };
  });

  it('validates empty workspace name', async () => {
    const { result } = renderHook(() => useWorkspaceBusinessLogic());
    const onError = vi.fn();

    await act(async () => {
      await result.current.handleCreateWorkspace('', '', undefined, onError);
    });

    expect(onError).toHaveBeenCalledWith('Workspace name is required');
  });

  it('creates workspace and navigates', async () => {
    const rafSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });

    createWorkspaceMutation.mutateAsync.mockResolvedValue({
      data: {
        id: 'ws1',
        bases: [{ id: 'b1', tables: [{ model: { id: 't1' } }] }],
      },
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());
    await act(async () => {
      await result.current.handleCreateWorkspace('Workspace', 'Desc');
    });

    expect(mockState.setWorkspace).toHaveBeenCalledWith('ws1');
    expect(mockState.navigateAndPersist).toHaveBeenCalled();
    expect(mockState.navigate).toHaveBeenCalled();
    rafSpy.mockRestore();
  });

  it('shows error when creating base without workspace', async () => {
    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateBaseForWorkspace({ name: 'Base', description: '' });
    });

    expect(toastError).toHaveBeenCalledWith('No workspace selected');
  });
});
