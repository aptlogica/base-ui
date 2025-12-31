import React from 'react';
import { useUserRole } from './useUserRole';
import { useWorkspaces } from './useApi';
import { useNavigationStore } from '../stores/navigationStore';

/**
 * Hook to determine user's access level for a specific workspace
 * Uses actual access_level values directly instead of abstraction layer
 * 
 * Workspace access_level values from API:
 * - "owner" - Full access to everything
 * - "co-owner" - Full access to everything (except cannot delete owner)
 * - "maintainer" - Everything below workspace level (bases, tables, views, records, columns)
 * - "base" - Can only access specific bases (check base-level access_level)
 * - "workspace-read" - Read-only (hold for now, everything restricted)
 * - "base-member" - Base-level member (when workspace access is "base")
 * - "base-read" - Base-level read-only (hold for now, everything restricted)
 * - "user" - No access
 */
export function useWorkspaceAccess(workspaceId?: string) {
  const { hasAdminRole, isMaintainer } = useUserRole();
  const { data: workspaces = [] } = useWorkspaces();
  const { selectedWorkspaceId } = useNavigationStore();
  
  // Use provided workspaceId or fall back to selected workspace
  const effectiveWorkspaceId = workspaceId || selectedWorkspaceId;
  
  // Find the current workspace
  const currentWorkspace = React.useMemo(() => {
    if (!effectiveWorkspaceId || !workspaces || workspaces.length === 0) {
      return null;
    }
    return workspaces.find((ws: any) => ws.id === effectiveWorkspaceId) || null;
  }, [effectiveWorkspaceId, workspaces]);
  
  // Get workspace access_level directly
  const wsAccess = React.useMemo(() => {
    if (currentWorkspace?.access_level) {
      return currentWorkspace.access_level.toLowerCase();
    }
    // Fallback to global role if no workspace-specific access_level
    if (hasAdminRole()) {
      return 'owner'; // Default to owner if admin role
    }
    if (isMaintainer()) {
      return 'maintainer';
    }
    return null;
  }, [currentWorkspace, hasAdminRole, isMaintainer]);
  
  // Check if user has full workspace access (owner, co-owner, or maintainer)
  const hasFullWorkspaceAccess = React.useMemo(() => {
    return wsAccess === 'owner' || wsAccess === 'co-owner' || wsAccess === 'maintainer';
  }, [wsAccess]);
  
  // Permission helper functions based on actual access_level
  
  // Workspace-level operations (only owner/co-owner)
  const canCreateWorkspace = React.useCallback(() => {
    return wsAccess === 'owner' || wsAccess === 'co-owner';
  }, [wsAccess]);
  
  const canDeleteWorkspace = React.useCallback(() => {
    return wsAccess === 'owner' || wsAccess === 'co-owner';
  }, [wsAccess]);
  
  // Base-level operations (owner, co-owner, maintainer)
  const canCreateBase = React.useCallback(() => {
    return wsAccess === 'owner' || wsAccess === 'co-owner' || wsAccess === 'maintainer';
  }, [wsAccess]);
  
  const canUpdateBase = React.useCallback(() => {
    return wsAccess === 'owner' || wsAccess === 'co-owner' || wsAccess === 'maintainer';
  }, [wsAccess]);
  
  const canDeleteBase = React.useCallback(() => {
    return wsAccess === 'owner' || wsAccess === 'co-owner' || wsAccess === 'maintainer';
  }, [wsAccess]);
  
  // Note: Table/View/Record/Column operations are handled in useBaseAccess.ts
  // This hook only handles workspace-level operations
  
  // User management (owner, co-owner, maintainer)
  const canAssignUsers = React.useCallback(() => {
    return wsAccess === 'owner' || wsAccess === 'co-owner' || wsAccess === 'maintainer';
  }, [wsAccess]);
  
  // Settings access
  const canAccessSettings = React.useCallback(() => {
    // Owner, co-owner, maintainer, and workspace-read can access settings
    return hasFullWorkspaceAccess || wsAccess === 'workspace-read';
  }, [hasFullWorkspaceAccess, wsAccess]);
  
  const canAccessAllSettingsTabs = React.useCallback(() => {
    // Only owner and co-owner can access all settings tabs
    return wsAccess === 'owner' || wsAccess === 'co-owner';
  }, [wsAccess]);
  
  // Check if user has workspace-read access (read-only at workspace level)
  const isWorkspaceReadOnly = React.useCallback(() => {
    return wsAccess === 'workspace-read';
  }, [wsAccess]);
  
  // Check if workspace access is "base" (user can only access specific bases)
  const isBaseLevelAccess = React.useCallback(() => {
    return wsAccess === 'base';
  }, [wsAccess]);
  
  // Backward compatibility: Keep accessLevel for components that still use it
  // But map to actual values for clarity
  const accessLevel = React.useMemo(() => {
    if (wsAccess === 'owner' || wsAccess === 'co-owner') return 'admin';
    if (wsAccess === 'maintainer') return 'full_access';
    return 'limited_access';
  }, [wsAccess]);
  
  return {
    // Actual access_level value
    wsAccess,
    hasFullWorkspaceAccess,
    isBaseLevelAccess,
    // Backward compatibility
    accessLevel,
    isAdmin: wsAccess === 'owner' || wsAccess === 'co-owner',
    isFullAccess: wsAccess === 'maintainer',
    isLimitedAccess: !hasFullWorkspaceAccess,
    currentWorkspace,
    isWorkspaceReadOnly,
    // Permission helpers
    canCreateWorkspace,
    canDeleteWorkspace,
    canCreateBase,
    canUpdateBase,
    canDeleteBase,
    canAssignUsers,
    canAccessSettings,
    canAccessAllSettingsTabs,
  };
}

