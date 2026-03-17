import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { NavigationResolver } from '../NavigationResolver';
import { AuthContext } from '../../auth/AuthContext';

let mockPathname = '/';
let workspacesLoading = false;
let workspacesData: any = [
  {
    id: 'ws1',
    bases: [{ id: 'b1' }],
  },
];
const replaceNavigateSpy = vi.fn();
const navigateSpy = vi.fn();
const setWorkspaceSpy = vi.fn();
const setBaseSpy = vi.fn();

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => navigateSpy,
}));

vi.mock('../../utils/navigationRedirect', () => ({
  replaceNavigate: (...args: any[]) => replaceNavigateSpy(...args),
}));

vi.mock('../../stores/pluginStore', () => ({
  usePluginStore: () => ({ openFlyout: vi.fn(), closeFlyout: vi.fn() }),
}));

const useNavigationStoreImpl = vi.hoisted(() => Object.assign(
  () => ({
    selectedWorkspaceId: null,
    selectedBaseId: null,
    selectedTableId: null,
    selectedViewId: null,
  }),
  {
    getState: () => ({
      setWorkspace: setWorkspaceSpy,
      setBase: setBaseSpy,
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
  useWorkspaceBases: () => ({ data: null, isLoading: false }),
  useBaseTables: () => ({ data: null, isLoading: false }),
  useTableViews: () => ({ data: null, isLoading: false }),
}));

vi.mock('../../utils/navigationPersistence', () => ({
  getBestNavigationTarget: () => '/workspace/ws1',
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
    replaceNavigateSpy.mockReset();
    navigateSpy.mockReset();
    setWorkspaceSpy.mockReset();
    setBaseSpy.mockReset();
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
});
