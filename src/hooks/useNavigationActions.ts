/* eslint-disable sonarjs/cognitive-complexity */
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
        // No workspaces available - go to workspace route
        replaceNavigate(navigate, '/workspace');
      }
    }
  };

  /**
   * Handle deletion of a base.
   * Clears base/table/view if the deleted base was active and
   * redirects to the next safe location in the same workspace.
   */
  const handleBaseDeletion = (deletedBaseId: string) => {
    if (!user?.id) return;
    
    const current = useNavigationStore.getState();
    const wasCurrentBase = current.selectedBaseId === deletedBaseId || cleanupBaseNavigation(deletedBaseId, user.id);
    
    if (wasCurrentBase) {
      const selectedWorkspaceId = current.selectedWorkspaceId;
      
      if (!selectedWorkspaceId) {
        replaceNavigate(navigate, '/workspace');
        saveUserNavigation(user.id);
        return;
      }
      
      // Stay in SAME workspace, find first remaining base
      const currentWorkspace = workspacesList.find((ws: any) => ws.id === selectedWorkspaceId);
      
      if (currentWorkspace?.bases) {
        const remainingBases = currentWorkspace.bases.filter((base: any) => base.id !== deletedBaseId);
        
        if (remainingBases.length > 0) {
          // Navigate to first remaining base in SAME workspace
          const firstBase = remainingBases[0];
          
          // Find first table in this base
          if (firstBase.tables && firstBase.tables.length > 0) {
            const firstTable = firstBase.tables[0];
            const tableId = firstTable?.model?.id || firstTable?.id;
            
            if (!tableId) {
              current.navigateToBase(selectedWorkspaceId, firstBase.id);
              replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}`);
              saveUserNavigation(user.id);
              return;
            }
            
            // Find first view in this table
            if (firstTable.views && firstTable.views.length > 0) {
              const firstView = firstTable.views[0];
              const viewId = firstView.id;
              
              // Navigate to first base > first table > first view in SAME workspace
              current.navigateToView(selectedWorkspaceId, firstBase.id, tableId, viewId);
              replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}/base/${firstBase.id}/table/${tableId}/${viewId}`);
              saveUserNavigation(user.id);
              return;
            } else {
              // No views, use grid
              current.navigateToTable(selectedWorkspaceId, firstBase.id, tableId);
              replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}/base/${firstBase.id}/table/${tableId}/grid`);
              saveUserNavigation(user.id);
              return;
            }
          } else {
            // No tables, just navigate to workspace homepage
            current.navigateToBase(selectedWorkspaceId, firstBase.id);
            replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}`);
            saveUserNavigation(user.id);
            return;
          }
        }
      }
      
      // Only go to workspace homepage if no bases remain in current workspace
      current.setBase(null);
      current.setTable(null);
      current.setView(null);
      if (selectedWorkspaceId) {
        replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}`);
      } else {
        replaceNavigate(navigate, '/workspace');
      }
      saveUserNavigation(user.id);
    }
  };

  /**
   * Handle deletion of a table.
   * Clears table/view if the deleted table was active and
   * redirects to the next safe location in the same base.
   */
  const handleTableDeletion = (deletedTableId: string) => {
    if (!user?.id) return;
    
    const current = useNavigationStore.getState();
    const wasCurrentTable = current.selectedTableId === deletedTableId || cleanupTableNavigation(deletedTableId, user.id);
    
    if (wasCurrentTable) {
      const selectedWorkspaceId = current.selectedWorkspaceId;
      const selectedBaseId = current.selectedBaseId;
      
      if (!selectedWorkspaceId || !selectedBaseId) {
        if (selectedWorkspaceId) {
          replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}`);
        } else {
          replaceNavigate(navigate, '/workspace');
        }
        saveUserNavigation(user.id);
        return;
      }
      
      // Stay in SAME base, find first remaining table
      const currentWorkspace = workspacesList.find((ws: any) => ws.id === selectedWorkspaceId);
      const currentBase = currentWorkspace?.bases?.find((base: any) => base.id === selectedBaseId);
      
      if (currentBase?.tables) {
        const remainingTables = currentBase.tables.filter((table: any) => {
          const tableId = table?.model?.id || table?.id;
          return tableId !== deletedTableId;
        });
        
        if (remainingTables.length > 0) {
          // Navigate to first remaining table in SAME base
          const firstTable = remainingTables[0];
          const tableId = firstTable?.model?.id || firstTable?.id;
          
          if (!tableId) {
            current.setTable(null);
            current.setView(null);
            replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}`);
            saveUserNavigation(user.id);
            return;
          }
          
          // Find first view in this table
          if (firstTable.views && firstTable.views.length > 0) {
            const firstView = firstTable.views[0];
            const viewId = firstView.id;
            
            // Navigate to first table > first view in SAME base
            current.navigateToView(selectedWorkspaceId, selectedBaseId, tableId, viewId);
            replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}/base/${selectedBaseId}/table/${tableId}/${viewId}`);
            saveUserNavigation(user.id);
            return;
          } else {
            // No views, use grid
            current.navigateToTable(selectedWorkspaceId, selectedBaseId, tableId);
            replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}/base/${selectedBaseId}/table/${tableId}/grid`);
            saveUserNavigation(user.id);
            return;
          }
        }
      }
      
      // Only go to workspace homepage if no tables remain in current base
      current.setTable(null);
      current.setView(null);
      if (selectedWorkspaceId) {
        replaceNavigate(navigate, `/workspace/${selectedWorkspaceId}`);
      } else {
        replaceNavigate(navigate, '/workspace');
      }
      saveUserNavigation(user.id);
    }
  };

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
                const workspaceId = workspace.id;
                replaceNavigate(navigate, `/workspace/${workspaceId}/base/${selectedBaseId}/table/${selectedTableId}/${firstView.id}`);
                saveUserNavigation(user.id);
                return;
              } else if (table) {
                // Table exists but no views - navigate to grid view
                const workspaceId = workspace.id;
                replaceNavigate(navigate, `/workspace/${workspaceId}/base/${selectedBaseId}/table/${selectedTableId}/grid`);
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
        replaceNavigate(navigate, '/workspace');
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
