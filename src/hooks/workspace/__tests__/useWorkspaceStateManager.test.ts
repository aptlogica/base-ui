/**
 * Comprehensive Unit Tests for useWorkspaceStateManager.ts
 *
 * This test suite covers state management from multiple sources:
 * - Plugin Store state and actions
 * - Navigation Store state and actions
 * - Auth state
 * - Current user state
 * - Router navigation
 * - Local modal/popover UI state
 *
 * Testing patterns:
 * - AAA (Arrange-Act-Assert)
 * - Isolated tests with mocked dependencies
 * - State verification
 * - Action invocation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useWorkspaceStateManager } from '../useWorkspaceStateManager';

// ============================================================================
// Mock Setup
// ============================================================================

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Auth Context
const mockAuthUser = { id: 'user-123', email: 'test@example.com' };
const mockUseAuth = vi.fn(() => ({
  user: mockAuthUser as any,
  restoreCompleted: true,
}));

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Current User
const mockCurrentUser = { id: 'user-123', name: 'Test User' };
vi.mock('../../../auth/useCurrentUser', () => ({
  useCurrentUser: () => mockCurrentUser,
}));

// Mock Plugin Store
const mockPluginStore = {
  flyoutOpen: false,
  flyoutMode: 'normal' as any,
  flyoutWidth: 300,
  currentPlugin: null as any,
  isTransitioning: false,
  selectedWorkspace: null as any,
  openFlyout: vi.fn(),
  closeFlyout: vi.fn(),
  setFlyoutMode: vi.fn(),
  setFlyoutWidth: vi.fn(),
  toggleFlyout: vi.fn(),
  setTransitioning: vi.fn(),
  setSelectedWorkspace: vi.fn(),
};

vi.mock('../../../stores/pluginStore', () => ({
  usePluginStore: () => mockPluginStore,
}));

// Mock Navigation Store
const mockNavigationStore = {
  selectedWorkspaceId: 'ws-1' as any,
  selectedBaseId: 'base-1' as any,
  selectedTableId: 'table-1' as any,
  selectedViewId: 'view-1' as any,
  expandedBases: { 'base-1': true } as any,
  expandedTables: { 'table-1': true } as any,
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
};

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => mockNavigationStore,
}));

// ============================================================================
// Test Utilities
// ============================================================================

const resetAllMocks = () => {
  vi.clearAllMocks();
  // Reset store states
  mockPluginStore.flyoutOpen = false;
  mockPluginStore.flyoutMode = 'normal';
  mockPluginStore.flyoutWidth = 300;
  mockPluginStore.currentPlugin = null;
  mockPluginStore.isTransitioning = false;
  mockPluginStore.selectedWorkspace = null;

  mockNavigationStore.selectedWorkspaceId = 'ws-1';
  mockNavigationStore.selectedBaseId = 'base-1';
  mockNavigationStore.selectedTableId = 'table-1';
  mockNavigationStore.selectedViewId = 'view-1';
  mockNavigationStore.expandedBases = { 'base-1': true };
  mockNavigationStore.expandedTables = { 'table-1': true };

  mockUseAuth.mockReturnValue({
    user: mockAuthUser,
    restoreCompleted: true,
  });
};

beforeEach(() => {
  resetAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// AUTH & USER STATE TESTS
// ============================================================================

describe('Auth & User State', () => {
  it('should expose auth user from useAuth', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.authUser).toEqual(mockAuthUser);
  });

  it('should expose current user from useCurrentUser', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.currentUser).toEqual(mockCurrentUser);
  });

  it('should expose restoreCompleted flag from useAuth', () => {
    mockUseAuth.mockReturnValue({
      user: mockAuthUser,
      restoreCompleted: true,
    });

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.restoreCompleted).toBe(true);
  });

  it('should update when auth restoreCompleted changes', () => {
    mockUseAuth.mockReturnValue({
      user: mockAuthUser,
      restoreCompleted: false,
    });

    const { result, rerender } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.restoreCompleted).toBe(false);

    mockUseAuth.mockReturnValue({
      user: mockAuthUser,
      restoreCompleted: true,
    });

    rerender();

    expect(result.current.restoreCompleted).toBe(true);
  });

  it('should handle null auth user', () => {
    mockUseAuth.mockReturnValue({
      user: null as any,
      restoreCompleted: true,
    });

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.authUser).toBeNull();
  });
});

// ============================================================================
// PLUGIN STORE STATE TESTS
// ============================================================================

describe('Plugin Store State', () => {
  it('should expose flyout state from plugin store', () => {
    mockPluginStore.flyoutOpen = true;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.flyoutOpen).toBe(true);
  });

  it('should expose flyout mode from plugin store', () => {
    mockPluginStore.flyoutMode = 'details' as any;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.flyoutMode).toBe('details');
  });

  it('should expose flyout width from plugin store', () => {
    mockPluginStore.flyoutWidth = 500;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.flyoutWidth).toBe(500);
  });

  it('should expose current plugin from plugin store', () => {
    mockPluginStore.currentPlugin = 'test-plugin' as any;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.currentPlugin).toBe('test-plugin');
  });

  it('should expose isTransitioning from plugin store', () => {
    mockPluginStore.isTransitioning = true;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.isTransitioning).toBe(true);
  });

  it('should expose selected workspace from plugin store', () => {
    mockPluginStore.selectedWorkspace = 'plugin-ws-1' as any;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.pluginStoreSelectedWorkspace).toBe('plugin-ws-1');
  });

  it('should handle null plugin store selected workspace', () => {
    mockPluginStore.selectedWorkspace = null;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.pluginStoreSelectedWorkspace).toBeNull();
  });
});

// ============================================================================
// PLUGIN STORE ACTION TESTS
// ============================================================================

describe('Plugin Store Actions', () => {
  it('should expose openFlyout action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.openFlyout).toBe('function');
  });

  it('should expose closeFlyout action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.closeFlyout).toBe('function');
  });

  it('should expose setFlyoutMode action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.setFlyoutMode).toBe('function');
  });

  it('should expose setFlyoutWidth action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.setFlyoutWidth).toBe('function');
  });

  it('should expose toggleFlyout action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.toggleFlyout).toBe('function');
  });

  it('should expose setTransitioning action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.setTransitioning).toBe('function');
  });

  it('should expose setPluginStoreSelectedWorkspace action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.setPluginStoreSelectedWorkspace).toBe('function');
  });
});

// ============================================================================
// NAVIGATION STORE STATE TESTS
// ============================================================================

describe('Navigation Store State', () => {
  it('should expose selectedWorkspaceId from navigation store', () => {
    mockNavigationStore.selectedWorkspaceId = 'ws-123';

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.selectedWorkspaceId).toBe('ws-123');
  });

  it('should expose selectedBaseId from navigation store', () => {
    mockNavigationStore.selectedBaseId = 'base-456';

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.selectedBaseId).toBe('base-456');
  });

  it('should expose selectedTableId from navigation store', () => {
    mockNavigationStore.selectedTableId = 'table-789';

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.selectedTableId).toBe('table-789');
  });

  it('should expose selectedViewId from navigation store', () => {
    mockNavigationStore.selectedViewId = 'view-101';

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.selectedViewId).toBe('view-101');
  });

  it('should expose expandedBases from navigation store', () => {
    const expandedBases = { 'base-1': true, 'base-2': false };
    mockNavigationStore.expandedBases = expandedBases;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.expandedBases).toEqual(expandedBases);
  });

  it('should expose expandedTables from navigation store', () => {
    const expandedTables = { 'table-1': true, 'table-2': false };
    mockNavigationStore.expandedTables = expandedTables;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.expandedTables).toEqual(expandedTables);
  });

  it('should handle null selected IDs', () => {
    mockNavigationStore.selectedWorkspaceId = null as any;
    mockNavigationStore.selectedBaseId = null as any;
    mockNavigationStore.selectedTableId = null as any;
    mockNavigationStore.selectedViewId = null as any;

    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.selectedWorkspaceId).toBeNull();
    expect(result.current.selectedBaseId).toBeNull();
    expect(result.current.selectedTableId).toBeNull();
    expect(result.current.selectedViewId).toBeNull();
  });
});

// ============================================================================
// NAVIGATION STORE ACTION TESTS
// ============================================================================

describe('Navigation Store Actions', () => {
  it('should expose toggleBaseExpansion action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.toggleBaseExpansion).toBe('function');
  });

  it('should expose toggleTableExpansion action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.toggleTableExpansion).toBe('function');
  });

  it('should expose setWorkspace action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.setWorkspace).toBe('function');
  });

  it('should expose setBase action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.setBase).toBe('function');
  });

  it('should expose setTable action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.setTable).toBe('function');
  });

  it('should expose setView action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.setView).toBe('function');
  });

  it('should expose loadUserNavigation action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.loadUserNavigation).toBe('function');
  });

  it('should expose saveUserNavigation action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.saveUserNavigation).toBe('function');
  });

  it('should expose navigateToLastLocation action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.navigateToLastLocation).toBe('function');
  });

  it('should expose navigateToFirstTableView action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.navigateToFirstTableView).toBe('function');
  });

  it('should expose navigateToFirstBase action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.navigateToFirstBase).toBe('function');
  });

  it('should expose navigateAndPersist action', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(typeof result.current.navigateAndPersist).toBe('function');
  });
});

// ============================================================================
// LOCAL UI STATE TESTS
// ============================================================================

describe('Local UI State - Modals', () => {
  it('should initialize showCreateWorkspace as false', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.showCreateWorkspace).toBe(false);
  });

  it('should allow toggling showCreateWorkspace', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setShowCreateWorkspace(true);
    });

    expect(result.current.showCreateWorkspace).toBe(true);

    act(() => {
      result.current.setShowCreateWorkspace(false);
    });

    expect(result.current.showCreateWorkspace).toBe(false);
  });

  it('should initialize showCreateBaseWorkspaceId as null', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.showCreateBaseWorkspaceId).toBeNull();
  });

  it('should allow setting showCreateBaseWorkspaceId', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setShowCreateBaseWorkspaceId('ws-1');
    });

    expect(result.current.showCreateBaseWorkspaceId).toBe('ws-1');

    act(() => {
      result.current.setShowCreateBaseWorkspaceId(null);
    });

    expect(result.current.showCreateBaseWorkspaceId).toBeNull();
  });

  it('should initialize showCreateTableBaseId as null', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.showCreateTableBaseId).toBeNull();
  });

  it('should allow setting showCreateTableBaseId', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setShowCreateTableBaseId('base-1');
    });

    expect(result.current.showCreateTableBaseId).toBe('base-1');

    act(() => {
      result.current.setShowCreateTableBaseId(null);
    });

    expect(result.current.showCreateTableBaseId).toBeNull();
  });

  it('should initialize showCreateViewModal as null', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.showCreateViewModal).toBeNull();
  });

  it('should allow setting showCreateViewModal', () => {
    const viewModal = { tableId: 'table-1', viewType: 'grid' };

    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setShowCreateViewModal(viewModal);
    });

    expect(result.current.showCreateViewModal).toEqual(viewModal);

    act(() => {
      result.current.setShowCreateViewModal(null);
    });

    expect(result.current.showCreateViewModal).toBeNull();
  });
});

describe('Local UI State - Editing', () => {
  it('should initialize editingTableId as null', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.editingTableId).toBeNull();
  });

  it('should allow setting editingTableId', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setEditingTableId('table-1');
    });

    expect(result.current.editingTableId).toBe('table-1');

    act(() => {
      result.current.setEditingTableId(null);
    });

    expect(result.current.editingTableId).toBeNull();
  });

  it('should initialize editingViewId as null', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.editingViewId).toBeNull();
  });

  it('should allow setting editingViewId', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setEditingViewId('view-1');
    });

    expect(result.current.editingViewId).toBe('view-1');

    act(() => {
      result.current.setEditingViewId(null);
    });

    expect(result.current.editingViewId).toBeNull();
  });
});

describe('Local UI State - Popovers', () => {
  it('should initialize popoverRef as null', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.popoverRef).toBeNull();
  });

  it('should allow setting popoverRef', () => {
    const mockRef = { current: document.createElement('div') };

    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setPopoverRef(mockRef);
    });

    expect(result.current.popoverRef).toBe(mockRef);

    act(() => {
      result.current.setPopoverRef(null);
    });

    expect(result.current.popoverRef).toBeNull();
  });
});

// ============================================================================
// ROUTER NAVIGATION TESTS
// ============================================================================

describe('Router Navigation', () => {
  it('should expose navigate function from useNavigate', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.navigate).toBe(mockNavigate);
  });

  it('should call navigate when invoked', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    result.current.navigate('/workspace');

    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
  });

  it('should support navigate with options', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    result.current.navigate('/workspace', { replace: true });

    expect(mockNavigate).toHaveBeenCalledWith('/workspace', { replace: true });
  });
});

// ============================================================================
// COMBINED STATE TESTS
// ============================================================================

describe('Combined State Management', () => {
  it('should expose all state and actions simultaneously', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    // Auth & User
    expect(result.current.authUser).toBeDefined();
    expect(result.current.currentUser).toBeDefined();
    expect(result.current.restoreCompleted).toBeDefined();

    // Plugin Store
    expect(result.current.flyoutOpen).toBeDefined();
    expect(result.current.flyoutMode).toBeDefined();
    expect(result.current.openFlyout).toBeDefined();

    // Navigation Store
    expect(result.current.selectedWorkspaceId).toBeDefined();
    expect(result.current.setWorkspace).toBeDefined();

    // Local UI State
    expect(result.current.showCreateWorkspace).toBeDefined();
    expect(result.current.setShowCreateWorkspace).toBeDefined();

    // Router
    expect(result.current.navigate).toBeDefined();
  });

  it('should manage multiple modal states independently', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setShowCreateWorkspace(true);
      result.current.setShowCreateBaseWorkspaceId('ws-1');
      result.current.setEditingTableId('table-1');
    });

    expect(result.current.showCreateWorkspace).toBe(true);
    expect(result.current.showCreateBaseWorkspaceId).toBe('ws-1');
    expect(result.current.editingTableId).toBe('table-1');

    act(() => {
      result.current.setShowCreateWorkspace(false);
    });

    expect(result.current.showCreateWorkspace).toBe(false);
    expect(result.current.showCreateBaseWorkspaceId).toBe('ws-1');
    expect(result.current.editingTableId).toBe('table-1');
  });

  it('should transition between navigation states', () => {
    mockNavigationStore.selectedWorkspaceId = 'ws-1';
    mockNavigationStore.selectedBaseId = 'base-1';

    const { result, rerender } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.selectedWorkspaceId).toBe('ws-1');
    expect(result.current.selectedBaseId).toBe('base-1');

    mockNavigationStore.selectedWorkspaceId = 'ws-2';
    mockNavigationStore.selectedBaseId = 'base-2';

    rerender();

    expect(result.current.selectedWorkspaceId).toBe('ws-2');
    expect(result.current.selectedBaseId).toBe('base-2');
  });
});

// ============================================================================
// RETURN VALUE COMPLETENESS TESTS
// ============================================================================

describe('Return Value Completeness', () => {
  it('should return all expected properties', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    // Auth & User
    expect(result.current).toHaveProperty('authUser');
    expect(result.current).toHaveProperty('currentUser');
    expect(result.current).toHaveProperty('restoreCompleted');

    // Plugin Store State
    expect(result.current).toHaveProperty('flyoutOpen');
    expect(result.current).toHaveProperty('flyoutMode');
    expect(result.current).toHaveProperty('flyoutWidth');
    expect(result.current).toHaveProperty('currentPlugin');
    expect(result.current).toHaveProperty('isTransitioning');
    expect(result.current).toHaveProperty('pluginStoreSelectedWorkspace');

    // Plugin Store Actions
    expect(result.current).toHaveProperty('openFlyout');
    expect(result.current).toHaveProperty('closeFlyout');
    expect(result.current).toHaveProperty('setFlyoutMode');
    expect(result.current).toHaveProperty('setFlyoutWidth');
    expect(result.current).toHaveProperty('toggleFlyout');
    expect(result.current).toHaveProperty('setTransitioning');
    expect(result.current).toHaveProperty('setPluginStoreSelectedWorkspace');

    // Navigation Store State
    expect(result.current).toHaveProperty('selectedWorkspaceId');
    expect(result.current).toHaveProperty('selectedBaseId');
    expect(result.current).toHaveProperty('selectedTableId');
    expect(result.current).toHaveProperty('selectedViewId');
    expect(result.current).toHaveProperty('expandedBases');
    expect(result.current).toHaveProperty('expandedTables');

    // Navigation Store Actions
    expect(result.current).toHaveProperty('toggleBaseExpansion');
    expect(result.current).toHaveProperty('toggleTableExpansion');
    expect(result.current).toHaveProperty('setWorkspace');
    expect(result.current).toHaveProperty('setBase');
    expect(result.current).toHaveProperty('setTable');
    expect(result.current).toHaveProperty('setView');
    expect(result.current).toHaveProperty('loadUserNavigation');
    expect(result.current).toHaveProperty('saveUserNavigation');
    expect(result.current).toHaveProperty('navigateToLastLocation');
    expect(result.current).toHaveProperty('navigateToFirstTableView');
    expect(result.current).toHaveProperty('navigateToFirstBase');
    expect(result.current).toHaveProperty('navigateAndPersist');

    // Local UI State
    expect(result.current).toHaveProperty('showCreateWorkspace');
    expect(result.current).toHaveProperty('setShowCreateWorkspace');
    expect(result.current).toHaveProperty('showCreateBaseWorkspaceId');
    expect(result.current).toHaveProperty('setShowCreateBaseWorkspaceId');
    expect(result.current).toHaveProperty('showCreateTableBaseId');
    expect(result.current).toHaveProperty('setShowCreateTableBaseId');
    expect(result.current).toHaveProperty('showCreateViewModal');
    expect(result.current).toHaveProperty('setShowCreateViewModal');
    expect(result.current).toHaveProperty('editingTableId');
    expect(result.current).toHaveProperty('setEditingTableId');
    expect(result.current).toHaveProperty('editingViewId');
    expect(result.current).toHaveProperty('setEditingViewId');
    expect(result.current).toHaveProperty('popoverRef');
    expect(result.current).toHaveProperty('setPopoverRef');

    // Router
    expect(result.current).toHaveProperty('navigate');
  });

  it('should return exactly 49 properties', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    const keys = Object.keys(result.current);
    expect(keys.length).toBe(49);
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle rapid state changes', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setShowCreateWorkspace(true);
      result.current.setShowCreateWorkspace(false);
      result.current.setShowCreateWorkspace(true);
    });

    expect(result.current.showCreateWorkspace).toBe(true);
  });

  it('should preserve other state when updating one modal', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setShowCreateWorkspace(true);
      result.current.setShowCreateBaseWorkspaceId('ws-1');
      result.current.setEditingTableId('table-1');
    });

    const previousWorkspaceModal = result.current.showCreateWorkspace;
    const previousBaseModal = result.current.showCreateBaseWorkspaceId;

    act(() => {
      result.current.setEditingViewId('view-1');
    });

    expect(result.current.showCreateWorkspace).toBe(previousWorkspaceModal);
    expect(result.current.showCreateBaseWorkspaceId).toBe(previousBaseModal);
    expect(result.current.editingViewId).toBe('view-1');
  });

  it('should handle multiple setters being called in sequence', () => {
    const { result } = renderHook(() => useWorkspaceStateManager());

    act(() => {
      result.current.setEditingTableId('table-1');
      result.current.setEditingViewId('view-1');
      result.current.setShowCreateViewModal({ tableId: 'table-1', viewType: 'grid' });
      result.current.setShowCreateWorkspace(true);
    });

    expect(result.current.editingTableId).toBe('table-1');
    expect(result.current.editingViewId).toBe('view-1');
    expect(result.current.showCreateViewModal).toEqual({ tableId: 'table-1', viewType: 'grid' });
    expect(result.current.showCreateWorkspace).toBe(true);
  });

  it('should handle store state changes', () => {
    mockNavigationStore.selectedWorkspaceId = 'ws-old';

    const { result, rerender } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.selectedWorkspaceId).toBe('ws-old');

    mockNavigationStore.selectedWorkspaceId = 'ws-new';

    rerender();

    expect(result.current.selectedWorkspaceId).toBe('ws-new');
  });

  it('should handle expansion state changes', () => {
    const { result, rerender } = renderHook(() => useWorkspaceStateManager());

    expect(result.current.expandedBases).toEqual({ 'base-1': true });

    mockNavigationStore.expandedBases = { 'base-1': true, 'base-2': true } as any;

    rerender();

    expect(result.current.expandedBases).toEqual({ 'base-1': true, 'base-2': true });
  });
});
