import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBaseAccess } from '../useBaseAccess';
import * as useWorkspaceAccess from '../useWorkspaceAccess';
import * as useApi from '../useApi';
import * as navigationStore from '../../stores/navigationStore';

// Mock dependencies
vi.mock('../useWorkspaceAccess');
vi.mock('../useApi');
vi.mock('../../stores/navigationStore', () => {
  const useNavigationStore = vi.fn();
  (useNavigationStore as any).getState = vi.fn(() => ({
    selectedWorkspaceId: null,
    selectedBaseId: null,
  }));
  return { useNavigationStore };
});

describe('useBaseAccess', () => {
  const mockUseWorkspaceAccess = vi.mocked(useWorkspaceAccess.useWorkspaceAccess);
  const mockUseWorkspaceBases = vi.mocked(useApi.useWorkspaceBases);
  const mockUseNavigationStore = vi.mocked(navigationStore.useNavigationStore);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockUseWorkspaceAccess.mockReturnValue({
      wsAccess: null,
      hasFullWorkspaceAccess: false,
      isBaseLevelAccess: () => false,
      currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
    } as any);

    mockUseWorkspaceBases.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    mockUseNavigationStore.mockReturnValue({
      selectedBaseId: 'base-1',
      selectedWorkspaceId: 'ws-1',
    } as any);
  });

  describe('table permissions', () => {
    it('should allow table creation for owner', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'owner',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateTable()).toBe(true);
    });

    it('should allow table creation for maintainer', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'maintainer',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateTable()).toBe(true);
    });

    it('should allow table creation for base-member', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'base',
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => true,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      mockUseWorkspaceBases.mockReturnValue({
        data: [{ id: 'base-1', name: 'Base 1', access_level: 'base-member' }],
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateTable()).toBe(true);
    });

    it('should not allow table creation for workspace-read', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'workspace-read',
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateTable()).toBe(false);
    });

    it('should allow table updates with full access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'maintainer',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canUpdateTable()).toBe(true);
    });

    it('should allow table deletion with full access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'owner',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canDeleteTable()).toBe(true);
    });
  });

  describe('view permissions', () => {
    it('should allow view creation for maintainer', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'maintainer',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateView()).toBe(true);
    });

    it('should allow view updates with appropriate access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'maintainer',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canUpdateView()).toBe(true);
    });

    it('should allow view deletion with full access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'owner',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canDeleteView()).toBe(true);
    });
  });

  describe('field permissions', () => {
    it('should allow field creation for maintainer', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'maintainer',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateColumn()).toBe(true);
    });

    it('should allow field updates with appropriate access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'maintainer',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canUpdateColumn()).toBe(true);
    });

    it('should allow field deletion with full access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'owner',
        hasFullWorkspaceAccess: true,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canDeleteColumn()).toBe(true);
    });
  });

  describe('record permissions', () => {
    it('should allow record management with base-member access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'base',
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => true,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      mockUseWorkspaceBases.mockReturnValue({
        data: [{ id: 'base-1', name: 'Base 1', access_level: 'base-member' }],
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateRecord()).toBe(true);
      expect(result.current.canUpdateRecord()).toBe(true);
      expect(result.current.canDeleteRecord()).toBe(true);
    });

    it('should not allow record management for read-only access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'workspace-read',
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => false,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateRecord()).toBe(false);
      expect(result.current.canUpdateRecord()).toBe(false);
      expect(result.current.canDeleteRecord()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined baseId', () => {
      const { result } = renderHook(() => useBaseAccess(undefined as any));

      expect(result.current.canCreateTable()).toBe(false);
      expect(result.current.canCreateView()).toBe(false);
      expect(result.current.canCreateColumn()).toBe(false);
    });

    it('should handle null workspace access', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: null,
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => false,
        currentWorkspace: null,
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canCreateTable()).toBe(false);
    });

    it('uses selected workspace id when current workspace is not available', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: null,
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => false,
        currentWorkspace: null,
      } as any);

      mockUseNavigationStore.mockReturnValue({
        selectedBaseId: 'base-1',
        selectedWorkspaceId: 'ws-fallback',
      } as any);

      renderHook(() => useBaseAccess('base-1'));

      expect(mockUseWorkspaceBases).toHaveBeenCalledWith('ws-fallback');
    });

    it('grants full base-level permissions for base owner (case-insensitive access level)', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'base',
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => true,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      mockUseWorkspaceBases.mockReturnValue({
        data: [{ id: 'base-1', name: 'Base 1', access_level: 'OWNER' }],
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.baseAccess).toBe('owner');
      expect(result.current.hasFullBaseAccess).toBe(true);
      expect(result.current.canUpdateBase()).toBe(true);
      expect(result.current.canDeleteBase()).toBe(true);
      expect(result.current.canManageBaseMembers()).toBe(true);
      expect(result.current.canCreateBase()).toBe(false);
    });

    it('treats base-read as accessible but read-only', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'base',
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => true,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      mockUseWorkspaceBases.mockReturnValue({
        data: [{ id: 'base-1', name: 'Base 1', access_level: 'base-read' }],
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.canAccessBase).toBe(true);
      expect(result.current.isBaseReadOnly()).toBe(true);
      expect(result.current.canCreateTable()).toBe(false);
      expect(result.current.canUpdateTable()).toBe(false);
      expect(result.current.canDeleteRecord()).toBe(false);
    });

    it('returns no base access when base is not found in workspace bases list', () => {
      mockUseWorkspaceAccess.mockReturnValue({
        wsAccess: 'base',
        hasFullWorkspaceAccess: false,
        isBaseLevelAccess: () => true,
        currentWorkspace: { id: 'ws-1', name: 'Workspace 1' },
      } as any);

      mockUseWorkspaceBases.mockReturnValue({
        data: [{ id: 'another-base', name: 'Other', access_level: 'owner' }],
      } as any);

      const { result } = renderHook(() => useBaseAccess('base-1'));

      expect(result.current.currentBase).toBeNull();
      expect(result.current.baseAccess).toBeNull();
      expect(result.current.canAccessBase).toBe(false);
      expect(result.current.hasFullBaseAccess).toBe(false);
    });
  });
});
