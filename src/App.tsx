import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Outlet, useLocation } from 'react-router-dom';
import { useTable, useWorkspaceBases, useBaseTables, useBaseById } from './hooks/useApi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkspaces } from './hooks/useApi';
import { DefaultAuthProvider, useAuth } from './auth/AuthContext';
import { PrivateRoute } from './auth/PrivateRoute';
import { RoleBasedRoute } from './auth/RoleBasedRoute';
import { AccessLevelRoute } from './auth/AccessLevelRoute';
import { PluginFrameworkProvider } from './core/PluginFrameworkContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AnnouncementBar, AnnouncementBarProps } from './components/AnnouncementBar';
import { NavigationRecovery } from './components/ZustandNavigationRecovery';
import { NavigationResolver } from './components/NavigationResolver';
import { initializeClientToken } from './service/clientService';
import { ViewType } from './types/viewTypes';
import { useExtensions } from './core/PluginFrameworkContext';
import { registerPlugin } from './core/PluginRegistry';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import RegisterValidation from './pages/RegisterValidation';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import SettingsPageRoute from './pages/SettingsPage';
import { usePluginStore } from './stores/pluginStore';
import { ExtensionPoint } from './core/ExtensionPoint';
import { ToastProvider } from './components/common/Toast';
import Sidebar from './components/layout/sidebar/Sidebar';
import { Loader } from './components/ui/Loader';
import { useQueryClient } from '@tanstack/react-query';
import AdministratorPage from './pages/AdministratorPage';
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage';
import { useNavigationStore } from './stores/navigationStore';
import { useClientHeaders } from './hooks/useClientHeaders';
import { RouteContextProvider } from './contexts/RouteContext';

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
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('Token expired') || error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('Token expired') || error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

// Add this at the top for TypeScript compatibility with import.meta.glob
// @ts-ignore
interface ImportMeta {
  glob: (pattern: string) => Record<string, () => Promise<any>>;
}

