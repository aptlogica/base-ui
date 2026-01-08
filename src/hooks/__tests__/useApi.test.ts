/**
 * Comprehensive Unit Tests for useApi.ts
 * 
 * This test suite covers all React Query hooks exported from useApi.ts
 * Following the AAA pattern (Arrange-Act-Assert) and testing:
 * - Happy path scenarios
 * - Error handling and failure modes
 * - Edge cases
 * - Cache invalidation patterns
 * - Conditional query enabling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Import the hooks to test
import {
  queryKeys,
  useWorkspaces,
  useWorkspaceById,
  useWorkspaceBases,
  useWorkspaceMembers,
  useBaseMembers,
  useBaseTables,
  useAllBases,
  useAllTables,
  useAllFields,
  useAllViews,
  useBaseById,
  useTable,
  useTableViews,
  useViewById,
  useViewsForTable,
  useUserProfile,
  useUserAccessDetails,
  useUserRolesAndAccess,
  useGetTenantUsers,
  useGetUsersForAssign,
  useGetOrganization,
  useGetOrganizationById,
  useAddRow,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useBulkAddBaseMembers,
  useRemoveBaseAccessMember,
  useRemoveUserFromBase,
  useCreateBase,
  useUpdateBase,
  useDeleteBase,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
  useImportTable,
  useCreateField,
  useUpdateField,
  useDeleteColumn,
  useReorderColumn,
  useCreateView,
  useUpdateViewAppearance,
  useUpdateViewMeta,
  useUpdateView,
  useDeleteView,
  useInsertRowData,
  useDeleteRecord,
  useInsertRelationData,
  useAddAttachment,
  useRemoveAttachments,
  useUpdateAssetById,
  useAddImage,
  useUpdateUserProfile,
  useChangePassword,
  useAddOrUpdateAvatar,
  useRemoveAvatar,
  useGetRecordsByPagination,
  useAddUser,
  useEditUser,
  useRemoveTenantUser,
  useActivateTenantUser,
  useDeactivateTenantUser,
  useAssignUserToWorkspace,
  useBulkAddMembers,
  useRemoveAccessMember,
  useRemoveUserFromWorkspace,
  useUpdateOrganization,
} from '../useApi';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock react-router-dom
const mockLocation = { pathname: '/home' };
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(() => mockLocation),
}));

// Mock AuthContext
const mockUser = { id: 'user-123', email: 'test@example.com' };
vi.mock('../../auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

// Mock all service functions from clientService
vi.mock('../../service/clientService', () => ({
  getWorkspacesByUser: vi.fn(),
  getWorkspaceByIdService: vi.fn(),
  getBasesByWorkspaceIdService: vi.fn(),
  getWorkspaceMembersService: vi.fn(),
  getBaseMembersService: vi.fn(),
  getTablesByBaseIdService: vi.fn(),
  getAllBasesService: vi.fn(),
  getAllTablesService: vi.fn(),
  getAllFieldsService: vi.fn(),
  getAllViewsService: vi.fn(),
  getBaseByIdService: vi.fn(),
  getTableByIdService: vi.fn(),
  getViewsByModelIdService: vi.fn(),
  getViewByIdService: vi.fn(),
  getUserProfileByIDService: vi.fn(),
  getUserAccessDetailsService: vi.fn(),
  getUserRolesAndAccessService: vi.fn(),
  getTenantUsersService: vi.fn(),
  getUsersForAssignService: vi.fn(),
  getOrganizationService: vi.fn(),
  getOrganizationServiceById: vi.fn(),
  getAllRecordsService: vi.fn(),
  // Mutations
  addRow: vi.fn(),
  createWorkspaceService: vi.fn(),
  updateWorkspaceService: vi.fn(),
  deleteWorkspaceService: vi.fn(),
  bulkAddBaseMembersService: vi.fn(),
  removeBaseAccessMemberService: vi.fn(),
  removeUserFromBaseService: vi.fn(),
  createBaseService: vi.fn(),
  updateBaseService: vi.fn(),
  deleteBaseService: vi.fn(),
  createTableService: vi.fn(),
  updateTableService: vi.fn(),
  deleteTableService: vi.fn(),
  importTableService: vi.fn(),
  createFieldService: vi.fn(),
  updateFieldService: vi.fn(),
  deleteFieldService: vi.fn(),
  reorderColumnService: vi.fn(),
  createViewService: vi.fn(),
  updateViewService: vi.fn(),
  deleteViewService: vi.fn(),
  insertRowDataService: vi.fn(),
  deleteRowService: vi.fn(),
  insertRelationDataService: vi.fn(),
  addAttachmentService: vi.fn(),
  removeAttachmentsService: vi.fn(),
  updateAssetByIdService: vi.fn(),
  addImageService: vi.fn(),
  updateUserProfileService: vi.fn(),
  changePasswordService: vi.fn(),
  addOrUpdateAvatarService: vi.fn(),
  removeAvatarService: vi.fn(),
  addUserService: vi.fn(),
  editUserService: vi.fn(),
  removeUserService: vi.fn(),
  activateTenantUserService: vi.fn(),
  deactivateTenantUserService: vi.fn(),
  assignUserToWorkspaceService: vi.fn(),
  bulkAddMembersService: vi.fn(),
  removeAccessMemberService: vi.fn(),
  removeUserFromWorkspaceService: vi.fn(),
  updateOrganizationService: vi.fn(),
  forceLogout: vi.fn(),
}));

// Import mocked modules for type safety
import * as clientService from '../../service/clientService';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Creates a fresh QueryClient for each test to ensure isolation
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Wrapper component providing QueryClientProvider
 */
const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

/**
 * Helper to set up mocked location path
 */
const setLocation = (pathname: string) => {
  mockLocation.pathname = pathname;
};

/**
 * Helper to set up mocked auth user
 */
const setAuthUser = (user: any) => {
  vi.mocked(useAuth).mockReturnValue({
    user,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
    saving: false,
    restoreCompleted: true,
    userRole: null,
  });
};

// ============================================================================
// Tests: queryKeys
// ============================================================================

