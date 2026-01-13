import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTable, useBaseTables, useWorkspaces } from './hooks/useApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultAuthProvider, useAuth } from './auth/AuthContext';
import { PrivateRoute } from './auth/PrivateRoute';
import { AccessLevelRoute } from './auth/AccessLevelRoute';
import { useExtensions, PluginFrameworkProvider } from './core/PluginFrameworkContext';
import { AnnouncementBar, AnnouncementBarProps } from './components/AnnouncementBar';
import { initializeClientToken } from './service/clientService';
import { AppInitializer } from './components/AppInitializer';
import { registerPlugin } from './core/PluginRegistry';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { usePluginStore } from './stores/pluginStore';
import { ExtensionPoint } from './core/ExtensionPoint';
import { ToastProvider } from './components/common/Toast';
import Sidebar from './components/layout/sidebar/Sidebar';
import { Loader } from './components/ui/Loader';
import AdministratorPage from './pages/AdministratorPage';
import NotFoundPage from './pages/NotFoundPage';
import { useClientHeaders } from './hooks/useClientHeaders';
import { RouteContextProvider } from './contexts/RouteContext';
import { NavigationResolver } from './components/NavigationResolver';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data warm to prevent duplicate calls across fast-mounting components
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: (failureCount, error: unknown) => {
        const err = error as { message?: string; response?: { status?: number } };
        if (err?.message?.includes('Token expired') || err?.response?.status === 401 || err?.response?.status === 403) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const err = error as { message?: string; response?: { status?: number } };
        if (err?.message?.includes('Token expired') || err?.response?.status === 401 || err?.response?.status === 403) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

// TypeScript compatibility with import.meta.glob
declare global {
  interface ImportMeta {
    glob: (pattern: string) => Record<string, () => Promise<{ default: unknown }>>;
  }
}

const Layout = () => {
  const { saving } = useAuth();
  const { flyoutOpen, flyoutMode, flyoutWidth, setFlyoutMode, selectedWorkspace, openFlyout, closeFlyout, currentPlugin } = usePluginStore();
  const location = useLocation();

  // Update client headers when workspace/base changes
  useClientHeaders();

  // Track sidebar position and width (for flyout menu)
  const [sidebarPosition] = useState('left');
  const [sidebarWidth] = useState(56);

  // Force layout mode only (disable floating mode entirely)
  useEffect(() => {
    setFlyoutMode('layout');
  }, [setFlyoutMode]);

  // Auto-open flyout menu when on base/table/view routes
  useEffect(() => {
    const isBaseRoute = location.pathname.includes('/base/') || (location.pathname.startsWith('/workspace/') && location.pathname.includes('/base/'));
    const isWorkspaceRoute = location.pathname.startsWith('/workspace/') && !location.pathname.includes('/administrator') && !location.pathname.includes('/base/');

    if (isBaseRoute) {
      // Auto-open flyout menu for workspace navigation
      if (!flyoutOpen || currentPlugin !== 'workspace-flyout-menu') {
        openFlyout('workspace-flyout-menu');
      }
    }
    // Close flyout on workspace homepage and other routes
    if (isWorkspaceRoute && !isBaseRoute && flyoutOpen && currentPlugin === 'workspace-flyout-menu') {
      closeFlyout();
    }
  }, [location.pathname, flyoutOpen, currentPlugin, openFlyout, closeFlyout]);

  // Layout: header on top, then sidebar on left and view on right
  return (
    <RouteContextProvider>
      <div className="min-h-screen w-screen h-screen flex flex-col bg-background">
        {/* Header - full width at top */}
        <header className="flex items-center justify-between bg-card px-6 py-2 border-b shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2">
            <ExtensionPoint id="layout:header-left" />
          </div>
          <div className="flex items-center gap-2">
            <ExtensionPoint id="layout:header" />
            {saving && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm border border-blue-200 dark:border-blue-700">
                <Loader size={16} />
                <span>Saving workspace data...</span>
              </div>
            )}
          </div>
        </header>

        {/* Below header: Sidebar on left, View on right */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Layout-Integrated Flyout Menu - Left Side */}
          {sidebarPosition === 'left' && flyoutMode === 'layout' && flyoutOpen && (
            <aside
              style={{ width: flyoutWidth, minWidth: flyoutWidth, maxWidth: flyoutWidth }}
              className="sidebar-flyout-bg border-r flex-shrink-0 shadow-inner overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out"
            >
              <Sidebar
                sidebarPosition={sidebarPosition}
                sidebarWidth={sidebarWidth}
                selectedWorkspace={selectedWorkspace}
              />
            </aside>
          )}

          {/* Main content area */}
          <main className="flex-1 p-0 overflow-y-auto bg-main text-text min-w-0">
            <Outlet />
          </main>

          {/* Layout-Integrated Flyout Menu - Right Side */}
          {sidebarPosition === 'right' && flyoutMode === 'layout' && flyoutOpen && (
            <aside
              style={{ width: flyoutWidth, minWidth: flyoutWidth, maxWidth: flyoutWidth }}
              className="sidebar-flyout-bg border-l flex-shrink-0 shadow-inner overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out"
            >
              <Sidebar
                sidebarPosition={sidebarPosition}
                sidebarWidth={sidebarWidth}
                selectedWorkspace={selectedWorkspace}
              />
            </aside>
          )}
        </div>

        {/* Overlays */}
        <ExtensionPoint id="layout:overlay" />

        {/* Floating mode disabled intentionally */}
      </div>
    </RouteContextProvider>
  );
};

