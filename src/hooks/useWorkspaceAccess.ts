import React from 'react';
import { useUserRole } from './useUserRole';
import { useWorkspaces } from './useApi';
import { useNavigationStore } from '../stores/navigationStore';
import { ROLES } from '../types/roles';

export type AccessLevel = 'admin' | 'full_access' | 'limited_access';

/**
 * Hook to determine user's access level for a specific workspace
 * Maps workspace access_level field to permission levels
 * 
 * Workspace access_level values from API:
 * - "owner" -> admin (full control)
 * - "co-owner" -> admin (full control)
 * - "maintainer" -> full_access (can manage bases)
 * - "workspace-read" -> limited_access (read-only)
 * - "base-member" -> limited_access (can edit tables/views)
 * - "base-read" -> limited_access (read-only)
 * - "user" -> limited_access (no access)
 */
export function useWorkspaceAccess(workspaceId?: string) {
  const { isAdmin, hasAdminRole, hasFullAccessRole, isMaintainer } = useUserRole();
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
  
  /**
   * Map workspace access_level to internal AccessLevel
   * Workspace access_level takes precedence over global role
   */
  const mapWorkspaceAccessLevel = (workspaceAccessLevel: string): AccessLevel => {
    if (!workspaceAccessLevel) {
      return 'limited_access';
    }

    switch (workspaceAccessLevel.toLowerCase()) {
      case 'owner':
      case 'co-owner':
        return 'admin';
      
      case 'maintainer':
        return 'full_access';
      
      case 'workspace-read':
      case 'base-member':
      case 'base-read':
      case 'user':
      default:
        return 'limited_access';
    }
  };
  
  // Determine access level
  const accessLevel: AccessLevel = React.useMemo(() => {
    // Priority 1: Check workspace-specific access_level
    if (currentWorkspace?.access_level) {
      return mapWorkspaceAccessLevel(currentWorkspace.access_level);
    }
    
    // Priority 2: Check global admin role (owner or co-owner)
    if (hasAdminRole()) {
      return 'admin';
    }
    
    // Priority 3: Check if user is maintainer
    if (isMaintainer()) {
      return 'full_access';
    }
    
    // Default: most restrictive
    return 'limited_access';
  }, [hasAdminRole, isMaintainer, currentWorkspace]);
  
  // Check if user has any workspace with admin or full_access level
  const hasAnyFullAccessWorkspace = React.useMemo(() => {
    // If user has global admin role, they have full access everywhere
    if (hasAdminRole()) return true;
    
    if (!workspaces || workspaces.length === 0) return false;
    
    return workspaces.some((ws: any) => {
      const wsLevel = mapWorkspaceAccessLevel(ws.access_level);
      return wsLevel === 'admin' || wsLevel === 'full_access';
    });
  }, [hasAdminRole, workspaces]);
  
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
    // Allow admin, full_access, and workspace-read users to access settings
    return accessLevel === 'admin' || accessLevel === 'full_access' || isWorkspaceReadOnly();
  }, [accessLevel, currentWorkspace]);
  
  const canAccessAllSettingsTabs = React.useCallback(() => {
    return accessLevel === 'admin';
  }, [accessLevel]);
  
  // Check if user has workspace-read access (read-only at workspace level)
  const isWorkspaceReadOnly = React.useCallback(() => {
    return currentWorkspace?.access_level === 'workspace-read';
  }, [currentWorkspace]);
  
  return {
    accessLevel,
    isAdmin: accessLevel === 'admin',
    isFullAccess: accessLevel === 'full_access',
    isLimitedAccess: accessLevel === 'limited_access',
    currentWorkspace,
    hasAnyFullAccessWorkspace,
    isWorkspaceReadOnly,
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