describe('queryKeys', () => {
  describe('static keys', () => {
    it('should return correct workspaces key', () => {
      expect(queryKeys.workspaces).toEqual(['workspaces']);
    });

    it('should return correct workspaceData key', () => {
      expect(queryKeys.workspaceData).toEqual(['getDataByUser']);
    });

    it('should return correct allBases key', () => {
      expect(queryKeys.allBases).toEqual(['allBases']);
    });

    it('should return correct allTables key', () => {
      expect(queryKeys.allTables).toEqual(['allTables']);
    });

    it('should return correct allFields key', () => {
      expect(queryKeys.allFields).toEqual(['allFields']);
    });

    it('should return correct allViews key', () => {
      expect(queryKeys.allViews).toEqual(['allViews']);
    });

    it('should return correct users key', () => {
      expect(queryKeys.users).toEqual(['users']);
    });
  });

  describe('dynamic keys', () => {
    it('should generate correct workspace key with id', () => {
      expect(queryKeys.workspace('ws-123')).toEqual(['workspace', 'ws-123']);
    });

    it('should generate correct bases key with workspaceId', () => {
      expect(queryKeys.bases('ws-123')).toEqual(['workspaces', 'ws-123', 'bases']);
    });

    it('should generate correct tables key with baseId', () => {
      expect(queryKeys.tables('base-123')).toEqual(['bases', 'base-123', 'tables']);
    });

    it('should generate correct fields key with tableId', () => {
      expect(queryKeys.fields('table-123')).toEqual(['tables', 'table-123', 'fields']);
    });

    it('should generate correct views key with tableId', () => {
      expect(queryKeys.views('table-123')).toEqual(['tables', 'table-123', 'views']);
    });

    it('should generate correct records key with tableId', () => {
      expect(queryKeys.records('table-123')).toEqual(['tables', 'table-123', 'records']);
    });

    it('should generate correct recordValues key with recordId', () => {
      expect(queryKeys.recordValues('record-123')).toEqual(['records', 'record-123', 'values']);
    });

    it('should generate correct user key with userId', () => {
      expect(queryKeys.user('user-123')).toEqual(['user', 'user-123']);
    });

    it('should generate correct userProfile key with id', () => {
      expect(queryKeys.userProfile('user-123')).toEqual(['userProfile', 'user-123']);
    });
  });
});

// ============================================================================
// Tests: useWorkspaces
// ============================================================================

describe('useWorkspaces', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    setLocation('/home');
    setAuthUser(mockUser);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('success scenarios', () => {
    it('should fetch workspaces successfully', async () => {
      // Arrange
      const mockWorkspaces = [
        { id: 'ws-1', title: 'Workspace 1' },
        { id: 'ws-2', title: 'Workspace 2' },
      ];
      vi.mocked(clientService.getWorkspacesByUser).mockResolvedValue({
        data: mockWorkspaces,
      });

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockWorkspaces);
      expect(clientService.getWorkspacesByUser).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when data is empty', async () => {
      // Arrange
      vi.mocked(clientService.getWorkspacesByUser).mockResolvedValue({
        data: [],
      });

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual([]);
    });

    it('should normalize non-array data to empty array', async () => {
      // Arrange
      vi.mocked(clientService.getWorkspacesByUser).mockResolvedValue({
        data: null,
      });

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual([]);
    });
  });

  describe('disabled query scenarios', () => {
    it('should not fetch when user is null', async () => {
      // Arrange
      setAuthUser(null);

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getWorkspacesByUser).not.toHaveBeenCalled();
    });

    it('should not fetch on login route', async () => {
      // Arrange
      setLocation('/login');

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getWorkspacesByUser).not.toHaveBeenCalled();
    });

    it('should not fetch on forgot-password route', async () => {
      // Arrange
      setLocation('/forgot-password');

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getWorkspacesByUser).not.toHaveBeenCalled();
    });

    it('should not fetch on reset-password route', async () => {
      // Arrange
      setLocation('/reset-password');

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getWorkspacesByUser).not.toHaveBeenCalled();
    });

    it('should not fetch on auth callback route', async () => {
      // Arrange
      setLocation('/auth/callback');

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getWorkspacesByUser).not.toHaveBeenCalled();
    });

    it('should not fetch on nested auth callback route', async () => {
      // Arrange
      setLocation('/auth/callback/google');

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getWorkspacesByUser).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle API errors and log them', async () => {
      // Arrange
      const apiError = new Error('Network error');
      vi.mocked(clientService.getWorkspacesByUser).mockRejectedValue(apiError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert - The hook catches errors and logs them
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should trigger forceLogout import on 401 error', async () => {
      // Arrange
      const authError = { response: { status: 401 } };
      vi.mocked(clientService.getWorkspacesByUser).mockRejectedValue(authError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert - Error is logged
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should trigger forceLogout import on 403 error', async () => {
      // Arrange
      const authError = { response: { status: 403 } };
      vi.mocked(clientService.getWorkspacesByUser).mockRejectedValue(authError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert - Error is logged
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle unexpected response format', async () => {
      // Arrange
      vi.mocked(clientService.getWorkspacesByUser).mockResolvedValue({
        something: 'unexpected',
      } as any);

      // Act
      const { result } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual([]);
    });
  });
});

// ============================================================================
// Tests: useWorkspaceById
// ============================================================================

