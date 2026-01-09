export interface LastNavigationState {
  workspaceId: string | null;
  baseId: string | null;
  tableId: string | null;
  viewId: string | null;
}

export interface ServerSyncState extends LastNavigationState {
  expandedBases: string[];
  expandedTables: string[];
}

const STORAGE_KEY_PREFIX = 'serenibase_session_nav';

// Get storage key for specific user
const getUserStorageKey = (userId?: string | null): string => {
  if (userId) {
    return `${STORAGE_KEY_PREFIX}_${userId}`;
  }
  return STORAGE_KEY_PREFIX; // Fallback for users without ID
};

// =============================================================================
// SESSION STORAGE FUNCTIONS (Temporary session cache only)
// Navigation persistence is now handled via API activity_data
// =============================================================================

/**
 * Get navigation state from sessionStorage (temporary session cache)
 * This is used only during the session for quick access.
 * For cross-device sync, use activity_data from the API (see AuthContext login).
 */
export const getLastNavigation = (userId?: string | null): LastNavigationState => {
  try {
    const storageKey = getUserStorageKey(userId);
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        workspaceId: data.workspaceId || null,
        baseId: data.baseId || null,
        tableId: data.tableId || null,
        viewId: data.viewId || null,
      };
    }
  } catch (error) {
    console.error('Failed to parse last navigation from sessionStorage:', error);
  }
  
  return {
    workspaceId: null,
    baseId: null,
    tableId: null,
    viewId: null,
  };
};

/**
 * Save navigation state to sessionStorage (temporary session cache only)
 * This is NOT persisted across devices - only saved to API on logout.
 * During normal navigation, we cache in sessionStorage for quick access.
 * On logout, AuthContext saves current state to activity_data API.
 */
export const saveLastNavigation = (state: LastNavigationState, userId?: string | null) => {
  try {
    const storageKey = getUserStorageKey(userId);
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save last navigation to sessionStorage:', error);
  }
};

/**
 * Check if user has any saved navigation state in session cache
 */
export const hasLastNavigation = (userId?: string | null): boolean => {
  try {
    const storageKey = getUserStorageKey(userId);
    const stored = sessionStorage.getItem(storageKey);
    return stored !== null && stored !== '';
  } catch (error) {
    return false;
  }
};

/**
 * Clear saved navigation for a user from session cache
 */
export const clearLastNavigation = (userId?: string | null) => {
  try {
    const storageKey = getUserStorageKey(userId);
    sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear last navigation:', error);
  }
};

/**
 * Clear all saved navigation states from session cache (on logout)
 * Also cleans up any legacy localStorage entries for backwards compatibility
 */
export const clearAllLastNavigation = () => {
  try {
    const keysToRemove: string[] = [];
    
    // Clean up sessionStorage navigation entries
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    // Also clean up any legacy localStorage entries (backwards compatibility)
    const legacyKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('serenibase_last_navigation')) {
        legacyKeysToRemove.push(key);
      }
    }
    legacyKeysToRemove.forEach(key => localStorage.removeItem(key));
    
  } catch (error) {
    console.error('Failed to clear all last navigation states:', error);
  }
};

/**
 * Clean up old token expiry keys (_st_exp, _rt_exp) from sessionStorage
 * These were used in old code but should not be there anymore
 */
export const cleanupOldTokenKeys = () => {
  try {
    sessionStorage.removeItem('_st_exp');
    sessionStorage.removeItem('_rt_exp');
  } catch (error) {
    console.error('Failed to cleanup old token keys:', error);
  }
};

/**
 * Get the best navigation target from available workspaces
 * For new users or when no saved navigation exists, navigates to first workspace > base > table > view
 * Returns path to navigate to, or null if no valid target exists
 */
export const getBestNavigationTarget = (workspaces: any[] | null, lastNav?: LastNavigationState): string | null => {
  if (!workspaces) {
    return null;
  }
  
  if (workspaces.length === 0) {
    return '/homepage';
  }
  
  // Try to use last navigation state if provided and valid
  if (lastNav?.workspaceId && lastNav.baseId && lastNav.tableId && lastNav.viewId) {
    const workspace = workspaces.find((ws: any) => ws.id === lastNav.workspaceId);
    if (workspace?.bases) {
      const base = workspace.bases.find((b: any) => b.id === lastNav.baseId);
      if (base?.tables) {
        // Handle both nested structure (model.id) and direct id
        const table = base.tables.find((t: any) => 
          t?.model?.id === lastNav.tableId || t?.id === lastNav.tableId
        );
        if (table?.views && table.views.length > 0) {
          const view = table.views.find((v: any) => v.id === lastNav.viewId);
          if (view) {
            // Handle both nested structure (model.id) and direct id
            const tableId = table?.model?.id || table?.id;
            return `/base/${base.id}/table/${tableId}/${view.id}`;
          }
        }
      }
    }
  }
  
  // Auto-select for new users: Navigate to first workspace > first base > first table > first view
  const firstWorkspace = workspaces[0];
  if (firstWorkspace?.bases && firstWorkspace.bases.length > 0) {
    const firstBase = firstWorkspace.bases[0];
    if (firstBase?.tables && firstBase.tables.length > 0) {
      const firstTable = firstBase.tables[0];
      // Handle both nested structure (model.id) and direct id
      const firstTableId = firstTable?.model?.id || firstTable?.id;
      if (firstTable?.views && firstTable.views.length > 0) {
        const firstView = firstTable.views[0];
        return `/base/${firstBase.id}/table/${firstTableId}/${firstView.id}`;
      } else {
        // Table exists but no views, navigate to table with grid view
        return `/base/${firstBase.id}/table/${firstTableId}/grid`;
      }
    } else {
      // Base exists but no tables
      return `/base/${firstBase.id}`;
    }
  }
  
  // If no valid path found, go to workspace
  return '/homepage';
};

