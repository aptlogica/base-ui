import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { renderHook } from '@testing-library/react';

import * as useWorkspaceDataModule from '../useWorkspaceData';
import * as authContextModule from '../../auth/AuthContext';
import * as navRedirectModule from '../../utils/navigationRedirect';
import * as navPersistenceModule from '../../utils/navigationPersistence';
import * as navigationStoreModule from '../../stores/navigationStore';

import { useNavigationActions } from '../useNavigationActions';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

// react-router-dom: useNavigate is used internally by the hook
const navigateSpy = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  } as unknown as typeof import('react-router-dom');
});

// Workspace data hook
vi.mock('../useWorkspaceData');

// Auth
vi.mock('../../auth/AuthContext');

// Navigation redirect helpers
vi.mock('../../utils/navigationRedirect');

// Navigation persistence helpers (cleanup + safe target)
vi.mock('../../utils/navigationPersistence');

// Zustand navigation store
vi.mock('../../stores/navigationStore');

// ----------------------------------------------------------------------------
// Test utilities
// ----------------------------------------------------------------------------

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(BrowserRouter, null, children)
);

// Default workspace datasets (two shapes)
const workspaceTreeArray = [
  {
    id: 'ws-1',
    bases: [
      {
        id: 'base-1',
        tables: [
          { id: 'table-1', views: [{ id: 'view-1' }, { id: 'view-2' }] },
        ],
      },
    ],
  },
  {
    id: 'ws-2',
    bases: [
      {
        id: 'base-2',
        tables: [
          { id: 'table-2', views: [{ id: 'view-A' }] },
        ],
      },
    ],
  },
];

const workspaceTreeNested = { data: { workspaces: workspaceTreeArray } };

// Helpers to reset store mock for each test
type StoreState = {
  selectedWorkspaceId: string | null;
  selectedBaseId: string | null;
  selectedTableId: string | null;
  selectedViewId: string | null;
  setWorkspace: (id: string | null) => void;
  setBase: (id: string | null) => void;
  setTable: (id: string | null) => void;
  setView: (id: string | null) => void;
};

const setWorkspace = vi.fn();
const setBase = vi.fn();
const setTable = vi.fn();
const setView = vi.fn();
const saveUserNavigation = vi.fn();

let storeState: StoreState;

const resetStoreState = (partial?: Partial<StoreState>) => {
  storeState = {
    selectedWorkspaceId: null,
    selectedBaseId: null,
    selectedTableId: null,
    selectedViewId: null,
    setWorkspace,
    setBase,
    setTable,
    setView,
    ...partial,
  } as StoreState;
};

// ----------------------------------------------------------------------------
// Setup/reset before each test
// ----------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Default auth with user id present
  vi.mocked(authContextModule.useAuth).mockReturnValue({ user: { id: 'user-1' } } as any);

  // Default workspace data to nested shape
  vi.mocked(useWorkspaceDataModule.default).mockReturnValue({ workspaces: workspaceTreeNested } as any);

  // replaceNavigate just forwards to navigate with replace flag; assert calls
  vi.mocked(navRedirectModule.replaceNavigate).mockImplementation((nav, to) => {
    // call through to our navigate spy for visibility
    (nav as any)(to, { replace: true });
  });

  // Safe target default
  vi.mocked(navPersistenceModule.getSafeNavigationTarget).mockReturnValue('/workspace');

  // By default, cleanup helpers return false (not current)
  vi.mocked(navPersistenceModule.cleanupWorkspaceNavigation).mockReturnValue(false);
  vi.mocked(navPersistenceModule.cleanupBaseNavigation).mockReturnValue(false);
  vi.mocked(navPersistenceModule.cleanupTableNavigation).mockReturnValue(false);
  vi.mocked(navPersistenceModule.cleanupViewNavigation).mockReturnValue(false);

  // Setup store hook and static getState() API
  resetStoreState();

  const mockedStoreFn: any = vi.fn(() => ({ saveUserNavigation }));
  mockedStoreFn.getState = vi.fn(() => storeState);
  (navigationStoreModule as any).useNavigationStore = mockedStoreFn;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('useNavigationActions - guards', () => {
  it('returns early when no user id present', () => {
    // Arrange
    vi.mocked(authContextModule.useAuth).mockReturnValue({ user: null } as any);
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleWorkspaceDeletion('ws-1');
    result.current.handleBaseDeletion('base-1');
    result.current.handleTableDeletion('table-1');
    result.current.handleViewDeletion('view-1');

    // Assert - no navigation, no store calls
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(setWorkspace).not.toHaveBeenCalled();
    expect(setBase).not.toHaveBeenCalled();
    expect(setTable).not.toHaveBeenCalled();
    expect(setView).not.toHaveBeenCalled();
  });
});

