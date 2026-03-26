import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useWorkspaceBusinessLogic } from '../useWorkspaceBusinessLogic';

const toast = {
  success: vi.fn(),
  error: vi.fn(),
};

const navigationActions = {
  handleTableDeletion: vi.fn(),
  handleViewDeletion: vi.fn(),
};

const navigation = {
  navigateToBase: vi.fn(),
  navigateToTable: vi.fn(),
  navigateToView: vi.fn(),
};

const pluginStore = {
  openFlyout: vi.fn(),
  closeFlyout: vi.fn(),
};

let dataServiceState: any;
let stateManager: any;

vi.mock('../../../components/common/Toast', () => ({
  useToast: () => toast,
}));

vi.mock('../../../hooks/useNavigation', () => ({
  useNavigation: () => navigation,
}));

vi.mock('../../../hooks/useNavigationActions', () => ({
  useNavigationActions: () => navigationActions,
}));

vi.mock('../../../stores/pluginStore', () => ({
  usePluginStore: () => pluginStore,
}));

vi.mock('../useWorkspaceSelection', () => ({
  useWorkspaceSelection: vi.fn(),
}));

vi.mock('../useWorkspaceDataService', () => ({
  useWorkspaceDataService: () => dataServiceState,
}));

vi.mock('../useWorkspaceStateManager', () => ({
  useWorkspaceStateManager: () => stateManager,
}));

const renderHookValue = () => {
  let latest: ReturnType<typeof useWorkspaceBusinessLogic> | null = null;
  const Probe = () => {
    latest = useWorkspaceBusinessLogic();
    return null;
  };
  render(<Probe />);
  return () => latest!;
};