// Wrapper for /workspace/:workspaceId/base/:baseId/table/:tableId/:viewId to provide table/view context to plugins
const TableViewRouteWrapper: React.FC = () => {
  const { baseId, tableId, viewId } = useParams();

  // Centralized table fetch so only one plugin renders and we can determine view type
  // PAGINATION DISABLED - Uncomment below to re-enable pagination (30 records per page)
  // const { data: response, isLoading, error, refetch } = useTable(tableId, { pageNumber: 1, pageLimit: 30 });
  // PERFORMANCE: Use cached data immediately if available (placeholderData handles this)
  // Note: useTable has enabled: !!tableId, so it won't fetch if tableId is missing
  const { data: response, isLoading, error, refetch } = useTable(tableId || ''); // No pagination - fetches all records

  if (!tableId) {
    console.error('❌ TableViewRouteWrapper: Table ID is required');
    return <div className="p-8 text-red-600">Table ID is required</div>;
  }

  // Only show loader on initial load (no cached data)
  // If we have cached data, show it immediately even if refetching
  // This provides instant navigation between views when data is cached
  const hasCachedData = response && typeof response === 'object' && 'data' in response;
  const isInitialLoad = isLoading && !hasCachedData;

  if (isInitialLoad) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error Loading View</div>
          <p className="text-muted-foreground mb-4">{String(error)}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Retry</button>
        </div>
      </div>
    );
  }

  const tableResponse = response && typeof response === 'object' && 'data' in response ? (response as { data?: { views?: Array<{ id: string | number; type?: string }> } }).data : null;
  const allViews = Array.isArray(tableResponse?.views) ? tableResponse.views : [];
  const requestedView = allViews.find((v) => String(v.id) === String(viewId));

  // Support URL slugs like /grid, /kanban, etc. as view type selectors
  const slug = (viewId || '').toLowerCase();
  const knownTypeSlugs = ['grid', 'form', 'gallery', 'kanban', 'calendar', 'gantt'];
  const isTypeSlug = knownTypeSlugs.includes(slug);
  const typeMatchedView = isTypeSlug
    ? allViews.find((v) => (String(v.type || '').toLowerCase() === slug))
    : undefined;

  // Determine effective viewType and view object passed to plugins
  const viewType = requestedView?.type || (isTypeSlug ? slug : undefined);

  // Construct props for plugins
  const table = { id: tableId, base_id: baseId || '' };
  let view = null;
  if (requestedView) {
    view = { id: requestedView.id, type: requestedView.type };
  } else if (typeMatchedView) {
    view = { id: typeMatchedView.id, type: typeMatchedView.type };
  }

  // If a non-slug viewId was provided but not found, show a clear message
  if (viewId && !requestedView && !isTypeSlug) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Something went wrong</div>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Prefer new 'view' extension point */}
      <ExtensionPoint
        id="view"
        props={{ table, view, viewType }}
        key={`view-${tableId}-${viewId}`}
        fallback={() => (
          <ExtensionPoint
            id="route"
            props={{ table, view, viewType }}
            key={`route-${tableId}-${viewId}`}
          />
        )}
      />
    </>
  );
};


