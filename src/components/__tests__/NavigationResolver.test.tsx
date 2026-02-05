import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import { NavigationResolver } from '../NavigationResolver';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockReplaceNavigate = vi.hoisted(() => vi.fn());
const mockGetBestNavigationTarget = vi.hoisted(() => vi.fn());
const mockNavigateToView = vi.hoisted(() => vi.fn());
const mockSetWorkspace = vi.hoisted(() => vi.fn());
const mockSetBase = vi.hoisted(() => vi.fn());
const mockSetTable = vi.hoisted(() => vi.fn());
const mockSetView = vi.hoisted(() => vi.fn());
const mockOpenFlyout = vi.hoisted(() => vi.fn());
const mockCloseFlyout = vi.hoisted(() => vi.fn());

const navStoreState = vi.hoisted(() => ({
  selectedWorkspaceId: null as string | null,
  selectedBaseId: null as string | null,
  selectedTableId: null as string | null,
  selectedViewId: null as string | null,
}));

const useNavigationStoreMock = vi.hoisted(() => {
  const stateRef = navStoreState;
  const store = () => stateRef;
  store.getState = () => ({
    ...stateRef,
    navigateToView: mockNavigateToView,
    setWorkspace: mockSetWorkspace,
    setBase: mockSetBase,
    setTable: mockSetTable,
    setView: mockSetView,
  });
  return store;
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../stores/navigationStore', () => ({
  useNavigationStore: useNavigationStoreMock,
}));

vi.mock('../../utils/navigationRedirect', () => ({
  replaceNavigate: mockReplaceNavigate,
}));

vi.mock('../../utils/navigationPersistence', () => ({
  getBestNavigationTarget: mockGetBestNavigationTarget,
}));

const workspacesDataRef = vi.hoisted(() => ({ current: [] as unknown[] }));
const workspacesLoadingRef = vi.hoisted(() => ({ current: false }));
const workspaceBasesDataRef = vi.hoisted(() => ({ current: null as unknown }));
const basesLoadingRef = vi.hoisted(() => ({ current: false }));
const baseTablesDataRef = vi.hoisted(() => ({ current: null as unknown }));
const tablesLoadingRef = vi.hoisted(() => ({ current: false }));
const tableViewsDataRef = vi.hoisted(() => ({ current: null as unknown }));
const viewsLoadingRef = vi.hoisted(() => ({ current: false }));

vi.mock('../../hooks/useApi', () => ({
  useWorkspaces: () => ({ data: workspacesDataRef.current, isLoading: workspacesLoadingRef.current }),
  useWorkspaceBases: () => ({ data: workspaceBasesDataRef.current, isLoading: basesLoadingRef.current }),
  useBaseTables: () => ({ data: baseTablesDataRef.current, isLoading: tablesLoadingRef.current }),
  useTableViews: () => ({ data: tableViewsDataRef.current, isLoading: viewsLoadingRef.current }),
}));

vi.mock('../../stores/pluginStore', () => ({
  usePluginStore: () => ({
    openFlyout: mockOpenFlyout,
    closeFlyout: mockCloseFlyout,
  }),
}));

const USER_ID = 'user-1';
const mockLogin = vi.hoisted(() => vi.fn());
const mockLogout = vi.hoisted(() => vi.fn());

const defaultAuthValue = {
  user: { id: USER_ID },
  login: mockLogin,
  logout: mockLogout,
  loading: false,
  saving: false,
  restoreCompleted: true,
  userRole: null,
};

const PATH = {
  LOGIN: '/login',
  WORKSPACE: '/workspace',
  WORKSPACE_WS1: '/workspace/ws-1',
  DASHBOARD: '/dashboard',
} as const;

