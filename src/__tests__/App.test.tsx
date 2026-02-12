import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <actual.MemoryRouter initialEntries={['/login']}>{children}</actual.MemoryRouter>
    ),
  };
});

vi.mock('../config/plugins.json', () => ({
  plugins: { builtin: [] },
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
  AnnouncementBar: () => <div>Announcement</div>,
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
    flyoutOpen: false,
    selectedWorkspace: null,
    openFlyout: vi.fn(),
    closeFlyout: vi.fn(),
    currentPlugin: null,
  }),
  FLYOUT_WIDTH: 240,
}));

vi.mock('../hooks/useClientHeaders', () => ({
  useClientHeaders: () => undefined,
}));

vi.mock('../hooks/useApi', () => ({
  useWorkspaces: () => ({ isLoading: false, error: null }),
  useTable: () => ({ isLoading: false, error: null }),
  useBaseTables: () => ({ isLoading: false, error: null }),
}));

describe('App', () => {
  it('renders login route after loading', async () => {
    render(<App />);

    expect(screen.getByText('Loader')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());
  });
});