describe('handleWorkspaceDeletion', () => {
  it('clears selection and navigates to safe target when current workspace is deleted (by equality)', () => {
    // Arrange
    resetStoreState({ selectedWorkspaceId: 'ws-1' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleWorkspaceDeletion('ws-1');

    // Assert
    expect(setWorkspace).toHaveBeenCalledWith(null);
    expect(setBase).toHaveBeenCalledWith(null);
    expect(setTable).toHaveBeenCalledWith(null);
    expect(setView).toHaveBeenCalledWith(null);
    expect(navPersistenceModule.getSafeNavigationTarget).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
    expect(saveUserNavigation).toHaveBeenCalledWith('user-1');
  });

  it('clears selection and navigates when cleanupWorkspaceNavigation returns true', () => {
    // Arrange
    vi.mocked(navPersistenceModule.cleanupWorkspaceNavigation).mockReturnValue(true);
    resetStoreState({ selectedWorkspaceId: 'ws-OTHER' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleWorkspaceDeletion('ws-1');

    // Assert
    expect(setWorkspace).toHaveBeenCalledWith(null);
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
    expect(saveUserNavigation).toHaveBeenCalledWith('user-1');
  });

  it('does nothing when deleted workspace is not current and cleanup returns false', () => {
    // Arrange
    resetStoreState({ selectedWorkspaceId: 'ws-2' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleWorkspaceDeletion('ws-1');

    // Assert
    expect(setWorkspace).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(saveUserNavigation).not.toHaveBeenCalled();
  });

  it('supports workspaces as plain array and filters deleted workspace before computing target', () => {
    // Arrange
    vi.mocked(useWorkspaceDataModule.default).mockReturnValue({ workspaces: workspaceTreeArray } as any);
    resetStoreState({ selectedWorkspaceId: 'ws-1' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleWorkspaceDeletion('ws-1');

    // Assert
    expect(navPersistenceModule.getSafeNavigationTarget).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'ws-2' })])
    );
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
  });
});

describe('handleBaseDeletion', () => {
  it('clears base/table/view and navigates to safe target when current base is deleted (by equality)', () => {
    // Arrange
    resetStoreState({ selectedBaseId: 'base-1' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleBaseDeletion('base-1');

    // Assert
    expect(setBase).toHaveBeenCalledWith(null);
    expect(setTable).toHaveBeenCalledWith(null);
    expect(setView).toHaveBeenCalledWith(null);
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
    expect(saveUserNavigation).toHaveBeenCalledWith('user-1');
  });

  it('acts when cleanupBaseNavigation returns true', () => {
    // Arrange
    vi.mocked(navPersistenceModule.cleanupBaseNavigation).mockReturnValue(true);
    resetStoreState({ selectedBaseId: 'base-OTHER' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleBaseDeletion('base-1');

    // Assert
    expect(setBase).toHaveBeenCalledWith(null);
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
  });

  it('does nothing when not current and cleanup returns false', () => {
    // Arrange
    resetStoreState({ selectedBaseId: 'base-2' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleBaseDeletion('base-1');

    // Assert
    expect(setBase).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

describe('handleTableDeletion', () => {
  it('clears table/view and navigates when current table is deleted (by equality)', () => {
    // Arrange
    resetStoreState({ selectedTableId: 'table-1' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleTableDeletion('table-1');

    // Assert
    expect(setTable).toHaveBeenCalledWith(null);
    expect(setView).toHaveBeenCalledWith(null);
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
    expect(saveUserNavigation).toHaveBeenCalledWith('user-1');
  });

  it('acts when cleanupTableNavigation returns true', () => {
    // Arrange
    vi.mocked(navPersistenceModule.cleanupTableNavigation).mockReturnValue(true);
    resetStoreState({ selectedTableId: 'table-OTHER' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleTableDeletion('table-1');

    // Assert
    expect(setTable).toHaveBeenCalledWith(null);
    expect(setView).toHaveBeenCalledWith(null);
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
  });

  it('does nothing when not current and cleanup returns false', () => {
    // Arrange
    resetStoreState({ selectedTableId: 'table-2' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleTableDeletion('table-1');

    // Assert
    expect(setTable).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});

describe('handleViewDeletion', () => {
  it('does nothing when cleanupViewNavigation returns false', () => {
    // Arrange
    vi.mocked(navPersistenceModule.cleanupViewNavigation).mockReturnValue(false);
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleViewDeletion('view-X');

    // Assert
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('navigates to first other view in same table when available', () => {
    // Arrange
    vi.mocked(navPersistenceModule.cleanupViewNavigation).mockReturnValue(true);
    resetStoreState({ selectedBaseId: 'base-1', selectedTableId: 'table-1' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleViewDeletion('view-1');

    // Assert
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1/base/base-1/table/table-1/view-1', { replace: true });
    expect(saveUserNavigation).toHaveBeenCalledWith('user-1');
  });

  it('navigates to grid if table exists but has no views', () => {
    // Arrange: make the table have no views
    const wsArrayNoViews = [
      { id: 'ws-1', bases: [{ id: 'base-1', tables: [{ id: 'table-1', views: [] }] }] },
    ];
    vi.mocked(useWorkspaceDataModule.default).mockReturnValue({ workspaces: { data: { workspaces: wsArrayNoViews } } } as any);
    vi.mocked(navPersistenceModule.cleanupViewNavigation).mockReturnValue(true);
    resetStoreState({ selectedBaseId: 'base-1', selectedTableId: 'table-1' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleViewDeletion('view-1');

    // Assert
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1/base/base-1/table/table-1/grid', { replace: true });
    expect(saveUserNavigation).toHaveBeenCalledWith('user-1');
  });

  it('supports tables with model.id when resolving table identity', () => {
    // Arrange: table with model.id and a single view
    const wsArrayModelId = [
      {
        id: 'ws-1',
        bases: [{ id: 'base-1', tables: [{ model: { id: 'tbl-xyz' }, views: [{ id: 'v-1' }] }] }],
      },
    ];
    vi.mocked(useWorkspaceDataModule.default).mockReturnValue({ workspaces: wsArrayModelId } as any);
    vi.mocked(navPersistenceModule.cleanupViewNavigation).mockReturnValue(true);
    resetStoreState({ selectedBaseId: 'base-1', selectedTableId: 'tbl-xyz' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleViewDeletion('v-1');

    // Assert
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1/base/base-1/table/tbl-xyz/v-1', { replace: true });
  });

  it('falls back to global safe target when table/base cannot be resolved', () => {
    // Arrange: selected table not in workspace data
    vi.mocked(navPersistenceModule.cleanupViewNavigation).mockReturnValue(true);
    resetStoreState({ selectedBaseId: 'base-UNKNOWN', selectedTableId: 'table-UNKNOWN' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleViewDeletion('view-1');

    // Assert
    expect(navPersistenceModule.getSafeNavigationTarget).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
  });

  it('falls back to /workspace when no workspaces exist', () => {
    // Arrange
    vi.mocked(useWorkspaceDataModule.default).mockReturnValue({ workspaces: { data: { workspaces: [] } } } as any);
    vi.mocked(navPersistenceModule.cleanupViewNavigation).mockReturnValue(true);
    resetStoreState({ selectedBaseId: 'base-1', selectedTableId: 'table-1' });
    const { result } = renderHook(() => useNavigationActions(), { wrapper });

    // Act
    result.current.handleViewDeletion('view-1');

    // Assert
    expect(navigateSpy).toHaveBeenCalledWith('/workspace', { replace: true });
  });
});
