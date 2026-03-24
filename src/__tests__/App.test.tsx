import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import App from '../App';
import * as clientService from '../service/clientService';

let initialRoute = '/login';
let workspacesState = { isLoading: false, error: null as any };
let tableState = { isLoading: false, error: null as any, data: null as any, refetch: vi.fn() };
let baseTablesState = { isLoading: false, error: null as any };
let shouldThrowPluginConfig = false;
let pluginConfigState: { builtin: Array<{ id: string; path: string; enabled?: boolean }> } = { builtin: [] };
const mockOpenFlyout = vi.fn();
const mockCloseFlyout = vi.fn();
let pluginStoreState: {
  flyoutOpen: boolean;
  selectedWorkspace: null;
  currentPlugin: string | null;
} = {
  flyoutOpen: false,
  selectedWorkspace: null,
  currentPlugin: null,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={[initialRoute]}>{children}</actual.MemoryRouter>
    ),
  };
});

vi.mock('../config/plugins.json', () => ({
  get plugins() {
    if (shouldThrowPluginConfig) {
      throw new Error('plugin config load failed');
    }
    return pluginConfigState;
  },
}));

vi.mock('../service/clientService', () => ({
  initializeClientToken: vi.fn(),
  forceLogout: vi.fn(),
}));

vi.mock('../core/PluginRegistry', () => ({
  registerPlugin: vi.fn(),
}));

vi.mock('../core/PluginFrameworkContext', () => ({
  PluginFrameworkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useExtensions: () => [],
}));

vi.mock('../auth/AuthContext', () => ({
  DefaultAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../auth/PrivateRoute', () => ({
  PrivateRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../auth/AccessLevelRoute', () => ({
  AccessLevelRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/AnnouncementBar', () => ({
  AnnouncementBar: ({ message, buttons }: any) => (
    <div>
      <span>{message}</span>
      {buttons?.map((btn: any) => (
        <button key={btn.label} onClick={btn.onClick}>{btn.label}</button>
      ))}
    </div>
  ),
}));

vi.mock('../components/AppInitializer', () => ({
  AppInitializer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/NavigationResolver', () => ({
  NavigationResolver: () => <div>NavResolver</div>,
}));