const Layout = () => {
  const { saving } = useAuth();
  const { flyoutOpen, flyoutMode, flyoutWidth, setFlyoutMode, selectedWorkspace, openFlyout, closeFlyout, currentPlugin } = usePluginStore();
  const location = useLocation();

  // Update client headers when workspace/base changes
  useClientHeaders();

  // Track sidebar position and width from workspace config (for flyout menu)
  const [sidebarPosition, setSidebarPosition] = useState('left');
  const [sidebarWidth, setSidebarWidth] = useState(56);

  // Force layout mode only (disable floating mode entirely)
  useEffect(() => {
    setFlyoutMode('layout');
    // Optional: clear any persisted preference
    try { localStorage.setItem('flyout-mode', 'layout'); } catch { }
  }, [setFlyoutMode]);

  useEffect(() => {
    const getSidebarConfig = () => {
      const config = (window as any).__workspaceConfig || {};
      return {
        position: config.sidebarPosition || 'left',
        width: config.sidebarWidth || 50,
      };
    };
    const updateSidebar = () => {
      const { position, width } = getSidebarConfig();
      setSidebarPosition(position);
      setSidebarWidth(width);
    };
    updateSidebar();
    window.addEventListener('workspace-config-changed', updateSidebar);
    return () => window.removeEventListener('workspace-config-changed', updateSidebar);
  }, []);

  // Auto-open flyout menu when on base/table/view routes
  useEffect(() => {
    const isBaseRoute = location.pathname.startsWith('/base/');

    if (isBaseRoute) {
      // Auto-open flyout menu for workspace navigation
      if (!flyoutOpen || currentPlugin !== 'workspace-flyout-menu') {
        openFlyout('workspace-flyout-menu');
      }
    } else {
      // Close flyout on homepage and other routes
      if (flyoutOpen && currentPlugin === 'workspace-flyout-menu') {
        closeFlyout();
      }
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
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving workspace data...</span>
              </div>
            )}
            {/* <SettingsButton /> */}
          </div>
        </header>

        {/* Below header: Sidebar on left, View on right */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Layout-Integrated Flyout Menu - Left Side */}
          {sidebarPosition === 'left' && flyoutMode === 'layout' && flyoutOpen && (
            <aside
              style={{ width: flyoutWidth, minWidth: flyoutWidth, maxWidth: flyoutWidth }}
              className="sidebar-flyout-bg border-r flex-shrink-0 shadow-inner overflow-y-auto"
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
              className="sidebar-flyout-bg border-l flex-shrink-0 shadow-inner overflow-y-auto"
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

// Wrapper for /base/:baseId/table/:tableId/:viewId to provide table/view context to plugins
const TableViewRouteWrapper: React.FC = () => {
  const { baseId, tableId, viewId } = useParams();

  if (!tableId) {
    console.log('❌ TableViewRouteWrapper: Table ID is required');
    return <div className="p-8 text-red-600">Table ID is required</div>;
  }

  // Centralized table fetch so only one plugin renders and we can determine view type
  // PAGINATION DISABLED - Uncomment below to re-enable pagination (30 records per page)
  // const { data: response, isLoading, error, refetch } = useTable(tableId, { pageNumber: 1, pageLimit: 30 });
  // PERFORMANCE: Use cached data immediately if available (placeholderData handles this)
  const { data: response, isLoading, error, refetch, isFetching } = useTable(tableId); // No pagination - fetches all records

  // Only show loader on initial load (no cached data)
  // If we have cached data, show it immediately even if refetching
  // This provides instant navigation between views when data is cached
  const hasCachedData = response?.data;
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

  const tableResponse = response?.data;
  const allViews: any[] = Array.isArray(tableResponse?.views) ? tableResponse.views : [];
  const requestedView = allViews.find((v: any) => String(v.id) === String(viewId));

  // Support URL slugs like /grid, /kanban, etc. as view type selectors
  const slug = (viewId || '').toLowerCase();
  const knownTypeSlugs = ['grid', 'form', 'gallery', 'kanban', 'calendar', 'gantt'];
  const isTypeSlug = knownTypeSlugs.includes(slug);
  const typeMatchedView = isTypeSlug
    ? allViews.find((v: any) => (String(v.type || '').toLowerCase() === slug))
    : undefined;

  // Determine effective viewType and view object passed to plugins
  const viewType = requestedView?.type || (isTypeSlug ? slug : undefined);

  // Construct props for plugins
  const table = { id: tableId, base_id: baseId || '' };
  const view = requestedView
    ? { id: requestedView.id, type: requestedView.type }
    : (typeMatchedView ? { id: typeMatchedView.id, type: typeMatchedView.type } : null);

  // If a non-slug viewId was provided but not found, show a clear message
  if (viewId && !requestedView && !isTypeSlug) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ View Not Found</div>
          <p className="text-muted-foreground">No view with ID "{viewId}" exists for this table.</p>
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

const AppRoutes = ({ loading }: { loading: boolean }) => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/registervalidation" element={<RegisterValidation />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<OAuthCallbackPage />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/homepage" replace />} />
        <Route path="/homepage" element={<ExtensionPoint id="page:homepage" />} />
        {/* <Route path="/dashboard" element={<ExtensionPoint id="page:dashboard" />} /> */}
        <Route path="/projects" element={<ExtensionPoint id="page:projects" />} />
        <Route path="/workspace/:workspaceId/settings" element={<SettingsPageRoute />} />
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
        <Route
          path="/workspace/:workspaceId/workspace-settings"
          element={
            <PrivateRoute>
              <WorkspaceSettingsPage />
            </PrivateRoute>
          }
        />
        {/* Add pluggable table view route with baseId (guarded) */}
        <Route path="/base/:baseId/table/:tableId/:viewId" element={<TableGuard><TableViewRouteWrapper /></TableGuard>} />
        {/* Base route redirects to homepage - base details are now on homepage */}
        <Route path="/base/:baseId" element={<BaseGuard><Navigate to="/homepage" replace /></BaseGuard>} />
        {/* (Legacy) Old table view route for backward compatibility (guarded) */}
        <Route path="/table/:tableId/:viewId" element={<TableGuard><TableViewRouteWrapper /></TableGuard>} />
        {/* Administrator page */}
        <Route
          path="/administrator"
          element={
            <RoleBasedRoute requiredRoles={['Admin']}>
              <PrivateRoute>
                <AdministratorPage />
              </PrivateRoute>
            </RoleBasedRoute>
          }
        />
        {/* Fallback: Use pluggable 404 page for unmatched routes */}
        <Route path="*" element={<ExtensionPoint id="page:notfound" />} />
      </Route>
    </Routes>
  );
};

//loads plugins from plugins.json dynamically loaded and registered at runtime
const pluginModules = (import.meta as any).glob('./plugins/*/index.tsx');

const loadEnabledPlugins = async () => {
  const config = await import('./config/plugins.json');
  const builtin = config.plugins?.builtin || [];
  const enabled = builtin.filter((p: any) => p.enabled);
  // Build a map of plugin id to expected path
  const idToPath: Record<string, string> = {};
  enabled.forEach((p: any) => {
    // Normalize path to match import.meta.glob keys
    let path = p.path;
    if (!path.startsWith('./')) path = './' + path;
    if (!path.endsWith('/')) path += '/';
    path += 'index.tsx';
    idToPath[p.id] = path;
  });
  // Load plugins using import.meta.glob
  const pluginPromises = enabled.map(async (p: any) => {
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
  plugins.forEach(registerPlugin);
  return plugins;
};

// AuthProviderChooser: chooses plugin-provided or default AuthProvider, must be inside PluginFrameworkProvider
function AuthProviderChooser({ children }: { children: React.ReactNode }) {
  const authProviders = useExtensions('auth:provider');
  const AuthProvider = authProviders.length > 0 ? authProviders[0].component : DefaultAuthProvider;
  return <AuthProvider>{children}</AuthProvider>;
}

const App: React.FC = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementBarProps | null>({
    message: "Your free trial ends in 3 days.",
    type: "warning",
    buttons: [
      { label: "Upgrade", onClick: () => window.location.href = '/billing', style: "primary" },
      { label: "Remind me later", onClick: () => setAnnouncement(null) }
    ]
  });
  const [plugins, setPlugins] = useState<any[]>([]);
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
        <button onClick={() => window.location.reload()}>
          Reload Application
        </button>
      </div>
    );
  }

  return (
    <PluginFrameworkProvider plugins={plugins} defaultConfig={{}}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProviderChooser>
            {announcement && <AnnouncementBar {...announcement} />}
            <Router>
              <WorkspacesGuard>
                <NavigationResolver />
                <NavigationRecovery />
                <AppRoutes loading={loading} />
              </WorkspacesGuard>
            </Router>
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
  const qc = useQueryClient();

  // Public routes that don't need workspace data
  const publicRoutes = ['/login', '/register', '/registervalidation', '/forgot-password', '/reset-password', '/auth/callback'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

  // Only fetch workspaces if not on a public route
  const { isLoading, error } = useWorkspaces();

  // Handle 401/403 errors by forcing logout
  React.useEffect(() => {
    if (error && !isPublicRoute) {
      const errorStatus = (error as any)?.response?.status || (error as any)?.status;
      if (errorStatus === 401 || errorStatus === 403) {
        // Import and call forceLogout
        import('./service/clientService').then(({ forceLogout }) => {
          forceLogout();
        }).catch(() => {
          // If forceLogout fails, at least clear tokens and redirect
          sessionStorage.clear();
          localStorage.clear();
          window.location.href = '/login';
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

// BaseGuard: ensures base's workspace bases are present for deep-links
const BaseGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = useParams();
  const baseId = String(params.baseId || '');
  const { data: baseResp, isLoading: baseLoading } = useBaseById(baseId);
  const workspaceId = (baseResp as any)?.data?.workspace_id || (baseResp as any)?.workspace_id;
  const { isLoading: basesLoading } = useWorkspaceBases(String(workspaceId || ''));

  if (baseLoading || (workspaceId && basesLoading)) {
    return (
      <div className="w-full h-[30vh] flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
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
