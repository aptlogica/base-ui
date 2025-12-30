import React from 'react';
import { useUserRole } from './useUserRole';
import { useWorkspaces } from './useApi';
import { useNavigationStore } from '../stores/navigationStore';
import { ROLES } from '../types/roles';

export type AccessLevel = 'admin' | 'full_access' | 'limited_access';

/**
 * Hook to determine user's access level for a specific workspace
 * Combines global admin role with workspace-specific access_level
 */
export function useWorkspaceAccess(workspaceId?: string) {
  const { isAdmin, hasRole } = useUserRole();
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
  
  // Determine access level
  const accessLevel: AccessLevel = React.useMemo(() => {
    // Check global admin role first
    if (isAdmin()) {
      return 'admin';
    }
    
    // Check if user is maintainer - treat as limited_access (only workspace tab, no create workspace)
    if (hasRole(ROLES.WorkspaceMaintainer)) {
      return 'limited_access';
    }
    
    // If no workspace found, return limited_access as default (most restrictive)
    if (!currentWorkspace) {
      return 'limited_access';
    }
    
    // Return the workspace's access_level from server response
    return currentWorkspace.access_level === 'full_access' 
      ? 'full_access' 
      : 'limited_access';
  }, [isAdmin, hasRole, currentWorkspace]);
  
  // Check if user has any workspace with full_access (for Settings menu visibility)
  const hasAnyFullAccessWorkspace = React.useMemo(() => {
    if (isAdmin()) return true;
    if (!workspaces || workspaces.length === 0) return false;
    return workspaces.some((ws: any) => ws.access_level === 'full_access');
  }, [isAdmin, workspaces]);
  
  // Permission helper functions
  const canCreateWorkspace = React.useCallback(() => {
    return accessLevel === 'admin';
  }, [accessLevel]);
  
  const canCreateBase = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access';
  }, [accessLevel]);
  
  const canCreateTable = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access' || accessLevel === 'limited_access';
  }, [accessLevel]);
  
  const canCreateView = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access' || accessLevel === 'limited_access';
  }, [accessLevel]);
  
  const canDeleteWorkspace = React.useCallback(() => {
    return accessLevel === 'admin';
  }, [accessLevel]);
  
  const canDeleteBase = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access';
  }, [accessLevel]);
  
  const canUpdateBase = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access';
  }, [accessLevel]);
  
  const canDeleteTable = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access' || accessLevel === 'limited_access';
  }, [accessLevel]);
  
  const canDeleteView = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access' || accessLevel === 'limited_access';
  }, [accessLevel]);
  
  const canAssignUsers = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access';
  }, [accessLevel]);
  
  const canAccessSettings = React.useCallback(() => {
    return accessLevel === 'admin' || accessLevel === 'full_access';
  }, [accessLevel]);
  
  const canAccessAllSettingsTabs = React.useCallback(() => {
    return accessLevel === 'admin';
  }, [accessLevel]);
  
  return {
    accessLevel,
    isAdmin: accessLevel === 'admin',
    isFullAccess: accessLevel === 'full_access',
    isLimitedAccess: accessLevel === 'limited_access',
    currentWorkspace,
    hasAnyFullAccessWorkspace,
    // Permission helpers
    canCreateWorkspace,
    canCreateBase,
    canCreateTable,
    canCreateView,
    canDeleteWorkspace,
    canDeleteBase,
    canUpdateBase,
    canDeleteTable,
    canDeleteView,
    canAssignUsers,
    canAccessSettings,
    canAccessAllSettingsTabs,
  };
}

