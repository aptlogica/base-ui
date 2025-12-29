import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigationStore } from '../stores/navigationStore';
import { isAuthenticated, logout as clientLogout, getStoredAccessToken } from '../service/clientService';
import { clearAllLastNavigation, cleanupOldTokenKeys } from '../utils/navigationPersistence';
import { decodeJwt } from 'jose';

interface AuthUser {
  id?: string;
  email?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  activity?: any;
  roles?: string[];
  [key: string]: any;
}
interface AuthContextType {
  user: AuthUser | null;
  login: (userInfo: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  saving: boolean;
  restoreCompleted: boolean;
  userRole: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function DefaultAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoreCompleted, setRestoreCompleted] = useState(false);
  const queryClient = useQueryClient();
  const lastUserIdRef = useRef<string | null>(null);

  // Get user role from sessionStorage or user object
  const userRole = React.useMemo(() => {
    try {
      // Try to get from token data
      const tokenData = sessionStorage.getItem('user_token_data');
      if (tokenData) {
        const parsed = JSON.parse(tokenData);
        return parsed.roles || null;
      }
      // Fallback: check if role stored directly
      const role = sessionStorage.getItem('user_role');
      if (role) return role;
      // Fallback to user.roles if available
      if (user?.roles) {
        return typeof user.roles === 'string' ? user.roles : null;
      }
      return null;
    } catch {
      return null;
    }
  }, [user]);

