import { useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

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

    // Check if selectedWorkspace is null or invalid (workspace doesn't exist in list)
    const isSelectedWorkspaceInvalid = !selectedWorkspace || 
      (selectedWorkspace.id && !workspaces.some(ws => ws.id === selectedWorkspace.id));

    // Priority 1: If store has selectedWorkspaceId (from activity_data or previous selection), sync the workspace object
    // This is critical for browser reload - store has ID, need to restore workspace object
    // FIX: Only sync workspace object, don't call setWorkspace() which triggers save and can cause loops
    if (selectedWorkspaceId) {
      const savedWorkspace = workspaces.find(ws => ws.id === selectedWorkspaceId);
      if (savedWorkspace) {
        // Workspace exists - sync the workspace object ONLY (don't update store ID - it's already correct)
        // This ensures workspace selection is restored on browser reload without triggering saves
        if (!selectedWorkspace || selectedWorkspace.id !== savedWorkspace.id) {
          setSelectedWorkspace(savedWorkspace);
          // DON'T call setWorkspace() here - selectedWorkspaceId is already correct in store
          // Calling setWorkspace() would trigger a save and potentially cause a restore loop
        }
      } else {
        // Workspace ID in store doesn't exist in loaded workspaces
        // This could happen if workspace was deleted or user lost access
        // FALLBACK: Always select first workspace when saved workspace is invalid
        if (workspaces.length > 0) {
          const firstWorkspace = workspaces[0];
          setSelectedWorkspace(firstWorkspace);
          setWorkspace(firstWorkspace.id);
          // Persist the selection for refresh scenarios
          if (authUser?.id) {
            navigateAndPersist(firstWorkspace.id, null as any, null as any, authUser.id);
          }
        }
      }
    } else {
      // No workspace selected in store - ONLY auto-select on initial load (not after user changes)
      // FIX: Check if this is initial load by checking if AppInitializer has completed
      // We should only auto-select if there's truly no saved state AND it's initial load
      // Don't auto-select if user just changed workspace (that would override their choice)
      const hasInitialized = sessionStorage.getItem('nav_initialized') === 'true';
      
      // Only auto-select first workspace if:
      // 1. This is initial load (not initialized yet)
      // 2. No workspace is selected
      // 3. Workspaces are available
      if (!hasInitialized && workspaces.length > 0) {
        const firstWorkspace = workspaces[0];
        setSelectedWorkspace(firstWorkspace);
        setWorkspace(firstWorkspace.id);
        // Mark as initialized to prevent future auto-selection
        sessionStorage.setItem('nav_initialized', 'true');
        // Persist the selection for refresh scenarios
        if (authUser?.id) {
          navigateAndPersist(firstWorkspace.id, null as any, null as any, authUser.id);
        }
      }
    }

    // ADDITIONAL SAFETY CHECK: If selectedWorkspace is null or invalid but workspaces are available,
    // always fallback to first workspace. This handles edge cases where selection gets lost unexpectedly.
    // This ensures workspace selection never disappears when workspaces are available.
    if (isSelectedWorkspaceInvalid && workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      // Only update if we don't already have a valid selection
      if (!selectedWorkspaceId || !workspaces.some(ws => ws.id === selectedWorkspaceId)) {
        setSelectedWorkspace(firstWorkspace);
        setWorkspace(firstWorkspace.id);
        // Persist the selection for refresh scenarios
        if (authUser?.id) {
          navigateAndPersist(firstWorkspace.id, null as any, null as any, authUser.id);
        }
      }
    }
  }, [workspaces, restoreCompleted, selectedWorkspace, selectedWorkspaceId, setWorkspace, setSelectedWorkspace, authUser, navigateAndPersist]);
};
