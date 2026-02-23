import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNavigation, useNavigationRestore } from '../useNavigation';
import * as navigationStore from '../../stores/navigationStore';
import * as useWorkspaceDataModule from '../useWorkspaceData';
import * as authContextModule from '../../auth/AuthContext';
import * as toastModule from '../../components/common/Toast';
import * as navigationPersistenceModule from '../../utils/navigationPersistence';
import * as navigationIndexModule from '../../utils/navigationIndex';

// ============================================================================
// MOCKS & SETUP
// ============================================================================

// Avoid hoisting issues: create mocks via vi.hoisted
const { navigateSpy, useNavigateMock, useLocationMock, useParamsMock } = vi.hoisted(() => {
  const nav = vi.fn();
  return {
    navigateSpy: nav,
    useNavigateMock: vi.fn(() => nav),
    useLocationMock: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
    useParamsMock: vi.fn(() => ({})),
  };
});

// Now define the mocks
vi.mock('../../stores/navigationStore');
vi.mock('../useWorkspaceData');
vi.mock('../../auth/AuthContext');
vi.mock('../../components/common/Toast');
vi.mock('../../utils/navigationPersistence');
vi.mock('../../utils/navigationIndex');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: useNavigateMock,
    useLocation: useLocationMock,
    useParams: useParamsMock,
  } as unknown as typeof import('react-router-dom');
});

// ============================================================================
// TEST SETUP & UTILITIES
// ============================================================================

const createQueryClientWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(BrowserRouter, null, children)
    );
};

const mockStoreState = {
  selectedWorkspaceId: null,
  selectedBaseId: null,
  selectedTableId: null,
  selectedViewId: null,
  expandedBases: [],
  expandedTables: [],
  navigateToWorkspace: vi.fn(),
  navigateToBase: vi.fn(),
  navigateToTable: vi.fn(),
  navigateToView: vi.fn(),
  getNavigationPath: vi.fn(() => '/'),
  saveUserNavigation: vi.fn(),
  updateActivityData: vi.fn(),
};

const mockAuthContext = {
  user: { id: 'user-1', email: 'user@example.com' },
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  saving: false,
  restoreCompleted: true,
  userRole: null,
};