/**
 * Resolve workspaceId from baseId by searching through workspaces
 */
export const resolveWorkspaceIdFromBaseId = (baseId: string, workspaces: any[]): string | null => {
  if (!baseId || !workspaces || workspaces.length === 0) {
    return null;
  }
  
  for (const workspace of workspaces) {
    if (workspace?.bases) {
      const base = workspace.bases.find((b: any) => b.id === baseId);
      if (base) {
        return workspace.id;
      }
    }
  }
  
  return null;
};

/**
 * Get safe navigation target after deletion
 * Returns the best available navigation target when current item is deleted
 */
export const getSafeNavigationTarget = (workspaces: any[] | null): string | null => {
  if (!workspaces || workspaces.length === 0) {
    return '/homepage';
  }
  
  // Navigate to first available workspace > base > table > view
  for (const workspace of workspaces) {
    if (workspace?.bases && workspace.bases.length > 0) {
      const firstBase = workspace.bases[0];
      if (firstBase?.tables && firstBase.tables.length > 0) {
        const firstTable = firstBase.tables[0];
        // Handle both nested structure (model.id) and direct id
        const firstTableId = firstTable?.model?.id || firstTable?.id;
        if (firstTable?.views && firstTable.views.length > 0) {
          return `/base/${firstBase.id}/table/${firstTableId}/${firstTable.views[0].id}`;
        } else {
          return `/base/${firstBase.id}/table/${firstTableId}/grid`;
        }
      } else {
        return `/base/${firstBase.id}`;
      }
    }
  }
  
  return '/homepage';
};

// =============================================================================
// CLEANUP HELPERS (for deletions)
// =============================================================================

/**
 * Clean up saved navigation when a workspace is deleted
 */
export const cleanupWorkspaceNavigation = (deletedWorkspaceId: string, userId?: string | null): boolean => {
  const lastNav = getLastNavigation(userId);
  
  if (lastNav.workspaceId === deletedWorkspaceId) {
    saveLastNavigation({
      workspaceId: null,
      baseId: null,
      tableId: null,
      viewId: null,
    }, userId);
    return true; // Was current workspace
  }
  
  return false; // Was not current workspace
};

/**
 * Clean up saved navigation when a base is deleted
 */
export const cleanupBaseNavigation = (deletedBaseId: string, userId?: string | null): boolean => {
  const lastNav = getLastNavigation(userId);
  
  if (lastNav.baseId === deletedBaseId) {
    saveLastNavigation({
      workspaceId: lastNav.workspaceId, // Keep workspace
      baseId: null,
      tableId: null,
      viewId: null,
    }, userId);
    return true; // Was current base
  }
  
  return false; // Was not current base
};

/**
 * Clean up saved navigation when a table is deleted
 */
export const cleanupTableNavigation = (deletedTableId: string, userId?: string | null): boolean => {
  const lastNav = getLastNavigation(userId);
  
  if (lastNav.tableId === deletedTableId) {
    saveLastNavigation({
      workspaceId: lastNav.workspaceId, // Keep workspace
      baseId: lastNav.baseId, // Keep base
      tableId: null,
      viewId: null,
    }, userId);
    return true; // Was current table
  }
  
  return false; // Was not current table
};

/**
 * Clean up saved navigation when a view is deleted
 */
export const cleanupViewNavigation = (deletedViewId: string, userId?: string | null): boolean => {
  const lastNav = getLastNavigation(userId);
  
  if (lastNav.viewId === deletedViewId) {
    saveLastNavigation({
      workspaceId: lastNav.workspaceId, // Keep workspace
      baseId: lastNav.baseId, // Keep base
      tableId: lastNav.tableId, // Keep table
      viewId: null,
    }, userId);
    return true; // Was current view
  }
  
  return false; // Was not current view
};