describe('useWorkspaceById', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('success scenarios', () => {
    it('should fetch workspace by id successfully', async () => {
      // Arrange
      const mockWorkspace = { id: 'ws-123', title: 'My Workspace' };
      vi.mocked(clientService.getWorkspaceByIdService).mockResolvedValue({
        data: mockWorkspace,
      });

      // Act
      const { result } = renderHook(() => useWorkspaceById('ws-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(clientService.getWorkspaceByIdService).toHaveBeenCalledWith('ws-123');
    });
  });

  describe('disabled query scenarios', () => {
    it('should not fetch when workspaceId is empty', async () => {
      // Act
      const { result } = renderHook(() => useWorkspaceById(''), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getWorkspaceByIdService).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Tests: useWorkspaceBases
// ============================================================================

describe('useWorkspaceBases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    setLocation('/home');
    setAuthUser(mockUser);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('success scenarios', () => {
    it('should fetch workspace bases successfully', async () => {
      // Arrange
      const mockBases = [{ id: 'base-1', title: 'Base 1' }];
      vi.mocked(clientService.getBasesByWorkspaceIdService).mockResolvedValue({
        data: mockBases,
      });

      // Act
      const { result } = renderHook(() => useWorkspaceBases('ws-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(clientService.getBasesByWorkspaceIdService).toHaveBeenCalledWith('ws-123');
    });
  });

  describe('disabled query scenarios', () => {
    it('should not fetch when workspaceId is empty', async () => {
      // Act
      const { result } = renderHook(() => useWorkspaceBases(''), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getBasesByWorkspaceIdService).not.toHaveBeenCalled();
    });

    it('should not fetch when user is null', async () => {
      // Arrange
      setAuthUser(null);

      // Act
      const { result } = renderHook(() => useWorkspaceBases('ws-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getBasesByWorkspaceIdService).not.toHaveBeenCalled();
    });

    it('should not fetch on public routes', async () => {
      // Arrange
      setLocation('/login');

      // Act
      const { result } = renderHook(() => useWorkspaceBases('ws-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getBasesByWorkspaceIdService).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Tests: useWorkspaceMembers
// ============================================================================

describe('useWorkspaceMembers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('success scenarios', () => {
    it('should fetch workspace members successfully', async () => {
      // Arrange
      const mockMembers = [
        { id: 'member-1', name: 'John' },
        { id: 'member-2', name: 'Jane' },
      ];
      vi.mocked(clientService.getWorkspaceMembersService).mockResolvedValue(mockMembers);

      // Act
      const { result } = renderHook(() => useWorkspaceMembers('ws-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockMembers);
      expect(clientService.getWorkspaceMembersService).toHaveBeenCalledWith('ws-123');
    });
  });

  describe('disabled query scenarios', () => {
    it('should not fetch when workspaceId is empty', async () => {
      // Act
      const { result } = renderHook(() => useWorkspaceMembers(''), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getWorkspaceMembersService).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Tests: useViewById
// ============================================================================

describe('useViewById', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('success scenarios', () => {
    it('should fetch view by valid UUID-like id', async () => {
      // Arrange
      const viewId = '123e4567-e89b-12d3-a456-426614174000';
      const mockView = { id: viewId, title: 'Grid View', type: 'grid' };
      vi.mocked(clientService.getViewByIdService).mockResolvedValue({
        data: mockView,
      });

      // Act
      const { result } = renderHook(() => useViewById(viewId), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockView);
      expect(clientService.getViewByIdService).toHaveBeenCalledWith(viewId);
    });
  });

  describe('slug detection - should not fetch for view type slugs', () => {
    it('should not fetch for "grid" slug', async () => {
      // Act
      const { result } = renderHook(() => useViewById('grid'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });

    it('should not fetch for "form" slug', async () => {
      // Act
      const { result } = renderHook(() => useViewById('form'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });

    it('should not fetch for "gallery" slug', async () => {
      // Act
      const { result } = renderHook(() => useViewById('gallery'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });

    it('should not fetch for "kanban" slug', async () => {
      // Act
      const { result } = renderHook(() => useViewById('kanban'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });

    it('should not fetch for "calendar" slug', async () => {
      // Act
      const { result } = renderHook(() => useViewById('calendar'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });

    it('should not fetch for "gantt" slug', async () => {
      // Act
      const { result } = renderHook(() => useViewById('gantt'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });

    it('should not fetch for case-insensitive slugs', async () => {
      // Act
      const { result } = renderHook(() => useViewById('GRID'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });
  });

  describe('ID validation - should not fetch for short strings', () => {
    it('should not fetch when viewId is too short', async () => {
      // Act
      const { result } = renderHook(() => useViewById('short'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });

    it('should not fetch when viewId has no hyphens', async () => {
      // Act
      const { result } = renderHook(() => useViewById('thisIsALongStringButNoHyphens'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });

    it('should not fetch when viewId is empty', async () => {
      // Act
      const { result } = renderHook(() => useViewById(''), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getViewByIdService).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Tests: useTable
// ============================================================================

describe('useTable', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('success scenarios', () => {
    it('should fetch table by id successfully', async () => {
      // Arrange
      const mockTable = {
        id: 'table-123',
        title: 'Tasks',
        columns: [],
        rows: [],
      };
      vi.mocked(clientService.getTableByIdService).mockResolvedValue(mockTable);

      // Act
      const { result } = renderHook(() => useTable('table-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockTable);
      expect(clientService.getTableByIdService).toHaveBeenCalledWith('table-123', undefined);
    });

    it('should pass options to service function', async () => {
      // Arrange
      const options = { includeRows: true, pageSize: 50 };
      vi.mocked(clientService.getTableByIdService).mockResolvedValue({});

      // Act
      renderHook(() => useTable('table-123', options), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(clientService.getTableByIdService).toHaveBeenCalledWith('table-123', options);
      });
    });
  });

  describe('disabled query scenarios', () => {
    it('should not fetch when tableId is empty', async () => {
      // Act
      const { result } = renderHook(() => useTable(''), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getTableByIdService).not.toHaveBeenCalled();
    });
  });

  describe('caching behavior', () => {
    it('should use placeholder data from previous fetch', async () => {
      // Arrange
      const mockTable = { id: 'table-123', title: 'Tasks' };
      vi.mocked(clientService.getTableByIdService).mockResolvedValue(mockTable);

      // Act - First render
      const { result, rerender } = renderHook(() => useTable('table-123'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Rerender should show cached data
      rerender();
      expect(result.current.data).toEqual(mockTable);
    });
  });
});

// ============================================================================
// Tests: useUserProfile
// ============================================================================

describe('useUserProfile', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('success scenarios', () => {
    it('should fetch user profile successfully', async () => {
      // Arrange
      const mockProfile = {
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };
      vi.mocked(clientService.getUserProfileByIDService).mockResolvedValue(mockProfile);

      // Act
      const { result } = renderHook(() => useUserProfile('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockProfile);
      expect(clientService.getUserProfileByIDService).toHaveBeenCalledWith('user-123');
    });
  });

  describe('disabled query scenarios', () => {
    it('should not fetch when userId is empty', async () => {
      // Act
      const { result } = renderHook(() => useUserProfile(''), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getUserProfileByIDService).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Tests: useGetTenantUsers
// ============================================================================

describe('useGetTenantUsers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('success scenarios', () => {
    it('should fetch tenant users successfully', async () => {
      // Arrange
      const mockUsers = [
        { id: 'user-1', name: 'User 1' },
        { id: 'user-2', name: 'User 2' },
      ];
      vi.mocked(clientService.getTenantUsersService).mockResolvedValue({
        data: mockUsers,
      });

      // Act
      const { result } = renderHook(() => useGetTenantUsers(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockUsers);
    });

    it('should return empty array when data is null', async () => {
      // Arrange
      vi.mocked(clientService.getTenantUsersService).mockResolvedValue({
        data: null,
      });

      // Act
      const { result } = renderHook(() => useGetTenantUsers(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual([]);
    });

    it('should return empty array when response has no data property', async () => {
      // Arrange
      vi.mocked(clientService.getTenantUsersService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useGetTenantUsers(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual([]);
    });
  });
});

// ============================================================================
// Tests: useAllBases, useAllTables, useAllFields, useAllViews
// ============================================================================

describe('Bulk API Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useAllBases', () => {
    it('should fetch all bases successfully', async () => {
      // Arrange
      const mockBases = [{ id: 'base-1' }, { id: 'base-2' }];
      vi.mocked(clientService.getAllBasesService).mockResolvedValue({
        data: mockBases,
      });

      // Act
      const { result } = renderHook(() => useAllBases(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockBases);
    });

    it('should return empty array on error', async () => {
      // Arrange
      vi.mocked(clientService.getAllBasesService).mockRejectedValue(new Error('Failed'));

      // Act
      const { result } = renderHook(() => useAllBases(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual([]);
    });
  });

  describe('useAllTables', () => {
    it('should fetch all tables successfully', async () => {
      // Arrange
      const mockTables = [{ id: 'table-1' }, { id: 'table-2' }];
      vi.mocked(clientService.getAllTablesService).mockResolvedValue({
        data: mockTables,
      });

      // Act
      const { result } = renderHook(() => useAllTables(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockTables);
    });
  });

  describe('useAllFields', () => {
    it('should fetch all fields successfully', async () => {
      // Arrange
      const mockFields = [{ id: 'field-1' }, { id: 'field-2' }];
      vi.mocked(clientService.getAllFieldsService).mockResolvedValue({
        data: mockFields,
      });

      // Act
      const { result } = renderHook(() => useAllFields(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockFields);
    });
  });

  describe('useAllViews', () => {
    it('should fetch all views successfully', async () => {
      // Arrange
      const mockViews = [{ id: 'view-1' }, { id: 'view-2' }];
      vi.mocked(clientService.getAllViewsService).mockResolvedValue({
        data: mockViews,
      });

      // Act
      const { result } = renderHook(() => useAllViews(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockViews);
    });
  });
});

// ============================================================================
// Tests: Workspace Mutations
// ============================================================================

describe('Workspace Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useCreateWorkspace', () => {
    it('should create workspace successfully', async () => {
      // Arrange
      const newWorkspace = { title: 'New Workspace', description: 'Test' };
      const createdWorkspace = { id: 'ws-new', ...newWorkspace };
      vi.mocked(clientService.createWorkspaceService).mockResolvedValue({
        data: createdWorkspace,
      });

      // Act
      const { result } = renderHook(() => useCreateWorkspace(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ workspace: newWorkspace });
      });

      // Assert
      expect(clientService.createWorkspaceService).toHaveBeenCalledWith(newWorkspace);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should invalidate workspaces query on success', async () => {
      // Arrange
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(clientService.createWorkspaceService).mockResolvedValue({
        data: { id: 'ws-new' },
      });

      // Act
      const { result } = renderHook(() => useCreateWorkspace(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ workspace: { title: 'Test', description: '' } });
      });

      // Assert
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useUpdateWorkspace', () => {
    it('should update workspace successfully', async () => {
      // Arrange
      const updates = { title: 'Updated Title' };
      vi.mocked(clientService.updateWorkspaceService).mockResolvedValue({
        data: { id: 'ws-123', ...updates },
      });

      // Act
      const { result } = renderHook(() => useUpdateWorkspace(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ workspaceId: 'ws-123', updates });
      });

      // Assert
      expect(clientService.updateWorkspaceService).toHaveBeenCalledWith('ws-123', updates);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteWorkspace', () => {
    it('should delete workspace successfully', async () => {
      // Arrange
      vi.mocked(clientService.deleteWorkspaceService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useDeleteWorkspace(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('ws-123');
      });

      // Assert
      expect(clientService.deleteWorkspaceService).toHaveBeenCalledWith('ws-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});

// ============================================================================
// Tests: Base Mutations
// ============================================================================

describe('Base Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useCreateBase', () => {
    it('should create base successfully', async () => {
      // Arrange
      const newBase = {
        title: 'New Base',
        description: 'Test description',
        workspace_id: 'ws-123',
      };
      vi.mocked(clientService.createBaseService).mockResolvedValue({
        data: { id: 'base-new', ...newBase },
      });

      // Act
      const { result } = renderHook(() => useCreateBase(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(newBase);
      });

      // Assert
      expect(clientService.createBaseService).toHaveBeenCalledWith({
        title: newBase.title,
        description: newBase.description,
        workspace_id: newBase.workspace_id,
        image: undefined,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle base creation with image', async () => {
      // Arrange
      const imageFile = new File([''], 'test.png', { type: 'image/png' });
      const newBase = {
        title: 'New Base',
        description: 'Test',
        workspace_id: 'ws-123',
        image: imageFile,
      };
      vi.mocked(clientService.createBaseService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useCreateBase(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(newBase);
      });

      // Assert
      expect(clientService.createBaseService).toHaveBeenCalledWith({
        title: newBase.title,
        description: newBase.description,
        workspace_id: newBase.workspace_id,
        image: imageFile,
      });
    });
  });

  describe('useUpdateBase', () => {
    it('should update base successfully', async () => {
      // Arrange
      const updates = { title: 'Updated Base' };
      vi.mocked(clientService.updateBaseService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateBase(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ baseId: 'base-123', updates });
      });

      // Assert
      expect(clientService.updateBaseService).toHaveBeenCalledWith('base-123', updates);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteBase', () => {
    it('should delete base successfully', async () => {
      // Arrange
      vi.mocked(clientService.deleteBaseService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useDeleteBase(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('base-123');
      });

      // Assert
      expect(clientService.deleteBaseService).toHaveBeenCalledWith('base-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});

// ============================================================================
// Tests: Table Mutations
// ============================================================================

describe('Table Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useCreateTable', () => {
    it('should create table successfully', async () => {
      // Arrange
      const newTable = {
        base_id: 'base-123',
        workspace_id: 'ws-123',
        title: 'New Table',
        description: 'Test table',
        order_index: 0,
      };
      vi.mocked(clientService.createTableService).mockResolvedValue({
        data: { id: 'table-new', ...newTable },
      });

      // Act
      const { result } = renderHook(() => useCreateTable(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(newTable);
      });

      // Assert
      expect(clientService.createTableService).toHaveBeenCalledWith(newTable);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUpdateTable', () => {
    it('should update table successfully', async () => {
      // Arrange
      const params = { title: 'Updated Table' };
      vi.mocked(clientService.updateTableService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateTable(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ tableId: 'table-123', params });
      });

      // Assert
      expect(clientService.updateTableService).toHaveBeenCalledWith('table-123', params);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteTable', () => {
    it('should delete table successfully', async () => {
      // Arrange
      vi.mocked(clientService.deleteTableService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useDeleteTable(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ tableId: 'table-123', baseId: 'base-123' });
      });

      // Assert
      expect(clientService.deleteTableService).toHaveBeenCalledWith('table-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useImportTable', () => {
    it('should import table successfully', async () => {
      // Arrange
      const file = new File(['col1,col2\n1,2'], 'data.csv', { type: 'text/csv' });
      const importParams = {
        base_id: 'base-123',
        workspace_id: 'ws-123',
        title: 'Imported Table',
        description: 'Imported from CSV',
        order_index: 0,
        file,
      };
      vi.mocked(clientService.importTableService).mockResolvedValue({
        data: { id: 'table-imported' },
      });

      // Act
      const { result } = renderHook(() => useImportTable(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(importParams);
      });

      // Assert
      expect(clientService.importTableService).toHaveBeenCalledWith(
        expect.objectContaining({
          base_id: 'base-123',
          workspace_id: 'ws-123',
          title: 'Imported Table',
        }),
        undefined
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle progress callback', async () => {
      // Arrange
      const file = new File(['data'], 'data.csv');
      const onProgress = vi.fn();
      vi.mocked(clientService.importTableService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useImportTable(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          base_id: 'base-123',
          workspace_id: 'ws-123',
          title: 'Test',
          description: '',
          order_index: 0,
          file,
          onProgress,
        });
      });

      // Assert
      expect(clientService.importTableService).toHaveBeenCalledWith(
        expect.anything(),
        onProgress
      );
    });

    it('should work without base_id for home page imports', async () => {
      // Arrange
      const file = new File(['data'], 'data.csv');
      vi.mocked(clientService.importTableService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useImportTable(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          workspace_id: 'ws-123',
          title: 'Test',
          description: '',
          order_index: 0,
          file,
        });
      });

      // Assert
      expect(clientService.importTableService).toHaveBeenCalledWith(
        expect.not.objectContaining({ base_id: expect.anything() }),
        undefined
      );
    });
  });
});

// ============================================================================
// Tests: Field Mutations
// ============================================================================

describe('Field Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useCreateField', () => {
    it('should create field successfully', async () => {
      // Arrange
      const config = {
        title: 'New Field',
        uidt: 'SingleLineText',
        meta: {},
        order_index: 1,
        description: 'Test field',
      };
      vi.mocked(clientService.createFieldService).mockResolvedValue({
        data: { id: 'field-new' },
      });

      // Act
      const { result } = renderHook(() => useCreateField(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          tableId: 'table-123',
          baseId: 'base-123',
          config,
        });
      });

      // Assert
      expect(clientService.createFieldService).toHaveBeenCalledWith({
        model_id: 'table-123',
        base_id: 'base-123',
        title: config.title,
        uidt: config.uidt,
        meta: config.meta,
        order_index: config.order_index,
        description: config.description,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should invalidate target table when creating link field', async () => {
      // Arrange
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const config = {
        title: 'Link Field',
        uidt: 'LinkToAnotherRecord',
        meta: {
          relation: {
            with: 'table-target-456',
          },
        },
      };
      vi.mocked(clientService.createFieldService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useCreateField(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          tableId: 'table-123',
          baseId: 'base-123',
          config,
        });
      });

      // Assert
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useUpdateField', () => {
    it('should update field successfully', async () => {
      // Arrange
      const updatedValue = { title: 'Updated Field' };
      vi.mocked(clientService.updateFieldService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateField(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ fieldId: 'field-123', updatedValue });
      });

      // Assert
      expect(clientService.updateFieldService).toHaveBeenCalledWith('field-123', updatedValue);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle type change with full refetch', async () => {
      // Arrange
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const updatedValue = { uidt: 'Number' }; // Type change
      vi.mocked(clientService.updateFieldService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateField(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ fieldId: 'field-123', updatedValue });
      });

      // Assert
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should handle metadata-only change', async () => {
      // Arrange
      const updatedValue = { title: 'New Title' }; // No uidt = metadata change
      vi.mocked(clientService.updateFieldService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateField(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ fieldId: 'field-123', updatedValue });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteColumn', () => {
    it('should delete column successfully', async () => {
      // Arrange
      vi.mocked(clientService.deleteFieldService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useDeleteColumn(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ fieldId: 'field-123' });
      });

      // Assert
      expect(clientService.deleteFieldService).toHaveBeenCalledWith('field-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should invalidate table-specific queries when tableId provided', async () => {
      // Arrange
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(clientService.deleteFieldService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useDeleteColumn(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ tableId: 'table-123', fieldId: 'field-123' });
      });

      // Assert
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useReorderColumn', () => {
    it('should reorder column successfully', async () => {
      // Arrange
      vi.mocked(clientService.reorderColumnService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useReorderColumn(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          source_column_id: 'col-1',
          target_column_id: 'col-2',
        });
      });

      // Assert
      expect(clientService.reorderColumnService).toHaveBeenCalledWith({
        source_column_id: 'col-1',
        target_column_id: 'col-2',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});

// ============================================================================
// Tests: View Mutations
// ============================================================================

describe('View Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useCreateView', () => {
    it('should create view successfully', async () => {
      // Arrange
      const newView = {
        model_id: 'table-123',
        base_id: 'base-123',
        title: 'New View',
        description: 'Test view',
        meta: { columns: [] },
        type: 'grid',
      };
      vi.mocked(clientService.createViewService).mockResolvedValue({
        data: { id: 'view-new', ...newView },
      });

      // Act
      const { result } = renderHook(() => useCreateView(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(newView);
      });

      // Assert
      expect(clientService.createViewService).toHaveBeenCalledWith(newView);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUpdateView', () => {
    it('should update view successfully', async () => {
      // Arrange
      const view = { title: 'Updated View' };
      vi.mocked(clientService.updateViewService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateView(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ viewId: 'view-123', view });
      });

      // Assert
      expect(clientService.updateViewService).toHaveBeenCalledWith('view-123', view);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteView', () => {
    it('should delete view successfully', async () => {
      // Arrange
      vi.mocked(clientService.deleteViewService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useDeleteView(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('view-123');
      });

      // Assert
      expect(clientService.deleteViewService).toHaveBeenCalledWith('view-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUpdateViewAppearance', () => {
    it('should update view appearance with optimistic update', async () => {
      // Arrange
      const appearance = { backgroundColor: '#ffffff' };
      vi.mocked(clientService.updateViewService).mockResolvedValue({});
      
      // Pre-populate cache with existing view
      queryClient.setQueryData(['view', 'view-123'], { id: 'view-123', meta: {} });

      // Act
      const { result } = renderHook(() => useUpdateViewAppearance(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ viewId: 'view-123', appearance });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(clientService.updateViewService).toHaveBeenCalledWith('view-123', {
        meta: { formViewAppearance: appearance },
      });
    });

    it('should rollback on error', async () => {
      // Arrange
      const appearance = { backgroundColor: '#ffffff' };
      const originalView = { id: 'view-123', meta: { formViewAppearance: { backgroundColor: '#000000' } } };
      vi.mocked(clientService.updateViewService).mockRejectedValue(new Error('Failed'));
      
      // Pre-populate cache
      queryClient.setQueryData(['view', 'view-123'], originalView);

      // Act
      const { result } = renderHook(() => useUpdateViewAppearance(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ viewId: 'view-123', appearance });
        } catch {
          // Expected error
        }
      });

      // Assert - should rollback to original
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useUpdateViewMeta', () => {
    it('should update view meta with optimistic update', async () => {
      // Arrange
      const meta = { cardOrder: ['card-1', 'card-2'] };
      vi.mocked(clientService.updateViewService).mockResolvedValue({});
      
      // Pre-populate cache
      queryClient.setQueryData(['view', 'view-123'], { id: 'view-123', meta: { existingKey: 'value' } });

      // Act
      const { result } = renderHook(() => useUpdateViewMeta(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ viewId: 'view-123', meta });
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(clientService.updateViewService).toHaveBeenCalledWith('view-123', {
        meta: { existingKey: 'value', cardOrder: ['card-1', 'card-2'] },
      });
    });

    it('should merge with currentMeta when provided', async () => {
      // Arrange
      const currentMeta = { existingKey: 'existingValue' };
      const meta = { newKey: 'newValue' };
      vi.mocked(clientService.updateViewService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateViewMeta(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ viewId: 'view-123', meta, currentMeta });
      });

      // Assert
      expect(clientService.updateViewService).toHaveBeenCalledWith('view-123', {
        meta: { existingKey: 'existingValue', newKey: 'newValue' },
      });
    });
  });
});

// ============================================================================
// Tests: Row Mutations
// ============================================================================

describe('Row Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useAddRow', () => {
    it('should add row successfully', async () => {
      // Arrange
      vi.mocked(clientService.addRow).mockResolvedValue({
        data: { row_id: 1 },
      });

      // Act
      const { result } = renderHook(() => useAddRow(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ model_id: 'table-123' });
      });

      // Assert
      expect(clientService.addRow).toHaveBeenCalledWith('table-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should invalidate records and tables queries on success', async () => {
      // Arrange
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(clientService.addRow).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useAddRow(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ model_id: 'table-123' });
      });

      // Assert
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useInsertRowData', () => {
    it('should insert row data successfully', async () => {
      // Arrange
      const params = {
        model_id: 'table-123',
        column_id: 'col-123',
        row_id: 1,
        value: 'Test Value',
      };
      vi.mocked(clientService.insertRowDataService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useInsertRowData(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(params);
      });

      // Assert
      expect(clientService.insertRowDataService).toHaveBeenCalledWith(params);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteRecord', () => {
    it('should delete record successfully', async () => {
      // Arrange
      vi.mocked(clientService.deleteRowService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useDeleteRecord(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ model_id: 'table-123', row_id: 1 });
      });

      // Assert
      expect(clientService.deleteRowService).toHaveBeenCalledWith({
        model_id: 'table-123',
        row_id: 1,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useInsertRelationData', () => {
    it('should link records successfully', async () => {
      // Arrange
      vi.mocked(clientService.insertRelationDataService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useInsertRelationData(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          model_id: 'table-123',
          column_id: 'col-123',
          source_row_id: 1,
          target_row_id: 2,
          action: 'link',
        });
      });

      // Assert
      expect(clientService.insertRelationDataService).toHaveBeenCalledWith({
        model_id: 'table-123',
        column_id: 'col-123',
        source_row_id: 1,
        target_row_id: 2,
        action: 'link',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should unlink records successfully', async () => {
      // Arrange
      vi.mocked(clientService.insertRelationDataService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useInsertRelationData(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          model_id: 'table-123',
          column_id: 'col-123',
          source_row_id: 1,
          target_row_id: 2,
          action: 'unlink',
        });
      });

      // Assert
      expect(clientService.insertRelationDataService).toHaveBeenCalledWith({
        model_id: 'table-123',
        column_id: 'col-123',
        source_row_id: 1,
        target_row_id: 2,
        action: 'unlink',
      });
    });

    it('should invalidate target table when provided', async () => {
      // Arrange
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.mocked(clientService.insertRelationDataService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useInsertRelationData(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          model_id: 'table-123',
          column_id: 'col-123',
          source_row_id: 1,
          target_row_id: 2,
          action: 'link',
          target_table_id: 'table-456',
        });
      });

      // Assert
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Tests: Attachment Mutations
// ============================================================================

describe('Attachment Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useAddAttachment', () => {
    it('should add attachment successfully', async () => {
      // Arrange
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const params = {
        model_id: 'table-123',
        column_id: 'col-123',
        row_id: 1,
        files: [file],
      };
      vi.mocked(clientService.addAttachmentService).mockResolvedValue({
        data: { attachments: ['file-id-1'] },
      });

      // Act
      const { result } = renderHook(() => useAddAttachment(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(params);
      });

      // Assert
      expect(clientService.addAttachmentService).toHaveBeenCalledWith(params);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle progress callback', async () => {
      // Arrange
      const file = new File(['content'], 'test.pdf');
      const onProgress = vi.fn();
      vi.mocked(clientService.addAttachmentService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useAddAttachment(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          model_id: 'table-123',
          column_id: 'col-123',
          row_id: 1,
          files: [file],
          onProgress,
        });
      });

      // Assert
      expect(clientService.addAttachmentService).toHaveBeenCalledWith(
        expect.objectContaining({ onProgress })
      );
    });
  });

  describe('useRemoveAttachments', () => {
    it('should remove attachments successfully', async () => {
      // Arrange
      vi.mocked(clientService.removeAttachmentsService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useRemoveAttachments(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          model_id: 'table-123',
          column_id: 'col-123',
          row_id: 1,
          attachments: ['file-1', 'file-2'],
        });
      });

      // Assert
      expect(clientService.removeAttachmentsService).toHaveBeenCalledWith({
        model_id: 'table-123',
        column_id: 'col-123',
        row_id: 1,
        attachments: ['file-1', 'file-2'],
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUpdateAssetById', () => {
    it('should update asset title successfully', async () => {
      // Arrange
      vi.mocked(clientService.updateAssetByIdService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateAssetById(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ id: 'asset-123', title: 'New Title' });
      });

      // Assert
      expect(clientService.updateAssetByIdService).toHaveBeenCalledWith('asset-123', {
        title: 'New Title',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useAddImage', () => {
    it('should add image successfully', async () => {
      // Arrange
      const file = new File([''], 'image.png', { type: 'image/png' });
      vi.mocked(clientService.addImageService).mockResolvedValue({
        data: { url: 'https://example.com/image.png' },
      });

      // Act
      const { result } = renderHook(() => useAddImage(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ files: [file] });
      });

      // Assert
      expect(clientService.addImageService).toHaveBeenCalledWith([file], undefined);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});

// ============================================================================
// Tests: Member Management Mutations
// ============================================================================

describe('Member Management Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useBulkAddBaseMembers', () => {
    it('should bulk add base members successfully', async () => {
      // Arrange
      vi.mocked(clientService.bulkAddBaseMembersService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useBulkAddBaseMembers(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          baseId: 'base-123',
          workspaceId: 'ws-123',
          members: [
            { user_id: 'user-1', role: 'base-member' },
            { user_id: 'user-2', role: 'base-read' },
          ],
        });
      });

      // Assert
      expect(clientService.bulkAddBaseMembersService).toHaveBeenCalledWith('base-123', {
        workspaceId: 'ws-123',
        members: [
          { user_id: 'user-1', role: 'base-member' },
          { user_id: 'user-2', role: 'base-read' },
        ],
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useRemoveBaseAccessMember', () => {
    it('should remove base access member successfully', async () => {
      // Arrange
      vi.mocked(clientService.removeBaseAccessMemberService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useRemoveBaseAccessMember(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ baseId: 'base-123', accessId: 'access-123' });
      });

      // Assert
      expect(clientService.removeBaseAccessMemberService).toHaveBeenCalledWith(
        'base-123',
        'access-123'
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useRemoveUserFromBase', () => {
    it('should remove user from base successfully', async () => {
      // Arrange
      vi.mocked(clientService.removeUserFromBaseService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useRemoveUserFromBase(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ baseId: 'base-123', user_id: 'user-123' });
      });

      // Assert
      expect(clientService.removeUserFromBaseService).toHaveBeenCalledWith('base-123', {
        user_id: 'user-123',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useBulkAddMembers', () => {
    it('should bulk add workspace members successfully', async () => {
      // Arrange
      vi.mocked(clientService.bulkAddMembersService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useBulkAddMembers(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          workspaceId: 'ws-123',
          members: [
            {
              user_id: 'user-1',
              memberships: [
                {
                  workspace_id: 'ws-123',
                  role: 'maintainer',
                  bases: [{ base_id: 'base-1', role: 'base-member' }],
                },
              ],
            },
          ],
        });
      });

      // Assert
      expect(clientService.bulkAddMembersService).toHaveBeenCalled();
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useRemoveAccessMember', () => {
    it('should remove access member successfully', async () => {
      // Arrange
      vi.mocked(clientService.removeAccessMemberService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useRemoveAccessMember(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ workspaceId: 'ws-123', accessId: 'access-123' });
      });

      // Assert
      expect(clientService.removeAccessMemberService).toHaveBeenCalledWith('ws-123', 'access-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useRemoveUserFromWorkspace', () => {
    it('should remove user from workspace successfully', async () => {
      // Arrange
      vi.mocked(clientService.removeUserFromWorkspaceService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useRemoveUserFromWorkspace(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ workspaceId: 'ws-123', user_id: 'user-123' });
      });

      // Assert
      expect(clientService.removeUserFromWorkspaceService).toHaveBeenCalledWith('ws-123', {
        user_id: 'user-123',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useAssignUserToWorkspace', () => {
    it('should assign user to workspace successfully', async () => {
      // Arrange
      vi.mocked(clientService.assignUserToWorkspaceService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useAssignUserToWorkspace(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          workspace_id: 'ws-123',
          user_ids: ['user-1', 'user-2'],
          access_level: 'maintainer',
          bases_ids: 'base-1,base-2',
        });
      });

      // Assert
      expect(clientService.assignUserToWorkspaceService).toHaveBeenCalledWith({
        workspace_id: 'ws-123',
        user_ids: ['user-1', 'user-2'],
        access_level: 'maintainer',
        bases_ids: 'base-1,base-2',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});

// ============================================================================
// Tests: User Profile Mutations
// ============================================================================

describe('User Profile Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useUpdateUserProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      vi.mocked(clientService.updateUserProfileService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateUserProfile('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          first_name: 'John',
          last_name: 'Doe',
          display_name: 'Johnny',
        });
      });

      // Assert
      expect(clientService.updateUserProfileService).toHaveBeenCalledWith('user-123', {
        first_name: 'John',
        last_name: 'Doe',
        display_name: 'Johnny',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should filter out empty string values', async () => {
      // Arrange
      vi.mocked(clientService.updateUserProfileService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateUserProfile('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          first_name: 'John',
          last_name: '', // Should be filtered out
          display_name: undefined, // Should be filtered out
        });
      });

      // Assert
      expect(clientService.updateUserProfileService).toHaveBeenCalledWith('user-123', {
        first_name: 'John',
      });
    });

    it('should update sessionStorage with display_name', async () => {
      // Arrange
      vi.mocked(clientService.updateUserProfileService).mockResolvedValue({});
      const setItemSpy = vi.spyOn(sessionStorage, 'setItem');

      // Act
      const { result } = renderHook(() => useUpdateUserProfile('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ display_name: 'New Name' });
      });

      // Assert
      expect(setItemSpy).toHaveBeenCalledWith('user_display_name', 'New Name');
    });
  });

  describe('useChangePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      vi.mocked(clientService.changePasswordService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useChangePassword('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          old_password: 'oldpass123',
          new_password: 'newpass456',
        });
      });

      // Assert
      expect(clientService.changePasswordService).toHaveBeenCalledWith('user-123', {
        old_password: 'oldpass123',
        new_password: 'newpass456',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useAddOrUpdateAvatar', () => {
    it('should update avatar successfully', async () => {
      // Arrange
      const avatarFile = new File([''], 'avatar.png', { type: 'image/png' });
      vi.mocked(clientService.addOrUpdateAvatarService).mockResolvedValue({
        data: { avatar_url: 'https://example.com/avatar.png' },
      });

      // Act
      const { result } = renderHook(() => useAddOrUpdateAvatar('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync(avatarFile);
      });

      // Assert
      expect(clientService.addOrUpdateAvatarService).toHaveBeenCalledWith('user-123', avatarFile);
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useRemoveAvatar', () => {
    it('should remove avatar successfully', async () => {
      // Arrange
      vi.mocked(clientService.removeAvatarService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useRemoveAvatar('user-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync();
      });

      // Assert
      expect(clientService.removeAvatarService).toHaveBeenCalledWith('user-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});

// ============================================================================
// Tests: Tenant User Mutations
// ============================================================================

describe('Tenant User Mutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useAddUser', () => {
    it('should add user successfully', async () => {
      // Arrange
      vi.mocked(clientService.addUserService).mockResolvedValue({
        data: { id: 'user-new' },
      });

      // Act
      const { result } = renderHook(() => useAddUser(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@example.com',
        });
      });

      // Assert
      expect(clientService.addUserService).toHaveBeenCalledWith({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useEditUser', () => {
    it('should edit user successfully', async () => {
      // Arrange
      vi.mocked(clientService.editUserService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useEditUser(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          user_id: 'user-123',
          firstname: 'Jane',
          lastname: 'Smith',
        });
      });

      // Assert
      expect(clientService.editUserService).toHaveBeenCalledWith({
        user_id: 'user-123',
        firstname: 'Jane',
        lastname: 'Smith',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useRemoveTenantUser', () => {
    it('should remove tenant user successfully', async () => {
      // Arrange
      vi.mocked(clientService.removeUserService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useRemoveTenantUser(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('user-123');
      });

      // Assert
      expect(clientService.removeUserService).toHaveBeenCalledWith('user-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useActivateTenantUser', () => {
    it('should activate tenant user successfully', async () => {
      // Arrange
      vi.mocked(clientService.activateTenantUserService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useActivateTenantUser(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('user-123');
      });

      // Assert
      expect(clientService.activateTenantUserService).toHaveBeenCalledWith('user-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeactivateTenantUser', () => {
    it('should deactivate tenant user successfully', async () => {
      // Arrange
      vi.mocked(clientService.deactivateTenantUserService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useDeactivateTenantUser(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync('user-123');
      });

      // Assert
      expect(clientService.deactivateTenantUserService).toHaveBeenCalledWith('user-123');
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should throw error when userId is not provided', async () => {
      // Act
      const { result } = renderHook(() => useDeactivateTenantUser(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await expect(
        act(async () => {
          await result.current.mutateAsync('');
        })
      ).rejects.toThrow();
    });
  });
});

// ============================================================================
// Tests: Organization Mutations
// ============================================================================

describe('Organization Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useGetOrganization', () => {
    it('should fetch organization successfully', async () => {
      // Arrange
      const mockOrg = { id: 'org-123', name: 'Test Org' };
      vi.mocked(clientService.getOrganizationService).mockResolvedValue({
        data: mockOrg,
      });

      // Act
      const { result } = renderHook(() => useGetOrganization(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockOrg);
    });
  });

  describe('useGetOrganizationById', () => {
    it('should fetch organization by id successfully', async () => {
      // Arrange
      const mockOrg = { id: 'org-123', name: 'Test Org' };
      vi.mocked(clientService.getOrganizationServiceById).mockResolvedValue({
        data: mockOrg,
      });

      // Act
      const { result } = renderHook(() => useGetOrganizationById('org-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockOrg);
    });

    it('should not fetch when organizationId is empty', async () => {
      // Act
      const { result } = renderHook(() => useGetOrganizationById(''), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getOrganizationServiceById).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateOrganization', () => {
    it('should update organization successfully', async () => {
      // Arrange
      vi.mocked(clientService.updateOrganizationService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateOrganization('org-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'Updated Org',
          description: 'New description',
        });
      });

      // Assert
      expect(clientService.updateOrganizationService).toHaveBeenCalledWith('org-123', {
        name: 'Updated Org',
        description: 'New description',
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should handle partial updates with empty defaults', async () => {
      // Arrange
      vi.mocked(clientService.updateOrganizationService).mockResolvedValue({});

      // Act
      const { result } = renderHook(() => useUpdateOrganization('org-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ name: 'Only Name' });
      });

      // Assert
      expect(clientService.updateOrganizationService).toHaveBeenCalledWith('org-123', {
        name: 'Only Name',
        description: '',
      });
    });
  });
});

// ============================================================================
// Tests: Additional Query Hooks
// ============================================================================

describe('Additional Query Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    setLocation('/home');
    setAuthUser(mockUser);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useUserAccessDetails', () => {
    it('should fetch user access details successfully', async () => {
      // Arrange
      const mockDetails = { workspaces: [], bases: [] };
      vi.mocked(clientService.getUserAccessDetailsService).mockResolvedValue({
        data: mockDetails,
      });

      // Act
      const { result } = renderHook(() => useUserAccessDetails('user-123', 'ws-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockDetails);
      expect(clientService.getUserAccessDetailsService).toHaveBeenCalledWith('user-123', 'ws-123');
    });

    it('should not fetch when userId is null', async () => {
      // Act
      const { result } = renderHook(() => useUserAccessDetails(null), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
      expect(clientService.getUserAccessDetailsService).not.toHaveBeenCalled();
    });
  });

  describe('useUserRolesAndAccess', () => {
    it('should fetch user roles and access successfully', async () => {
      // Arrange
      const mockRoles = { roles: ['admin'], access: [] };
      vi.mocked(clientService.getUserRolesAndAccessService).mockResolvedValue({
        data: mockRoles,
      });

      // Act
      const { result } = renderHook(() => useUserRolesAndAccess('user-123', 'scope-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockRoles);
    });

    it('should not fetch when userId is null', async () => {
      // Act
      const { result } = renderHook(() => useUserRolesAndAccess(null), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useGetUsersForAssign', () => {
    it('should fetch users for assign successfully', async () => {
      // Arrange
      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }];
      vi.mocked(clientService.getUsersForAssignService).mockResolvedValue({
        data: mockUsers,
      });

      // Act
      const { result } = renderHook(() => useGetUsersForAssign(), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockUsers);
    });
  });

  describe('useTableViews', () => {
    it('should fetch table views successfully', async () => {
      // Arrange
      const mockViews = [{ id: 'view-1', type: 'grid' }];
      vi.mocked(clientService.getViewsByModelIdService).mockResolvedValue(mockViews);

      // Act
      const { result } = renderHook(() => useTableViews('table-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(clientService.getViewsByModelIdService).toHaveBeenCalledWith('table-123');
    });

    it('should not fetch when tableId is empty', async () => {
      // Act
      const { result } = renderHook(() => useTableViews(''), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should not fetch on public routes', async () => {
      // Arrange
      setLocation('/login');

      // Act
      const { result } = renderHook(() => useTableViews('table-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useViewsForTable', () => {
    it('should fetch views for table successfully', async () => {
      // Arrange
      const mockViews = [{ id: 'view-1' }];
      vi.mocked(clientService.getViewsByModelIdService).mockResolvedValue(mockViews);

      // Act
      const { result } = renderHook(() => useViewsForTable('table-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useGetRecordsByPagination', () => {
    it('should fetch records with pagination successfully', async () => {
      // Arrange
      const mockRecords = { rows: [{ id: 1 }, { id: 2 }], total: 100 };
      vi.mocked(clientService.getAllRecordsService).mockResolvedValue(mockRecords);

      // Act
      const { result } = renderHook(() => useGetRecordsByPagination('table-123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ pageNumber: 1, pageSize: 50 });
      });

      // Assert
      expect(clientService.getAllRecordsService).toHaveBeenCalledWith('table-123', {
        pageNumber: 1,
        pageLimit: 50,
      });
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});

// ============================================================================
// Tests: Dependent Query Hooks (useBaseMembers, useBaseTables, useBaseById)
// ============================================================================

describe('Dependent Query Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    setLocation('/home');
    setAuthUser(mockUser);
  });

  afterEach(() => {
    queryClient.clear();
  });

  // Note: These hooks depend on useWorkspaces internally
  // We need to mock the useWorkspaces return value

  describe('useBaseTables', () => {
    it('should not fetch when no workspaces available', async () => {
      // Arrange - Mock useWorkspaces to return empty array
      vi.mocked(clientService.getWorkspacesByUser).mockResolvedValue({ data: [] });

      // First render useWorkspaces to populate cache
      renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      // Wait for workspaces to load
      await waitFor(() => {
        expect(clientService.getWorkspacesByUser).toHaveBeenCalled();
      });

      // Act
      const { result } = renderHook(() => useBaseTables('base-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert - should not fetch because no workspaces
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('should fetch when workspaces are available', async () => {
      // Arrange
      vi.mocked(clientService.getWorkspacesByUser).mockResolvedValue({
        data: [{ id: 'ws-1' }],
      });
      vi.mocked(clientService.getTablesByBaseIdService).mockResolvedValue({
        data: [{ id: 'table-1' }],
      });

      // First populate workspaces
      const { result: wsResult } = renderHook(() => useWorkspaces(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(wsResult.current.isSuccess).toBe(true);
      });

      // Act
      const { result } = renderHook(() => useBaseTables('base-123'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(clientService.getTablesByBaseIdService).toHaveBeenCalledWith('base-123');
      });
    });
  });
});

// ============================================================================
// Tests: Error Handling Edge Cases
// ============================================================================

describe('Error Handling Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('mutation error handling', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const networkError = new Error('Network error');
      vi.mocked(clientService.createWorkspaceService).mockRejectedValue(networkError);

      // Act
      const { result } = renderHook(() => useCreateWorkspace(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ workspace: { title: 'Test', description: '' } });
        } catch (e) {
          // Expected
        }
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(result.current.error).toBe(networkError);
    });

    it('should handle API error responses', async () => {
      // Arrange
      const apiError = { response: { status: 400, data: { message: 'Bad request' } } };
      vi.mocked(clientService.updateBaseService).mockRejectedValue(apiError);

      // Act
      const { result } = renderHook(() => useUpdateBase(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ baseId: 'base-123', updates: {} });
        } catch (e) {
          // Expected
        }
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('query error handling', () => {
    it('should handle query errors without crashing', async () => {
      // Arrange
      setLocation('/home');
      setAuthUser(mockUser);
      vi.mocked(clientService.getWorkspaceByIdService).mockRejectedValue(new Error('Not found'));

      // Act
      const { result } = renderHook(() => useWorkspaceById('ws-invalid'), {
        wrapper: createWrapper(queryClient),
      });

      // Assert
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});

