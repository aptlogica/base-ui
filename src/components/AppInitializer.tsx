import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigationStore } from '../stores/navigationStore';
import { hasLastNavigation, getLastNavigation } from '../utils/navigationPersistence';

/**
 * AppInitializer - Orchestrates app initialization
 * 
 * Responsibilities:
 * 1. Wait for authentication
 * 2. Load user preferences (activity data) ONCE
 * 3. Restore navigation state ONCE (only if no existing state)
 * 4. NEVER override user's current selection
 * 
 * This follows enterprise patterns where initialization is separated from authentication.
 */
export const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const initializedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only initialize once per user session
    if (authLoading || !user?.id) return;
    
    const userId = user.id; // Type guard: user.id is guaranteed to be string here
    
    // Reset if user changed
    if (lastUserIdRef.current !== userId) {
      initializedRef.current = false;
      lastUserIdRef.current = userId;
    }

    // Only run ONCE per user session (not on every render/refresh)
    // CRITICAL: Once initialized, NEVER run again - this prevents overriding user selections
    if (initializedRef.current) {
      return; // Already initialized - don't touch navigation state
    }

    const initialize = async () => {
      const currentState = useNavigationStore.getState();
      
      // Priority 1: If user is actively navigating, PRESERVE it
      // This prevents navigation state from being overwritten on refresh
      const hasActiveNavigation = !!(
        currentState.selectedWorkspaceId || 
        currentState.selectedBaseId || 
        currentState.selectedTableId ||
        currentState.selectedViewId
      );

      if (hasActiveNavigation) {
        initializedRef.current = true;
        return; // Don't override user's current selection
      }

      // Priority 2: Check sessionStorage (fast, same-session recovery)
      // BUT: Only if store is truly empty (no navigation state at all)
      // This prevents restoring old sessionStorage over user's current selection
      if (hasLastNavigation(userId)) {
        const storedNav = getLastNavigation(userId);
        // Only restore if store is completely empty AND stored navigation exists
        // Don't restore if store already has navigation (user might have changed it)
        if (!currentState.selectedWorkspaceId && storedNav.workspaceId) {
          useNavigationStore.getState().loadUserNavigation(userId);
        }
        initializedRef.current = true;
        return;
      }

      // Priority 3: Load activity data (cross-device sync) - ONLY if no session cache
      try {
        const hasFullPath = await useNavigationStore.getState().loadFromActivityData(userId);
        if (!hasFullPath) {
          // Fallback to sessionStorage if activity data incomplete
          useNavigationStore.getState().loadUserNavigation(userId);
        }
      } catch {
        // Failed to load activity data, using sessionStorage fallback
        useNavigationStore.getState().loadUserNavigation(userId);
      }

      initializedRef.current = true;
      // Mark as initialized in sessionStorage to prevent auto-selection in useWorkspaceBusinessLogic
      try {
        sessionStorage.setItem('nav_initialized', 'true');
      } catch (storageError) {
        // Ignore storage errors (e.g., private browsing mode, quota exceeded)
        // This is non-critical - navigation will still work without this flag
        if (storageError instanceof DOMException && storageError.name !== 'QuotaExceededError') {
          // Log unexpected DOM exceptions (but not quota errors which are expected)
        }
      }
    };

    initialize();
    // CRITICAL: Only depend on user.id and authLoading - don't re-run when navigation changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  return <>{children}</>;
};
