import { useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

const PENDING_NEW_WORKSPACE_KEY = 'pending_new_workspace';
const PENDING_NEW_WORKSPACE_TTL_MS = 15000;

// Helper: Check if selected workspace is invalid
const isSelectedWorkspaceInvalid = (
  selectedWorkspace: any,
  workspaceList: any[],
  selectedWorkspaceId: string | null
): boolean => {
  if (!selectedWorkspace) return true;
  if (!selectedWorkspace.id) return true;
  if (selectedWorkspaceId && selectedWorkspace.id !== selectedWorkspaceId) return true;
  return !workspaceList.some(ws => ws.id === selectedWorkspace.id);
};

const shouldDeferInvalidWorkspaceFallback = (workspaceList: any[], selectedWorkspaceId: string | null): boolean => {
  if (!selectedWorkspaceId) return false;

  const pendingWorkspaceRaw = sessionStorage.getItem(PENDING_NEW_WORKSPACE_KEY);
  if (!pendingWorkspaceRaw) return false;

  try {
    const pendingWorkspace = JSON.parse(pendingWorkspaceRaw) as { id?: string; createdAt?: number };
    const isExpired = !pendingWorkspace?.createdAt || (Date.now() - pendingWorkspace.createdAt) > PENDING_NEW_WORKSPACE_TTL_MS;
    if (isExpired) {
      sessionStorage.removeItem(PENDING_NEW_WORKSPACE_KEY);
      return false;
    }

    if (pendingWorkspace.id !== selectedWorkspaceId) {
      return false;
    }

    // Workspace reached query data - clear pending marker
    if (workspaceList.some(ws => ws.id === selectedWorkspaceId)) {
      sessionStorage.removeItem(PENDING_NEW_WORKSPACE_KEY);
      return false;
    }

    return true;
  } catch {
    sessionStorage.removeItem(PENDING_NEW_WORKSPACE_KEY);
    return false;
  }
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

  if (selectedWorkspace?.id && selectedWorkspace.id !== selectedWorkspaceId) {
    setSelectedWorkspace(null);
  }
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
    const isInvalid = isSelectedWorkspaceInvalid(selectedWorkspace, workspaceList, selectedWorkspaceId);
    const shouldDeferFallback = shouldDeferInvalidWorkspaceFallback(workspaceList, selectedWorkspaceId);

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
    if (isInvalid && !shouldDeferFallback) {
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
