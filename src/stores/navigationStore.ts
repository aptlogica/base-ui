import { create } from 'zustand';
import { 
  saveLastNavigation, 
  getLastNavigation, 
  type LastNavigationState,
  resolveWorkspaceIdFromBaseId,
  getSafeNavigationTarget
} from '../utils/navigationPersistence';
import { 
  updateUserActivity, 
  getUserActivity, 
  clearUserActivity,
  createLoginSession,
  type UserActivityData,
  type LoginSession
} from '../service/activityService';

interface NavigationState {
  // Core navigation state - replaces workspacePersistence.ts
  selectedWorkspaceId: string | null;
  selectedBaseId: string | null;
  selectedTableId: string | null;
  selectedViewId: string | null;
  
  // UI state for sidebar - replaces local useState calls
  expandedBases: string[];
  expandedTables: string[];
  
  // Navigation actions
  setWorkspace: (id: string | null) => void;
  setBase: (id: string | null) => void;
  setTable: (id: string | null) => void;
  setView: (id: string | null) => void;
  
  // Navigation with hierarchy reset
  navigateToWorkspace: (workspaceId: string) => void;
  navigateToBase: (workspaceId: string, baseId: string) => void;
  navigateToTable: (workspaceId: string, baseId: string, tableId: string) => void;
  navigateToView: (workspaceId: string, baseId: string, tableId: string, viewId: string) => void;
  // Convenience helper to navigate and persist navigation state for a user
  navigateAndPersist: (workspaceId: string, baseId: string, tableId: string, userId?: string) => void;
  
  // User-specific persistence
  loadUserNavigation: (userId: string) => void;
  saveUserNavigation: (userId: string) => void;
  clearUserNavigation: (userId: string) => void;
  
  // Activity data management
  updateActivityData: (userId: string, isLogin?: boolean) => Promise<void>;
  loadFromActivityData: (userId: string) => Promise<boolean>;
  clearActivityData: (userId: string) => Promise<void>;
  // lastActivityUpdate removed
  
  // Navigation helpers (from bridge)
  navigateToLastLocation: (userId: string, workspaceId: string, workspaceData: any, navigate: (path: string) => void) => boolean;
  navigateToFirstTableView: (workspaceData: any, baseId: string, navigate: (path: string) => void) => boolean;
  navigateToFirstBase: (workspaceId: string, workspaceData: any, navigate: (path: string) => void) => boolean;
  
  // UI state actions
  toggleBaseExpansion: (baseId: string) => void;
  toggleTableExpansion: (tableId: string) => void;
  
  // Utility actions
  reset: () => void;
  getNavigationPath: () => string;
}

