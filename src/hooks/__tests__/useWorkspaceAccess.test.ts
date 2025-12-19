import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkspaceAccess } from '../useWorkspaceAccess';
import * as useUserRole from '../useUserRole';
import * as useApi from '../useApi';
import * as navigationStore from '../../stores/navigationStore';

// Mock dependencies
vi.mock('../useUserRole');
vi.mock('../useApi');
vi.mock('../../stores/navigationStore', () => ({
  useNavigationStore: vi.fn()
}));

describe('useWorkspaceAccess', () => {
  const mockIsAdmin = vi.fn();
  const mockUseWorkspaces = vi.mocked(useApi.useWorkspaces);
  const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserRole.useUserRole).mockReturnValue({ isAdmin: mockIsAdmin } as any);
    mockUseNavigationStore.mockReturnValue({ selectedWorkspaceId: 'ws-1' } as any);
  });

  describe('access level determination', () => {
    it('should return admin access level for global admin', () => {
      mockIsAdmin.mockReturnValue(true);
      mockUseWorkspaces.mockReturnValue({ data: [] } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('admin');
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isFullAccess).toBe(false);
      expect(result.current.isLimitedAccess).toBe(false);
    });

    it('should return full_access for workspace with full_access', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'full_access' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('full_access');
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isFullAccess).toBe(true);
      expect(result.current.isLimitedAccess).toBe(false);
    });

    it('should return limited_access for workspace with limited_access', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'limited_access' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isFullAccess).toBe(false);
      expect(result.current.isLimitedAccess).toBe(true);
    });

    it('should return limited_access when workspace not found', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-2', name: 'Workspace 2', access_level: 'full_access' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
      expect(result.current.currentWorkspace).toBeNull();
    });

    it('should return limited_access when workspaces array is empty', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({ data: [] } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
    });

    it('should use provided workspaceId over selectedWorkspaceId', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'limited_access' },
          { id: 'ws-2', name: 'Workspace 2', access_level: 'full_access' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess('ws-2'));

      expect(result.current.accessLevel).toBe('full_access');
      expect(result.current.currentWorkspace?.id).toBe('ws-2');
    });
  });

  describe('hasAnyFullAccessWorkspace', () => {
    it('should return true for admin', () => {
      mockIsAdmin.mockReturnValue(true);
      mockUseWorkspaces.mockReturnValue({ data: [] } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.hasAnyFullAccessWorkspace).toBe(true);
    });

    it('should return true if any workspace has full_access', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'limited_access' },
          { id: 'ws-2', name: 'Workspace 2', access_level: 'full_access' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.hasAnyFullAccessWorkspace).toBe(true);
    });

    it('should return false if no workspace has full_access', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'limited_access' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.hasAnyFullAccessWorkspace).toBe(false);
    });
  });

  describe('permission helpers - admin', () => {
    beforeEach(() => {
      mockIsAdmin.mockReturnValue(true);
      mockUseWorkspaces.mockReturnValue({ data: [] } as any);
    });

    it('should allow all actions for admin', () => {
      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.canCreateWorkspace()).toBe(true);
      expect(result.current.canCreateBase()).toBe(true);
      expect(result.current.canCreateTable()).toBe(true);
      expect(result.current.canCreateView()).toBe(true);
      expect(result.current.canDeleteWorkspace()).toBe(true);
      expect(result.current.canDeleteBase()).toBe(true);
      expect(result.current.canUpdateBase()).toBe(true);
      expect(result.current.canDeleteTable()).toBe(true);
      expect(result.current.canDeleteView()).toBe(true);
      expect(result.current.canAssignUsers()).toBe(true);
      expect(result.current.canAccessSettings()).toBe(true);
      expect(result.current.canAccessAllSettingsTabs()).toBe(true);
    });
  });

  describe('permission helpers - full_access', () => {
    beforeEach(() => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'full_access' }
        ]
      } as any);
    });

    it('should allow base and table operations but not workspace operations', () => {
      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.canCreateWorkspace()).toBe(false);
      expect(result.current.canCreateBase()).toBe(true);
      expect(result.current.canCreateTable()).toBe(true);
      expect(result.current.canCreateView()).toBe(true);
      expect(result.current.canDeleteWorkspace()).toBe(false);
      expect(result.current.canDeleteBase()).toBe(true);
      expect(result.current.canUpdateBase()).toBe(true);
      expect(result.current.canDeleteTable()).toBe(true);
      expect(result.current.canDeleteView()).toBe(true);
      expect(result.current.canAssignUsers()).toBe(true);
      expect(result.current.canAccessSettings()).toBe(true);
      expect(result.current.canAccessAllSettingsTabs()).toBe(false);
    });
  });

  describe('permission helpers - limited_access', () => {
    beforeEach(() => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'limited_access' }
        ]
      } as any);
    });

    it('should only allow table and view operations', () => {
      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.canCreateWorkspace()).toBe(false);
      expect(result.current.canCreateBase()).toBe(false);
      expect(result.current.canCreateTable()).toBe(true);
      expect(result.current.canCreateView()).toBe(true);
      expect(result.current.canDeleteWorkspace()).toBe(false);
      expect(result.current.canDeleteBase()).toBe(false);
      expect(result.current.canUpdateBase()).toBe(false);
      expect(result.current.canDeleteTable()).toBe(true);
      expect(result.current.canDeleteView()).toBe(true);
      expect(result.current.canAssignUsers()).toBe(false);
      expect(result.current.canAccessSettings()).toBe(false);
      expect(result.current.canAccessAllSettingsTabs()).toBe(false);
    });
  });

  describe('workspace detection edge cases', () => {
    it('should handle null workspaces data', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({ data: null } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
      expect(result.current.currentWorkspace).toBeNull();
    });

    it('should handle undefined workspaces data', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseWorkspaces.mockReturnValue({ data: undefined } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
    });

    it('should handle undefined selectedWorkspaceId', () => {
      mockIsAdmin.mockReturnValue(false);
      mockUseNavigationStore.mockReturnValue({ selectedWorkspaceId: undefined } as any);
      mockUseWorkspaces.mockReturnValue({
        data: [
          { id: 'ws-1', name: 'Workspace 1', access_level: 'full_access' }
        ]
      } as any);

      const { result } = renderHook(() => useWorkspaceAccess());

      expect(result.current.accessLevel).toBe('limited_access');
      expect(result.current.currentWorkspace).toBeNull();
    });
  });
});
