import { useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavigationStore } from '../stores/navigationStore';
import { useAuth } from '../auth/AuthContext';
import { usePluginStore } from '../stores/pluginStore';

/**
 * Navigation hook that syncs Zustand store with React Router
 * Handles URL parsing, navigation, and browser reload restoration
 */
export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
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
  } = useNavigationStore();

  // Flyout management for layout navigation
  const { openFlyout, closeFlyout } = usePluginStore();

  // Sync URL params with store on mount and route changes
  useEffect(() => {
    const parseCurrentRoute = () => {
      const path = location.pathname;
      
      // Parse different route patterns
      const patterns = [
        // /workspace/{workspaceId}/base/{baseId}/table/{tableId}/{viewId}
        /^\/workspace\/([^/]+)\/base\/([^/]+)\/table\/([^/]+)\/([^/]+)$/,
        // /workspace/{workspaceId}
        /^\/workspace\/([^/]+)$/
      ];

      for (const pattern of patterns) {
        const match = path.match(pattern);
        if (match) {
          if (match.length === 5) {
            // View route: /workspace/{workspaceId}/base/{baseId}/table/{tableId}/{viewId}
            const [, workspaceId, baseId, tableId, viewId] = match;
            
            // Check if viewId is a slug (not a real view ID)
            const viewTypeSlugs = ['grid', 'form', 'gallery', 'kanban', 'calendar', 'gantt'];
            const isViewSlug = viewTypeSlugs.includes(viewId.toLowerCase());
            
            if (selectedWorkspaceId !== workspaceId || selectedBaseId !== baseId || selectedTableId !== tableId || selectedViewId !== viewId) {
              if (isViewSlug) {
                // Don't save slug as selectedViewId - only update table/base
                // This prevents "grid" from being saved and causing redirects
                navigateToTable(workspaceId, baseId, tableId);
              } else {
                // Real view ID - save it
                navigateToView(workspaceId, baseId, tableId, viewId);
              }
            }
          } else if (match.length === 2) {
            // Workspace route: /workspace/{workspaceId}
            const [, workspaceId] = match;
            if (selectedWorkspaceId !== workspaceId) {
              navigateToWorkspace(workspaceId);
            }
          }
          return;
        }
      }
    };

    parseCurrentRoute();
  }, [location.pathname, selectedWorkspaceId, selectedBaseId, selectedTableId, selectedViewId]);

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
    // Navigate to workspace homepage (bases are shown there)
    navigate(`/workspace/${workspaceId}`);
    // Open flyout for base routes
    openFlyout('workspace-flyout-menu');
    // No API call - cached in sessionStorage only
  };

  const navigateToTableWithUrl = (workspaceId: string, baseId: string, tableId: string) => {
    // Default to grid view route for consistency with router
    navigateToTable(workspaceId, baseId, tableId);
    navigate(`/workspace/${workspaceId}/base/${baseId}/table/${tableId}/grid`);
    // Open flyout for table/view routes
    openFlyout('workspace-flyout-menu');
    // No API call - cached in sessionStorage only
  };

  const navigateToViewWithUrl = (workspaceId: string, baseId: string, tableId: string, viewId: string) => {
    navigateToView(workspaceId, baseId, tableId, viewId);
    navigate(`/workspace/${workspaceId}/base/${baseId}/table/${tableId}/${viewId}`);
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