import { useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

// Helper: Check if selected workspace is invalid
const isSelectedWorkspaceInvalid = (selectedWorkspace: any, workspaceList: any[]): boolean => {
  if (!selectedWorkspace) return true;
  if (!selectedWorkspace.id) return true;
  return !workspaceList.some(ws => ws.id === selectedWorkspace.id);
};

// Helper: Select and persist first workspace
const selectFirstWorkspace = (
  workspaceList: any[],
  setSelectedWorkspace: (workspace: any) => void,
  setWorkspace: (id: string) => void,
  navigateAndPersist: (workspaceId: string, baseId: any, tableId: any, userId: string) => void,
  userId: string | undefined
) => {
  if (workspaceList.length === 0) return;
  const firstWorkspace = workspaceList[0];
  setSelectedWorkspace(firstWorkspace);
  setWorkspace(firstWorkspace.id);
  if (userId) {
    navigateAndPersist(firstWorkspace.id, null as any, null as any, userId);
  }
};

// Helper: Sync workspace object from store ID
const syncWorkspaceFromStoreId = (
  workspaceList: any[],
  selectedWorkspaceId: string | null,
  selectedWorkspace: any,
  setSelectedWorkspace: (workspace: any) => void,
  setWorkspace: (id: string) => void,
  navigateAndPersist: (workspaceId: string, baseId: any, tableId: any, userId: string) => void,
  userId: string | undefined
) => {
  if (!selectedWorkspaceId) return;
  
  const savedWorkspace = workspaceList.find(ws => ws.id === selectedWorkspaceId);
  if (savedWorkspace) {
    // Workspace exists - sync the workspace object ONLY (don't update store ID - it's already correct)
    if (!selectedWorkspace || selectedWorkspace.id !== savedWorkspace.id) {
      setSelectedWorkspace(savedWorkspace);
    }
    return;
  }
  
  // Workspace ID in store doesn't exist - fallback to first workspace
  selectFirstWorkspace(workspaceList, setSelectedWorkspace, setWorkspace, navigateAndPersist, userId);
};

// Helper: Handle auto-selection on initial load
const handleInitialAutoSelection = (
  workspaceList: any[],
  setSelectedWorkspace: (workspace: any) => void,
  setWorkspace: (id: string) => void,
  navigateAndPersist: (workspaceId: string, baseId: any, tableId: any, userId: string) => void,
  userId: string | undefined
) => {
  const hasInitialized = sessionStorage.getItem('nav_initialized') === 'true';
  if (!hasInitialized && workspaceList.length > 0) {
    selectFirstWorkspace(workspaceList, setSelectedWorkspace, setWorkspace, navigateAndPersist, userId);
    sessionStorage.setItem('nav_initialized', 'true');
  }
};

// Helper: Handle invalid workspace fallback
const handleInvalidWorkspaceFallback = (
  workspaceList: any[],
  selectedWorkspaceId: string | null,
  setSelectedWorkspace: (workspace: any) => void,
  setWorkspace: (id: string) => void,
  navigateAndPersist: (workspaceId: string, baseId: any, tableId: any, userId: string) => void,
  userId: string | undefined
) => {
  if (workspaceList.length === 0) return;
  
  const hasValidStoreId = selectedWorkspaceId && workspaceList.some(ws => ws.id === selectedWorkspaceId);
  if (!hasValidStoreId) {
    selectFirstWorkspace(workspaceList, setSelectedWorkspace, setWorkspace, navigateAndPersist, userId);
  }
};

/**
 * Hook to manage workspace selection synchronization
 * Handles syncing selectedWorkspace state with selectedWorkspaceId from store
 * and provides fallback logic for edge cases
 */
export const useWorkspaceSelection = (
  workspaces: any[] | undefined,
  restoreCompleted: boolean,
  selectedWorkspace: any,
  selectedWorkspaceId: string | null,
  setSelectedWorkspace: (workspace: any) => void,
  setWorkspace: (id: string) => void,
  navigateAndPersist: (workspaceId: string, baseId: any, tableId: any, userId: string) => void
) => {
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (!restoreCompleted) return;
    if (!workspaces || !Array.isArray(workspaces) || workspaces.length === 0) return;

    const workspaceList = workspaces;
    const isInvalid = isSelectedWorkspaceInvalid(selectedWorkspace, workspaceList);

    // Priority 1: If store has selectedWorkspaceId, sync the workspace object
    if (selectedWorkspaceId) {
      syncWorkspaceFromStoreId(
        workspaceList,
        selectedWorkspaceId,
        selectedWorkspace,
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist,
        authUser?.id
      );
    } else {
      // No workspace selected in store - auto-select on initial load only
      handleInitialAutoSelection(
        workspaceList,
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist,
        authUser?.id
      );
    }

    // Additional safety check: fallback if selectedWorkspace is invalid
    if (isInvalid) {
      handleInvalidWorkspaceFallback(
        workspaceList,
        selectedWorkspaceId,
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist,
        authUser?.id
      );
    }
  }, [workspaces, restoreCompleted, selectedWorkspace, selectedWorkspaceId, setWorkspace, setSelectedWorkspace, authUser, navigateAndPersist]);
};
