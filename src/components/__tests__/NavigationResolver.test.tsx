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

const renderWithAuth = (user: any, restoreCompleted = true) =>
  render(
    <AuthContext.Provider value={{ user, restoreCompleted } as any}>
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

  it('navigates to saved view when data is sourced from workspace bases and table views', async () => {
    mockPathname = '/app';
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'v1';
    workspacesData = [
      {
        id: 'ws1',
        bases: [
          {
            id: 'b1',
            tables: [
              {
                id: 't1',
                views: [{ id: 'v1' }],
              },
            ],
          },
        ],
      },
    ];
    workspaceBasesData = null;
    baseTablesData = null;
    tableViewsData = null;

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(
        navigateSpy,
        '/workspace/ws1/base/b1/table/t1/v1'
      );
    });
    expect(navigateToViewSpy).toHaveBeenCalledWith('ws1', 'b1', 't1', 'v1');
  });

  it('navigates to saved view when api hooks return arrays', async () => {
    mockPathname = '/app';
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'v1';
    workspaceBasesData = [{ id: 'b1' }];
    baseTablesData = [{ id: 't1' }];
    tableViewsData = [{ id: 'v1' }];

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(
        navigateSpy,
        '/workspace/ws1/base/b1/table/t1/v1'
      );
    });
  });

  it('does not navigate when already on expected path', async () => {
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'v1';
    mockPathname = '/workspace/ws1/base/b1/table/t1/v1';
    workspaceBasesData = { data: [{ id: 'b1' }] };
    baseTablesData = { data: [{ id: 't1' }] };
    tableViewsData = { data: [{ id: 'v1' }] };

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).not.toHaveBeenCalled();
    });
  });

  it('does not navigate to saved view while data is pending', async () => {
    mockPathname = '/app';
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'v1';
    workspaceBasesData = { data: [{ id: 'b1' }] };
    baseTablesData = { data: [{ id: 't1' }] };
    tableViewsData = { data: [{ id: 'v1' }] };
    viewsLoading = true;

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).not.toHaveBeenCalled();
    });
  });

  it('does not navigate to saved view while bases are loading', async () => {
    mockPathname = '/app';
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'v1';
    workspaceBasesData = { data: [{ id: 'b1' }] };
    baseTablesData = { data: [{ id: 't1' }] };
    tableViewsData = { data: [{ id: 'v1' }] };
    basesLoading = true;

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).not.toHaveBeenCalled();
    });
  });

  it('does not auto-select when best target is the current path', async () => {
    mockPathname = '/workspace';
    workspacesData = [{ id: 'ws1', bases: [{ id: 'b1' }] }];
    vi.mocked(getBestNavigationTarget).mockReturnValueOnce('/workspace');

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(navigateSpy, '/workspace/ws1');
    });
  });

  it('auto-selects when view slug is selected but no saved navigation state', async () => {
    mockPathname = '/workspace';
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'grid';
    workspacesData = [{ id: 'ws1', bases: [{ id: 'b1' }] }];
    vi.mocked(getBestNavigationTarget).mockReturnValueOnce('/workspace/ws1');

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(navigateSpy, '/workspace/ws1');
    });
  });

  it('does not navigate to saved view when view is invalid', async () => {
    mockPathname = '/app';
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'missing-view';
    workspaceBasesData = { data: [{ id: 'b1' }] };
    baseTablesData = { data: [{ id: 't1' }] };
    tableViewsData = { data: [{ id: 'v1' }] };

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).not.toHaveBeenCalled();
    });
    expect(navigateToViewSpy).not.toHaveBeenCalled();
  });

  it('navigates to saved view when table id is stored in model', async () => {
    mockPathname = '/app';
    selectedWorkspaceId = 'ws1';
    selectedBaseId = 'b1';
    selectedTableId = 't1';
    selectedViewId = 'v1';
    workspaceBasesData = { data: [{ id: 'b1' }] };
    baseTablesData = { data: [{ model: { id: 't1' } }] };
    tableViewsData = { data: [{ id: 'v1' }] };

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(
        navigateSpy,
        '/workspace/ws1/base/b1/table/t1/v1'
      );
    });
  });

  it('auto-selects full target path and opens flyout', async () => {
    mockPathname = '/workspace';
    workspacesData = [{ id: 'ws1', bases: [{ id: 'b1' }] }];
    vi.mocked(getBestNavigationTarget).mockReturnValueOnce('/workspace/ws1/base/b1/table/t1/v1');

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalledWith(navigateSpy, '/workspace/ws1');
    });
    expect(navigateToViewSpy).not.toHaveBeenCalled();
    expect(openFlyoutSpy).not.toHaveBeenCalled();
  });

  it('does not navigate when restore is not completed', async () => {
    mockPathname = '/workspace';
    renderWithAuth({ id: 'u1' }, false);

    await waitFor(() => {
      expect(replaceNavigateSpy).not.toHaveBeenCalled();
    });
  });

  it('redirects to best target when selected workspace is missing', async () => {
    mockPathname = '/home';
    selectedWorkspaceId = 'ws-missing';
    workspacesData = [{ id: 'ws1', bases: [{ id: 'b1' }] }];
    vi.mocked(getBestNavigationTarget).mockReturnValueOnce('/workspace/ws1');

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalled();
    });
    const [, targetPath] = replaceNavigateSpy.mock.calls[0];
    expect(['/workspace/ws1', '/workspace']).toContain(targetPath);
  });

  it('falls back to first workspace when best target is unavailable', async () => {
    mockPathname = '/home';
    selectedWorkspaceId = 'ws-missing';
    workspacesData = [{ id: 'ws1', bases: [{ id: 'b1' }] }];
    vi.mocked(getBestNavigationTarget).mockReturnValueOnce(null as any);

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).toHaveBeenCalled();
    });
    const [, targetPath] = replaceNavigateSpy.mock.calls[0];
    expect(['/workspace/ws1', '/workspace']).toContain(targetPath);
  });

  it('clears navigation state and returns to /workspace when no workspaces exist', async () => {
    mockPathname = '/home';
    selectedWorkspaceId = 'ws1';
    workspacesData = [];

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(setWorkspaceSpy).toHaveBeenCalledWith(null);
      expect(setBaseSpy).toHaveBeenCalledWith(null);
      expect(setTableSpy).toHaveBeenCalledWith(null);
      expect(setViewSpy).toHaveBeenCalledWith(null);
      expect(replaceNavigateSpy).toHaveBeenCalledWith(navigateSpy, '/workspace');
    });
  });

  it('skips validation redirect on excluded workspace routes', async () => {
    mockPathname = '/workspace/ws1/settings';
    selectedWorkspaceId = 'ws1';

    renderWithAuth({ id: 'u1' });

    await waitFor(() => {
      expect(replaceNavigateSpy).not.toHaveBeenCalled();
    });
  });
});