export const useNavigationStore = create<NavigationState>()((set, get) => ({
  // Initial state
  selectedWorkspaceId: null,
  selectedBaseId: null,
  selectedTableId: null,
  selectedViewId: null,
  expandedBases: [],
  expandedTables: [],

  // Basic setters
  setWorkspace: (id) => set({ selectedWorkspaceId: id }),
  setBase: (id) => set({ selectedBaseId: id }),
  setTable: (id) => set({ selectedTableId: id }),
  setView: (id) => set({ selectedViewId: id }),

      // Navigation with hierarchy management
      navigateToWorkspace: (workspaceId) => {
        set({
          selectedWorkspaceId: workspaceId,
          selectedBaseId: null,
          selectedTableId: null,
          selectedViewId: null,
          expandedBases: [],
          expandedTables: [],
        });
      },

      navigateToBase: (workspaceId, baseId) => {
        set({
          selectedWorkspaceId: workspaceId,
          selectedBaseId: baseId,
          selectedTableId: null,
          selectedViewId: null,
          expandedTables: [],
          // Add base to expanded bases if not already expanded
          expandedBases: get().expandedBases.includes(baseId) 
            ? get().expandedBases 
            : [...get().expandedBases, baseId]
        });
      },

      navigateToTable: (workspaceId, baseId, tableId) => {
        set({
          selectedWorkspaceId: workspaceId,
          selectedBaseId: baseId,
          selectedTableId: tableId,
          selectedViewId: null,
          // Ensure base and table are expanded
          expandedBases: get().expandedBases.includes(baseId) 
            ? get().expandedBases 
            : [...get().expandedBases, baseId],
          expandedTables: get().expandedTables.includes(tableId) 
            ? get().expandedTables 
            : [...get().expandedTables, tableId]
        });
      },

          // Convenience helper: navigate and cache in sessionStorage only
          // Note: Activity data is now saved to backend only on logout (handled in AuthContext)
          navigateAndPersist: (workspaceId: string, baseId: string, tableId: string, userId?: string) => {
            // Update navigation in-memory
            get().navigateToTable(workspaceId, baseId, tableId);
            // Save to sessionStorage (temporary cache) for session recovery only
            // Backend sync happens on logout via AuthContext
            if (userId) {
              try {
                get().saveUserNavigation(userId);
              } catch (err) {
                console.warn('Failed to cache navigation in sessionStorage', err);
              }
            }
          },

      navigateToView: (workspaceId, baseId, tableId, viewId) => {
        set({
          selectedWorkspaceId: workspaceId,
          selectedBaseId: baseId,
          selectedTableId: tableId,
          selectedViewId: viewId,
          // Ensure base and table are expanded
          expandedBases: get().expandedBases.includes(baseId) 
            ? get().expandedBases 
            : [...get().expandedBases, baseId],
          expandedTables: get().expandedTables.includes(tableId) 
            ? get().expandedTables 
            : [...get().expandedTables, tableId]
        });
      },

      // UI state management
      toggleBaseExpansion: (baseId) => set((state) => ({
        expandedBases: state.expandedBases.includes(baseId)
          ? state.expandedBases.filter(id => id !== baseId)
          : [...state.expandedBases, baseId]
      })),

      toggleTableExpansion: (tableId) => set((state) => ({
        expandedTables: state.expandedTables.includes(tableId)
          ? state.expandedTables.filter(id => id !== tableId)
          : [...state.expandedTables, tableId]
      })),

      // Utility functions
      reset: () => set({
        selectedWorkspaceId: null,
        selectedBaseId: null,
        selectedTableId: null,
        selectedViewId: null,
        expandedBases: [],
        expandedTables: [],
      }),

      // User-specific persistence methods
      loadUserNavigation: (userId: string) => {
        const lastNav = getLastNavigation(userId);
        if (lastNav.workspaceId || lastNav.baseId || lastNav.tableId || lastNav.viewId) {
          set({
            selectedWorkspaceId: lastNav.workspaceId,
            selectedBaseId: lastNav.baseId,
            selectedTableId: lastNav.tableId,
            selectedViewId: lastNav.viewId,
          });
        }
      },

      saveUserNavigation: (userId: string) => {
        const state = get();
        // Don't save if workspaceId is null - this prevents overwriting valid saved state
        // Only save when we have at least a workspaceId (user has made a selection)
        if (!state.selectedWorkspaceId) {
          return; // Don't save null workspaceId - preserve existing saved state
        }
        const navState: LastNavigationState = {
          workspaceId: state.selectedWorkspaceId,
          baseId: state.selectedBaseId,
          tableId: state.selectedTableId,
          viewId: state.selectedViewId,
        };
        saveLastNavigation(navState, userId);
      },

      clearUserNavigation: (userId: string) => {
        saveLastNavigation({
          workspaceId: null,
          baseId: null,
          tableId: null,
          viewId: null,
        }, userId);
        set({
          selectedWorkspaceId: null,
          selectedBaseId: null,
          selectedTableId: null,
          selectedViewId: null,
          expandedBases: [],
          expandedTables: [],
        });
      },

      // Navigation helper functions (consolidated from bridge)
      navigateToLastLocation: (userId: string, workspaceId: string, workspaceData: any, navigate: (path: string) => void): boolean => {
        if (!userId || !workspaceData) return false;
        
        // Get last navigation from persistence
        const lastNav = getLastNavigation(userId);
        
        if (lastNav.workspaceId === workspaceId && lastNav.baseId && lastNav.tableId && lastNav.viewId) {
          // Update Zustand store
          get().navigateToView(workspaceId, lastNav.baseId, lastNav.tableId, lastNav.viewId);
          // Navigate to URL
          navigate(`/base/${lastNav.baseId}/table/${lastNav.tableId}/${lastNav.viewId}`);
          return true;
        } else if (lastNav.workspaceId === workspaceId && lastNav.baseId) {
          // Navigate to last known base
          get().navigateToBase(workspaceId, lastNav.baseId);
          navigate(`/base/${lastNav.baseId}`);
          return true;
        }
        
        return false;
      },

      navigateToFirstTableView: (workspaceData: any, baseId: string, navigate: (path: string) => void): boolean => {
        if (!workspaceData?.data?.workspaces) return false;

        const workspaces = workspaceData.data.workspaces;
        let targetWorkspaceId = null;
        let targetTable: any = null;
        let targetView: any = null;

        // Find the workspace and base
        for (const workspace of workspaces) {
          if (workspace.bases) {
            const base = workspace.bases.find((b: any) => b.id === baseId);
            if (base) {
              targetWorkspaceId = workspace.id;
              if (base.tables && base.tables.length > 0) {
                targetTable = base.tables[0];
                if (targetTable.views && targetTable.views.length > 0) {
                  targetView = targetTable.views[0];
                }
              }
              break;
            }
          }
        }

        if (targetWorkspaceId && targetTable && (targetTable as any).id) {
          if (targetView && (targetView as any).id) {
            // Navigate to first view
            get().navigateToView(targetWorkspaceId, baseId, (targetTable as any).id, (targetView as any).id);
            navigate(`/base/${baseId}/table/${(targetTable as any).id}/${(targetView as any).id}`);
          } else {
            // Navigate to first table with grid view
            get().navigateToTable(targetWorkspaceId, baseId, (targetTable as any).id);
            navigate(`/base/${baseId}/table/${(targetTable as any).id}/grid`);
          }
          return true;
        } else if (targetWorkspaceId) {
          // Navigate to base only
          get().navigateToBase(targetWorkspaceId, baseId);
          navigate(`/base/${baseId}`);
          return true;
        }
        return false;
      },

      navigateToFirstBase: (workspaceId: string, workspaceData: any, navigate: (path: string) => void): boolean => {
        // Try to get workspace bases from the API hook data structure
        let bases = null;
        
        if (workspaceData && Array.isArray(workspaceData)) {
          // Handle workspace data as array format
          const workspace = workspaceData.find(ws => ws.id === workspaceId);
          bases = workspace?.bases;
        } else if (workspaceData?.data) {
          // Handle other data structure formats
          if (Array.isArray(workspaceData.data.workspaces)) {
            const workspace = workspaceData.data.workspaces.find((ws: any) => ws.id === workspaceId);
            bases = workspace?.bases;
          } else if (workspaceData.data) {
            bases = workspaceData.data;
          }
        }

        if (bases && Array.isArray(bases) && (bases as any[]).length > 0) {
          const firstBase = bases[0] as any;
          if (firstBase && firstBase.id) {
            
            // Navigate to the first base and try to find first table/view
            if (firstBase.tables && Array.isArray(firstBase.tables) && firstBase.tables.length > 0) {
              const firstTable = firstBase.tables[0] as any;
              if (firstTable && firstTable.id) {
                if (firstTable.views && Array.isArray(firstTable.views) && firstTable.views.length > 0) {
                  const firstView = firstTable.views[0] as any;
                  if (firstView && firstView.id) {
                    get().navigateToView(workspaceId, firstBase.id, firstTable.id, firstView.id);
                    navigate(`/base/${firstBase.id}/table/${firstTable.id}/${firstView.id}`);
                  }
                } else {
                  get().navigateToTable(workspaceId, firstBase.id, firstTable.id);
                  navigate(`/base/${firstBase.id}/table/${firstTable.id}/grid`);
                }
              }
            } else {
              get().navigateToBase(workspaceId, firstBase.id);
              navigate(`/base/${firstBase.id}`);
            }
            return true;
          }
        }
        return false;
      },

      getNavigationPath: () => {
        const state = get();
        if (state.selectedViewId && state.selectedTableId && state.selectedBaseId) {
          return `/base/${state.selectedBaseId}/table/${state.selectedTableId}/${state.selectedViewId}`;
        } else if (state.selectedTableId && state.selectedBaseId) {
          return `/base/${state.selectedBaseId}/table/${state.selectedTableId}`;
        } else if (state.selectedBaseId) {
          return `/base/${state.selectedBaseId}`;
        } else if (state.selectedWorkspaceId) {
          return `/workspace/${state.selectedWorkspaceId}`;
        }
        return '/';
      },

      // Activity data management
      // IMPORTANT: This is called on both login (to create/update login sessions) and logout (to save navigation state)
      // During normal navigation, we use sessionStorage cache only
      // On login (isLogin=true): Creates/updates login session with current timestamp
      // On logout (isLogin=false/undefined): Only saves navigation state, does NOT update login_at (preserves original login time)
      updateActivityData: async (userId: string, isLogin: boolean = false) => {
        const state = get();
        
        // Get current activity_data to preserve login_sessions
        let currentActivity: UserActivityData | null = null;
        try {
          currentActivity = await getUserActivity(userId);
        } catch (err) {
          // Ignore if can't fetch - will create new
        }

        // Get existing sessions
        const existingSessions = currentActivity?.login_sessions || [];
        let allSessions: LoginSession[] = existingSessions;

        // Only create/update login session on login (not on logout)
        if (isLogin) {
        // Create new login session
        const newSession = createLoginSession();

          // Check if a session from the same device already exists
          const existingSessionIndex = existingSessions.findIndex(session => 
            session.browser === newSession.browser &&
            session.browser_version === newSession.browser_version &&
            session.os === newSession.os &&
            session.device_type === newSession.device_type
          );
          
          if (existingSessionIndex !== -1) {
            // Update existing session's login_at timestamp and move it to the top
            // This happens when user logs in again from the same device
            const updatedSessions = [...existingSessions];
            updatedSessions[existingSessionIndex] = {
              ...updatedSessions[existingSessionIndex],
              login_at: newSession.login_at, // Update login time for new login
              // Update other fields that might have changed (timezone, etc.)
              timezone: newSession.timezone,
              language: newSession.language,
              device_memory: newSession.device_memory
            };
            // Move updated session to the beginning
            const [updatedSession] = updatedSessions.splice(existingSessionIndex, 1);
            allSessions = [updatedSession, ...updatedSessions].slice(0, 15);
          } else {
            // Add new session (limit to last 15)
            allSessions = [newSession, ...existingSessions].slice(0, 15);
          }
        }
        // On logout (isLogin=false), we keep existing sessions as-is (don't update login_at)

        try {
          const activityData: UserActivityData = {
            last_workspace_id: state.selectedWorkspaceId || currentActivity?.last_workspace_id,
            last_base_id: state.selectedBaseId || currentActivity?.last_base_id,
            last_table_id: state.selectedTableId || currentActivity?.last_table_id,
            last_view_id: state.selectedViewId || currentActivity?.last_view_id,
            login_sessions: allSessions,
            last_updated_at: new Date().toISOString()
          };

          await updateUserActivity(userId, activityData);
        } catch (error) {
          console.error('❌ Failed to update activity data:', error);
          throw error; // Re-throw so caller can handle it
        }
      },

      loadFromActivityData: async (userId: string): Promise<boolean> => {
        try {
          const activityData = await getUserActivity(userId);
          
          if (activityData) {
            set({
              selectedWorkspaceId: activityData.last_workspace_id || null,
              selectedBaseId: activityData.last_base_id || null,
              selectedTableId: activityData.last_table_id || null,
              selectedViewId: activityData.last_view_id || null,
            });
            const s = get();
            const hasFullPath = !!(s.selectedWorkspaceId && s.selectedBaseId && s.selectedTableId && s.selectedViewId);
            return hasFullPath;
          } else {
            return false;
          }
        } catch (error) {
          console.error('❌ Failed to load activity data:', error);
          return false;
        }
      },

      clearActivityData: async (userId: string) => {
        try {
          await clearUserActivity(userId);
        } catch (error) {
          console.error('❌ Failed to clear activity data:', error);
        }
      }
    }));