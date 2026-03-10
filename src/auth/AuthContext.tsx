import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigationStore } from '../stores/navigationStore';
import { isAuthenticated, logout as clientLogout } from '../service/clientService';
import { clearAllLastNavigation, cleanupOldTokenKeys } from '../utils/navigationPersistence';

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
  restoreCompleted: boolean;
  userRole: string | null;
}

interface ActivityData {
  last_workspace_id?: string | null;
  last_base_id?: string | null;
  last_table_id?: string | null;
  last_view_id?: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function DefaultAuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoreCompleted, setRestoreCompleted] = useState(false);
  const queryClient = useQueryClient();
  const lastUserIdRef = useRef<string | null>(null);
  const tabIdRef = useRef<string>('');
  const crossTabTtlMs = (() => {
    const envTtl = Number(import.meta.env.VITE_CROSS_TAB_TTL_MS);
    return Number.isFinite(envTtl) && envTtl > 0 ? envTtl : 15 * 60 * 1000;
  })();
  const AUTH_LOCK_KEY = 'sb_auth_lock';
  const TAB_ID_KEY = 'sb_tab_id';
  const TAB_LOCKED_KEY = 'sb_tab_locked';

  // Get user role from sessionStorage or user object
  const userRole = React.useMemo(() => {
    const role = sessionStorage.getItem('user_role');
    if (role) return role;
    if (user?.roles) {
      return typeof user.roles === 'string' ? user.roles : null;
    }
    return null;
  }, [user]);

  // Debug helper – enable by setting window.__NAV_DEBUG__ = true in console
  const debug = (...args: any[]) => {
    try {
      const w: any = globalThis as any;
      const q = typeof globalThis === 'undefined' ? null : new URLSearchParams(globalThis.location.search);
      const enabled = !!(
        (w?.__NAV_DEBUG__) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('NAV_DEBUG') === '1') ||
        (q?.get('navdebug') === '1')
      );
      if (enabled) console.log('[NAV][Auth]', ...args);
    } catch { }
  };

  // Get navigation store methods
  const { loadUserNavigation, clearUserNavigation, updateActivityData, loadFromActivityData } = useNavigationStore();

  const getTabId = () => {
    try {
      const existing = sessionStorage.getItem(TAB_ID_KEY);
      if (existing) return existing;
      const generated = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem(TAB_ID_KEY, generated);
      return generated;
    } catch {
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
  };

  if (!tabIdRef.current) {
    tabIdRef.current = getTabId();
  }

  const parseAuthLock = (raw: string | null) => {
    if (!raw) return { valid: false, userId: '', tabId: '' };
    try {
      const parsed = JSON.parse(raw);
      const ts = Number(parsed?.ts);
      const userId = String(parsed?.user_id || '');
      const tabId = String(parsed?.tab_id || '');
      if (!Number.isFinite(ts)) return { valid: false, userId: '', tabId: '' };
      const isFresh = Date.now() - ts <= crossTabTtlMs;
      return { valid: isFresh, userId, tabId };
    } catch {
      return { valid: false, userId: '', tabId: '' };
    }
  };

  const writeAuthLock = (userId: string) => {
    try {
      localStorage.setItem(
        AUTH_LOCK_KEY,
        JSON.stringify({ user_id: userId, tab_id: tabIdRef.current, ts: Date.now() })
      );
    } catch { }
  };

  const clearAuthLockIfOwner = () => {
    try {
      const current = parseAuthLock(localStorage.getItem(AUTH_LOCK_KEY));
      if (current.valid && current.tabId === tabIdRef.current) {
        localStorage.removeItem(AUTH_LOCK_KEY);
      }
    } catch { }
  };

  const markTabLocked = () => {
    try { sessionStorage.setItem(TAB_LOCKED_KEY, '1'); } catch { }
  };

  const clearTabLocked = () => {
    try { sessionStorage.removeItem(TAB_LOCKED_KEY); } catch { }
  };

  const isTabLocked = () => {
    try {
      return sessionStorage.getItem(TAB_LOCKED_KEY) === '1';
    } catch {
      return false;
    }
  };

  // Cross-tab signout handler: listen for 'sb_signout' events
  React.useEffect(() => {
    const onStorage = async (e: StorageEvent) => {
      if (e.key === 'sb_signout') {
        // Remote tab logged out: perform local cleanup
        try {
          await clientLogout();
        } catch (err) {
          console.warn('clientLogout error during cross-tab signout', err);
        }

        // Clear React Query cache on cross-tab logout
        try {
          queryClient.clear(); // Use clear() to prevent refetch attempts
        } catch (err) {
          debug('Failed to clear React Query cache on cross-tab logout', err);
        }

        // Remove known keys (only what we actually store)
        const keys = ['user_id', 'user_display_name', 'user_avatar', 'user_role'];
        keys.forEach(k => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
        localStorage.removeItem(AUTH_LOCK_KEY);
        // Clear navigation for current user if any
        const remoteUserId = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
        if (remoteUserId) clearUserNavigation(remoteUserId);
        lastUserIdRef.current = null;
        setUser(null);
      }
    };

    globalThis.addEventListener('storage', onStorage);
    return () => globalThis.removeEventListener('storage', onStorage);
  }, [clearUserNavigation, queryClient]);

  // Listen for token expiration events
  React.useEffect(() => {
    const onTokenExpired = () => {
      // Clear React Query cache on token expiration
      try {
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

    globalThis.addEventListener('auth_token_expired', onTokenExpired);
    return () => globalThis.removeEventListener('auth_token_expired', onTokenExpired);
  }, [clearUserNavigation, queryClient]);

  useEffect(() => {
    const resetUserState = () => {
      if (lastUserIdRef.current) {
        debug('Auth lost on init - clearing all React Query cache');
        queryClient.clear(); // Use clear() to prevent refetch attempts
      }
      lastUserIdRef.current = null;
      setUser(null);
    };
    const updateUserStateFromStorage = (userId: string, displayName: string | null, avatar: string | null) => {
      if (lastUserIdRef.current && lastUserIdRef.current !== userId) {
        debug('User changed on init - resetting all React Query cache and clearing navigation store');
        queryClient.resetQueries();
        const { reset } = useNavigationStore.getState();
        reset();
      }
      lastUserIdRef.current = userId;
      setUser({
        id: userId,
        display_name: displayName || undefined,
        avatar: avatar || undefined,
      });
      writeAuthLock(userId);
    };
    const initializeAuth = async () => {
      if (isTabLocked()) {
        resetUserState();
        setLoading(false);
        return;
      }
      const isAuth = await isAuthenticated();
      if (isAuth) {
        // Only read minimal data needed for initialization
        const user_id = sessionStorage.getItem('user_id') || localStorage.getItem('user_id');
        const user_display_name = sessionStorage.getItem('user_display_name');
        const user_avatar = sessionStorage.getItem('user_avatar');

        if (user_id) {
          const currentLock = parseAuthLock(localStorage.getItem(AUTH_LOCK_KEY));
          if (currentLock.valid && currentLock.userId === user_id && currentLock.tabId !== tabIdRef.current) {
            markTabLocked();
            resetUserState();
            setLoading(false);
            return;
          }
          updateUserStateFromStorage(user_id, user_display_name, user_avatar);
        } else {
          resetUserState();
        }
      } else {
        resetUserState();
      }
      setLoading(false);
    };
    initializeAuth();
  }, [queryClient]);

  // Cross-tab heartbeat: keep auth lock fresh while authenticated
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    const heartbeatMs = Math.max(10_000, Math.floor(crossTabTtlMs / 2));
    const writeHeartbeat = () => {
      writeAuthLock(userId);
    };
    writeHeartbeat();
    const timer = setInterval(writeHeartbeat, heartbeatMs);
    return () => clearInterval(timer);
  }, [user?.id, crossTabTtlMs]);

  // Enforce single-tab lock for the same user
  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== AUTH_LOCK_KEY) return;
      const current = parseAuthLock(e.newValue);
      if (!current.valid) return;
      if (current.userId !== userId) return;
      if (current.tabId === tabIdRef.current) return;

      // Another tab took over this user's session
      markTabLocked();
      try {
        queryClient.clear();
      } catch (err) {
        debug('Failed to clear React Query cache on tab lock', err);
      }
      lastUserIdRef.current = null;
      setUser(null);
    };

    globalThis.addEventListener('storage', onStorage);
    return () => globalThis.removeEventListener('storage', onStorage);
  }, [user?.id, queryClient]);


  const login = async (userInfo: any) => {
    // Handle user change and reset state if necessary
    handleUserChange(userInfo);

    // Update last user reference
    if (userInfo?.id) {
      lastUserIdRef.current = userInfo.id;
    }

    setRestoreCompleted(false);

    try {
      clearTabLocked();
      // Store user data in sessionStorage
      storeUserData(userInfo);

      writeAuthLock(userInfo.id);

      // Set minimal user state
      setUser({
        id: userInfo.id,
        email: userInfo.email || undefined,
        display_name: userInfo.display_name || undefined,
        avatar: userInfo.avatar || undefined,
      });

      // Create/update login session
      await createLoginSession(userInfo);

      // Load navigation state
      await loadNavigationState(userInfo);

      // Mark navigation data as loaded
      setRestoreCompleted(true);
    } catch (error) {
      console.error('Login error:', error);
      setRestoreCompleted(true);
    }
  };

  // Helper function to handle user change
  const handleUserChange = (userInfo: any) => {
    if (user?.id && userInfo?.id && user.id !== userInfo.id) {
      debug('User changed - resetting all React Query cache and clearing navigation store');
      queryClient.resetQueries();
      const { reset } = useNavigationStore.getState();
      reset();
    }
  };

  // Helper function to store user data
  const storeUserData = (userInfo: any) => {
    if (userInfo?.id) {
      sessionStorage.setItem('user_id', userInfo.id);
      if (userInfo.display_name) sessionStorage.setItem('user_display_name', userInfo.display_name);
      if (userInfo.avatar) sessionStorage.setItem('user_avatar', userInfo.avatar);
    }
  };

  // Helper function to create/update login session
  const createLoginSession = async (userInfo: any) => {
    if (userInfo?.id) {
      try {
        await updateActivityData(userInfo.id, true); // true = isLogin
      } catch (err) {
        debug('login: ⚠️ Failed to create login session (non-blocking)', err);
      }
    }
  };

  // Helper function to load navigation state
  const loadNavigationState = async (userInfo: any) => {
    if (userInfo?.id) {
      try {
        const activityDataFromResponse = userInfo.activity_data || userInfo.data?.activity_data || userInfo.data?.user?.activity_data;

        if (activityDataFromResponse) {
          setNavigationState(activityDataFromResponse);
        } else {
          await fallbackLoadNavigation(userInfo.id);
        }
      } catch (error) {
        await fallbackLoadNavigation(userInfo.id);
        debug('login: unexpected error, fallback to session cache', error);
      }
    }
  };

  // Helper function to set navigation state from activity data

  const setNavigationState = (activityData: ActivityData) => {
    const navigationStore = useNavigationStore.getState();
    const { last_workspace_id, last_base_id, last_table_id, last_view_id } = activityData;

    navigationStore.setWorkspace(last_workspace_id || null);
    navigationStore.setBase(last_base_id || null);
    navigationStore.setTable(last_table_id || null);
    navigationStore.setView(last_view_id || null);

    // Verify it was set
    const verifyState = useNavigationStore.getState();
    const match =
      verifyState.selectedWorkspaceId === last_workspace_id &&
      verifyState.selectedBaseId === last_base_id &&
      verifyState.selectedTableId === last_table_id &&
      verifyState.selectedViewId === last_view_id;

    debug('login: Navigation state restored from activity_data', {
      workspace: last_workspace_id,
      base: last_base_id,
      table: last_table_id,
      view: last_view_id,
      verified: match
    });
  };

  // Fallback function to load navigation from API or session storage
  const fallbackLoadNavigation = async (userId: string): Promise<void> => {
    try {
      const hasFullPath: boolean = await loadFromActivityData(userId);
      if (!hasFullPath) {
        loadUserNavigation(userId);
      }
    } catch (apiError: unknown) {
      loadUserNavigation(userId);
      debug('login: activity API error, fallback to session cache', apiError);
    }
  };


  const logout = async () => {
    // Flag logout to suppress login guard redirects/toasts during navigation
    try { sessionStorage.setItem('sb_logout_in_progress', '1'); } catch { }

    // STEP 1: Save current navigation state to activity data before logout
    try {
      const uid = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || undefined;
      if (uid) {
        await updateActivityData(uid);
      }
    } catch (err) {
      debug('Failed to save activity data on logout', err);
    }

    // STEP 2: Cancel all pending queries and clear React Query cache (before API call to prevent refetch attempts)
    try {
      // Cancel all pending queries first to prevent them from completing
      queryClient.cancelQueries();
      // Then clear the cache
      queryClient.clear(); // Use clear() instead of invalidateQueries() to prevent refetch attempts
    } catch (err) {
      debug('Failed to clear React Query cache on logout', err);
    }

    // STEP 3: Clear user ref and state IMMEDIATELY to disable all queries
    // This must happen before navigation to prevent queries from running
    lastUserIdRef.current = null;
    setUser(null);

    // STEP 4: Clean up old token keys and navigation entries
    try {
      cleanupOldTokenKeys();
      clearAllLastNavigation();
    } catch (err) {
      debug('Failed to clear navigation persistence on logout', err);
    }

    // STEP 5: Call logout API to expire token on backend (this will also clear local tokens)
    try {
      await clientLogout(); // This now calls the logout API before clearing tokens
    } catch (err) {
      debug('Failed to logout via API', err);
      // Continue with cleanup even if API call fails
    }

    // STEP 6: Remove user & tenant data from storage
    const keysToRemove = ['user_id', 'user_display_name', 'user_avatar', 'user_role'];
    keysToRemove.forEach(k => {
      try { sessionStorage.removeItem(k); } catch { }
      try { localStorage.removeItem(k); } catch { }
    });
    clearAuthLockIfOwner();

    // STEP 7: Clear user navigation persistence for this user (if any)
    try {
      const uid = sessionStorage.getItem('user_id') || localStorage.getItem('user_id') || undefined;
      if (uid) clearUserNavigation(uid);
    } catch (err) {
      debug('Failed to clear user navigation on logout', err);
    }

    // STEP 8: Broadcast sign-out to other tabs (write-then-remove to trigger storage event)
    try {
      localStorage.setItem('sb_signout', Date.now().toString());
      localStorage.removeItem('sb_signout');
    } catch (err) {
      debug('Failed to broadcast sign-out to other tabs', err);
    }

    try { sessionStorage.removeItem('sb_logout_in_progress'); } catch { }
  };

  // Use useMemo to memoize the value object
  const value = useMemo(() => ({
    user,
    login,
    logout,
    loading,
    restoreCompleted,
    userRole,
  }), [user, loading, restoreCompleted, userRole]);


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
} 
