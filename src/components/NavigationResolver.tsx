import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, useAuth } from '../auth/AuthContext';
import { useWorkspaces, useWorkspaceBases, useBaseTables, useTableViews } from '../hooks/useApi';
import { useNavigationStore } from '../stores/navigationStore';
import { replaceNavigate } from '../utils/navigationRedirect';
import { getBestNavigationTarget } from '../utils/navigationPersistence';
import { usePluginStore } from '../stores/pluginStore';

/**
 * NavigationResolver - Resolves and navigates to saved view BEFORE workspace page renders
 * 
 * This component runs BEFORE any private route renders to:
 * 1. Load activity_data (already loaded during login into navigation store)
 * 2. Wait for workspaces to load
 * 3. Validate saved navigation state exists in current workspace tree
 * 4. Navigate directly to saved view OR first available workspace/base/table/view
 * 
 * This prevents flashing the workspace page before redirecting to saved view.
 */
export const NavigationResolver: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResolving, setIsResolving] = useState(true);
  const resolvedRef = useRef(false);
  const initialNavigationDoneRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  
  // Safely get auth context - handle case where AuthProvider might not be ready yet
  // Use useContext directly to avoid throwing error during hot reload or initial mount
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const restoreCompleted = authContext?.restoreCompleted || false;
  
  const {
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    getNavigationPath,
  } = useNavigationStore();

  // Flyout management
  const { openFlyout, closeFlyout } = usePluginStore();
  
  // Load workspaces to validate navigation state
  const { data: workspacesData, isLoading: workspacesLoading } = useWorkspaces();
  const { data: workspaceBasesData, isLoading: basesLoading } = useWorkspaceBases(selectedWorkspaceId || '');
  const { data: baseTablesData, isLoading: tablesLoading } = useBaseTables(selectedBaseId || '');
  // Fetch views for the selected table (needed to validate view exists)
  const { data: tableViewsData, isLoading: viewsLoading } = useTableViews(selectedTableId || '');
  
  const debug = (...args: any[]) => {
    try {
      const w: any = window as any;
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const enabled = !!(
        (w && w.__NAV_DEBUG__) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('NAV_DEBUG') === '1') ||
        (q && q.get('navdebug') === '1')
      );
      if (enabled) console.log('[NAV][Resolver]', ...args);
    } catch {}
  };
  
  useEffect(() => {
    // Reset navigation flags when user changes
    if (user?.id && lastUserIdRef.current !== user.id) {
      resolvedRef.current = false;
      initialNavigationDoneRef.current = false;
      lastUserIdRef.current = user.id;
    }
    
    // Only resolve on private routes after login completes
    const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/auth/callback'];
    const isPublicRoute = publicRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
    
    // Excluded routes where we should NOT redirect (user intentionally navigated here)
    const excludedRoutes = [
      '/workspace', // Only exclude base /workspace, not /workspace/:id paths
      '/reset-password'
    ];
    
    const isExcludedRoute = (path: string): boolean => {
      // Exclude settings and administrator pages (can have dynamic segments)
      // Check for /settings or /administrator in the path
      // (matches /workspace/:id/settings, /workspace/:id/administrator, /administrator)
      if (path.includes('/settings') || path.includes('/administrator')) {
        return true;
      }
      // Check exact matches or workspace root (not workspace/:id paths)
      if (path === '/workspace') {
        return true;
      }
      return excludedRoutes.some(route => path === route || path.startsWith(route + '/'));
    };
    
    const currentExcluded = isExcludedRoute(location.pathname);
    const currentPath = location.pathname;
    
    // Check if selectedViewId is a slug (not a real view ID)
    // Slugs like "grid" should not be treated as navigation state
    const viewTypeSlugs = ['grid', 'form', 'gallery', 'kanban', 'calendar', 'gantt'];
    const isViewSlug = selectedViewId && viewTypeSlugs.includes(selectedViewId.toLowerCase());
    const hasNavigationState = !!(selectedWorkspaceId && selectedBaseId && selectedTableId && selectedViewId && !isViewSlug);
    const expectedPath = hasNavigationState
      ? `/workspace/${selectedWorkspaceId}/base/${selectedBaseId}/table/${selectedTableId}/${selectedViewId}`
      : null;
    
    debug('NavigationResolver: useEffect triggered', {
      pathname: location.pathname,
      isPublicRoute,
      isExcludedRoute: currentExcluded,
      hasUser: !!user?.id,
      userId: user?.id,
      restoreCompleted,
      alreadyResolved: resolvedRef.current,
      hasNavigationState,
      expectedPath,
      selectedIds: {
        workspace: selectedWorkspaceId,
        base: selectedBaseId,
        table: selectedTableId,
        view: selectedViewId
      }
    });
    
    // Check if this is initial navigation (coming from / or /workspace after login)
    const isInitialPath = currentPath === '/' || currentPath === '/workspace';
    const isInitialNavigation = isInitialPath && !initialNavigationDoneRef.current;
    
    // If user is on an excluded route, skip navigation (user intentionally navigated here)
    // EXCEPTION: Allow auto-select from /workspace during initial navigation (user just logged in)
    // This prevents redirecting users away from settings/account/administrator pages,
    // but allows normal auto-select behavior when landing on /workspace after login
    const isWorkspaceRoot = currentPath === '/workspace';
    const shouldSkipExcluded = currentExcluded && !(isWorkspaceRoot && isInitialNavigation);
    
    if (shouldSkipExcluded) {
      debug('NavigationResolver: Skipping - excluded route', {
        currentPath,
        isInitialNavigation,
        isWorkspaceRoot,
        hasNavigationState,
        expectedPath
      });
      setIsResolving(false);
      // Mark as resolved so we don't try to redirect when they're intentionally on this page
      resolvedRef.current = true;
      initialNavigationDoneRef.current = true;
      return;
    }
    
    // Reset resolved flag if navigation state appears and we haven't navigated yet
    // This allows the resolver to run again when activity_data loads after initial mount
    // BUT only if this is initial navigation AND user is not on an excluded route (or is on /workspace during initial nav)
    if (hasNavigationState && currentPath !== expectedPath && resolvedRef.current && restoreCompleted && isInitialNavigation && !shouldSkipExcluded) {
      debug('NavigationResolver: Resetting resolved flag - navigation state appeared and path mismatch', {
        currentPath,
        expectedPath,
        hasNavigationState,
        reason: 'Navigation state loaded after initial resolution'
      });
      resolvedRef.current = false;
      setIsResolving(true);
      // Continue execution to retry navigation
    }
    
    if (isPublicRoute || !user?.id || !restoreCompleted) {
      if (isPublicRoute) {
        debug('NavigationResolver: Skipping - public route');
        setIsResolving(false);
        return;
      }
      if (!user?.id) {
        debug('NavigationResolver: Skipping - no user');
        setIsResolving(false);
        return;
      }
      if (!restoreCompleted) {
        debug('NavigationResolver: Skipping - restore not completed yet');
        return;
      }
      return;
    }
    
    // Skip if already resolved AND we're on the correct path
    // Also skip if on excluded route (settings, account, administrator), but allow /workspace during initial nav
    if (resolvedRef.current && (location.pathname === expectedPath || shouldSkipExcluded)) {
      debug('NavigationResolver: Skipping - already resolved', {
        onCorrectPath: location.pathname === expectedPath,
        onExcludedRoute: shouldSkipExcluded,
        pathname: location.pathname
      });
      setIsResolving(false);
      return;
    }
    
    // If already resolved but path doesn't match
    // Only reset/retry if this is initial navigation, otherwise user navigated intentionally
    // CRITICAL: Never reset if user is on an excluded route (settings, account, administrator)
    // EXCEPTION: Allow /workspace during initial navigation for auto-select
    if (resolvedRef.current && currentPath !== expectedPath) {
      // If on excluded route (but not /workspace during initial nav), don't redirect - user intentionally navigated here
      if (shouldSkipExcluded) {
        debug('NavigationResolver: User on excluded route, not redirecting', {
          currentPath,
          expectedPath
        });
        setIsResolving(false);
        return;
      }
      
      if (isInitialNavigation && hasNavigationState) {
        // Initial navigation - allow redirect to saved view
        debug('NavigationResolver: Resetting - resolved but path mismatch on initial path, will retry', {
          currentPath,
          expectedPath
        });
        resolvedRef.current = false;
        setIsResolving(true);
      } else {
        // Subsequent navigation - user navigated intentionally, don't redirect
        debug('NavigationResolver: User on different page, not redirecting', {
          currentPath,
          expectedPath,
          isInitialNavigation,
          initialNavigationDone: initialNavigationDoneRef.current
        });
        setIsResolving(false);
        return;
      }
    }
    
    debug('NavigationResolver: Starting resolution', {
      currentPath,
      hasNavigationState,
      expectedPath,
      selectedIds: {
        workspace: selectedWorkspaceId,
        base: selectedBaseId,
        table: selectedTableId,
        view: selectedViewId
      }
    });
    
    // If we're already on the expected path, no need to resolve
    if (hasNavigationState && currentPath === expectedPath) {
      debug('NavigationResolver: Already on expected path, skipping resolution');
      resolvedRef.current = true;
      setIsResolving(false);
      return;
    }
    
    // Wait for workspaces to load
    if (workspacesLoading || !workspacesData) {
      debug('NavigationResolver: Waiting for workspaces to load', {
        workspacesLoading,
        hasWorkspacesData: !!workspacesData,
        workspacesDataType: typeof workspacesData,
        workspacesDataIsArray: Array.isArray(workspacesData)
      });
      return;
    }
    
    const workspaces = Array.isArray(workspacesData) ? workspacesData : [];
    debug('NavigationResolver: Workspaces loaded', {
      workspacesCount: workspaces.length,
      workspaceIds: workspaces.map((w: any) => w?.id).filter(Boolean)
    });
    
    // PRIORITY 1: Navigate to saved view if we have activity_data
    if (hasNavigationState && selectedWorkspaceId) {
      // CRITICAL: Don't redirect if user is on an excluded route (like settings)
      // EXCEPTION: Allow navigation from /workspace during initial navigation
      // This prevents redirecting users away from settings pages when they intentionally navigate there
      if (shouldSkipExcluded) {
        debug('NavigationResolver: Skipping navigation - user on excluded route', {
          currentPath,
          expectedPath
        });
        setIsResolving(false);
        return;
      }
      
      // CRITICAL: Ensure we have ALL required IDs before proceeding
      if (!selectedBaseId || !selectedTableId || !selectedViewId) {
        debug('NavigationResolver: Waiting for complete navigation state', {
          hasWorkspace: !!selectedWorkspaceId,
          hasBase: !!selectedBaseId,
          hasTable: !!selectedTableId,
          hasView: !!selectedViewId
        });
        return; // Wait for activity_data to fully populate the store
      }
      
      // Wait for bases and tables to load for validation
      if (selectedWorkspaceId && basesLoading) {
        debug('NavigationResolver: Waiting for bases to load', { workspaceId: selectedWorkspaceId });
        return;
      }
      
      if (selectedBaseId && tablesLoading) {
        debug('NavigationResolver: Waiting for tables to load', { baseId: selectedBaseId });
        return;
      }
      
      // Wait for views to load if we have a table (needed for view validation)
      if (selectedTableId && viewsLoading) {
        debug('NavigationResolver: Waiting for views to load', { tableId: selectedTableId });
        return;
      }
      
      // Extract bases from workspaceBasesData
      const basesFromQuery = workspaceBasesData
        ? (Array.isArray((workspaceBasesData as any)?.data)
            ? (workspaceBasesData as any).data
            : (Array.isArray(workspaceBasesData) ? workspaceBasesData : []))
        : [];
      
      const allBasesFromWorkspace = Array.isArray(workspaces)
        ? workspaces.flatMap((ws: any) => Array.isArray(ws?.bases) ? ws.bases : [])
        : [];
      
      const allBases = basesFromQuery.length > 0 ? basesFromQuery : allBasesFromWorkspace;
      const base = Array.isArray(allBases) && allBases.length > 0
        ? (allBases as any[]).find((b: any) => b?.id === selectedBaseId)
        : undefined;
      
      // Extract tables from baseTablesData
      const tablesFromQuery = baseTablesData
        ? (Array.isArray((baseTablesData as any)?.data)
            ? (baseTablesData as any).data
            : (Array.isArray(baseTablesData) ? baseTablesData : []))
        : [];
      
      const tablesForBase = tablesFromQuery.length > 0
        ? tablesFromQuery
        : (base && Array.isArray((base as any).tables) ? (base as any).tables : []);
      
      // Find table (handle nested model.id structure)
      const table = Array.isArray(tablesForBase) && tablesForBase.length > 0
        ? (tablesForBase as any[]).find((t: any) => {
            const tableIdMatch =
              t?.model?.id === selectedTableId ||
              t?.id === selectedTableId ||
              t?.table_id === selectedTableId;
            return tableIdMatch;
          })
        : undefined;
      
      // Validate view (grid is always valid)
      // Get views from tableViewsData (API response) or nested in table object
      const viewsFromApi = tableViewsData
        ? (Array.isArray((tableViewsData as any)?.data)
            ? (tableViewsData as any).data
            : (Array.isArray(tableViewsData) ? tableViewsData : []))
        : [];
      
      const viewsFromTable = Array.isArray((table as any)?.views) ? (table as any).views : [];
      const allViews = viewsFromApi.length > 0 ? viewsFromApi : viewsFromTable;
      
      const isGrid = selectedViewId === 'grid';
      const viewOk = isGrid || !!(
        Array.isArray(allViews) &&
        allViews.find((v: any) => v?.id === selectedViewId)
      );
      
      debug('NavigationResolver: Validation check', {
        foundBase: !!base,
        foundTable: !!table,
        viewOk,
        baseId: selectedBaseId,
        tableId: selectedTableId,
        viewId: selectedViewId
      });
      
      if (base && table && viewOk && selectedWorkspaceId) {
        // Valid saved view - navigate directly
        const targetPath = `/workspace/${selectedWorkspaceId}/base/${selectedBaseId}/table/${selectedTableId}/${selectedViewId}`;
        
        // Double-check: Don't navigate if user is on an excluded route
        // EXCEPTION: Allow navigation from /workspace during initial navigation
        // This is a safety check in case the earlier check was missed
        if (shouldSkipExcluded) {
          debug('NavigationResolver: Skipping navigation - user on excluded route (safety check)', {
            currentPath,
            targetPath
          });
          setIsResolving(false);
          return;
        }
        
        debug('NavigationResolver: ✅ Navigating to saved view', {
          targetPath,
          workspaceId: selectedWorkspaceId,
          baseId: selectedBaseId,
          tableId: selectedTableId,
          viewId: selectedViewId,
          currentPath,
          willNavigate: currentPath !== targetPath
        });
        if (currentPath !== targetPath) {
          // Update navigation store BEFORE navigating to ensure consistency
          const { navigateToView } = useNavigationStore.getState();
          navigateToView(selectedWorkspaceId, selectedBaseId, selectedTableId, selectedViewId);
          // Open flyout for base/table/view routes
          openFlyout('workspace-flyout-menu');
          replaceNavigate(navigate, targetPath);
        }
        resolvedRef.current = true;
        initialNavigationDoneRef.current = true;
        setIsResolving(false);
        return;
      } else {
        // Saved view invalid - fall through to auto-select
        const reason = !base ? 'base not found' : !table ? 'table not found' : !viewOk ? 'view not found' : 'unknown';
        debug('NavigationResolver: ❌ Saved view invalid, will auto-select', {
          reason,
          searchedBaseId: selectedBaseId,
          searchedTableId: selectedTableId,
          searchedViewId: selectedViewId,
          availableBases: allBases.map((b: any) => ({ id: b?.id, name: b?.name })),
          availableTables: tablesForBase.map((t: any) => ({ 
            id: t?.model?.id || t?.id, 
            name: t?.name || t?.model?.name 
          })),
          availableViews: allViews.map((v: any) => ({ id: v?.id, type: v?.type, name: v?.title || v?.name }))
        });
      }
    }
    
    // PRIORITY 2: Handle new users (no saved navigation state)
    // If no saved view, navigate to /workspace and auto-select first base for better UX
    if (!hasNavigationState && isInitialNavigation) {
      debug('NavigationResolver: No saved navigation state', {
        currentPath,
        workspacesCount: workspaces.length
      });
      
      // If user has no saved view, navigate to first workspace
      // But also auto-select first base so workspace page has something to show
      if (workspaces.length > 0 && (currentPath === '/' || currentPath === '/workspace')) {
        const firstWorkspace = workspaces[0];
        debug('NavigationResolver: No saved view - navigating to first workspace');
        // Close flyout on workspace homepage
        closeFlyout();
        // Set workspace in store first
        const { setWorkspace } = useNavigationStore.getState();
        setWorkspace(firstWorkspace.id);
        replaceNavigate(navigate, `/workspace/${firstWorkspace.id}`);
      }
      
      // Auto-select first workspace and base for new users (helps workspace page show content)
      if (workspaces.length > 0) {
        const firstWorkspace = workspaces[0];
        if (firstWorkspace?.bases && firstWorkspace.bases.length > 0) {
          const firstBase = firstWorkspace.bases[0];
          const { setWorkspace, setBase } = useNavigationStore.getState();
          if (selectedWorkspaceId !== firstWorkspace.id || selectedBaseId !== firstBase.id) {
            debug('NavigationResolver: Auto-selecting first workspace and base for new user', {
              workspaceId: firstWorkspace.id,
              baseId: firstBase.id
            });
            setWorkspace(firstWorkspace.id);
            setBase(firstBase.id);
          }
        }
      }
      
      resolvedRef.current = true;
      initialNavigationDoneRef.current = true;
      setIsResolving(false);
      return;
    }
    
    // PRIORITY 2: Auto-select first workspace/base/table/view only if invalid saved state
    // Only if we're on root or workspace path AND initial navigation AND not on excluded route (or /workspace is allowed)
    if (isInitialNavigation && (currentPath === '/' || currentPath === '/workspace') && !shouldSkipExcluded) {
      debug('NavigationResolver: Checking for auto-select (invalid saved state)', {
        currentPath,
        workspacesCount: workspaces.length
      });
      
      if (workspaces.length > 0) {
        const targetPath = getBestNavigationTarget(workspaces);
        debug('NavigationResolver: Auto-select target calculated', {
          targetPath,
          willNavigate: !!targetPath && currentPath !== targetPath
        });
        
        if (targetPath && currentPath !== targetPath && targetPath !== '/workspace') {
          // Extract IDs from target path and update navigation store
          // Pattern: /workspace/{workspaceId}/base/{baseId}/table/{tableId}/{viewId}
          const pathMatch = targetPath.match(/^\/workspace\/([^\/]+)\/base\/([^\/]+)\/table\/([^\/]+)\/([^\/]+)$/);
          if (pathMatch) {
            const [, workspaceId, baseId, tableId, viewId] = pathMatch;
            
            if (workspaceId && baseId && tableId && viewId) {
              // Update navigation store BEFORE navigating
              const { navigateToView } = useNavigationStore.getState();
              navigateToView(workspaceId, baseId, tableId, viewId);
              // Open flyout for base/table/view routes
              openFlyout('workspace-flyout-menu');
              debug('NavigationResolver: ✅ Auto-selecting first available view', {
                targetPath,
                workspaceId,
                baseId,
                tableId,
                viewId
              });
              replaceNavigate(navigate, targetPath);
              resolvedRef.current = true;
              initialNavigationDoneRef.current = true;
              setIsResolving(false);
              return;
            }
          } else {
            // Fallback: navigate anyway, useNavigation hook will sync from URL
            debug('NavigationResolver: ✅ Auto-selecting first available view (fallback)', targetPath);
            replaceNavigate(navigate, targetPath);
            resolvedRef.current = true;
            initialNavigationDoneRef.current = true;
            setIsResolving(false);
            return;
          }
        } else if (targetPath) {
          debug('NavigationResolver: Already on auto-select target, skipping navigation');
        } else {
          debug('NavigationResolver: ⚠️ No valid target found for auto-select');
        }
      } else {
        debug('NavigationResolver: ⚠️ No workspaces available for auto-select');
      }
    } else {
      debug('NavigationResolver: Not on root/workspace path, skipping auto-select', { currentPath });
    }
    
    // Resolution complete (either navigated or staying on current path)
    debug('NavigationResolver: ✅ Resolution complete', {
      finalPath: location.pathname,
      resolved: resolvedRef.current,
      initialNavigationDone: initialNavigationDoneRef.current
    });
    resolvedRef.current = true;
    initialNavigationDoneRef.current = true;
    setIsResolving(false);
  }, [
    user?.id,
    restoreCompleted,
    location.pathname,
    workspacesData,
    workspacesLoading,
    workspaceBasesData,
    basesLoading,
    baseTablesData,
    tablesLoading,
    tableViewsData,
    viewsLoading,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    navigate,
    ]);

  // Validate URL when workspaces change (e.g., after member removal)
  // This ensures users are redirected if they lose access to the current workspace/base
  useEffect(() => {
    if (!workspacesData || workspacesLoading) return;
    if (!user?.id || !restoreCompleted) return;
    if (isResolving) return; // Don't interfere with ongoing resolution
    
    const workspaces = Array.isArray(workspacesData) ? workspacesData : [];
    const currentPath = location.pathname;
    
    // Skip validation on excluded routes (settings, etc.)
    const excludedRoutes = ['/workspace', '/projects', '/settings', '/administrator'];
    const isExcluded = excludedRoutes.some(route => currentPath.includes(route));
    if (isExcluded) return;
    
    // If no workspaces at all, stay on /workspace and let HomePage show "no workspaces" message
    if (workspaces.length === 0) {
      debug('NavigationResolver: No workspaces available, staying on /workspace');
      // Clear any invalid navigation state
      const { setWorkspace, setBase, setTable, setView } = useNavigationStore.getState();
      setWorkspace(null);
      setBase(null);
      setTable(null);
      setView(null);
      // If not already on /workspace, navigate there
      if (currentPath !== '/workspace' && currentPath !== '/') {
        replaceNavigate(navigate, '/workspace');
      }
      resolvedRef.current = true;
      initialNavigationDoneRef.current = true;
      setIsResolving(false);
      return;
    }
    
    // Check if current workspace is still valid
    if (selectedWorkspaceId) {
      const currentWorkspace = workspaces.find((ws: any) => ws.id === selectedWorkspaceId);
      if (!currentWorkspace) {
        // Current workspace no longer accessible - redirect to safe location
        debug('NavigationResolver: Current workspace no longer accessible, redirecting to fallback');
        const targetPath = getBestNavigationTarget(workspaces);
        if (targetPath) {
          replaceNavigate(navigate, targetPath);
        } else {
          // Has workspaces but no valid target - select first workspace as fallback
          const firstWorkspace = workspaces[0];
          const { setWorkspace } = useNavigationStore.getState();
          setWorkspace(firstWorkspace.id);
          replaceNavigate(navigate, `/workspace/${firstWorkspace.id}`);
        }
      }
    }
  }, [workspacesData, workspacesLoading, selectedWorkspaceId, user?.id, restoreCompleted, location.pathname, navigate, isResolving]);
  
  // Show loading state while resolving (only on private routes)
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route =>
    location.pathname === route || location.pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute || !user?.id) {
    return null;
  }
  
  // Show loading while resolving navigation
  // if (isResolving && restoreCompleted) {
  //   return (
  //     <div className="w-full h-screen flex items-center justify-center bg-background">
  //       <div className="flex flex-col items-center space-y-4">
  //         <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
  //         <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
  //           Preparing your workspace…
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  
  return null;
};