function renderResolver(initialPath: string, authValue = defaultAuthValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="*" element={<NavigationResolver />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('NavigationResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const state = navStoreState;
    state.selectedWorkspaceId = null;
    state.selectedBaseId = null;
    state.selectedTableId = null;
    state.selectedViewId = null;
    workspacesDataRef.current = [];
    workspacesLoadingRef.current = false;
    workspaceBasesDataRef.current = null;
    basesLoadingRef.current = false;
    baseTablesDataRef.current = null;
    tablesLoadingRef.current = false;
    tableViewsDataRef.current = null;
    viewsLoadingRef.current = false;
  });

  describe('Public routes', () => {
    it('should return null when pathname is /login', () => {
      const { container } = renderResolver(PATH.LOGIN);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when pathname is /forgot-password', () => {
      const { container } = renderResolver('/forgot-password');

      expect(container.firstChild).toBeNull();
    });

    it('should return null when pathname is /reset-password', () => {
      const { container } = renderResolver('/reset-password');

      expect(container.firstChild).toBeNull();
    });

    it('should return null when pathname is /auth/callback', () => {
      const { container } = renderResolver('/auth/callback');

      expect(container.firstChild).toBeNull();
    });
  });

  describe('When user is not available', () => {
    it('should return null when user is null', () => {
      const authValue = { ...defaultAuthValue, user: null };
      const { container } = renderResolver(PATH.WORKSPACE, authValue);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when user.id is undefined', () => {
      const authValue = { ...defaultAuthValue, user: {} };
      const { container } = renderResolver(PATH.WORKSPACE, authValue);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering on private route', () => {
    it('should return null when user is set and on private route', () => {
      const { container } = renderResolver(PATH.WORKSPACE);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Navigation side effects', () => {
    it('should not call replaceNavigate when on public route and workspaces not loaded', () => {
      workspacesDataRef.current = null;
      renderResolver(PATH.LOGIN);

      expect(mockReplaceNavigate).not.toHaveBeenCalled();
    });

    it('should not call replaceNavigate when user is null', () => {
      const authValue = { ...defaultAuthValue, user: null };
      renderResolver(PATH.WORKSPACE, authValue);

      expect(mockReplaceNavigate).not.toHaveBeenCalled();
    });

    it('should not call replaceNavigate when restoreCompleted is false', async () => {
      const authValue = { ...defaultAuthValue, restoreCompleted: false };
      renderResolver(PATH.WORKSPACE, authValue);

      await waitFor(() => {
        expect(mockReplaceNavigate).not.toHaveBeenCalled();
      });
    });

    it('should not call replaceNavigate when workspaces are still loading', () => {
      workspacesLoadingRef.current = true;
      workspacesDataRef.current = null;
      renderResolver(PATH.WORKSPACE);

      expect(mockReplaceNavigate).not.toHaveBeenCalled();
    });

    it('should call setWorkspace and replaceNavigate when no nav state and on root and workspaces exist', async () => {
      const wsId = 'ws-1';
      workspacesDataRef.current = [{ id: wsId, bases: [] }];
      renderResolver('/');

      await waitFor(() => {
        expect(mockSetWorkspace).toHaveBeenCalledWith(wsId);
        expect(mockReplaceNavigate).toHaveBeenCalledWith(mockNavigate, `/workspace/${wsId}`);
      });
    });

    it('should call setWorkspace and replaceNavigate when no nav state and on /workspace and workspaces exist', async () => {
      const wsId = 'ws-1';
      workspacesDataRef.current = [{ id: wsId, bases: [] }];
      renderResolver(PATH.WORKSPACE);

      await waitFor(() => {
        expect(mockSetWorkspace).toHaveBeenCalledWith(wsId);
        expect(mockReplaceNavigate).toHaveBeenCalledWith(mockNavigate, `/workspace/${wsId}`);
      });
    });

    it('should call closeFlyout when navigating to first workspace', async () => {
      workspacesDataRef.current = [{ id: 'ws-1', bases: [] }];
      renderResolver(PATH.WORKSPACE);

      await waitFor(() => {
        expect(mockCloseFlyout).toHaveBeenCalled();
      });
    });

    it('should call setWorkspace and setBase when first workspace has bases', async () => {
      workspacesDataRef.current = [
        { id: 'ws-1', bases: [{ id: 'base-1' }] },
      ];
      renderResolver(PATH.WORKSPACE);

      await waitFor(() => {
        expect(mockSetWorkspace).toHaveBeenCalledWith('ws-1');
        expect(mockSetBase).toHaveBeenCalledWith('base-1');
      });
    });
  });

  describe('Empty workspaces handling', () => {
    it('should clear nav state and replaceNavigate to /workspace when workspaces empty and path not excluded', async () => {
      workspacesDataRef.current = [];
      navStoreState.selectedWorkspaceId = 'ws-old';
      navStoreState.selectedBaseId = 'base-old';
      navStoreState.selectedTableId = 'table-old';
      navStoreState.selectedViewId = 'view-old';
      renderResolver(PATH.DASHBOARD);

      await waitFor(() => {
        expect(mockSetWorkspace).toHaveBeenCalledWith(null);
        expect(mockSetBase).toHaveBeenCalledWith(null);
        expect(mockSetTable).toHaveBeenCalledWith(null);
        expect(mockSetView).toHaveBeenCalledWith(null);
        expect(mockReplaceNavigate).toHaveBeenCalledWith(mockNavigate, PATH.WORKSPACE);
      });
    });
  });

  describe('getBestNavigationTarget', () => {
    it('should call getBestNavigationTarget when current workspace no longer in list', async () => {
      mockGetBestNavigationTarget.mockReturnValue(`${PATH.WORKSPACE}/ws-1`);
      workspacesDataRef.current = [{ id: 'ws-1', bases: [] }];
      navStoreState.selectedWorkspaceId = 'ws-removed';
      renderResolver(PATH.DASHBOARD);

      await waitFor(() => {
        expect(mockGetBestNavigationTarget).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ id: 'ws-1' })])
        );
      });
    });
  });

  describe('Saved view navigation', () => {
    it('should call navigateToView openFlyout and replaceNavigate when has valid saved view and path differs', async () => {
      const targetPath = '/workspace/ws-1/base/base-1/table/table-1/view-1';
      navStoreState.selectedWorkspaceId = 'ws-1';
      navStoreState.selectedBaseId = 'base-1';
      navStoreState.selectedTableId = 'table-1';
      navStoreState.selectedViewId = 'view-1';
      workspacesDataRef.current = [{ id: 'ws-1', bases: [] }];
      workspaceBasesDataRef.current = [{ id: 'base-1', tables: [] }];
      baseTablesDataRef.current = [{ id: 'table-1', views: [{ id: 'view-1' }] }];
      tableViewsDataRef.current = [{ id: 'view-1' }];
      renderResolver(PATH.WORKSPACE);

      await waitFor(() => {
        expect(mockNavigateToView).toHaveBeenCalledWith('ws-1', 'base-1', 'table-1', 'view-1');
        expect(mockOpenFlyout).toHaveBeenCalledWith('workspace-flyout-menu');
        expect(mockReplaceNavigate).toHaveBeenCalledWith(mockNavigate, targetPath);
      });
    });
  });

  describe('View slug not treated as navigation state', () => {
    it('should not treat grid as navigation state', () => {
      navStoreState.selectedWorkspaceId = 'ws-1';
      navStoreState.selectedBaseId = 'base-1';
      navStoreState.selectedTableId = 'table-1';
      navStoreState.selectedViewId = 'grid';
      workspacesDataRef.current = [];
      const { container } = renderResolver(PATH.WORKSPACE);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Excluded routes', () => {
    it('should return null when on settings path and not call replaceNavigate for redirect', () => {
      const { container } = renderResolver(`${PATH.WORKSPACE_WS1}/settings`);

      expect(container.firstChild).toBeNull();
      expect(mockReplaceNavigate).not.toHaveBeenCalled();
    });

    it('should return null when path includes administrator', () => {
      const { container } = renderResolver(`${PATH.WORKSPACE_WS1}/administrator`);

      expect(container.firstChild).toBeNull();
    });
  });
});