  // Debug helper – enable by setting window.__NAV_DEBUG__ = true in console
  const debug = (...args: any[]) => {
    try {
      const w: any = window as any;
      const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const enabled = !!(
        (w && w.__NAV_DEBUG__) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('NAV_DEBUG') === '1') ||
        (q && q.get('navdebug') === '1')
      );
      if (enabled) console.log('[NAV][Auth]', ...args);
    } catch {}
  };

  // Get navigation store methods
  const { loadUserNavigation, saveUserNavigation, clearUserNavigation, updateActivityData, loadFromActivityData } = useNavigationStore();

  // Cross-tab signout handler: listen for 'sb_signout' events
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sb_signout') {
        // Remote tab logged out: perform local cleanup
        try {
          clientLogout();
        } catch (err) {
          console.warn('clientLogout error during cross-tab signout', err);
        }
        
        // Clear React Query cache on cross-tab logout
        try {
          debug('Cross-tab logout - clearing all React Query cache');
          queryClient.clear(); // Use clear() to prevent refetch attempts
        } catch (err) {
          debug('Failed to clear React Query cache on cross-tab logout', err);
        }
        
        // Remove known keys (only what we actually store)
        const keys = ['user_id','user_email','user_display_name','user_avatar','user_role','user_token_data'];
        keys.forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
        // Clear navigation for current user if any
        const remoteUserId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
        if (remoteUserId) clearUserNavigation(remoteUserId);
        lastUserIdRef.current = null;
        setUser(null);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [clearUserNavigation, queryClient]);

  // Listen for token expiration events
  React.useEffect(() => {
    const onTokenExpired = () => {
      // Clear React Query cache on token expiration
      try {
        debug('Token expired - clearing all React Query cache');
        queryClient.clear(); // Use clear() to prevent refetch attempts
      } catch (err) {
        debug('Failed to clear React Query cache on token expiration', err);
      }
      // Clear user state immediately
      setUser(null);
      lastUserIdRef.current = null;
      // Clear navigation for current user if any
      const userId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
      if (userId) clearUserNavigation(userId);
      // Force redirect will happen via clientService
    };

    window.addEventListener('auth_token_expired', onTokenExpired);
    return () => window.removeEventListener('auth_token_expired', onTokenExpired);
  }, [clearUserNavigation, queryClient]);

  useEffect(() => {
    const initializeAuth = async () => {
      const isAuth = await isAuthenticated();
      if (isAuth) {
        // Only read minimal data needed for initialization
        const user_id = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
        const user_email = sessionStorage.getItem('user_email');
        const user_display_name = sessionStorage.getItem('user_display_name');
        const user_avatar = sessionStorage.getItem('user_avatar');
        
        if (user_id) {
          // Clear cache if user changed (e.g., different user logged in this session)
          if (lastUserIdRef.current && lastUserIdRef.current !== user_id) {
            debug('User changed on init - resetting all React Query cache and clearing navigation store');
            queryClient.resetQueries();
            // Clear navigation store for old user
            const { reset } = useNavigationStore.getState();
            reset();
          }
          lastUserIdRef.current = user_id;
          
          // Set minimal user state - full profile will be fetched via useUserProfile hook
          setUser({
            id: user_id,
            email: user_email || undefined,
            display_name: user_display_name || undefined,
            avatar: user_avatar || undefined,
          });
          // Try to restore navigation from activity_data first (cross-device)
          try {
            const hasFullPath = await useNavigationStore.getState().loadFromActivityData(user_id);
            debug('initializeAuth: loadFromActivityData ->', hasFullPath);
            if (!hasFullPath) {
              useNavigationStore.getState().loadUserNavigation(user_id);
              debug('initializeAuth: fallback to session cache');
            }
          } catch {
            useNavigationStore.getState().loadUserNavigation(user_id);
            debug('initializeAuth: activity API error, fallback to session cache');
          }
        } else {
          // No user ID - clear cache to be safe
          if (lastUserIdRef.current) {
            debug('User removed on init - clearing all React Query cache');
            queryClient.clear(); // Use clear() to prevent refetch attempts
            lastUserIdRef.current = null;
          }
          setUser(null);
        }
      } else {
        // Not authenticated - clear cache
        if (lastUserIdRef.current) {
          debug('Auth lost on init - clearing all React Query cache');
          queryClient.clear(); // Use clear() to prevent refetch attempts
          lastUserIdRef.current = null;
        }
        setUser(null);
      }
      setLoading(false);
    };
    initializeAuth();
  }, [queryClient]);

  const login = async (userInfo: any) => {
    // Clear React Query cache ONLY if user is changing (not initial load or fresh login)
    // On fresh login, we want to keep any cached data until navigation recovery completes
    if (user?.id && userInfo?.id && user.id !== userInfo.id) {
      debug('User changed - resetting all React Query cache and clearing navigation store');
      // Reset all queries to force fresh fetches (removes cache and marks as needing fresh data)
      queryClient.resetQueries();
      // Also clear navigation store for old user
      const { reset } = useNavigationStore.getState();
      reset();
    }
    // Note: Don't clear cache on fresh login - let navigation recovery use any available data
    
    // Update last user ref
    if (userInfo?.id) {
      lastUserIdRef.current = userInfo.id;
    }
    
    setRestoreCompleted(false);
    
    try {
      if (userInfo && userInfo.id) {
        // Store only minimal data in sessionStorage (for instant UI render)
        sessionStorage.setItem('user_id', userInfo.id);
        if (userInfo.email) sessionStorage.setItem('user_email', userInfo.email);
        if (userInfo.display_name) sessionStorage.setItem('user_display_name', userInfo.display_name);
        if (userInfo.avatar) sessionStorage.setItem('user_avatar', userInfo.avatar);
      }
      
      // Set minimal user state - full profile will be fetched via useUserProfile hook
      setUser({
        id: userInfo.id,
        email: userInfo.email || undefined,
        display_name: userInfo.display_name || undefined,
        avatar: userInfo.avatar || undefined,
      });
      
      // Create/update login session on login (not on logout)
      // This ensures the login_at timestamp reflects when user actually logged in
      if (userInfo && userInfo.id) {
        try {
          await updateActivityData(userInfo.id, true); // true = isLogin
        } catch (err) {
          // Log but don't block login if session creation fails
          debug('login: ⚠️ Failed to create login session (non-blocking)', err);
        }
      }
      
      // On login: Load from activity_data in login response (most efficient)
      // Falls back to API call, then sessionStorage cache
      if (userInfo && userInfo.id) {
        try {
          // Check if activity_data is in login response (more efficient - no extra API call)
          // userInfo is the user object from data.data.user, so activity_data is directly on it
          const activityDataFromResponse = userInfo.activity_data || userInfo.data?.activity_data || userInfo.data?.user?.activity_data;
          
          debug('login: checking for activity_data', { 
            hasActivityData: !!activityDataFromResponse,
            userInfoKeys: Object.keys(userInfo || {}),
            activityDataFromResponse,
            userInfoActivityData: userInfo.activity_data,
            userInfoDataActivityData: userInfo.data?.activity_data,
            userInfoDataUserActivityData: userInfo.data?.user?.activity_data
          });
          
          if (activityDataFromResponse) {
            // Load directly from login response data
            const navigationStore = useNavigationStore.getState();
            const workspaceId = activityDataFromResponse.last_workspace_id || null;
            const baseId = activityDataFromResponse.last_base_id || null;
            const tableId = activityDataFromResponse.last_table_id || null;
            const viewId = activityDataFromResponse.last_view_id || null;
            
            debug('login: Setting navigation state from activity_data', {
              workspace: workspaceId,
              base: baseId,
              table: tableId,
              view: viewId
            });
            
            navigationStore.setWorkspace(workspaceId);
            navigationStore.setBase(baseId);
            navigationStore.setTable(tableId);
            navigationStore.setView(viewId);
            
            // Verify it was set
            const verifyState = useNavigationStore.getState();
            const match = 
              verifyState.selectedWorkspaceId === workspaceId &&
              verifyState.selectedBaseId === baseId &&
              verifyState.selectedTableId === tableId &&
              verifyState.selectedViewId === viewId;
            
            debug('login: ✅ Navigation state set and verified', {
              stored: {
                workspace: verifyState.selectedWorkspaceId,
                base: verifyState.selectedBaseId,
                table: verifyState.selectedTableId,
                view: verifyState.selectedViewId
              },
              expected: {
                workspace: workspaceId,
                base: baseId,
                table: tableId,
                view: viewId
              },
              match
            });
          } else {
            // Fallback: Try to load from activity_data API
            try {
              const hasFullPath = await loadFromActivityData(userInfo.id);
              debug('login: loadFromActivityData ->', hasFullPath);
              if (!hasFullPath) {
                loadUserNavigation(userInfo.id);
                debug('login: fallback to session cache');
              }
            } catch (apiError) {
              // Fallback to sessionStorage cache on error
              loadUserNavigation(userInfo.id);
              debug('login: activity API error, fallback to session cache');
            }
          }
        } catch (error) {
          // Final fallback to sessionStorage cache
          loadUserNavigation(userInfo.id);
          debug('login: unexpected error, fallback to session cache');
        }
      }
      
      // Mark navigation data as loaded
      // NavigationRecovery will handle actual navigation after workspaces load
      setRestoreCompleted(true);
      
    } catch (error) {
      console.error('Login error:', error);
      setRestoreCompleted(true);
    }
  };

  const logout = async () => {
    // STEP 1: Save current navigation state to activity data before logout
    try {
      const uid = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || undefined;
      if (uid) {
        await updateActivityData(uid);
      }
    } catch (err) {
      // Continue with logout even if save fails
    }

    // STEP 2: Clear React Query cache (before API call to prevent refetch attempts)
    try {
      queryClient.clear(); // Use clear() instead of invalidateQueries() to prevent refetch attempts
    } catch (err) {
      debug('Failed to clear React Query cache on logout', err);
    }

    // STEP 3: Clean up old token keys and navigation entries
    try {
      cleanupOldTokenKeys();
      clearAllLastNavigation();
    } catch (err) {
      // Ignore cleanup errors
    }

    // STEP 4: Call logout API to expire token on backend (this will also clear local tokens)
    try {
      await clientLogout(); // This now calls the logout API before clearing tokens
    } catch (err) {
      // Continue with cleanup even if API call fails
    }

    // STEP 5: Remove user & tenant data from storage
    try {
      const keysToRemove = ['user_id','user_email','user_display_name','user_avatar','tenant_schema','user_role','user_token_data'];
      keysToRemove.forEach(k => {
        try { sessionStorage.removeItem(k); } catch {}
        try { localStorage.removeItem(k); } catch {}
      });
    } catch (err) {
      // Ignore storage errors
    }

    // STEP 6: Clear user navigation persistence for this user (if any)
    try {
      const uid = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || undefined;
      if (uid) clearUserNavigation(uid);
    } catch (err) {
      // Ignore navigation cleanup errors
    }

    // STEP 7: Broadcast sign-out to other tabs (write-then-remove to trigger storage event)
    try {
      localStorage.setItem('sb_signout', Date.now().toString());
      localStorage.removeItem('sb_signout');
    } catch (err) {
      // ignore
    }

    // STEP 8: Clear user ref and state
    lastUserIdRef.current = null;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, saving, restoreCompleted, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
} 