import { useNavigate } from 'react-router-dom';
import { replaceNavigate } from '../utils/navigationRedirect';
import { 
  cleanupWorkspaceNavigation,
  cleanupBaseNavigation,
  cleanupTableNavigation,
  cleanupViewNavigation,
  getSafeNavigationTarget
} from '../utils/navigationPersistence';
import { useNavigationStore } from '../stores/navigationStore';
import { useAuth } from '../auth/AuthContext';
import useWorkspaceData from './useWorkspaceData';

/**
 * Provides safe navigation handlers after destructive operations.
 *
 * Behavior when deleting the current selection:
 * - View: jump to the first available view in the same table, else grid, else safe target.
 * - Table: jump to the next safe target (first table in workspace tree).
 * - Base: jump to the next safe target (first base → first table → first view).
 * - Workspace: jump to the next safe workspace (or /workspace if none remain).
 */
export const useNavigationActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaces } = useWorkspaceData();
  const { saveUserNavigation } = useNavigationStore();

  // Get workspaces list (handle different data structures)
  const workspacesList = (workspaces as any)?.data?.workspaces || (Array.isArray(workspaces) ? workspaces : []);

  /**
   * Handle workspace deletion cleanup and safe navigation
   * When deleting the current workspace, navigate to first available workspace/base/table/view
   */
  /**
   * Handle deletion of a workspace.
   * Clears selections if the deleted workspace was active and
   * redirects to the first valid remaining workspace tree.
   */
  const handleWorkspaceDeletion = (deletedWorkspaceId: string) => {
    if (!user?.id) return;
    
    const current = useNavigationStore.getState();
    const wasCurrentWorkspace = current.selectedWorkspaceId === deletedWorkspaceId || cleanupWorkspaceNavigation(deletedWorkspaceId, user.id);
    
    if (wasCurrentWorkspace) {
      // Clear current selections in store
      current.setWorkspace(null);
      current.setBase(null);
      current.setTable(null);
      current.setView(null);
      // Build a list that excludes the deleted workspace to avoid redirecting back to it
      const remainingWorkspaces = Array.isArray(workspacesList)
        ? workspacesList.filter((w: any) => w && w.id !== deletedWorkspaceId)
        : [];
      // Navigate to safe location (first available workspace/base/table/view)
      const targetPath = getSafeNavigationTarget(remainingWorkspaces);
      if (targetPath) {
        replaceNavigate(navigate, targetPath);
        // Update session cache (backend sync happens on logout)
        saveUserNavigation(user.id);
      } else {
        // No workspaces available - go to homepage
        replaceNavigate(navigate, '/homepage');
      }
    }
  };

  /**
   * Handle base deletion cleanup and safe navigation
   * When deleting the current base, navigate to first available base/table/view
   */
  /**
   * Handle deletion of a base.
   * Clears base/table/view if the deleted base was active and
   * redirects to the next safe location.
   */
  const handleBaseDeletion = (deletedBaseId: string) => {
    if (!user?.id) return;
    
    const current = useNavigationStore.getState();
    const wasCurrentBase = current.selectedBaseId === deletedBaseId || cleanupBaseNavigation(deletedBaseId, user.id);
    
    if (wasCurrentBase) {
      // Clear base/table/view since base is gone
      current.setBase(null);
      current.setTable(null);
      current.setView(null);
      
      // Don't use stale workspacesList - it still contains the deleted base
      // Instead, create updated workspace data with deleted base filtered out
      const selectedWorkspaceId = current.selectedWorkspaceId;
      const updatedWorkspacesList = Array.isArray(workspacesList)
        ? workspacesList.map((workspace: any) => {
            if (workspace.id === selectedWorkspaceId && workspace.bases) {
              return {
                ...workspace,
                bases: workspace.bases.filter((base: any) => base.id !== deletedBaseId)
              };
            }
            return workspace;
          })
        : [];
      
      // Navigate to safe location using updated data
      const targetPath = getSafeNavigationTarget(updatedWorkspacesList);
      if (targetPath) {
        replaceNavigate(navigate, targetPath);
        // Update session cache
        saveUserNavigation(user.id);
      } else {
        // No bases available - go to homepage
        replaceNavigate(navigate, '/homepage');
      }
    }
  };

  /**
   * Handle table deletion cleanup and safe navigation
   * When deleting the current table, navigate to first available table/view
   */
  /**
   * Handle deletion of a table.
   * Clears table/view if the deleted table was active and
   * redirects to the next safe location.
   */
  const handleTableDeletion = (deletedTableId: string) => {
    if (!user?.id) return;
    
    const current = useNavigationStore.getState();
    const wasCurrentTable = current.selectedTableId === deletedTableId || cleanupTableNavigation(deletedTableId, user.id);
    
    if (wasCurrentTable) {
      // Clear table/view since table is gone
      current.setTable(null);
      current.setView(null);
      // Navigate to safe location (first available table/view)
      const targetPath = getSafeNavigationTarget(workspacesList);
      if (targetPath) {
        replaceNavigate(navigate, targetPath);
        // Update session cache
        saveUserNavigation(user.id);
      } else {
        // No tables available - navigate to homepage
        replaceNavigate(navigate, '/homepage');
      }
    }
  };

  /**
   * Handle view deletion cleanup and safe navigation
   * When deleting the current view, navigate to another view in the same table, or safe location
   */
  /**
   * Handle deletion of a view.
   * Tries to select another view under the same table;
   * if none available, falls back to grid, else to a global safe target.
   */
  const handleViewDeletion = (deletedViewId: string) => {
    if (!user?.id) return;
    
    const wasCurrentView = cleanupViewNavigation(deletedViewId, user.id);
    
    if (wasCurrentView) {
      // Try to find another view in the same table first
      const navigationState = useNavigationStore.getState();
      const { selectedTableId, selectedBaseId } = navigationState;
      
      if (selectedTableId && selectedBaseId && workspacesList.length > 0) {
        // Find the table and see if it has other views
        for (const workspace of workspacesList) {
          if (workspace?.bases) {
            const base = workspace.bases.find((b: any) => b.id === selectedBaseId);
            if (base?.tables) {
              // Handle both nested structure (model.id) and direct id
              const table = base.tables.find((t: any) => 
                t?.model?.id === selectedTableId || t?.id === selectedTableId
              );
              if (table?.views && table.views.length > 0) {
                const firstView = table.views[0];
                replaceNavigate(navigate, `/base/${selectedBaseId}/table/${selectedTableId}/${firstView.id}`);
                saveUserNavigation(user.id);
                return;
              } else if (table) {
                // Table exists but no views - navigate to grid view
                replaceNavigate(navigate, `/base/${selectedBaseId}/table/${selectedTableId}/grid`);
                saveUserNavigation(user.id);
                return;
              }
            }
          }
        }
      }
      
      // Fallback to safe location
      const targetPath = getSafeNavigationTarget(workspacesList);
      if (targetPath) {
        replaceNavigate(navigate, targetPath);
        saveUserNavigation(user.id);
      } else {
        replaceNavigate(navigate, '/homepage');
      }
    }
  };

  return {
    handleWorkspaceDeletion,
    handleBaseDeletion,
    handleTableDeletion,
    handleViewDeletion,
  };
};
