import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { NavigationResolver } from '../NavigationResolver';
import { getBestNavigationTarget } from '../../utils/navigationPersistence';
import { AuthContext } from '../../auth/AuthContext';

let mockPathname = '/';
let workspacesLoading = false;
let workspacesData: any = [
  {
    id: 'ws1',
    bases: [{ id: 'b1' }],
  },
];
let selectedWorkspaceId: string | null = null;
let selectedBaseId: string | null = null;
let selectedTableId: string | null = null;
let selectedViewId: string | null = null;
let workspaceBasesData: any = null;
let baseTablesData: any = null;
let tableViewsData: any = null;
let basesLoading = false;
let tablesLoading = false;
let viewsLoading = false;
const openFlyoutSpy = vi.fn();
const closeFlyoutSpy = vi.fn();
const replaceNavigateSpy = vi.fn();
const navigateSpy = vi.fn();
const setWorkspaceSpy = vi.fn();
const setBaseSpy = vi.fn();
const setTableSpy = vi.fn();
const setViewSpy = vi.fn();
const navigateToViewSpy = vi.fn();

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => navigateSpy,
}));

vi.mock('../../utils/navigationRedirect', () => ({
  replaceNavigate: (...args: any[]) => replaceNavigateSpy(...args),
}));

vi.mock('../../stores/pluginStore', () => ({
  usePluginStore: () => ({ openFlyout: openFlyoutSpy, closeFlyout: closeFlyoutSpy }),
}));

const useNavigationStoreImpl = vi.hoisted(() => Object.assign(
  () => ({
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
  }),
  {
    getState: () => ({
      setWorkspace: setWorkspaceSpy,
      setBase: setBaseSpy,
      setTable: setTableSpy,
      setView: setViewSpy,
      navigateToView: navigateToViewSpy,
    }),
  },
));

vi.mock('../../stores/navigationStore', () => ({
  useNavigationStore: useNavigationStoreImpl,
}));

vi.mock('../../hooks/useApi', () => ({
  useWorkspaces: () => ({
    data: workspacesData,
    isLoading: workspacesLoading,
  }),
  useWorkspaceBases: () => ({ data: workspaceBasesData, isLoading: basesLoading }),
  useBaseTables: () => ({ data: baseTablesData, isLoading: tablesLoading }),
  useTableViews: () => ({ data: tableViewsData, isLoading: viewsLoading }),
}));

vi.mock('../../utils/navigationPersistence', () => ({
  getBestNavigationTarget: vi.fn(() => '/workspace/ws1'),
}));

const renderWithAuth = (user: any) =>
  render(
    <AuthContext.Provider value={{ user, restoreCompleted: true } as any}>
      <NavigationResolver />
    </AuthContext.Provider>
  );

describe('NavigationResolver', () => {
  beforeEach(() => {
    mockPathname = '/';
    workspacesLoading = false;
    workspacesData = [
      {
        id: 'ws1',
        bases: [{ id: 'b1' }],
      },
    ];
    selectedWorkspaceId = null;
    selectedBaseId = null;
    selectedTableId = null;
    selectedViewId = null;
    workspaceBasesData = null;
    baseTablesData = null;
    tableViewsData = null;
    basesLoading = false;
    tablesLoading = false;
    viewsLoading = false;
    replaceNavigateSpy.mockReset();
    navigateSpy.mockReset();
    setWorkspaceSpy.mockReset();
    setBaseSpy.mockReset();
    setTableSpy.mockReset();
    setViewSpy.mockReset();
    navigateToViewSpy.mockReset();
    openFlyoutSpy.mockReset();
    closeFlyoutSpy.mockReset();
  });

  it('returns null on public routes', () => {
    mockPathname = '/login';
    const { container } = renderWithAuth({ id: 'u1' });
    expect(container.firstChild).toBeNull();
  });

  it('returns null when user is missing', () => {
    const { container } = renderWithAuth(null);
    expect(container.firstChild).toBeNull();
  });

  it('navigates to first workspace on initial load', async () => {
    mockPathname = '/';
    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(navigateSpy, '/workspace/ws1');
    });
  });

  it('skips resolution on excluded routes', async () => {
    mockPathname = '/workspace/ws1/settings';
    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).not.toHaveBeenCalled();
    });
  });

  it('does not navigate while workspaces are loading', async () => {
    workspacesLoading = true;
    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).not.toHaveBeenCalled();
    });
  });

  it('auto-selects best target on initial navigation', async () => {
    mockPathname = '/workspace';
    workspacesData = [{ id: 'ws1', bases: [{ id: 'b1' }] }];
    vi.mocked(getBestNavigationTarget).mockReturnValueOnce('/workspace/ws1');

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(navigateSpy, '/workspace/ws1');
    });
  });

  it('navigates to saved view when navigation state is valid', async () => {
    mockPathname = '/app';
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'v1';
    workspaceBasesData = { data: [{ id: 'b1' }] };
    baseTablesData = { data: [{ id: 't1' }] };
    tableViewsData = { data: [{ id: 'v1' }] };

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(
        navigateSpy,
        '/workspace/ws1/base/b1/table/t1/v1'
      );
    });
    expect(navigateToViewSpy).toHaveBeenCalledWith('ws1', 'b1', 't1', 'v1');
    expect(openFlyoutSpy).toHaveBeenCalledWith('workspace-flyout-menu');
  });
});
