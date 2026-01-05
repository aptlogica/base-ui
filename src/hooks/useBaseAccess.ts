import React from 'react';
import { useWorkspaceAccess } from './useWorkspaceAccess';
import { useWorkspaceBases } from './useApi';
import { useNavigationStore } from '../stores/navigationStore';

export function useBaseAccess(baseId?: string) {
  const { wsAccess, hasFullWorkspaceAccess, isBaseLevelAccess, currentWorkspace } = useWorkspaceAccess();
  const { selectedBaseId, selectedWorkspaceId } = useNavigationStore();
  const workspaceId = currentWorkspace?.id || selectedWorkspaceId || '';
  const { data: basesData } = useWorkspaceBases(workspaceId);
  
  // Use provided baseId or fall back to selected base
  const effectiveBaseId = baseId || selectedBaseId;
  
  // Get bases array from API response
  const bases = React.useMemo(() => {
    if (!basesData) return [];
    const data = (basesData as any)?.data || basesData;
    return Array.isArray(data) ? data : [];
  }, [basesData]);
  
  // Find the current base
  const currentBase = React.useMemo(() => {
    if (!effectiveBaseId || !bases || bases.length === 0) {
      return null;
    }
    return bases.find((base: any) => base.id === effectiveBaseId) || null;
  }, [effectiveBaseId, bases]);
  
  // Get base access_level
  const baseAccess = React.useMemo(() => {
    if (!currentBase?.access_level) return null;
    return currentBase.access_level.toLowerCase();
  }, [currentBase]);
  
  // If user has full workspace access (owner/co-owner/maintainer), they have full access to all bases
  const hasFullBaseAccess = React.useMemo(() => {
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess() && baseAccess === 'owner') return true;
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess]);
  
  // Check if user can access this base at all
  const canAccessBase = React.useMemo(() => {
    // Full workspace access means access to all bases
    if (hasFullWorkspaceAccess) return true;
    // If workspace access is "base", check if user has access to this specific base
    if (isBaseLevelAccess() && currentBase) {
      // Include all valid base access levels
      return baseAccess === 'owner' || 
             baseAccess === 'maintainer' || 
             baseAccess === 'base-member' || 
             baseAccess === 'base-read' ||
             baseAccess === 'workspace-read';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, currentBase, baseAccess]);
  
  // Base-level operations (only base owner, or workspace owner/co-owner/maintainer)
  const canCreateBase = React.useCallback(() => {
    return hasFullWorkspaceAccess; // Only workspace-level admins can create bases
  }, [hasFullWorkspaceAccess]);
  
  const canUpdateBase = React.useCallback(() => {
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess() && baseAccess === 'owner') return true;
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess]);
  
  const canDeleteBase = React.useCallback(() => {
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess() && baseAccess === 'owner') return true;
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess]);
  
  // Base member management (only base owner, or workspace owner/co-owner/maintainer)
  const canManageBaseMembers = React.useCallback(() => {
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess() && baseAccess === 'owner') return true;
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess]);
  
  // Table/View/Record/Column operations
  // Hierarchy: Workspace > Base > Table > View
  // - Maintainer: Full access to everything below workspace (base, table, view, record, column)
  // - Base Member: Full access to everything below base (table, view, record, column)
  // - Restrictions: Only for workspace-read and base-read (read-only)
  
  const canCreateTable = React.useCallback(() => {
    // Workspace read-only users cannot create tables
    if (wsAccess === 'workspace-read') return false;
    
    // Maintainer (and owner/co-owner) can do everything below workspace
    if (hasFullWorkspaceAccess) return true;
    
    // If workspace access is "base", check base-level access
    if (isBaseLevelAccess()) {
      // Base read-only and workspace-read users cannot create tables
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      // Base owner, maintainer, and base-member can create tables
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canUpdateTable = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canDeleteTable = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canCreateView = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canUpdateView = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canDeleteView = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canCreateRecord = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canUpdateRecord = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canDeleteRecord = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canCreateColumn = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canUpdateColumn = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  const canDeleteColumn = React.useCallback(() => {
    if (wsAccess === 'workspace-read') return false;
    if (hasFullWorkspaceAccess) return true;
    if (isBaseLevelAccess()) {
      if (baseAccess === 'base-read' || baseAccess === 'workspace-read') return false;
      return baseAccess === 'owner' || baseAccess === 'maintainer' || baseAccess === 'base-member';
    }
    return false;
  }, [hasFullWorkspaceAccess, isBaseLevelAccess, baseAccess, wsAccess]);
  
  // Check if base is read-only
  const isBaseReadOnly = React.useCallback(() => {
    if (hasFullWorkspaceAccess) return false;
    return baseAccess === 'base-read' || baseAccess === 'workspace-read';
  }, [hasFullWorkspaceAccess, baseAccess]);
  
  return {
    baseAccess,
    currentBase,
    canAccessBase,
    hasFullBaseAccess,
    // Base operations
    canCreateBase,
    canUpdateBase,
    canDeleteBase,
    canManageBaseMembers,
    // Table operations
    canCreateTable,
    canUpdateTable,
    canDeleteTable,
    // View operations
    canCreateView,
    canUpdateView,
    canDeleteView,
    // Record operations
    canCreateRecord,
    canUpdateRecord,
    canDeleteRecord,
    // Column operations
    canCreateColumn,
    canUpdateColumn,
    canDeleteColumn,
    // Read-only check
    isBaseReadOnly,
  };
}

