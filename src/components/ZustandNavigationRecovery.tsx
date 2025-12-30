import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import useWorkspaceData from '../hooks/useWorkspaceData';
import { useToast } from '../components/common/Toast';
import { replaceNavigate } from '../utils/navigationRedirect';
import { useNavigationStore } from '../stores/navigationStore';
import { getBestNavigationTarget, getSafeNavigationTarget } from '../utils/navigationPersistence';

/**
 * Navigation Recovery Component
 * 
 * Handles navigation recovery scenarios:
 * 1. On login: Restores from activity_data API (cross-device sync)
 * 2. On page load: Falls back to sessionStorage cache if no activity_data
 * 3. Auto-selects first workspace/base/table/view for new users
 * 4. Validates current navigation state against available data
 * 5. Excludes settings/account routes from automatic redirects
 * 
 * Flow:
 * - User logs in → Load from activity_data API → Navigate to saved location
 * - No saved location → Auto-select first workspace/base/table/view
 * - Invalid navigation state → Redirect to safe location
 */
/**
 * Orchestrates navigation restoration and validation after login/app load.
 *
 * Responsibilities:
 * - Restore saved location (activity_data → session cache → auto-select).
 * - Validate selections exist in the current workspace tree; otherwise redirect safely.
 * - Respect excluded routes (settings, account, login, projects) to avoid hijacking user intent.
 * - Use replace-style redirects to keep browser history clean.
 */