const AppRoutes = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for auth_token_expired event and navigate using React Router (prevents page refresh)
  useEffect(() => {
    const handleAuthTokenExpired = () => {
      // Only navigate if we're not already on the login page
      if (location.pathname !== '/login' && !location.pathname.startsWith('/login')) {
        navigate('/login', { replace: true });
      }
    };

    globalThis.addEventListener('auth_token_expired', handleAuthTokenExpired);
    return () => {
      globalThis.removeEventListener('auth_token_expired', handleAuthTokenExpired);
    };
  }, [navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/workspace" replace />} />
        <Route path="/workspace" element={<ExtensionPoint id="page:homepage" />} /> {/* Handles /workspace when no workspaceId - NavigationResolver will redirect to first workspace */}
        <Route path="/workspace/:workspaceId" element={<ExtensionPoint id="page:homepage" />} />
        <Route
          path="/workspace/:workspaceId/administrator"
          element={
            <PrivateRoute>
              <AccessLevelRoute>
                <AdministratorPage />
              </AccessLevelRoute>
            </PrivateRoute>
          }
        />
        {/* Table view route with workspace context */}
        <Route path="/workspace/:workspaceId/base/:baseId/table/:tableId/:viewId" element={<TableGuard><TableViewRouteWrapper /></TableGuard>} />
        {/* Fallback: 404 page for unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

//loads plugins from plugins.json dynamically loaded and registered at runtime
const pluginModules = import.meta.glob('./plugins/*/index.tsx');

interface PluginConfig {
  id: string;
  path: string;
  enabled?: boolean;
}

const loadEnabledPlugins = async (): Promise<unknown[]> => {
  const config = await import('./config/plugins.json') as { plugins?: { builtin?: PluginConfig[] } };
  const builtin = config.plugins?.builtin || [];
  const enabled = builtin.filter((p) => p.enabled);
  // Build a map of plugin id to expected path
  const idToPath: Record<string, string> = {};
  enabled.forEach((p) => {
    // Normalize path to match import.meta.glob keys
    let path = p.path;
    if (!path.startsWith('./')) path = './' + path;
    if (!path.endsWith('/')) path += '/';
    path += 'index.tsx';
    idToPath[p.id] = path;
  });
  // Load plugins using import.meta.glob
  const pluginPromises = enabled.map(async (p) => {
    const importFn = pluginModules[idToPath[p.id]];
    if (!importFn) {
      console.error('Plugin not found:', idToPath[p.id]);
      return null;
    }
    try {
      const mod = await importFn();
      return mod.default;
    } catch (err) {
      console.error('Failed to load plugin', p.id, err);
      return null;
    }
  });
  const plugins = (await Promise.all(pluginPromises)).filter(Boolean);
  // Register each plugin so getRegisteredPlugins() works
  plugins.forEach((plugin) => {
    if (plugin) {
      registerPlugin(plugin as Parameters<typeof registerPlugin>[0]);
    }
  });
  return plugins;
};

// AuthProviderChooser: chooses plugin-provided or default AuthProvider, must be inside PluginFrameworkProvider
function AuthProviderChooser({ children }: Readonly<{ children: React.ReactNode }>) {
  const authProviders = useExtensions('auth:provider');
  const AuthProvider = authProviders.length > 0 ? authProviders[0].component : DefaultAuthProvider;
  return <AuthProvider>{children}</AuthProvider>;
}

const App: React.FC = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementBarProps | null>({
    message: "Your free trial ends in 3 days.",
    type: "warning",
    buttons: [
      { label: "Upgrade", onClick: () => globalThis.location.href = '/billing', style: "primary" },
      { label: "Remind me later", onClick: () => setAnnouncement(null) }
    ]
  });
  const [plugins, setPlugins] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Initialize client token from localStorage
    initializeClientToken();
    loadEnabledPlugins()
      .then(setPlugins)
      .catch((err) => {
        setInitError(err.message || 'Failed to load plugins');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">
      <Loader />
    </div>
  }
  if (initError) {
    return (
      <div className="error">
        <h2>Plugin Initialization Error</h2>
        <p>{initError}</p>
        <button onClick={() => globalThis.location.reload()}>
          Reload Application
        </button>
      </div>
    );
  }

  return (
    <PluginFrameworkProvider plugins={plugins as Parameters<typeof PluginFrameworkProvider>[0]['plugins']} defaultConfig={{}}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProviderChooser>
            {announcement && <AnnouncementBar {...announcement} />}
            <AppInitializer>
              <Router>
                <WorkspacesGuard>
                  <NavigationResolver />
                  <AppRoutes />
                </WorkspacesGuard>
              </Router>
            </AppInitializer>
          </AuthProviderChooser>
        </ToastProvider>
      </QueryClientProvider>
    </PluginFrameworkProvider>
  );
};

export default App;

// Guard that ensures workspaces are fetched once before rendering private routes
const WorkspacesGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Public routes that don't need workspace data
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

  // Only fetch workspaces if not on a public route
  const { isLoading, error } = useWorkspaces();

  // Handle 401/403 errors by forcing logout
  React.useEffect(() => {
    if (error && !isPublicRoute) {
      const err = error as { response?: { status?: number }; status?: number };
      const errorStatus = err?.response?.status || err?.status;
      if (errorStatus === 401 || errorStatus === 403) {
        // Import and call forceLogout
        import('./service/clientService').then(({ forceLogout }) => {
          forceLogout();
        }).catch(() => {
          // If forceLogout fails, at least clear tokens and redirect
          sessionStorage.clear();
          localStorage.clear();
          globalThis.location.href = '/login';
        });
      }
    }
  }, [error, isPublicRoute]);

  // If on public route, don't show loading - just render children
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If first call in flight, show a tiny centered indicator to avoid flicker
  if (isLoading) {
    return (
      <div className="w-full h-[40vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <Loader size={10} />
          <div className="text-sm text-gray-600 dark:text-gray-300">Preparing your workspace…</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// TableGuard: ensures tables for base are present before rendering table routes
const TableGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const baseId = String(params.baseId || '');
  const tableId = String(params.tableId || '');
  const { isLoading: tablesLoading } = useBaseTables(baseId);
  const { isLoading: tableLoading } = useTable(tableId);

  if (tablesLoading || tableLoading) {
    return (
      <div className="w-full h-[30vh] flex items-center justify-center">
        <Loader size={10} />
      </div>
    );
  }
  return <>{children}</>;
};