vi.mock('../components/layout/sidebar/Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}));

vi.mock('../components/common/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../components/ui/Loader', () => ({
  Loader: () => <div>Loader</div>,
}));

vi.mock('../core/ExtensionPoint', () => ({
  ExtensionPoint: ({ id }: { id: string }) => <div>Ext {id}</div>,
}));

vi.mock('../pages/LoginPage', () => ({
  default: () => <div>Login</div>,
}));

vi.mock('../pages/ForgotPasswordPage', () => ({
  default: () => <div>Forgot</div>,
}));

vi.mock('../pages/ResetPasswordPage', () => ({
  default: () => <div>Reset</div>,
}));

vi.mock('../pages/AdministratorPage', () => ({
  default: () => <div>Admin</div>,
}));

vi.mock('../pages/NotFoundPage', () => ({
  default: () => <div>NotFound</div>,
}));

vi.mock('../stores/pluginStore', () => ({
  usePluginStore: () => ({
    flyoutOpen: pluginStoreState.flyoutOpen,
    selectedWorkspace: pluginStoreState.selectedWorkspace,
    openFlyout: mockOpenFlyout,
    closeFlyout: mockCloseFlyout,
    currentPlugin: pluginStoreState.currentPlugin,
  }),
  FLYOUT_WIDTH: 240,
}));

vi.mock('../hooks/useClientHeaders', () => ({
  useClientHeaders: () => undefined,
}));

vi.mock('../hooks/useApi', () => ({
  useWorkspaces: () => workspacesState,
  useTable: () => tableState,
  useBaseTables: () => baseTablesState,
}));

describe('App', () => {
  beforeEach(() => {
    shouldThrowPluginConfig = false;
    pluginConfigState = { builtin: [] };
    pluginStoreState = {
      flyoutOpen: false,
      selectedWorkspace: null,
      currentPlugin: null,
    };
    mockOpenFlyout.mockReset();
    mockCloseFlyout.mockReset();
  });

  it('renders login route after loading', async () => {
    initialRoute = '/login';
    workspacesState = { isLoading: false, error: null };
    render(<App />);

    expect(screen.getByText('Loader')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());
  });

  it('does not block public routes with workspace loading', async () => {
    initialRoute = '/login';
    workspacesState = { isLoading: true, error: null };
    render(<App />);

    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());
  });

  it('shows workspace loading guard on protected routes', async () => {
    initialRoute = '/workspace';
    workspacesState = { isLoading: true, error: null };
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Preparing your workspace/i)).toBeInTheDocument();
    });
  });

  it('renders not found for unknown private route', async () => {
    initialRoute = '/unknown-private-route';
    workspacesState = { isLoading: false, error: null };
    tableState = { isLoading: false, error: null, data: null, refetch: vi.fn() };
    baseTablesState = { isLoading: false, error: null };
    render(<App />);

    await waitFor(() => expect(screen.getByText('NotFound')).toBeInTheDocument());
  });

  it('renders forgot and reset routes', async () => {
    initialRoute = '/forgot-password';
    workspacesState = { isLoading: false, error: null };
    render(<App />);
    await waitFor(() => expect(screen.getByText('Forgot')).toBeInTheDocument());

    initialRoute = '/reset-password/token-x';
    render(<App />);
    await waitFor(() => expect(screen.getByText('Reset')).toBeInTheDocument());
  });

  it('handles auth_token_expired event without crashing', async () => {
    initialRoute = '/workspace';
    workspacesState = { isLoading: false, error: null };
    render(<App />);
    await waitFor(() => expect(screen.getByText('Ext page:homepage')).toBeInTheDocument());

    act(() => {
      globalThis.dispatchEvent(new CustomEvent('auth_token_expired'));
    });
    await waitFor(() =>
      expect(screen.queryByText('Login') || screen.queryByText('Ext page:homepage')).toBeTruthy()
    );
  });

  it('calls forceLogout on workspace auth error', async () => {
    initialRoute = '/workspace';
    workspacesState = { isLoading: false, error: { response: { status: 401 } } };
    render(<App />);

    await waitFor(() => {
      expect((clientService.forceLogout as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    });
  });

  it('renders administrator route', async () => {
    initialRoute = '/workspace/w1/administrator';
    workspacesState = { isLoading: false, error: null };
    render(<App />);

    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument());
  });

  it('shows table guard loader while table/base data is loading', async () => {
    initialRoute = '/workspace/w1/base/b1/table/t1/v1';
    workspacesState = { isLoading: false, error: null };
    tableState = { isLoading: true, error: null, data: null, refetch: vi.fn() };
    baseTablesState = { isLoading: true, error: null };

    render(<App />);
    await waitFor(() => expect(screen.getByText('Loader')).toBeInTheDocument());
  });

  it('renders table error state and retries', async () => {
    const refetch = vi.fn();
    initialRoute = '/workspace/w1/base/b1/table/t1/v1';
    workspacesState = { isLoading: false, error: null };
    tableState = { isLoading: false, error: new Error('boom'), data: null, refetch };
    baseTablesState = { isLoading: false, error: null };

    render(<App />);
    await act(async () => {
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.queryByText('Loader')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Something went wrong')).toBeInTheDocument());
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    retryBtn.click();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders table not-found fallback for unknown non-slug view', async () => {
    initialRoute = '/workspace/w1/base/b1/table/t1/unknown-view-id';
    workspacesState = { isLoading: false, error: null };
    tableState = {
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      data: { data: { views: [{ id: 'v1', type: 'grid' }] } },
    };
    baseTablesState = { isLoading: false, error: null };

    render(<App />);
    await waitFor(() => expect(screen.getByText('Please try again later.')).toBeInTheDocument());
  });

  it('renders table view extension for matched view id', async () => {
    initialRoute = '/workspace/w1/base/b1/table/t1/v1';
    workspacesState = { isLoading: false, error: null };
    tableState = {
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      data: { data: { views: [{ id: 'v1', type: 'kanban' }] } },
    };
    baseTablesState = { isLoading: false, error: null };

    render(<App />);
    await waitFor(() => expect(screen.getByText('Ext view')).toBeInTheDocument());
  });

  it('renders table view extension for slug-based type resolution', async () => {
    initialRoute = '/workspace/w1/base/b1/table/t1/grid';
    workspacesState = { isLoading: false, error: null };
    tableState = {
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      data: { data: { views: [{ id: 'v-actual', type: 'grid' }] } },
    };
    baseTablesState = { isLoading: false, error: null };

    render(<App />);
    await waitFor(() => expect(screen.getByText('Ext view')).toBeInTheDocument());
  });

  it('dismisses announcement when remind me later is clicked', async () => {
    initialRoute = '/login';
    workspacesState = { isLoading: false, error: null };
    render(<App />);

    await waitFor(() => expect(screen.getByText(/free trial ends in 3 days/i)).toBeInTheDocument());
    act(() => {
      screen.getByRole('button', { name: /remind me later/i }).click();
    });
    await waitFor(() => expect(screen.queryByText(/free trial ends in 3 days/i)).not.toBeInTheDocument());
  });

  it('renders plugin initialization error screen when plugin config import fails', async () => {
    shouldThrowPluginConfig = true;
    initialRoute = '/login';
    workspacesState = { isLoading: false, error: null };

    render(<App />);
    await waitFor(() => expect(screen.getByText(/plugin initialization error/i)).toBeInTheDocument());
    expect(screen.getByText(/plugin config load failed/i)).toBeInTheDocument();
  });

  it('opens workspace flyout automatically on base routes', async () => {
    initialRoute = '/workspace/w1/base/b1/table/t1/v1';
    workspacesState = { isLoading: false, error: null };
    pluginStoreState = {
      flyoutOpen: false,
      selectedWorkspace: null,
      currentPlugin: null,
    };
    tableState = {
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      data: { data: { views: [{ id: 'v1', type: 'grid' }] } },
    };
    baseTablesState = { isLoading: false, error: null };

    render(<App />);
    await waitFor(() => {
      expect(mockOpenFlyout).toHaveBeenCalledWith('workspace-flyout-menu');
    });
  });

  it('closes workspace flyout on workspace homepage route', async () => {
    initialRoute = '/workspace/w1';
    workspacesState = { isLoading: false, error: null };
    pluginStoreState = {
      flyoutOpen: true,
      selectedWorkspace: null,
      currentPlugin: 'workspace-flyout-menu',
    };

    render(<App />);
    await waitFor(() => {
      expect(mockCloseFlyout).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles sidebar collapse button in layout', async () => {
    initialRoute = '/workspace/w1/base/b1/table/t1/v1';
    workspacesState = { isLoading: false, error: null };
    pluginStoreState = {
      flyoutOpen: true,
      selectedWorkspace: null,
      currentPlugin: 'workspace-flyout-menu',
    };
    tableState = {
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      data: { data: { views: [{ id: 'v1', type: 'grid' }] } },
    };
    baseTablesState = { isLoading: false, error: null };

    render(<App />);
    const collapseButton = await screen.findByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    });
  });
});