describe('useWorkspaceBusinessLogic', () => {
  const originalRaf = globalThis.requestAnimationFrame;

  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
    navigationActions.handleTableDeletion.mockClear();
    navigationActions.handleViewDeletion.mockClear();
    navigation.navigateToBase.mockClear();
    navigation.navigateToTable.mockClear();
    navigation.navigateToView.mockClear();
    pluginStore.openFlyout.mockClear();
    pluginStore.closeFlyout.mockClear();

    dataServiceState = {
      workspacesQuery: { data: [], refetch: vi.fn() },
      workspaceByIdQuery: { data: { data: null } },
      workspaceBasesQuery: { data: { data: [] } },
      baseByIdQuery: { data: { data: null } },
      baseTablesQuery: { data: { data: [] }, refetch: vi.fn() },
      tableByIdQuery: { data: { data: null }, refetch: vi.fn() },
      tableViewsQuery: { data: [] },
      viewByIdQuery: { data: null },
      workspacesLoading: false,
      basesLoading: false,
      tablesLoading: false,
      viewsLoading: false,
      workspacesError: null,
      basesError: null,
      tablesError: null,
      viewsError: null,
      createWorkspaceMutation: { mutateAsync: vi.fn() },
      createBaseMutation: { mutateAsync: vi.fn() },
      createTableMutation: { mutateAsync: vi.fn() },
      updateTableMutation: { mutateAsync: vi.fn() },
      deleteTableMutation: { mutateAsync: vi.fn() },
      createViewMutation: { mutateAsync: vi.fn() },
      deleteViewMutation: { mutateAsync: vi.fn() },
    };

    stateManager = {
      authUser: { id: 'u1' },
      currentUser: null,
      restoreCompleted: true,
      pluginStoreSelectedWorkspace: null,
      setPluginStoreSelectedWorkspace: vi.fn(),
      selectedWorkspaceId: 'w1',
      selectedBaseId: 'b1',
      selectedTableId: 't1',
      selectedViewId: 'v1',
      expandedBases: [],
      expandedTables: [],
      toggleBaseExpansion: vi.fn(),
      toggleTableExpansion: vi.fn(),
      setWorkspace: vi.fn(),
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
      selectedWorkspace: null,
      setSelectedWorkspace: vi.fn(),
      workspaceError: '',
      setWorkspaceError: vi.fn(),
      isError: false,
      setIsError: vi.fn(),
      handleFormSubmit: vi.fn(),
      isAnyBaseActive: vi.fn(),
      findFirstBase: vi.fn(),
      popoverRef: null,
      setPopoverRef: vi.fn(),
      navigate: vi.fn(),
      flyoutOpen: false,
    };

    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRaf;
  });

  it('validates workspace name before create', async () => {
    const getValue = renderHookValue();
    const onError = vi.fn();

    await act(async () => {
      await getValue().handleCreateWorkspace('', '', undefined, onError);
    });

    expect(onError).toHaveBeenCalledWith('Workspace name is required');
    expect(dataServiceState.createWorkspaceMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('creates workspace and navigates to first table', async () => {
    const getValue = renderHookValue();
    const workspaceData = {
      id: 'w2',
      bases: [{ id: 'b2', tables: [{ id: 't2' }] }],
    };
    dataServiceState.createWorkspaceMutation.mutateAsync.mockResolvedValue({ data: workspaceData });

    await act(async () => {
      await getValue().handleCreateWorkspace('New', 'Desc');
    });

    expect(dataServiceState.createWorkspaceMutation.mutateAsync).toHaveBeenCalled();
    expect(stateManager.setWorkspace).toHaveBeenCalledWith('w2');
    expect(stateManager.navigateAndPersist).toHaveBeenCalledWith('w2', 'b2', 't2', 'u1');
    expect(stateManager.navigate).toHaveBeenCalled();
  });

  it('handles base creation when workspace is missing', async () => {
    const getValue = renderHookValue();

    await act(async () => {
      await getValue().handleCreateBaseForWorkspace({ name: 'Base', description: '' });
    });

    expect(toast.error).toHaveBeenCalledWith('No workspace selected');
    expect(dataServiceState.createBaseMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('creates base for current workspace', async () => {
    dataServiceState.workspaceByIdQuery = { data: { data: { id: 'w1' } } };
    const getValue = renderHookValue();

    await act(async () => {
      await getValue().handleCreateBaseForWorkspace({ name: 'Base', description: 'Desc' });
    });

    expect(dataServiceState.createBaseMutation.mutateAsync).toHaveBeenCalledWith({
      title: 'Base',
      description: 'Desc',
      workspace_id: 'w1',
      image: undefined,
    });
    expect(stateManager.setShowCreateBaseWorkspaceId).toHaveBeenCalledWith(null);
    expect(toast.success).toHaveBeenCalledWith('Base created successfully');
  });

  it('updates table and refetches data', async () => {
    const getValue = renderHookValue();

    await act(async () => {
      await getValue().handleEditTable('t1', { title: 'Updated' });
    });

    expect(dataServiceState.updateTableMutation.mutateAsync).toHaveBeenCalled();
    expect(dataServiceState.workspacesQuery.refetch).toHaveBeenCalled();
    expect(dataServiceState.baseTablesQuery.refetch).toHaveBeenCalled();
    expect(dataServiceState.tableByIdQuery.refetch).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Table updated successfully');
  });

  it('deletes table and navigates to remaining table', async () => {
    const table = { id: 't1', base_id: 'b1', workspace_id: 'w1', title: 'Table' };
    dataServiceState.baseTablesQuery = {
      data: {
        data: [
          { model: { id: 't1', base_id: 'b1', workspace_id: 'w1', title: 'Table' } },
          { model: { id: 't2', base_id: 'b1', workspace_id: 'w1', title: 'Next' } },
        ],
      },
    };
    const getValue = renderHookValue();

    await act(async () => {
      await getValue().handleDeleteTable(table);
    });

    expect(dataServiceState.deleteTableMutation.mutateAsync).toHaveBeenCalled();
    expect(navigationActions.handleTableDeletion).toHaveBeenCalledWith('t1');
    expect(stateManager.toggleTableExpansion).toHaveBeenCalledWith('t1');
    expect(navigation.navigateToTable).toHaveBeenCalledWith('w1', 'b1', 't2');
    expect(toast.success).toHaveBeenCalled();
  });
});