const mockToastContext = {
  show: vi.fn(),
  dismiss: vi.fn(),
  clear: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

const mockWorkspaceData = {
  data: {
    workspaces: [
      {
        id: 'ws-1',
        name: 'Workspace 1',
        bases: [
          {
            id: 'base-1',
            name: 'Base 1',
            workspace_id: 'ws-1',
            tables: [
              { id: 'table-1', name: 'Table 1', base_id: 'base-1' }
            ]
          }
        ]
      },
      {
        id: 'ws-2',
        name: 'Workspace 2',
        bases: [
          {
            id: 'base-2',
            name: 'Base 2',
            workspace_id: 'ws-2',
            tables: [
              { id: 'table-2', name: 'Table 2', base_id: 'base-2' }
            ]
          }
        ]
      }
    ]
  }
};

const mockWorkspaceIndex = {
  baseToWorkspace: new Map([
    ['base-1', 'ws-1'],
    ['base-2', 'ws-2'],
    ['base-3', 'ws-1']
  ]),
  tableToBase: new Map([
    ['table-1', 'base-1'],
    ['table-2', 'base-2']
  ])
};

// ============================================================================
// DESCRIBE BLOCKS
// ============================================================================

describe('useNavigation Hook', () => {
  // Setup before each test
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
    mockUseNavigationStore.mockReturnValue(mockStoreState  as any);

    const mockUseAuth = vi.mocked(authContextModule.useAuth);
    mockUseAuth.mockReturnValue(mockAuthContext  as any);

    const mockUseToast = vi.mocked(toastModule.useToast);
    mockUseToast.mockReturnValue(mockToastContext  as any);

    const mockUseWorkspaceData = vi.mocked(useWorkspaceDataModule.default);
    mockUseWorkspaceData.mockReturnValue({
      workspaces: mockWorkspaceData,
      loading: false,
      error: null,
    }  as any);

    const mockBuildWorkspaceIndex = vi.mocked(navigationIndexModule.buildWorkspaceIndex);
    mockBuildWorkspaceIndex.mockReturnValue(mockWorkspaceIndex);

    const mockResolveWorkspaceIdFromBaseId = vi.mocked(
      navigationPersistenceModule.resolveWorkspaceIdFromBaseId
    );
    mockResolveWorkspaceIdFromBaseId.mockReturnValue('ws-1');

    navigateSpy.mockClear();
    useLocationMock.mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // TEST GROUP 1: HOOK INITIALIZATION & STATE EXPOSURE
  // =========================================================================

  describe('Hook Initialization & State Exposure', () => {
    it('should return current selection states from store', () => {
      // Arrange
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        selectedBaseId: 'base-1',
        selectedTableId: 'table-1',
        selectedViewId: 'view-1',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(result.current.selectedWorkspaceId).toBe('ws-1');
      expect(result.current.selectedBaseId).toBe('base-1');
      expect(result.current.selectedTableId).toBe('table-1');
      expect(result.current.selectedViewId).toBe('view-1');
    });

    it('should expose navigation functions', () => {
      // Arrange - Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(typeof result.current.navigateToWorkspace).toBe('function');
      expect(typeof result.current.navigateToBase).toBe('function');
      expect(typeof result.current.navigateToTable).toBe('function');
      expect(typeof result.current.navigateToView).toBe('function');
    });

    it('should expose utility functions', () => {
      // Arrange - Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(typeof result.current.restoreNavigation).toBe('function');
      expect(typeof result.current.getNavigationPath).toBe('function');
      expect(result.current.currentPath).toBe('/');
    });

    it('should return current pathname as currentPath', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/grid',
        search: '',
        hash: '',
        state: null,
      });

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(result.current.currentPath).toBe('/workspace/ws-1/base/base-1/table/table-1/grid');
    });

    it('should return null for all navigation states on initial load', () => {
      // Arrange - Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(result.current.selectedWorkspaceId).toBeNull();
      expect(result.current.selectedBaseId).toBeNull();
      expect(result.current.selectedTableId).toBeNull();
      expect(result.current.selectedViewId).toBeNull();
    });
  });

  // =========================================================================
  // TEST GROUP 2: URL PARSING - WORKSPACE ROUTE PATTERN
  // =========================================================================

  describe('URL Parsing - Workspace Route (/workspace/{workspaceId})', () => {
    it('should parse workspace route and update store when first loaded', async () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.navigateToWorkspace).toHaveBeenCalledWith('ws-1');
      });
    });

    it('should NOT update store if already selected workspace matches URL', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(mockStoreState.navigateToWorkspace).not.toHaveBeenCalled();
    });

    it('should update store when navigating to different workspace', async () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-2',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.navigateToWorkspace).toHaveBeenCalledWith('ws-2');
      });
    });
  });

  // =========================================================================
  // TEST GROUP 3: URL PARSING - VIEW ROUTE PATTERN (Full route with workspace)
  // =========================================================================
  // Note: Base-only routes (/base/{baseId}) are no longer supported
  // Navigation to base now goes to /workspace/{workspaceId}
  // Full routes are: /workspace/{workspaceId}/base/{baseId}/table/{tableId}/{viewId}

  // =========================================================================
  // TEST GROUP 4: URL PARSING - VIEW ROUTE PATTERN (Full route with workspace)
  // =========================================================================
  // Note: Table-only routes (/base/{baseId}/table/{tableId}) are no longer supported
  // Full routes are: /workspace/{workspaceId}/base/{baseId}/table/{tableId}/{viewId}

  // =========================================================================
  // TEST GROUP 5: URL PARSING - VIEW ROUTE PATTERN & SLUG DETECTION
  // =========================================================================

  describe('URL Parsing - View Route (/workspace/{workspaceId}/base/{baseId}/table/{tableId}/{viewId})', () => {
    it('should parse view route with real view ID', async () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/view-uuid-123',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
        selectedBaseId: null,
        selectedTableId: null,
        selectedViewId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.navigateToView).toHaveBeenCalledWith(
          'ws-1',
          'base-1',
          'table-1',
          'view-uuid-123'
        );
      });
    });

    it('should NOT save grid slug as selectedViewId', async () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/grid',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
        selectedBaseId: null,
        selectedTableId: null,
        selectedViewId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.navigateToTable).toHaveBeenCalledWith(
          'ws-1',
          'base-1',
          'table-1'
        );
        expect(mockStoreState.navigateToView).not.toHaveBeenCalled();
      });
    });

    it('should NOT save form slug as selectedViewId', async () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/form',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
        selectedBaseId: null,
        selectedTableId: null,
        selectedViewId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.navigateToTable).toHaveBeenCalled();
        expect(mockStoreState.navigateToView).not.toHaveBeenCalled();
      });
    });

    it('should handle all view type slugs correctly', async () => {
      // Arrange
      const slugs = ['gallery', 'kanban', 'calendar', 'gantt'];
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
        selectedBaseId: null,
        selectedTableId: null,
        selectedViewId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);

      // Act & Assert for each slug
      for (const slug of slugs) {
        useLocationMock.mockReturnValue({
          pathname: `/workspace/ws-1/base/base-1/table/table-1/${slug}`,
          search: '',
          hash: '',
          state: null,
        });
        mockUseNavigationStore.mockReturnValue(storeState  as any);

        renderHook(() => useNavigation(), {
          wrapper: createQueryClientWrapper(),
        });

        await waitFor(() => {
          expect(mockStoreState.navigateToView).not.toHaveBeenCalled();
          expect(mockStoreState.navigateToTable).toHaveBeenCalled();
        });

        mockStoreState.navigateToTable.mockClear();
        mockStoreState.navigateToView.mockClear();
      }
    });

    it('should NOT update store if view already selected and unchanged', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/view-uuid-123',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        selectedBaseId: 'base-1',
        selectedTableId: 'table-1',
        selectedViewId: 'view-uuid-123',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(mockStoreState.navigateToView).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // TEST GROUP 6: NAVIGATION FUNCTIONS WITH URL UPDATES
  // =========================================================================

  describe('Navigation Functions', () => {
    it('navigateToWorkspace should call store and React Router navigate', async () => {
      // Arrange
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Act
      act(() => {
        result.current.navigateToWorkspace('ws-2');
      });

      // Assert
      expect(mockStoreState.navigateToWorkspace).toHaveBeenCalledWith('ws-2');
      expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-2');
    });

    it('navigateToBase should call store and React Router navigate to workspace', async () => {
      // Arrange
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Act
      act(() => {
        result.current.navigateToBase('ws-1', 'base-2');
      });

      // Assert
      expect(mockStoreState.navigateToBase).toHaveBeenCalledWith('ws-1', 'base-2');
      // navigateToBase now navigates to workspace homepage
      expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1');
    });

    it('navigateToTable should call store and React Router with full route', async () => {
      // Arrange
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Act
      act(() => {
        result.current.navigateToTable('ws-1', 'base-1', 'table-2');
      });

      // Assert
      expect(mockStoreState.navigateToTable).toHaveBeenCalledWith(
        'ws-1',
        'base-1',
        'table-2'
      );
      expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1/base/base-1/table/table-2/grid');
    });

    it('navigateToView should call store and React Router navigate', async () => {
      // Arrange
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Act
      act(() => {
        result.current.navigateToView('ws-1', 'base-1', 'table-1', 'view-abc');
      });

      // Assert
      expect(mockStoreState.navigateToView).toHaveBeenCalledWith(
        'ws-1',
        'base-1',
        'table-1',
        'view-abc'
      );
      expect(navigateSpy).toHaveBeenCalledWith(
        '/workspace/ws-1/base/base-1/table/table-1/view-abc'
      );
    });
  });

  // =========================================================================
  // TEST GROUP 7: SESSION STORAGE CACHING
  // =========================================================================

  describe('Session Storage Caching', () => {
    it('should cache navigation state when restoreCompleted is true', async () => {
      // Arrange
      const authContext = {
        ...mockAuthContext,
        restoreCompleted: true,
      };
      const mockUseAuth = vi.mocked(authContextModule.useAuth);
      mockUseAuth.mockReturnValue(authContext  as any);

      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        selectedBaseId: 'base-1',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.saveUserNavigation).toHaveBeenCalledWith('user-1');
      });
    });

    it('should NOT cache navigation during restore phase', async () => {
      // Arrange
      const authContext = {
        ...mockAuthContext,
        restoreCompleted: false,
      };
      const mockUseAuth = vi.mocked(authContextModule.useAuth);
      mockUseAuth.mockReturnValue(authContext  as any);

      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        selectedBaseId: 'base-1',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(mockStoreState.saveUserNavigation).not.toHaveBeenCalled();
    });

    it('should NOT cache if user is not authenticated', async () => {
      // Arrange
      const authContext = {
        ...mockAuthContext,
        user: null,
        restoreCompleted: true,
      };
      const mockUseAuth = vi.mocked(authContextModule.useAuth);
      mockUseAuth.mockReturnValue(authContext  as any);

      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(mockStoreState.saveUserNavigation).not.toHaveBeenCalled();
    });

    it('should NOT cache if selectedWorkspaceId is null', async () => {
      // Arrange
      const authContext = {
        ...mockAuthContext,
        restoreCompleted: true,
      };
      const mockUseAuth = vi.mocked(authContextModule.useAuth);
      mockUseAuth.mockReturnValue(authContext  as any);

      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(mockStoreState.saveUserNavigation).not.toHaveBeenCalled();
    });

    it('should cache on navigation state changes after restore completes', async () => {
      // Arrange
      const authContext = {
        ...mockAuthContext,
        restoreCompleted: true,
      };
      const mockUseAuth = vi.mocked(authContextModule.useAuth);
      mockUseAuth.mockReturnValue(authContext  as any);

      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        selectedBaseId: 'base-1',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      const { rerender } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Act - Update store state
      const updatedState = {
        ...storeState,
        selectedTableId: 'table-1',
      };
      mockUseNavigationStore.mockReturnValue(updatedState  as any);
      rerender();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.saveUserNavigation).toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // TEST GROUP 8: BROWSER RELOAD RESTORATION
  // =========================================================================

  describe('Browser Reload Restoration', () => {
    it('should restore navigation path when on home route with stored state', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        selectedBaseId: 'base-1',
        selectedTableId: 'table-1',
        getNavigationPath: vi.fn(() => '/workspace/ws-1/base/base-1/table/table-1/grid'),
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      act(() => {
        result.current.restoreNavigation();
      });

      // Assert
      expect(navigateSpy).toHaveBeenCalledWith(
        '/workspace/ws-1/base/base-1/table/table-1/grid',
        { replace: true }
      );
    });

    it('should NOT restore if already on non-home route', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/grid',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        getNavigationPath: vi.fn(() => '/workspace/ws-1/base/base-1/table/table-1/grid'),
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      navigateSpy.mockClear();
      act(() => {
        result.current.restoreNavigation();
      });

      // Assert
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should NOT restore if no stored navigation state', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
        getNavigationPath: vi.fn(() => '/'),
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      navigateSpy.mockClear();
      act(() => {
        result.current.restoreNavigation();
      });

      // Assert
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should not navigate if restored path equals current path', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        getNavigationPath: vi.fn(() => '/'),
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      navigateSpy.mockClear();
      act(() => {
        result.current.restoreNavigation();
      });

      // Assert
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // TEST GROUP 9: EDGE CASES & ERROR HANDLING
  // =========================================================================

  describe('Edge Cases & Error Handling', () => {
    it('should handle empty pathname gracefully', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '',
        search: '',
        hash: '',
        state: null,
      });

      // Act - should not throw
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(result.current).toBeDefined();
    });

    it('should handle special characters in IDs', async () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-with-dash_and_underscore/table/table-123/grid',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert - should handle the IDs correctly
      await waitFor(() => {
        expect(mockStoreState.navigateToTable).toHaveBeenCalledWith(
          'ws-1',
          'base-with-dash_and_underscore',
          'table-123'
        );
      });
    });

    it('should handle workspace data loading state', () => {
      // Arrange
      const mockUseWorkspaceData = vi.mocked(useWorkspaceDataModule.default);
      mockUseWorkspaceData.mockReturnValue({
        workspaces: undefined,
        loading: true,
        error: null,
      }  as any);

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(result.current).toBeDefined();
      expect(result.current.selectedWorkspaceId).toBe(null);
    });

    it('should handle null workspaces data gracefully', () => {
      // Arrange
      const mockUseWorkspaceData = vi.mocked(useWorkspaceDataModule.default);
      mockUseWorkspaceData.mockReturnValue({
        workspaces: null,
        loading: false,
        error: null,
      }  as any);

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(result.current).toBeDefined();
    });

    it('should handle workspace data with alternative nested structure', () => {
      // Arrange
      const mockUseWorkspaceData = vi.mocked(useWorkspaceDataModule.default);
      mockUseWorkspaceData.mockReturnValue({
        workspaces: [
          {
            id: 'ws-1',
            bases: [{ id: 'base-1', workspaceId: 'ws-1' }]
          }
        ],
        loading: false,
        error: null,
      }  as any);

      // Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(result.current).toBeDefined();
    });
  });

  // =========================================================================
  // TEST GROUP 10: useNavigationRestore HOOK
  // =========================================================================

  describe('useNavigationRestore Hook', () => {
    it('should call restoreNavigation on mount', () => {
      // Arrange
      const mockGetNavigationPath = vi.fn(() => '/workspace/ws-1');
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue({
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        getNavigationPath: mockGetNavigationPath,
      }  as any);

      useLocationMock.mockReturnValue({
        pathname: '/',
        search: '',
        hash: '',
        state: null,
      });

      // Act
      renderHook(() => useNavigationRestore(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      expect(navigateSpy).toHaveBeenCalled();
    });

    it('should call restoreNavigation only once on mount', () => {
      // Arrange
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue({
        ...mockStoreState,
        selectedWorkspaceId: null,
      }  as any);

      // Act
      const { rerender } = renderHook(() => useNavigationRestore(), {
        wrapper: createQueryClientWrapper(),
      });

      navigateSpy.mockClear();
      rerender();

      // Assert
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // TEST GROUP 11: COMPLEX SCENARIO INTEGRATION TESTS
  // =========================================================================

  describe('Complex Scenario Integration Tests', () => {
    it('should handle complete navigation flow: workspace → base → table → view', async () => {
      // Arrange
      const { rerender } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      const storeState: any = { ...mockStoreState };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState);

      // Act 1: Navigate to workspace
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1',
        search: '',
        hash: '',
        state: null,
      });
      rerender();

      await waitFor(() => {
        expect(mockStoreState.navigateToWorkspace).toHaveBeenCalledWith('ws-1');
      });

      mockStoreState.navigateToWorkspace.mockClear();
      storeState.selectedWorkspaceId = 'ws-1';

      // Act 2: Navigate to base (now navigates to workspace homepage)
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1',
        search: '',
        hash: '',
        state: null,
      });
      rerender();

      // Note: Base navigation now goes to workspace homepage, not a base-specific route
      // The base is selected in the store but URL shows workspace
      mockStoreState.navigateToBase.mockClear();
      storeState.selectedBaseId = 'base-1';

      // Act 3: Navigate to table
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/grid',
        search: '',
        hash: '',
        state: null,
      });
      rerender();

      await waitFor(() => {
        expect(mockStoreState.navigateToTable).toHaveBeenCalledWith(
          'ws-1',
          'base-1',
          'table-1'
        );
      });

      mockStoreState.navigateToTable.mockClear();
      storeState.selectedTableId = 'table-1';

      // Act 4: Navigate to view
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/view-abc',
        search: '',
        hash: '',
        state: null,
      });
      rerender();

      await waitFor(() => {
        expect(mockStoreState.navigateToView).toHaveBeenCalledWith(
          'ws-1',
          'base-1',
          'table-1',
          'view-abc'
        );
      });

      // Assert - final state reached via store updates
      expect(navigationStore.useNavigationStore).toBeDefined();
    });

    it('should handle breadcrumb-style backward navigation', async () => {
      // Arrange - start at view level
      useLocationMock.mockReturnValue({
        pathname: '/base/base-1/table/table-1/view-abc',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        selectedBaseId: 'base-1',
        selectedTableId: 'table-1',
        selectedViewId: 'view-abc',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      mockStoreState.navigateToTable.mockClear();

      // Act 1: Go back to table
      act(() => {
        result.current.navigateToTable('ws-1', 'base-1', 'table-1');
      });

      expect(mockStoreState.navigateToTable).toHaveBeenCalledWith(
        'ws-1',
        'base-1',
        'table-1'
      );

      mockStoreState.navigateToBase.mockClear();

      // Act 2: Go back to base
      act(() => {
        result.current.navigateToBase('ws-1', 'base-1');
      });

      // Assert
      expect(mockStoreState.navigateToBase).toHaveBeenCalledWith('ws-1', 'base-1');
    });

    it('should handle rapid consecutive navigation changes', async () => {
      // Arrange
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Act - rapid navigation
      act(() => {
        result.current.navigateToBase('ws-1', 'base-1');
        result.current.navigateToTable('ws-1', 'base-1', 'table-1');
        result.current.navigateToView('ws-1', 'base-1', 'table-1', 'view-x');
        result.current.navigateToBase('ws-1', 'base-2');
      });

      // Assert - all calls should be registered
      expect(navigateSpy).toHaveBeenCalledTimes(4);
    });

    it('should preserve state across workspace switch with different base structure', async () => {
      // Arrange - start with ws-1
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: 'ws-1',
        selectedBaseId: 'base-1',
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      const { rerender } = renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      mockStoreState.navigateToWorkspace.mockClear();

      // Act - switch to ws-2
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-2',
        search: '',
        hash: '',
        state: null,
      });
      storeState.selectedWorkspaceId = 'ws-1';
      storeState.selectedBaseId = 'base-1';
      rerender();

      // Assert
      await waitFor(() => {
        expect(mockStoreState.navigateToWorkspace).toHaveBeenCalledWith('ws-2');
      });
    });
  });

  // =========================================================================
  // TEST GROUP 12: ROUTE PATTERN EDGE CASES
  // =========================================================================

  describe('Route Pattern Edge Cases', () => {
    it('should NOT match path with extra segments', () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/grid/extra',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = { ...mockStoreState };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert - extra segments should not match the pattern
      expect(mockStoreState.navigateToView).not.toHaveBeenCalled();
      expect(mockStoreState.navigateToTable).not.toHaveBeenCalled();
    });

    it('should handle uppercase view type slugs case-insensitively', async () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/GRID',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.navigateToTable).toHaveBeenCalled();
        expect(mockStoreState.navigateToView).not.toHaveBeenCalled();
      });
    });

    it('should handle mixed case view type slugs', async () => {
      // Arrange
      useLocationMock.mockReturnValue({
        pathname: '/workspace/ws-1/base/base-1/table/table-1/GrId',
        search: '',
        hash: '',
        state: null,
      });
      const storeState = {
        ...mockStoreState,
        selectedWorkspaceId: null,
      };
      const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);
      mockUseNavigationStore.mockReturnValue(storeState  as any);

      // Act
      renderHook(() => useNavigation(), {
        wrapper: createQueryClientWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.navigateToTable).toHaveBeenCalled();
        expect(mockStoreState.navigateToView).not.toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // TEST GROUP 13: MEMOIZATION & PERFORMANCE
  // =========================================================================
  // Note: Workspace index building is no longer needed since workspaceId is in URL
  // These tests have been removed as they test obsolete functionality
});
