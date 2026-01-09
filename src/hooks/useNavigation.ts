import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useNavigationStore } from '../stores/navigationStore';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../auth/AuthContext';
import { resolveWorkspaceIdFromBaseId } from '../utils/navigationPersistence';
import { buildWorkspaceIndex } from '../utils/navigationIndex';
import useWorkspaceData from './useWorkspaceData';
import { usePluginStore } from '../stores/pluginStore';

/**
 * Navigation hook that syncs Zustand store with React Router
 * Handles URL parsing, navigation, and browser reload restoration
 */
export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const toast = useToast();
  
  const {
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    navigateToWorkspace,
    navigateToBase,
    navigateToTable,
    navigateToView,
    getNavigationPath,
    saveUserNavigation,
    updateActivityData
  } = useNavigationStore();

  // Flyout management for layout navigation
  const { openFlyout, closeFlyout } = usePluginStore();

  // Sync URL params with store on mount and route changes
  useEffect(() => {
    const parseCurrentRoute = () => {
      const path = location.pathname;
      
      // Parse different route patterns
      const patterns = [
        // /base/{baseId}/table/{tableId}/{viewId}
        /^\/base\/([^\/]+)\/table\/([^\/]+)\/([^\/]+)$/,
        // /base/{baseId}/table/{tableId}
        /^\/base\/([^\/]+)\/table\/([^\/]+)$/,
        // /base/{baseId}
        /^\/base\/([^\/]+)$/,
        // /workspace/{workspaceId}
        /^\/workspace\/([^\/]+)$/
      ];

      for (const pattern of patterns) {
        const match = path.match(pattern);
        if (match) {
          if (match.length === 4) {
            // View route: /base/{baseId}/table/{tableId}/{viewId}
            const [, baseId, tableId, viewId] = match;
            
            // Check if viewId is a slug (not a real view ID)
            const viewTypeSlugs = ['grid', 'form', 'gallery', 'kanban', 'calendar', 'gantt'];
            const isViewSlug = viewTypeSlugs.includes(viewId.toLowerCase());
            
            if (selectedBaseId !== baseId || selectedTableId !== tableId || selectedViewId !== viewId) {
              // Ensure we have a workspaceId. If missing, resolve from baseId (prefer O(1) index)
              const effectiveWorkspaceId = selectedWorkspaceId || workspaceIndex.baseToWorkspace.get(baseId) || resolveWorkspaceIdFromBaseId(baseId, workspacesList) || '';
              if (!effectiveWorkspaceId) {
                // User-friendly feedback instead of silent failure
                try { toast.error('Unable to resolve workspace for this base.'); } catch {}
                return;
              }
              
              if (isViewSlug) {
                // Don't save slug as selectedViewId - only update table/base
                // This prevents "grid" from being saved and causing redirects
                navigateToTable(effectiveWorkspaceId, baseId, tableId);
              } else {
                // Real view ID - save it
                navigateToView(effectiveWorkspaceId, baseId, tableId, viewId);
              }
            }
          } else if (match.length === 3) {
            // Table route: /base/{baseId}/table/{tableId}
            const [, baseId, tableId] = match;
            if (selectedBaseId !== baseId || selectedTableId !== tableId) {
              const effectiveWorkspaceId = selectedWorkspaceId || workspaceIndex.baseToWorkspace.get(baseId) || resolveWorkspaceIdFromBaseId(baseId, workspacesList) || '';
              if (!effectiveWorkspaceId) {
                try { toast.error('Unable to resolve workspace for this base.'); } catch {}
                return;
              }
              navigateToTable(effectiveWorkspaceId, baseId, tableId);
            }
          } else if (match.length === 2) {
            if (pattern.source.includes('base')) {
              // Base route: /base/{baseId}
              const [, baseId] = match;
              if (selectedBaseId !== baseId) {
                const effectiveWorkspaceId = selectedWorkspaceId || workspaceIndex.baseToWorkspace.get(baseId) || resolveWorkspaceIdFromBaseId(baseId, workspacesList) || '';
                if (!effectiveWorkspaceId) {
                  try { toast.error('Unable to resolve workspace for this base.'); } catch {}
                  return;
                }
                navigateToBase(effectiveWorkspaceId, baseId);
              }
            } else {
              // Workspace route: /workspace/{workspaceId}
              const [, workspaceId] = match;
              if (selectedWorkspaceId !== workspaceId) {
                navigateToWorkspace(workspaceId);
              }
            }
          }
          return;
        }
      }
    };

    parseCurrentRoute();
  }, [location.pathname]);

  // Cache navigation in sessionStorage on changes (per-user)
  // Note: This only caches in sessionStorage for session recovery
  // Backend sync happens on logout via AuthContext (saves to activity_data API)
  // IMPORTANT: Don't save during initial load/restore to prevent overwriting saved state with null
  const { restoreCompleted } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    // Don't save during initial restore phase - wait until restore is complete
    // This prevents overwriting saved navigation state with null during browser reload
    if (!restoreCompleted) return;
    
    // Only save if we have at least a workspaceId (don't save null states)
    // This prevents clearing saved state during loading phases
    if (!selectedWorkspaceId) return;
    
    // Save to sessionStorage for quick session recovery
    // No backend API call here - saves on logout only
    try {
      saveUserNavigation(user.id);
    } catch (e) {
      // non-fatal
      console.warn('Failed to cache navigation state in sessionStorage', e);
    }
  }, [
    user?.id,
    restoreCompleted,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    saveUserNavigation,
  ]);

  // Get workspaces for workspaceId resolution
  const { workspaces } = useWorkspaceData();
  const workspacesList = useMemo(() => (workspaces?.data?.workspaces || (Array.isArray(workspaces) ? workspaces : [])) as any[], [workspaces]);
  const workspaceIndex = useMemo(() => buildWorkspaceIndex(workspacesList), [workspacesList]);

  // Navigation functions that update both store and URL
  // Note: Activity data is NOT updated here - only saved to API on logout
  // During navigation, we only cache in sessionStorage
  const navigateToWorkspaceWithUrl = (workspaceId: string) => {
    navigateToWorkspace(workspaceId);
    navigate(`/workspace/${workspaceId}`);
    // Close flyout on workspace route (not a base route)
    closeFlyout();
    // No API call - cached in sessionStorage only
  };

  const navigateToBaseWithUrl = (workspaceId: string, baseId: string) => {
    navigateToBase(workspaceId, baseId);
    navigate(`/base/${baseId}`);
    // Open flyout for base routes
    openFlyout('workspace-flyout-menu');
    // No API call - cached in sessionStorage only
  };

  const navigateToTableWithUrl = (workspaceId: string, baseId: string, tableId: string) => {
    // Default to grid view route for consistency with router
    navigateToTable(workspaceId, baseId, tableId);
    navigate(`/base/${baseId}/table/${tableId}/grid`);
    // Open flyout for table/view routes
    openFlyout('workspace-flyout-menu');
    // No API call - cached in sessionStorage only
  };

  const navigateToViewWithUrl = (workspaceId: string, baseId: string, tableId: string, viewId: string) => {
    navigateToView(workspaceId, baseId, tableId, viewId);
    navigate(`/base/${baseId}/table/${tableId}/${viewId}`);
    // Open flyout for view routes
    openFlyout('workspace-flyout-menu');
    // No API call - cached in sessionStorage only
  };

  // Browser reload restoration
  const restoreNavigation = () => {
    if (location.pathname === '/' && selectedWorkspaceId) {
      // On app load, if we have stored navigation state but are on home page, restore
      const path = getNavigationPath();
      if (path !== '/') {
        navigate(path, { replace: true });
      }
    }
  };

  return {
    // Current selections from store
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    
    // Navigation functions that sync URL
    navigateToWorkspace: navigateToWorkspaceWithUrl,
    navigateToBase: navigateToBaseWithUrl,
    navigateToTable: navigateToTableWithUrl,
    navigateToView: navigateToViewWithUrl,
    
    // Utility functions
    restoreNavigation,
    getNavigationPath,
    currentPath: location.pathname,
  };
};

/**
 * Hook for restoring navigation state on app initialization
 * Use this in your main App component
 */
export const useNavigationRestore = () => {
  const { restoreNavigation } = useNavigation();
  
  useEffect(() => {
    restoreNavigation();
  }, []); // Run once on mount
};