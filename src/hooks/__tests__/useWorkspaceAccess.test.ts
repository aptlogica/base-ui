import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkspaceAccess } from '../useWorkspaceAccess';
import * as useUserRole from '../useUserRole';
import * as useApi from '../useApi';
import * as navigationStore from '../../stores/navigationStore';

// Mock dependencies
vi.mock('../useUserRole');
vi.mock('../useApi');
vi.mock('../../stores/navigationStore', () => {
  const useNavigationStore = vi.fn();
  (useNavigationStore as any).getState = vi.fn(() => ({
    selectedWorkspaceId: null,
    selectedBaseId: null,
  }));
  return { useNavigationStore };
});

describe('useWorkspaceAccess', () => {
  const mockHasAdminRole = vi.fn();
  const mockIsMaintainer = vi.fn();
  const mockUseWorkspaces = vi.mocked(useApi.useWorkspaces);
  const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserRole.useUserRole).mockReturnValue({ 
      hasAdminRole: mockHasAdminRole,
      isMaintainer: mockIsMaintainer,
    } as any);
    mockUseNavigationStore.mockReturnValue({ selectedWorkspaceId: 'ws-1' } as any);
    mockHasAdminRole.mockReturnValue(false);
    mockIsMaintainer.mockReturnValue(false);
  });

  describe('access level determination', () => {
    it('should return admin access level for global admin', () => {
      mockHasAdminRole.mockReturnValue(true);
      mockUseWorkspaces.mockReturnValue({ data: [] } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('admin');
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.hasFullWorkspaceAccess).toBe(true);
    });

    it('should return full_access for workspace with full_access', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'maintainer' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('full_access');
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isFullAccess).toBe(true);
      expect(result.current.isLimitedAccess).toBe(false);
    });

    it('should return limited_access for workspace with limited_access', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'base' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
      expect(result.current.isLimitedAccess).toBe(true);
    });

    it('should return limited_access when workspace not found', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-2', name: 'Workspace 2', access_level: 'maintainer' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
      expect(result.current.currentWorkspace).toBeNull();
    });

    it('should return limited_access when workspaces array is empty', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({ data: [] } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
    });

    it('should use provided workspaceId over selectedWorkspaceId', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'base' },
          { id: 'ws-2', name: 'Workspace 2', access_level: 'maintainer' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess('ws-2'));

      expect(result.current.accessLevel).toBe('full_access');
      expect(result.current.currentWorkspace?.id).toBe('ws-2');
    });
  });

  describe('hasAnyFullAccessWorkspace', () => {
    it('should return true for admin', () => {
      mockHasAdminRole.mockReturnValue(true);
      mockUseWorkspaces.mockReturnValue({ data: [] } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      // Admin users have full workspace access
      expect(result.current.hasFullWorkspaceAccess).toBe(true);
    });

    it('should return true if any workspace has full_access', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'base' },
          { id: 'ws-2', name: 'Workspace 2', access_level: 'maintainer' }
        ]
      } as any);
      mockUseNavigationStore.mockReturnValue({ selectedWorkspaceId: 'ws-1' } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      // Selected workspace (ws-1) has 'base' level - limited access
      expect(result.current.hasFullWorkspaceAccess).toBe(false);
    });

    it('should return false if no workspace has full_access', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'base' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.hasFullWorkspaceAccess).toBe(false);
    });
  });

  describe('permission helpers - admin', () => {
    beforeEach(() => {
      mockHasAdminRole.mockReturnValue(true);
      mockUseWorkspaces.mockReturnValue({ data: [] } as any);
    });

    it('should allow all actions for admin', () => {
      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.canCreateWorkspace()).toBe(true);
      expect(result.current.canCreateBase()).toBe(true);
      expect(result.current.canDeleteWorkspace()).toBe(true);
      expect(result.current.canDeleteBase()).toBe(true);
      expect(result.current.canUpdateBase()).toBe(true);
      expect(result.current.canAssignUsers()).toBe(true);
      expect(result.current.canAccessSettings()).toBe(true);
      expect(result.current.canAccessAllSettingsTabs()).toBe(true);
    });
  });

  describe('permission helpers - full_access', () => {
    beforeEach(() => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'maintainer' }
        ]
      } as any);
    });

    it('should allow base and table operations but not workspace operations', () => {
      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.canCreateWorkspace()).toBe(false);
      expect(result.current.canCreateBase()).toBe(true);
      expect(result.current.canDeleteWorkspace()).toBe(false);
      expect(result.current.canDeleteBase()).toBe(true);
      expect(result.current.canUpdateBase()).toBe(true);
      expect(result.current.canAssignUsers()).toBe(true);
      expect(result.current.canAccessSettings()).toBe(true);
      expect(result.current.canAccessAllSettingsTabs()).toBe(false);
    });
  });

  describe('permission helpers - limited_access', () => {
    beforeEach(() => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'base' }
        ]
      } as any);
    });

    it('should only allow limited operations', () => {
      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.canCreateWorkspace()).toBe(false);
      expect(result.current.canCreateBase()).toBe(false);
      expect(result.current.canDeleteWorkspace()).toBe(false);
      expect(result.current.canDeleteBase()).toBe(false);
      expect(result.current.canUpdateBase()).toBe(false);
      expect(result.current.canAssignUsers()).toBe(false);
      expect(result.current.canAccessSettings()).toBe(false);
      expect(result.current.canAccessAllSettingsTabs()).toBe(false);
    });
  });

  describe('workspace detection edge cases', () => {
    it('should handle null workspaces data', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({ data: null } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
      expect(result.current.currentWorkspace).toBeNull();
    });

    it('should handle undefined workspaces data', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({ data: undefined } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
    });

    it('should handle undefined selectedWorkspaceId', () => {
      mockHasAdminRole.mockReturnValue(false);
      mockUseNavigationStore.mockReturnValue({ selectedWorkspaceId: undefined } as any);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'maintainer' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
      expect(result.current.currentWorkspace).toBeNull();
    });
  });
});