export const NavigationRecovery: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const debug = (...args: any[]) => {
    try {
      const w: any = window as any;
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const enabled = !!(
        (w && w.__NAV_DEBUG__) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('NAV_DEBUG') === '1') ||
        (q && q.get('navdebug') === '1')
      );
      if (enabled) console.log('[NAV][Recovery]', ...args);
    } catch {}
  };
  const recoveryAttempted = useRef(false);
  const lastUserId = useRef<string | null>(null);
  
  const { 
    selectedWorkspaceId, 
    selectedBaseId, 
    selectedTableId, 
    selectedViewId,
    loadUserNavigation,
    loadFromActivityData
  } = useNavigationStore();

  // Pass selected IDs reactively so bases/tables queries run when activity_data loads
  const {
    workspaces: workspacesData,
    workspaceBases: workspaceBasesData,
    baseTables: baseTablesData,
    loading: isLoading,
    _raw,
  } = useWorkspaceData(selectedWorkspaceId || undefined, selectedBaseId || undefined);
  
  // Get the store instance to access current state
  const get = useNavigationStore.getState;

  // Use workspaces data directly; avoid eager bulk dashboard fetches
  const workspaces = React.useMemo(() => {
    return Array.isArray(workspacesData) ? workspacesData : [];
  }, [workspacesData]);

  // Routes that should NOT trigger automatic redirects
  // Users should stay on these pages (settings, account, etc.)
  // Routes we should not hijack with recovery (but we still allow auto-select from /workspace)
  const excludedRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/projects'
  ];

  // Check if current path should be excluded from redirects
  const isExcludedRoute = (path: string): boolean => {
    // Exclude settings, administrator, and workspace-settings pages (can have dynamic segments)
    if (path.includes('/settings') || path.includes('/administrator') || path.includes('/workspace-settings')) {
      return true;
    }
    return excludedRoutes.some(route => path === route || path.startsWith(route + '/'));
  };

  useEffect(() => {
    // Reset recoveryAttempted if user changed
    if (user?.id !== lastUserId.current) {
      recoveryAttempted.current = false;
      lastUserId.current = user?.id || null;
      debug('User changed, resetting recovery attempt');
    }

    const currentPath = location.pathname;
    
    // Must have user
    if (!user?.id) {
      return;
    }

    // Get current navigation state FIRST - check if we have saved navigation
    const currentState = get();
    const hasNavigationState = !!(currentState.selectedBaseId && currentState.selectedTableId && currentState.selectedViewId);
    const expectedPath = hasNavigationState 
      ? `/base/${currentState.selectedBaseId}/table/${currentState.selectedTableId}/${currentState.selectedViewId}`
      : null;
    
    debug('Recovery check', {
      hasNavigationState,
      expectedPath,
      currentPath,
      recoveryAttempted: recoveryAttempted.current,
      selectedIds: {
        workspace: currentState.selectedWorkspaceId,
        base: currentState.selectedBaseId,
        table: currentState.selectedTableId,
        view: currentState.selectedViewId
      }
    });
    
    // Check if current path is excluded (settings, account, etc.) - don't redirect from these
    const currentExcluded = isExcludedRoute(currentPath);
    if (currentExcluded) {
      debug('Current path is excluded route, skipping navigation recovery', { currentPath });
      return;
    }

    // Reset recoveryAttempted if navigation state appears and we haven't navigated yet
    // This allows retry when activity_data loads after initial mount
    if (hasNavigationState && currentPath !== expectedPath && recoveryAttempted.current) {
      debug('Navigation state appeared, resetting recovery attempt to allow navigation');
      recoveryAttempted.current = false;
    }

    // Don't run recovery logic if already attempted (unless we just reset it above)
    if (recoveryAttempted.current && (!hasNavigationState || currentPath === expectedPath)) {
      return;
    }

    // For new users: Clear any stale selectedWorkspaceId if we don't have full navigation state
    // This prevents validation from running with stale workspace IDs
    if (!hasNavigationState && selectedWorkspaceId && !recoveryAttempted.current) {
      const { setWorkspace } = useNavigationStore.getState();
      debug('New user detected - clearing stale workspace selection');
      setWorkspace(null);
      // Don't return - let it continue to auto-select
    }


    // PRIORITY 1: If we have navigation state, validate it and navigate
    // Only navigate after confirming base/table (and view when not grid) exist in current workspaces
    if (hasNavigationState && currentPath !== expectedPath && !recoveryAttempted.current) {
      // Wait for workspaces to load first
      if (!workspacesData || (Array.isArray(workspacesData) && workspacesData.length === 0)) {
        debug('Waiting for workspaces to load before validation');
        return;
      }

      // If we have workspaceId, wait for bases query to finish (if enabled)
      const needsBases = !!selectedWorkspaceId;
      const basesLoading = needsBases && (_raw?.workspaceBasesQuery?.isLoading || !workspaceBasesData);
      
      // If we have baseId, wait for tables query to finish (if enabled)
      const needsTables = !!selectedBaseId;
      const tablesLoading = needsTables && (_raw?.baseTablesQuery?.isLoading || !baseTablesData);

      // Wait for required queries to complete
      if (basesLoading || tablesLoading) {
        debug('Waiting for base/tables queries to load for navigation state', { basesLoading, tablesLoading, hasBases: !!workspaceBasesData, hasTables: !!baseTablesData });
        return;
      }

      // Prefer directly-fetched bases/tables if available; fallback to nested workspaces
      const allBasesFromWorkspace = Array.isArray(workspaces)
        ? workspaces.flatMap((ws: any) => Array.isArray(ws?.bases) ? ws.bases : [])
        : [];
      
      // Extract bases from workspaceBasesData (could be { data: [...] } or array)
      const basesFromQuery = workspaceBasesData
        ? (Array.isArray((workspaceBasesData as any)?.data) 
            ? (workspaceBasesData as any).data 
            : (Array.isArray(workspaceBasesData) ? workspaceBasesData : []))
        : [];
      
      const allBases = basesFromQuery.length > 0 ? basesFromQuery : allBasesFromWorkspace;

      const base = Array.isArray(allBases) && allBases.length > 0
        ? (allBases as any[]).find((b: any) => b?.id === currentState.selectedBaseId)
        : undefined;

      // Extract tables from baseTablesData (could be { data: [...] } or array)
      const tablesFromQuery = baseTablesData
        ? (Array.isArray((baseTablesData as any)?.data)
            ? (baseTablesData as any).data
            : (Array.isArray(baseTablesData) ? baseTablesData : []))
        : [];

      const tablesForBase = tablesFromQuery.length > 0 
        ? tablesFromQuery
        : (base && Array.isArray((base as any).tables) ? (base as any).tables : []);

      // Log actual table IDs for debugging
      // API returns tables with nested structure: { model: { id: "..." } }
      const actualTableIds = Array.isArray(tablesForBase) 
        ? tablesForBase.map((t: any) => t?.model?.id || t?.id || t?.table_id || 'NO_ID')
        : [];
      
      const table = Array.isArray(tablesForBase) && tablesForBase.length > 0
        ? (tablesForBase as any[]).find((t: any) => {
            // Check nested model.id first (API structure), then fallback to direct id
            const tableIdMatch = 
              t?.model?.id === currentState.selectedTableId || 
              t?.id === currentState.selectedTableId || 
              t?.table_id === currentState.selectedTableId;
            return tableIdMatch;
          })
        : undefined;
      
      const isGrid = currentState.selectedViewId === 'grid';
      const viewOk = isGrid || !!(Array.isArray((table as any)?.views) && (table as any).views.find((v: any) => v?.id === currentState.selectedViewId));
      
      debug('Validation check', { 
        baseId: currentState.selectedBaseId, 
        tableId: currentState.selectedTableId, 
        viewId: currentState.selectedViewId,
        foundBase: !!base,
        foundTable: !!table,
        viewOk,
        basesCount: allBases.length,
        tablesCount: tablesForBase.length,
        actualTableIds, // NEW: Show what IDs we actually have
        hasBasesData: !!workspaceBasesData,
        hasTablesData: !!baseTablesData,
        baseTablesDataStructure: baseTablesData ? (Array.isArray((baseTablesData as any)?.data) ? 'has data array' : Array.isArray(baseTablesData) ? 'direct array' : 'unknown') : 'null'
      });
      
      if (base && table && viewOk) {
        const targetPath = `/base/${currentState.selectedBaseId}/table/${currentState.selectedTableId}/${currentState.selectedViewId}`;
        debug('✅ Navigating to saved state:', targetPath);
        replaceNavigate(navigate, targetPath);
            recoveryAttempted.current = true;
        return;
      }
      debug('❌ Saved state invalid for current workspaces, will fall through to auto-select', {
        reason: !base ? 'base not found' : !table ? 'table not found' : !viewOk ? 'view not found' : 'unknown'
      });
      // Mark as attempted to prevent infinite loops when validation fails
              recoveryAttempted.current = true;
      // Fall through to auto-select for new users
    }
    
    // Do not interfere with excluded routes (settings, account, etc.) ONLY if no navigation state
    // If we have navigation state, we should have navigated above
    if (!hasNavigationState && isExcludedRoute(currentPath)) {
      recoveryAttempted.current = true;
      debug('Waiting for workspaces to load');
      return;
    }

    // PRIORITY 2: Wait for workspaces to load if we don't have navigation state yet
    // Only block if loading AND no navigation state
    if ((isLoading || !workspacesData || (Array.isArray(workspacesData) && workspacesData.length === 0))) {
      debug('Waiting for workspaces to load before auto-select');
      return;
    }

    // PRIORITY 3: Auto-select ONLY if we have workspaces, no saved navigation state (new users)
    // Wait a moment to ensure activity_data has had time to load from login response
    if (!hasNavigationState && !recoveryAttempted.current && workspacesData && Array.isArray(workspacesData) && workspacesData.length > 0) {
      // Current path is invalid, root, or workspace - redirect to best available
    if (currentPath === '/' || currentPath === '/workspace') {
        const targetPath = getBestNavigationTarget(workspaces);
        if (targetPath) {
          debug('Auto-selecting target for new user (no saved navigation state):', targetPath);
          replaceNavigate(navigate, targetPath);
          recoveryAttempted.current = true;
          return;
        }
        // If no valid target, mark as attempted to prevent infinite loops
        recoveryAttempted.current = true;
      }
    }

    // Scenario 3: Validate current selection against available data
    // Only validate if we have FULL navigation state (indicates it's from activity_data, not stale)
    // For new users with no navigation state, skip this and go to auto-select
    if (selectedWorkspaceId && hasNavigationState && !recoveryAttempted.current) {
      const workspace = workspaces.find((ws: any) => ws.id === selectedWorkspaceId);
      if (!workspace) {
        // Selected workspace doesn't exist - navigate to safe location
        const targetPath = getSafeNavigationTarget(workspaces);
        if (targetPath) {
          try { toast.info('Your previous workspace is unavailable. Redirected to a valid workspace.'); } catch {}
          debug('Workspace invalid, redirecting:', targetPath);
          replaceNavigate(navigate, targetPath);
          recoveryAttempted.current = true;
        }
        return;
      }

      // Validate base exists in workspace
      if (selectedBaseId && workspace.bases) {
        const base = workspace.bases.find((b: any) => b.id === selectedBaseId);
        if (!base) {
          // Selected base doesn't exist - navigate to safe location
          const targetPath = getSafeNavigationTarget(workspaces);
          if (targetPath) {
            try { toast.info('Your previous base is unavailable. Redirected to a valid location.'); } catch {}
            debug('Base invalid, redirecting:', targetPath);
            replaceNavigate(navigate, targetPath);
            recoveryAttempted.current = true;
          }
          return;
        }

        // Validate table exists in base
        if (selectedTableId && base.tables) {
          // Handle both nested structure (model.id) and direct id
          const table = base.tables.find((t: any) => 
            t?.model?.id === selectedTableId || t?.id === selectedTableId
          );
          if (!table) {
            // Selected table doesn't exist - navigate to safe location
            const targetPath = getSafeNavigationTarget(workspaces);
            if (targetPath) {
              try { toast.info('Your previous table is unavailable. Redirected to a valid location.'); } catch {}
              replaceNavigate(navigate, targetPath);
              recoveryAttempted.current = true;
            }
            return;
          }

          // Validate view exists in table (or is grid slug)
          if (selectedViewId) {
            // "grid" is a special route slug, not a view ID - always valid for any table
            if (selectedViewId === 'grid') {
              // Grid view is valid - no validation needed
              // Navigation already happened or will happen via URL
              recoveryAttempted.current = true;
              return;
            }
            
            // For actual view IDs, check if view exists
            if (table.views) {
            const view = table.views.find((v: any) => v.id === selectedViewId);
            if (!view) {
                // Selected view doesn't exist - navigate to safe location
                const targetPath = getSafeNavigationTarget(workspaces);
              if (targetPath) {
                  debug('View invalid, redirecting:', targetPath);
                  try { toast.info('Your previous view is unavailable. Redirected to a valid view.'); } catch {}
                  replaceNavigate(navigate, targetPath);
                  recoveryAttempted.current = true;
              }
              return;
              }
            }
          }
        }
      }
    }

    // Recovery completed successfully
    recoveryAttempted.current = true;
  }, [
    isLoading,
    user?.id,
    workspacesData,
    workspaceBasesData,
    baseTablesData,
    workspaces,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    loadUserNavigation,
    loadFromActivityData,
    navigate,
    location.pathname,
    get,
    _raw,
  ]);

  // Don't run on public routes (login, register, etc.)
  const currentPath = location.pathname;
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => currentPath === route || currentPath.startsWith(route + '/'));
  
  // Early return for public routes - don't interfere with login page
  if (isPublicRoute || !user?.id) {
    return null;
  }

  // Don't show loading here - WorkspacesGuard already handles initial workspace loading
  // This component should only handle navigation recovery logic, not loading states
  // Return null to avoid duplicate loading indicators
  return null;
};
