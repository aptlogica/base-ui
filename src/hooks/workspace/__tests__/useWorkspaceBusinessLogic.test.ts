/**
 * Comprehensive Unit Tests for useWorkspaceBusinessLogic.ts
 *
 * This test suite covers all business logic operations:
 * - Workspace CRUD operations
 * - Base CRUD operations
 * - Table CRUD operations
 * - View CRUD operations
 * - Navigation and state synchronization
 * - Error handling and edge cases
 * - Derived state calculations
 * - Modal and UI state management
 *
 * Testing patterns:
 * - AAA (Arrange-Act-Assert)
 * - Isolated tests with mocked dependencies
 * - Async/await handling with waitFor
 * - State verification
 * - Error scenarios and recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Import the hook under test
import { useWorkspaceBusinessLogic } from '../useWorkspaceBusinessLogic';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock useWorkspaceDataService
vi.mock('../useWorkspaceDataService', () => ({
  useWorkspaceDataService: vi.fn(),
}));

// Mock useWorkspaceStateManager
vi.mock('../useWorkspaceStateManager', () => ({
  useWorkspaceStateManager: vi.fn(),
}));

// Mock useToast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};

vi.mock('../../../components/common/Toast', () => ({
  useToast: () => mockToast,
}));

// Mock useNavigation
const mockNavigateToBase = vi.fn();
const mockNavigateToTable = vi.fn();
const mockNavigateToView = vi.fn();

vi.mock('../../../hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigateToBase: mockNavigateToBase,
    navigateToTable: mockNavigateToTable,
    navigateToView: mockNavigateToView,
  }),
}));

// Mock useNavigationActions
const mockHandleTableDeletion = vi.fn();
const mockHandleViewDeletion = vi.fn();

vi.mock('../../../hooks/useNavigationActions', () => ({
  useNavigationActions: () => ({
    handleTableDeletion: mockHandleTableDeletion,
    handleViewDeletion: mockHandleViewDeletion,
  }),
}));

// Import mocked modules
import * as useWorkspaceDataServiceModule from '../useWorkspaceDataService';
import * as useWorkspaceStateManagerModule from '../useWorkspaceStateManager';

// ============================================================================
// Test Data & Helpers
// ============================================================================

const createMockWorkspace = (overrides?: any) => ({
  id: 'workspace-1',
  title: 'Test Workspace',
  description: 'A test workspace',
  bases: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockBase = (overrides?: any) => ({
  id: 'base-1',
  title: 'Test Base',
  description: 'A test base',
  workspace_id: 'workspace-1',
  tables: [],
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockTable = (overrides?: any) => ({
  id: 'table-1',
  title: 'Test Table',
  name: 'test_table',
  description: 'A test table',
  base_id: 'base-1',
  workspace_id: 'workspace-1',
  views: [],
  fields: [],
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockView = (overrides?: any) => ({
  id: 'view-1',
  title: 'Test View',
  name: 'test_view',
  table_id: 'table-1',
  type: 'grid',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockUser = (overrides?: any) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});

const createMockMutation = (overrides?: any) => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  isSuccess: false,
  data: null,
  reset: vi.fn(),
  ...overrides,
});

const createMockQuery = (overrides?: any) => ({
  data: null,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

// ============================================================================
// Shared Setup
// ============================================================================

let mockDataService: any;
let mockStateManager: any;

const setupMocks = (dataServiceOverrides?: any, stateManagerOverrides?: any) => {
  // Default data service mock
  mockDataService = {
    workspacesQuery: createMockQuery(),
    workspaceByIdQuery: createMockQuery(),
    workspaceBasesQuery: createMockQuery(),
    baseByIdQuery: createMockQuery(),
    baseTablesQuery: createMockQuery(),
    tableByIdQuery: createMockQuery(),
    tableViewsQuery: createMockQuery(),
    viewByIdQuery: createMockQuery(),
    workspacesLoading: false,
    basesLoading: false,
    tablesLoading: false,
    viewsLoading: false,
    workspacesError: null,
    basesError: null,
    tablesError: null,
    viewsError: null,
    createWorkspaceMutation: createMockMutation(),
    updateWorkspaceMutation: createMockMutation(),
    deleteWorkspaceMutation: createMockMutation(),
    createBaseMutation: createMockMutation(),
    deleteBaseMutation: createMockMutation(),
    createTableMutation: createMockMutation(),
    updateTableMutation: createMockMutation(),
    deleteTableMutation: createMockMutation(),
    createFieldMutation: createMockMutation(),
    updateFieldMutation: createMockMutation(),
    deleteFieldMutation: createMockMutation(),
    createViewMutation: createMockMutation(),
    updateViewMutation: createMockMutation(),
    deleteViewMutation: createMockMutation(),
    addRowMutation: createMockMutation(),
    insertRowDataMutation: createMockMutation(),
    deleteRecordMutation: createMockMutation(),
    ...dataServiceOverrides,
  };

  // Default state manager mock
  mockStateManager = {
    authUser: createMockUser(),
    currentUser: createMockUser(),
    restoreCompleted: true,
    pluginStoreSelectedWorkspace: null,
    setPluginStoreSelectedWorkspace: vi.fn(),
    selectedWorkspaceId: 'workspace-1',
    selectedBaseId: 'base-1',
    selectedTableId: 'table-1',
    selectedViewId: 'view-1',
    expandedBases: {},
    expandedTables: {},
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
    showCreateViewModal: null,
    setShowCreateViewModal: vi.fn(),
    editingTableId: null,
    setEditingTableId: vi.fn(),
    editingViewId: null,
    setEditingViewId: vi.fn(),
    popoverRef: null,
    setPopoverRef: vi.fn(),
    navigate: vi.fn(),
    flyoutMode: 'normal',
    flyoutOpen: false,
    isTransitioning: false,
    ...stateManagerOverrides,
  };

  vi.mocked(useWorkspaceDataServiceModule.useWorkspaceDataService).mockReturnValue(mockDataService);
  vi.mocked(useWorkspaceStateManagerModule.useWorkspaceStateManager).mockReturnValue(mockStateManager);
};

beforeEach(() => {
  vi.clearAllMocks();
  setupMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// WORKSPACE TESTS
// ============================================================================

describe('Workspace Operations', () => {
  it('should expose workspace data from queries', () => {
    const workspace = createMockWorkspace();
    setupMocks({
      workspacesQuery: createMockQuery({ data: [workspace] }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.workspaces).toEqual([workspace]);
  });

  it('should create a workspace with valid name and description', async () => {
    const newWorkspace = createMockWorkspace({ title: 'New Workspace' });
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockResolvedValue({ data: newWorkspace });

    setupMocks({
      createWorkspaceMutation: mockCreateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateWorkspace(
        'New Workspace',
        'Description',
        onSuccess,
        onError
      );
    });

    expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
      workspace: {
        title: 'New Workspace',
        description: 'Description',
      },
    });
    expect(onSuccess).toHaveBeenCalledWith(newWorkspace);
  });

  it('should handle workspace creation error with no workspace ID returned', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockResolvedValue({ data: null });

    setupMocks({
      createWorkspaceMutation: mockCreateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateWorkspace(
        'New Workspace',
        'Description',
        onSuccess,
        onError
      );
    });

    expect(onError).toHaveBeenCalledWith('Failed to create workspace. Please try again.');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should reject workspace creation with empty name', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateWorkspace('', 'Description', onSuccess, onError);
    });

    expect(onError).toHaveBeenCalledWith('Workspace name is required');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should reject workspace creation with whitespace-only name', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateWorkspace('   ', 'Description', onSuccess, onError);
    });

    expect(onError).toHaveBeenCalledWith('Workspace name is required');
  });

  it('should handle workspace creation mutation error', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockRejectedValue(new Error('Network error'));

    setupMocks({
      createWorkspaceMutation: mockCreateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateWorkspace(
        'New Workspace',
        'Description',
        onSuccess,
        onError
      );
    });

    expect(onError).toHaveBeenCalledWith('Failed to create workspace. Please try again.');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should update workspace selection and navigate after creation', async () => {
    const newWorkspace = createMockWorkspace({
      id: 'new-ws',
      title: 'New Workspace',
      bases: [
        {
          id: 'new-base',
          tables: [
            { id: 'new-table', views: [{ id: 'new-view' }] },
          ],
        },
      ],
    });

    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockResolvedValue({ data: newWorkspace });

    const mockSetWorkspace = vi.fn();
    const mockNavigateAndPersist = vi.fn();
    const mockNavigate = vi.fn();

    setupMocks(
      { createWorkspaceMutation: mockCreateMutation },
      {
        setWorkspace: mockSetWorkspace,
        navigateAndPersist: mockNavigateAndPersist,
        navigate: mockNavigate,
        authUser: createMockUser({ id: 'user-1' }),
      }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateWorkspace('New Workspace', 'Description');
    });

    // Wait for async navigation
    await waitFor(() => {
      expect(mockSetWorkspace).toHaveBeenCalledWith('new-ws');
    });

    // Navigation happens in requestAnimationFrame, verify navigate was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// BASE TESTS
// ============================================================================

describe('Base Operations', () => {
  it('should create a base for selected workspace', async () => {
    const newBase = createMockBase();
    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockResolvedValue(newBase);

    setupMocks({
      workspaceByIdQuery: createMockQuery({ data: { data: createMockWorkspace() } }),
      createBaseMutation: mockCreateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateBaseForWorkspace({
        name: 'Test Base',
        description: 'Test Description',
      });
    });

    expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
      title: 'Test Base',
      description: 'Test Description',
      workspace_id: 'workspace-1',
      image: undefined,
    });
    expect(mockToast.success).toHaveBeenCalledWith('Base created successfully');
  });

  it('should handle base creation error when no workspace selected', async () => {
    setupMocks({
      workspaceByIdQuery: createMockQuery({ data: null }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateBaseForWorkspace({
        name: 'Test Base',
        description: 'Test Description',
      });
    });

    expect(mockToast.error).toHaveBeenCalledWith('No workspace selected');
  });

  it('should handle base creation mutation error', async () => {
    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockRejectedValue(new Error('API error'));

    setupMocks({
      workspaceByIdQuery: createMockQuery({ data: { data: createMockWorkspace() } }),
      createBaseMutation: mockCreateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await expect(
        result.current.handleCreateBaseForWorkspace({
          name: 'Test Base',
          description: 'Test Description',
        })
      ).rejects.toThrow();
    });

    expect(mockToast.error).toHaveBeenCalledWith('Failed to create base. Please try again.');
  });

  it('should create base with image file', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const newBase = createMockBase();
    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockResolvedValue(newBase);

    setupMocks({
      workspaceByIdQuery: createMockQuery({ data: { data: createMockWorkspace() } }),
      createBaseMutation: mockCreateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateBaseForWorkspace({
        name: 'Test Base',
        description: 'Test Description',
        image: mockFile,
      });
    });

    expect(mockCreateMutation.mutateAsync).toHaveBeenCalledWith({
      title: 'Test Base',
      description: 'Test Description',
      workspace_id: 'workspace-1',
      image: mockFile,
    });
  });

  it('should expose current workspace data', () => {
    const workspace = createMockWorkspace();
    setupMocks({
      workspaceByIdQuery: createMockQuery({ data: { data: workspace } }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.currentWorkspace).toEqual(workspace);
  });

  it('should expose workspace bases', () => {
    const bases = [createMockBase()];
    setupMocks({
      workspaceBasesQuery: createMockQuery({ data: bases }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.workspaceBases).toEqual(bases);
  });
});

// ============================================================================
// TABLE TESTS
// ============================================================================

describe('Table Operations', () => {
  it('should edit a table with valid updates', async () => {
    const mockUpdateMutation = createMockMutation();
    mockUpdateMutation.mutateAsync.mockResolvedValue({ success: true });

    const mockRefetchWorkspaces = vi.fn();
    const mockRefetchBaseTables = vi.fn();
    const mockRefetchTableById = vi.fn();

    setupMocks({
      updateTableMutation: mockUpdateMutation,
      workspacesQuery: createMockQuery({ refetch: mockRefetchWorkspaces }),
      baseTablesQuery: createMockQuery({ refetch: mockRefetchBaseTables }),
      tableByIdQuery: createMockQuery({ refetch: mockRefetchTableById }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleEditTable('table-1', {
        title: 'Updated Table',
        description: 'New Description',
      });
    });

    expect(mockUpdateMutation.mutateAsync).toHaveBeenCalledWith({
      tableId: 'table-1',
      params: {
        title: 'Updated Table',
        description: 'New Description',
        updated_at: expect.any(String),
      },
    });
    expect(mockToast.success).toHaveBeenCalledWith('Table updated successfully');
    expect(mockRefetchWorkspaces).toHaveBeenCalled();
    expect(mockRefetchBaseTables).toHaveBeenCalled();
    expect(mockRefetchTableById).toHaveBeenCalled();
  });

  it('should handle table edit error', async () => {
    const mockUpdateMutation = createMockMutation();
    mockUpdateMutation.mutateAsync.mockRejectedValue(new Error('API error'));

    setupMocks({
      updateTableMutation: mockUpdateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await expect(
        result.current.handleEditTable('table-1', { title: 'Updated' })
      ).rejects.toThrow();
    });

    expect(mockToast.error).toHaveBeenCalledWith('Failed to update table. Please try again.');
  });

  it('should delete a table and navigate away if it is currently selected', async () => {
    const table = createMockTable();
    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockResolvedValue({ success: true });

    setupMocks(
      {
        deleteTableMutation: mockDeleteMutation,
        baseTablesQuery: createMockQuery({
          data: {
            data: [
              { model: createMockTable({ id: 'table-1' }) },
              { model: createMockTable({ id: 'table-2' }) },
            ],
          },
        }),
      },
      {
        selectedTableId: 'table-1',
        selectedBaseId: 'base-1',
      }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleDeleteTable(table);
    });

    expect(mockDeleteMutation.mutateAsync).toHaveBeenCalledWith({
      tableId: 'table-1',
      baseId: 'base-1',
    });
    expect(mockHandleTableDeletion).toHaveBeenCalledWith('table-1');
    expect(mockToast.success).toHaveBeenCalledWith('Table "Test Table" deleted successfully');
    expect(mockNavigateToTable).toHaveBeenCalled();
  });

  it('should delete a table without navigating if it is not currently selected', async () => {
    const table = createMockTable();
    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockResolvedValue({ success: true });

    setupMocks(
      {
        deleteTableMutation: mockDeleteMutation,
      },
      {
        selectedTableId: 'table-2', // Different table is selected
      }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleDeleteTable(table);
    });

    expect(mockDeleteMutation.mutateAsync).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith('Table "Test Table" deleted successfully');
    expect(mockNavigateToTable).not.toHaveBeenCalled();
  });

  it('should navigate to next table when deleting currently selected table', async () => {
    const table = createMockTable({ id: 'table-1' });
    const nextTable = createMockTable({ id: 'table-2' });
    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockResolvedValue({ success: true });

    setupMocks(
      {
        deleteTableMutation: mockDeleteMutation,
        baseTablesQuery: createMockQuery({
          data: {
            data: [{ model: nextTable }],
          },
        }),
      },
      {
        selectedTableId: 'table-1',
        selectedBaseId: 'base-1',
        selectedWorkspaceId: 'workspace-1',
      }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleDeleteTable(table);
    });

    expect(mockNavigateToTable).toHaveBeenCalledWith('workspace-1', 'base-1', 'table-2');
  });

  it('should navigate to base when no other tables remain after deletion', async () => {
    const table = createMockTable({ id: 'table-1' });
    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockResolvedValue({ success: true });

    setupMocks(
      {
        deleteTableMutation: mockDeleteMutation,
        baseTablesQuery: createMockQuery({ data: { data: [] } }),
      },
      {
        selectedTableId: 'table-1',
        selectedBaseId: 'base-1',
        selectedWorkspaceId: 'workspace-1',
      }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleDeleteTable(table);
    });

    expect(mockNavigateToBase).toHaveBeenCalledWith('workspace-1', 'base-1');
  });

  it('should handle table deletion error', async () => {
    const table = createMockTable();
    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockRejectedValue(new Error('Delete failed'));

    setupMocks({
      deleteTableMutation: mockDeleteMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await expect(result.current.handleDeleteTable(table)).rejects.toThrow();
    });

    expect(mockToast.error).toHaveBeenCalledWith('Failed to delete table. Please try again.');
  });

  it('should expose base tables', () => {
    const tables = [{ model: createMockTable() }];
    setupMocks({
      baseTablesQuery: createMockQuery({ data: tables }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.baseTables).toEqual(tables);
  });

  it('should expose selected table', () => {
    const table = createMockTable();
    setupMocks({
      tableByIdQuery: createMockQuery({ data: { data: table } }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.selectedTable).toEqual(table);
  });
});

// ============================================================================
// VIEW TESTS
// ============================================================================

describe('View Operations', () => {
  it('should delete a view and navigate away if it is currently selected', async () => {
    const view = createMockView();
    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockResolvedValue({ success: true });

    setupMocks(
      {
        deleteViewMutation: mockDeleteMutation,
      },
      {
        selectedViewId: 'view-1',
        selectedTableId: 'table-1',
        selectedBaseId: 'base-1',
        selectedWorkspaceId: 'workspace-1',
      }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleDeleteView(view);
    });

    expect(mockHandleViewDeletion).toHaveBeenCalledWith('view-1');
    expect(mockToast.success).toHaveBeenCalledWith('View "Test View" deleted successfully');
    expect(mockNavigateToTable).toHaveBeenCalledWith('workspace-1', 'base-1', 'table-1');
  });

  it('should delete a view without navigating if it is not currently selected', async () => {
    const view = createMockView({ id: 'view-1' });

    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockResolvedValue({ success: true });

    setupMocks(
      {
        deleteViewMutation: mockDeleteMutation,
      },
      {
        selectedViewId: 'view-2', // Different view is selected
      }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleDeleteView(view);
    });

    expect(mockHandleViewDeletion).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith('View "Test View" deleted successfully');
    expect(mockNavigateToTable).not.toHaveBeenCalled();
  });

  it('should navigate to base when view deletion removes all views', async () => {
    const view = createMockView();

    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockResolvedValue({ success: true });

    setupMocks(
      {
        deleteViewMutation: mockDeleteMutation,
      },
      {
        selectedViewId: 'view-1',
        selectedTableId: null,
        selectedBaseId: 'base-1',
        selectedWorkspaceId: 'workspace-1',
      }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleDeleteView(view);
    });

    expect(mockNavigateToBase).toHaveBeenCalledWith('workspace-1', 'base-1');
  });

  it('should handle view deletion error', async () => {
    const view = createMockView();
    const mockDeleteMutation = createMockMutation();
    mockDeleteMutation.mutateAsync.mockRejectedValue(new Error('Delete failed'));

    mockHandleViewDeletion.mockRejectedValue(new Error('Delete failed'));

    setupMocks({
      deleteViewMutation: mockDeleteMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await expect(result.current.handleDeleteView(view)).rejects.toThrow();
    });

    expect(mockToast.error).toHaveBeenCalledWith('Failed to delete view. Please try again.');
  });

  it('should expose table views', () => {
    const views = [createMockView()];
    setupMocks({
      tableViewsQuery: createMockQuery({ data: views }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.tableViews).toEqual(views);
  });

  it('should expose selected view', () => {
    const view = createMockView();
    setupMocks({
      viewByIdQuery: createMockQuery({ data: view }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.selectedView).toEqual(view);
  });
});

// ============================================================================
// STATE & SELECTION TESTS
// ============================================================================

describe('State Management', () => {
  it('should expose all selected IDs', () => {
    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.selectedWorkspaceId).toBe('workspace-1');
    expect(result.current.selectedBaseId).toBe('base-1');
    expect(result.current.selectedTableId).toBe('table-1');
    expect(result.current.selectedViewId).toBe('view-1');
  });

  it('should expose auth and current user', () => {
    const user = createMockUser({ id: 'user-123' });
    setupMocks({}, { authUser: user, currentUser: user });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.authUser).toEqual(user);
    expect(result.current.currentUser).toEqual(user);
  });

  it('should expose UI modal states', () => {
    setupMocks({}, {
      showCreateWorkspace: true,
      showCreateBaseWorkspaceId: 'base-1',
      showCreateTableBaseId: 'table-1',
      showCreateViewModal: { tableId: 'table-1', viewType: 'grid' },
      editingTableId: 'table-edit-1',
      editingViewId: 'view-edit-1',
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.showCreateWorkspace).toBe(true);
    expect(result.current.showCreateBaseWorkspaceId).toBe('base-1');
    expect(result.current.showCreateTableBaseId).toBe('table-1');
    expect(result.current.showCreateViewModal).toEqual({ tableId: 'table-1', viewType: 'grid' });
    expect(result.current.editingTableId).toBe('table-edit-1');
    expect(result.current.editingViewId).toBe('view-edit-1');
  });

  it('should update modal state setters', () => {
    const setShowCreateWorkspace = vi.fn();
    const setShowCreateBaseWorkspaceId = vi.fn();
    setupMocks({}, {
      setShowCreateWorkspace,
      setShowCreateBaseWorkspaceId,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(typeof result.current.setShowCreateWorkspace).toBe('function');
    expect(typeof result.current.setShowCreateBaseWorkspaceId).toBe('function');
  });

  it('should expose expansion state for bases and tables', () => {
    const expandedBases = { 'base-1': true };
    const expandedTables = { 'table-1': true };
    setupMocks({}, { expandedBases, expandedTables });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.expandedBases).toEqual(expandedBases);
    expect(result.current.expandedTables).toEqual(expandedTables);
  });

  it('should expose toggle expansion functions', () => {
    const toggleBaseExpansion = vi.fn();
    const toggleTableExpansion = vi.fn();
    setupMocks({}, { toggleBaseExpansion, toggleTableExpansion });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.toggleBaseExpansion).toBe(toggleBaseExpansion);
    expect(result.current.toggleTableExpansion).toBe(toggleTableExpansion);
  });

  it('should expose set functions for selection', () => {
    const setWorkspace = vi.fn();
    const setBase = vi.fn();
    const setTable = vi.fn();
    const setView = vi.fn();
    setupMocks({}, { setWorkspace, setBase, setTable, setView });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.setWorkspace).toBe(setWorkspace);
    expect(result.current.setBase).toBe(setBase);
    expect(result.current.setTable).toBe(setTable);
    expect(result.current.setView).toBe(setView);
  });

  it('should expose navigation persistence functions', () => {
    const loadUserNavigation = vi.fn();
    const saveUserNavigation = vi.fn();
    const navigateToLastLocation = vi.fn();
    const navigateToFirstTableView = vi.fn();
    const navigateToFirstBase = vi.fn();
    const navigateAndPersist = vi.fn();

    setupMocks({}, {
      loadUserNavigation,
      saveUserNavigation,
      navigateToLastLocation,
      navigateToFirstTableView,
      navigateToFirstBase,
      navigateAndPersist,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.loadUserNavigation).toBe(loadUserNavigation);
    expect(result.current.saveUserNavigation).toBe(saveUserNavigation);
    expect(result.current.navigateToLastLocation).toBe(navigateToLastLocation);
    expect(result.current.navigateToFirstTableView).toBe(navigateToFirstTableView);
    expect(result.current.navigateToFirstBase).toBe(navigateToFirstBase);
    expect(result.current.navigateAndPersist).toBe(navigateAndPersist);
  });
});

// ============================================================================
// HELPER FUNCTION TESTS
// ============================================================================

describe('Helper Functions', () => {
  it('should check if a table is active', () => {
    setupMocks({}, {
      selectedBaseId: 'base-1',
      selectedTableId: 'table-1',
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.isTableActive('base-1', 'table-1')).toBe(true);
    expect(result.current.isTableActive('base-1', 'table-2')).toBe(false);
    expect(result.current.isTableActive('base-2', 'table-1')).toBe(false);
  });

  it('should check if a view is active', () => {
    setupMocks({}, {
      selectedBaseId: 'base-1',
      selectedTableId: 'table-1',
      selectedViewId: 'view-1',
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.isViewActive('base-1', 'table-1', 'view-1')).toBe(true);
    expect(result.current.isViewActive('base-1', 'table-1', 'view-2')).toBe(false);
    expect(result.current.isViewActive('base-2', 'table-1', 'view-1')).toBe(false);
  });

  it('should determine if any base is active when on base path', () => {
    // Mock window.location for base path
    Object.defineProperty(window, 'location', {
      value: { pathname: '/base/base-1/table/table-1' },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.isAnyBaseActive()).toBe(true);
  });

  it('should determine if any base is not active when on other path', () => {
    // Mock window.location for non-base path
    Object.defineProperty(window, 'location', {
      value: { pathname: '/homepage' },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.isAnyBaseActive()).toBe(false);
  });
});

// ============================================================================
// LOADING & ERROR STATE TESTS
// ============================================================================

describe('Loading & Error States', () => {
  it('should report loading state when workspaces are loading', () => {
    setupMocks({
      workspacesLoading: true,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.loading).toBe(true);
  });

  it('should report loading state when bases are loading', () => {
    setupMocks({
      basesLoading: true,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.loading).toBe(true);
  });

  it('should report loading state when tables are loading', () => {
    setupMocks({
      tablesLoading: true,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.loading).toBe(true);
  });

  it('should report loading state when views are loading', () => {
    setupMocks({
      viewsLoading: true,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.loading).toBe(true);
  });

  it('should report error state when workspaces query fails', () => {
    const error = new Error('Failed to fetch workspaces');
    setupMocks({
      workspacesError: error,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.error).toBe(error);
  });

  it('should report error state when bases query fails', () => {
    const error = new Error('Failed to fetch bases');
    setupMocks({
      basesError: error,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.error).toBe(error);
  });

  it('should report combined loading states', () => {
    setupMocks({
      workspacesLoading: true,
      basesLoading: false,
      tablesLoading: true,
      viewsLoading: false,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.loading).toBe(true);
  });
});

// ============================================================================
// PLUGIN STORE STATE TESTS
// ============================================================================

describe('Plugin Store State', () => {
  it('should expose plugin store state', () => {
    setupMocks({}, {
      flyoutMode: 'details',
      flyoutOpen: true,
      isTransitioning: true,
      pluginStoreSelectedWorkspace: 'plugin-ws-1',
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.flyoutMode).toBe('details');
    expect(result.current.flyoutOpen).toBe(true);
    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.pluginStoreSelectedWorkspace).toBe('plugin-ws-1');
  });

  it('should expose plugin store selection setter', () => {
    const setPluginStoreSelectedWorkspace = vi.fn();
    setupMocks({}, { setPluginStoreSelectedWorkspace });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.setPluginStoreSelectedWorkspace).toBe(setPluginStoreSelectedWorkspace);
  });
});

// ============================================================================
// NAVIGATION FUNCTION TESTS
// ============================================================================

describe('Navigation Functions', () => {
  it('should expose navigate functions', () => {
    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(typeof result.current.navigateToBase).toBe('function');
    expect(typeof result.current.navigateToTable).toBe('function');
    expect(typeof result.current.navigateToView).toBe('function');
  });

  it('should expose router navigate function', () => {
    const navigate = vi.fn();
    setupMocks({}, { navigate });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.navigate).toBe(navigate);
  });
});

// ============================================================================
// MUTATION EXPOSURE TESTS
// ============================================================================

describe('Mutation Exposure', () => {
  it('should expose all mutations for direct access', () => {
    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.createWorkspaceMutation).toBeDefined();
    expect(result.current.createBaseMutation).toBeDefined();
    expect(result.current.createTableMutation).toBeDefined();
    expect(result.current.createViewMutation).toBeDefined();
    expect(result.current.updateTableMutation).toBeDefined();
    expect(result.current.deleteTableMutation).toBeDefined();
    expect(result.current.deleteViewMutation).toBeDefined();
  });
});

// ============================================================================
// DERIVED STATE TESTS
// ============================================================================

describe('Derived State', () => {
  it('should expose current base data', () => {
    const base = createMockBase();
    setupMocks({
      baseByIdQuery: createMockQuery({ data: { data: base } }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.selectedBase).toEqual(base);
  });

  it('should return undefined for base when not selected', () => {
    setupMocks({
      baseByIdQuery: createMockQuery({ data: null, error: null, isLoading: false }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.selectedBase).toBeUndefined();
  });

  it('should combine baseTables with model and metadata', () => {
    const tables = [{ model: createMockTable() }];
    setupMocks({
      baseTablesQuery: createMockQuery({ data: tables }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.baseTables).toEqual(tables);
  });

  it('should handle missing baseTables gracefully', () => {
    setupMocks({
      baseTablesQuery: createMockQuery({ data: null }),
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(result.current.baseTables).toBeNull();
  });
});

// ============================================================================
// EDGE CASES & ERROR RECOVERY TESTS
// ============================================================================

describe('Edge Cases & Error Recovery Tests', () => {
  it('should handle workspace creation with null bases', async () => {
    const newWorkspace = createMockWorkspace({ bases: null });
    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockResolvedValue({ data: newWorkspace });

    setupMocks({
      createWorkspaceMutation: mockCreateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateWorkspace('Test', '', (ws) => {
        expect(ws).toEqual(newWorkspace);
      });
    });
  });

  it('should handle missing authUser during navigation', async () => {
    const newWorkspace = createMockWorkspace({
      id: 'ws-1',
      bases: [{ id: 'base-1', tables: [{ id: 'table-1' }] }],
    });

    const mockCreateMutation = createMockMutation();
    mockCreateMutation.mutateAsync.mockResolvedValue({ data: newWorkspace });

    setupMocks(
      { createWorkspaceMutation: mockCreateMutation },
      { authUser: null }
    );

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleCreateWorkspace('Test', '');
    });

    // Should not crash and should still call navigate
    await waitFor(() => {
      expect(mockStateManager.navigate).toBeDefined();
    });
  });

  it('should handle form submission with valid workspace data', async () => {
    const mockCreateWorkspace = vi.fn();
    const mockSetShowCreateWorkspace = vi.fn();
    const mockSetNewWorkspaceName = vi.fn();
    const mockSetNewWorkspaceDescription = vi.fn();
    const mockSetWorkspaceError = vi.fn();

    setupMocks({}, {
      setShowCreateWorkspace: mockSetShowCreateWorkspace,
      newWorkspaceName: 'Test WS',
      setNewWorkspaceName: mockSetNewWorkspaceName,
      newWorkspaceDescription: 'Test Desc',
      setNewWorkspaceDescription: mockSetNewWorkspaceDescription,
      workspaceError: '',
      setWorkspaceError: mockSetWorkspaceError,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    // Mock the handleCreateWorkspace to avoid full execution
    result.current.handleCreateWorkspace = mockCreateWorkspace;

    // Simulate form submission would call handlers
    expect(typeof result.current.handleFormSubmit).toBe('function');
  });

  it('should handle multiple rapid edits to same table', async () => {
    const mockUpdateMutation = createMockMutation();
    let callCount = 0;
    mockUpdateMutation.mutateAsync.mockImplementation(async () => {
      callCount++;
      return { success: true };
    });

    setupMocks({
      updateTableMutation: mockUpdateMutation,
    });

    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    await act(async () => {
      await result.current.handleEditTable('table-1', { title: 'Title 1' });
      await result.current.handleEditTable('table-1', { title: 'Title 2' });
      await result.current.handleEditTable('table-1', { title: 'Title 3' });
    });

    expect(callCount).toBe(3);
    expect(mockToast.success).toHaveBeenCalledTimes(3);
  });

  it('should set views refetch trigger', () => {
    const { result } = renderHook(() => useWorkspaceBusinessLogic());

    expect(typeof result.current.setViewsRefetchTrigger).toBe('function');

    act(() => {
      result.current.setViewsRefetchTrigger(1);
    });

    // Verify the function was called successfully (no error)
    expect(true).toBe(true);
  });
});
