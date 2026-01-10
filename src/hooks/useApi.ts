import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  // New workspace API services
  createWorkspaceService,
  getWorkspaceByIdService,
  updateWorkspaceService,
  deleteWorkspaceService,
  getBasesByWorkspaceIdService,
  getWorkspaceMembersService,
  // New base API services
  createBaseService,
  getBaseByIdService,
  updateBaseService,
  deleteBaseService,
  getAllBasesService,
  getBaseMembersService,
  removeBaseAccessMemberService,
  removeUserFromBaseService,
  // New table API services
  createTableService,
  getTableByIdService,
  updateTableService,
  deleteTableService,
  getTablesByBaseIdService,
  getAllTablesService,
  importTableService,
  // New field API services
  createFieldService,
  updateFieldService,
  deleteFieldService,
  getAllFieldsService,
  // New view API services
  createViewService,
  updateViewService,
  deleteViewService,
  getViewsByModelIdService,
  getViewByIdService,
  getAllViewsService,
  // User profile API services
  getUserProfileByIDService,
  updateUserProfileService,
  changePasswordService,
  addOrUpdateAvatarService,
  removeAvatarService,
  assignUserToWorkspaceService,
  bulkAddMembersService,
  removeUserFromWorkspaceService,
  bulkAddBaseMembersService,
  
  removeAccessMemberService,
  getUserAccessDetailsService,
  getUserRolesAndAccessService,
  // Tenant API services
  getTenantUsersService,
  getUsersForAssignService,
  addUserService,
  editUserService,
  activateTenantUserService,
  deactivateTenantUserService,
  removeUserService,
  addRow,
  deleteRowService,
  bulkDeleteRowService,
  insertRowDataService,
  insertRelationDataService,
  // Attachment services
  addAttachmentService,
  removeAttachmentsService,
  updateAssetByIdService,
  addImageService,
  reorderColumnService,
  getAllRecordsService,
  getWorkspacesByUser,
  //Organization Services 
  getOrganizationService,
  getOrganizationServiceById,
  updateOrganizationService
} from '../service/clientService';
import { WorkspaceBaseInput } from '../types/interfaces/workspace.interface';

// Query Keys
export const queryKeys = {
  workspaces: ['workspaces'] as const,
  workspace: (workspaceId: string) => ['workspace', workspaceId] as const,
  workspaceData: ['getDataByUser'] as const, // Legacy - keep for backward compatibility
  bases: (workspaceId: string) => ['workspaces', workspaceId, 'bases'] as const,
  allBases: ['allBases'] as const,
  tables: (baseId: string) => ['bases', baseId, 'tables'] as const,
  allTables: ['allTables'] as const,
  fields: (tableId: string) => ['tables', tableId, 'fields'] as const,
  allFields: ['allFields'] as const,
  views: (tableId: string) => ['tables', tableId, 'views'] as const,
  allViews: ['allViews'] as const,
  records: (tableId: string) => ['tables', tableId, 'records'] as const,
  recordValues: (recordId: string) => ['records', recordId, 'values'] as const,
  users: ['users'] as const,
  user: (userId: string) => ['user', userId] as const,
  userProfile: (id: string) => ['userProfile', id] as const,
};

// =========================
// Workspace APIs
// =========================

export const useWorkspaces = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Public routes that don't need workspace data
  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/auth/callback'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: async () => {
      try {
        const result: any = await getWorkspacesByUser();
        // Ensure we return the data in the expected format
        const data = result?.data;
        if (data) {
          return Array.isArray(data) ? data : [];
        }

        // Unexpected format handled gracefully by returning empty array
        return [];
      } catch (error: any) {
        console.error('❌ Workspace query failed:', error);

        // Handle 401/403 errors - force logout
        const errorStatus = error?.response?.status || error?.status;
        if (errorStatus === 401 || errorStatus === 403) {
          // Import and call forceLogout
          import('../service/clientService').then(({ forceLogout }) => {
            forceLogout();
          }).catch(() => {
            // If forceLogout fails, at least clear tokens and redirect
            sessionStorage.clear();
            localStorage.clear();
            globalThis.location.href = '/login';
          });
        }

        // If it's an auth validation error, provide helpful feedback
        if (error.message?.includes('Missing required authentication data')) {
          throw new Error('Authentication incomplete. Please log in again.');
        }

        throw error;
      }
    },
    // Keep workspaces warm to avoid duplicate calls across views
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      // Don't retry auth-related errors
      if (error.message?.includes('authentication') || error.message?.includes('schema')) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: !!user && !isPublicRoute, // Only fetch if user is authenticated and not on public routes
  });
};

// New: create empty row via TableService
export const useAddRow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ model_id }: { model_id: string }) => addRow(model_id),
    onSuccess: (_, { model_id }) => {
      // CRITICAL: Use refetchType: 'active' to bypass staleTime and update immediately
      // This ensures UI updates instantly after adding a row, regardless of cache age
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.records(model_id),
        refetchType: 'active' // Force immediate refetch - bypasses staleTime
      });
      queryClient.invalidateQueries({ 
        queryKey: ['tables', String(model_id)],
        refetchType: 'active' // Force immediate refetch - bypasses staleTime
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.views(model_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useWorkspaceById = (workspaceId: string) => {
  return useQuery({
    queryKey: queryKeys.workspace(workspaceId),
    queryFn: () => getWorkspaceByIdService(workspaceId),
    enabled: !!workspaceId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

export const useWorkspaceBases = (workspaceId: string) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Public routes that don't need workspace data
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

  return useQuery({
    queryKey: queryKeys.bases(workspaceId),
    queryFn: () => getBasesByWorkspaceIdService(workspaceId),
    enabled: !!workspaceId && !!user && !isPublicRoute, // Only fetch if user is authenticated and not on public routes
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

export const useWorkspaceMembers = (workspaceId: string) => {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'members'],
    queryFn: async () => {
      const result = await getWorkspaceMembersService(workspaceId);
      return result;
    },
    enabled: !!workspaceId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

export const useBulkAddBaseMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      baseId: string;
      workspaceId: string;
      members: Array<{
        user_id: string;
        role: string;
      }>;
    }) => {
      return await bulkAddBaseMembersService(params.baseId, { workspaceId: params.workspaceId, members: params.members });
    },
    onSuccess: (_, variables) => {
      // Invalidate base members query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['base', variables.baseId, 'members']
      });
      queryClient.invalidateQueries({
        queryKey: ['bases']
      });
      queryClient.invalidateQueries({
        queryKey: ['workspaces']
      });
    },
  });
};

export const useRemoveBaseAccessMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      baseId: string;
      accessId: string;
    }) => {
      return await removeBaseAccessMemberService(params.baseId, params.accessId);
    },
    onSuccess: (_, variables) => {
      // Invalidate base members query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['base', variables.baseId, 'members']
      });
      queryClient.invalidateQueries({
        queryKey: ['bases']
      });
    },
  });
};

export const useRemoveUserFromBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      baseId: string;
      user_id: string;
    }) => {
      return await removeUserFromBaseService(params.baseId, { user_id: params.user_id });
    },
    onSuccess: (_, variables) => {
      // Invalidate userRolesAndAccess queries to refresh role display in MembersTable
      queryClient.invalidateQueries({
        queryKey: ['userRolesAndAccess', variables.user_id],
        exact: false
      });
      // Invalidate base members query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['base', variables.baseId, 'members']
      });
      queryClient.invalidateQueries({
        queryKey: ['bases']
      });
    },
  });
};

export const useBaseMembers = (baseId: string) => {
  // Check if workspaces are available before making base API calls
  // This prevents 401 errors when user has no workspaces but baseId is still set
  const { data: workspacesData } = useWorkspaces();
  const workspaces = Array.isArray(workspacesData) ? workspacesData : [];
  const hasWorkspaces = workspaces.length > 0;

  return useQuery({
    queryKey: ['base', baseId, 'members'],
    queryFn: async () => {
      const result = await getBaseMembersService(baseId);
      return result;
    },
    enabled: !!baseId && hasWorkspaces,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

export const useBaseTables = (baseId: string) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Public routes that don't need base data
  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/auth/callback'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));
  
  // Check if workspaces are available before making base API calls
  // This prevents 401 errors when user has no workspaces but baseId is still set
  const { data: workspacesData } = useWorkspaces();
  const workspaces = Array.isArray(workspacesData) ? workspacesData : [];
  const hasWorkspaces = workspaces.length > 0;

  return useQuery({
    queryKey: queryKeys.tables(baseId),
    queryFn: () => getTablesByBaseIdService(baseId),
    enabled: !!baseId && !!user && hasWorkspaces && !isPublicRoute, // Only fetch if user is authenticated and not on public routes
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

// =========================
// Bulk API Hooks
// =========================

export const useAllBases = () => {
  return useQuery({
    queryKey: queryKeys.allBases,
    queryFn: async () => {
      try {
        const result = await getAllBasesService() as any;
        // Ensure we return the data in the expected format
        if (result?.data) {
          return Array.isArray(result.data) ? result.data : [];
        }
        return [];
      } catch (error) {
        console.error('❌ Failed to fetch all bases:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000,
  });
};

export const useAllTables = () => {
  return useQuery({
    queryKey: queryKeys.allTables,
    queryFn: async () => {
      try {
        const result = await getAllTablesService() as any;
        // Ensure we return the data in the expected format
        if (result?.data) {
          return Array.isArray(result.data) ? result.data : [];
        }
        return [];
      } catch (error) {
        console.error('❌ Failed to fetch all tables:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000,
  });
};

export const useAllFields = () => {
  return useQuery({
    queryKey: queryKeys.allFields,
    queryFn: async () => {
      try {
        const result = await getAllFieldsService() as any;
        // Ensure we return the data in the expected format
        if (result?.data) {
          return Array.isArray(result.data) ? result.data : [];
        }
        return [];
      } catch (error) {
        console.error('❌ Failed to fetch all fields:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000,
  });
};

export const useAllViews = () => {
  return useQuery({
    queryKey: queryKeys.allViews,
    queryFn: async () => {
      try {
        const result = await getAllViewsService() as any;
        // Ensure we return the data in the expected format
        if (result?.data) {
          return Array.isArray(result.data) ? result.data : [];
        }
        return [];
      } catch (error) {
        console.error('❌ Failed to fetch all views:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000,
  });
};

export const useBaseById = (baseId: string) => {
  // Check if workspaces are available before making base API calls
  // This prevents 401 errors when user has no workspaces but baseId is still set
  const { data: workspacesData } = useWorkspaces();
  const workspaces = Array.isArray(workspacesData) ? workspacesData : [];
  const hasWorkspaces = workspaces.length > 0;

  return useQuery({
    queryKey: ['bases', baseId],
    queryFn: () => getBaseByIdService(baseId),
    enabled: !!baseId && hasWorkspaces,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

export const useTable = (tableId: string, options?: any) => {
  return useQuery({
    queryKey: ['tables', tableId],
    queryFn: () => getTableByIdService(tableId, options),
    enabled: !!tableId,
    staleTime: 5 * 60 * 1000, // Increased from 2 to 5 minutes - faster navigation between views
    gcTime: 15 * 60 * 1000, // Increased from 10 to 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Show cached data immediately while refetching (for background updates)
    // This ensures instant UI when navigating between views if data is cached
    placeholderData: (previousData) => previousData,
  });
};

export const useTableViews = (tableId: string) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Public routes that don't need view data
  const publicRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));

  return useQuery({
    queryKey: queryKeys.views(tableId),
    queryFn: () => getViewsByModelIdService(tableId),
    enabled: !!tableId && !!user && !isPublicRoute, // Only fetch if user is authenticated and not on public routes
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

/**
 * Hook to fetch view by ID
 * Note: "grid", "form", "kanban", etc. are route slugs, not view IDs
 * Only fetch if viewId looks like a UUID/ID (not a slug)
 */
export const useViewById = (viewId: string) => {
  // List of known view type slugs (not IDs) - don't fetch these via API
  const viewTypeSlugs = ['grid', 'form', 'gallery', 'kanban', 'calendar', 'gantt'];
  const isSlug = viewTypeSlugs.includes(viewId?.toLowerCase());

  // Only enable if viewId exists and is not a slug
  // UUIDs are typically 36 chars with hyphens, slugs are short strings
  const looksLikeId = Boolean(viewId && viewId.length > 10 && viewId.includes('-'));

  return useQuery({
    queryKey: ['view', viewId],
    queryFn: async () => {
      const result = await getViewByIdService(viewId) as any;
      return result?.data;
    },
    enabled: !!viewId && !isSlug && looksLikeId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });
};

// Workspace Mutation Hooks
export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspace }: { workspace: WorkspaceBaseInput }) =>
      createWorkspaceService(workspace),
    onSuccess: (data: any) => {
      // Invalidate and immediately refetch workspaces list for instant UI update
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.workspaces,
        refetchType: 'active' // Force immediate refetch for active queries
      });
      
      // If the new workspace has an ID, invalidate its bases query
      const newWorkspaceId = data?.data?.id || data?.id;
      if (newWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.bases(newWorkspaceId) });
      }
      
      // Also invalidate all workspace-related queries to ensure bases are refreshed
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, updates }: { workspaceId: string; updates: any }) =>
      updateWorkspaceService(workspaceId, updates),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      // Use new API for workspace deletion
      return await deleteWorkspaceService(workspaceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

// =========================
// Base APIs
// =========================

export const useCreateBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, description, workspace_id, image }: { title: string; description: string; workspace_id: string; image?: File | Blob | null }) => {
      // Directly pass the SDK CreateBase interface
      return createBaseService({ title, description, workspace_id, image: image || undefined });
    },
    onSuccess: (_, { workspace_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bases(workspace_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspace_id) });
    },
  });
};

export const useDeleteBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (baseId: string) => deleteBaseService(baseId),
    onSuccess: () => {
      // Invalidate all workspace-related queries since base structure changed
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useUpdateBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ baseId, updates }: { baseId: string; updates: any }) =>
      updateBaseService(baseId, updates),
    onSuccess: (_, { baseId }) => {
      // Invalidate base by ID query (used by BaseSettingsTab)
      queryClient.invalidateQueries({ queryKey: ['bases', baseId] });

      // Invalidate all workspaces queries to refresh base lists
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });

      // Invalidate all bases queries (this will refresh bases in workspace lists)
      queryClient.invalidateQueries({ queryKey: queryKeys.allBases });

      // Get the base data to invalidate workspace-specific bases if available
      const baseData = queryClient.getQueryData(['bases', baseId]);
      if (baseData && typeof baseData === 'object' && 'data' in baseData) {
        const workspaceId = (baseData as { data?: { workspace_id?: string } }).data?.workspace_id;
        if (workspaceId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.bases(workspaceId) });
        } else {
          // Fallback: invalidate all workspace bases queries
          queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        }
      } else {
        // Fallback: invalidate all workspace bases queries
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      }
    },
  });
};

// =========================
// Table APIs
// =========================

export const useCreateTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ base_id, workspace_id, title, description, order_index }: { base_id: string; workspace_id: string; title: string; description?: string, order_index?: number }) => {
      return createTableService({ base_id, workspace_id, title, description, order_index });
    },
    onSuccess: (_, { base_id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables(base_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, params }: { tableId: string; params: any }) =>
      updateTableService(tableId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, baseId: _baseId }: { tableId: string; baseId: string }) => deleteTableService(tableId),
    onSuccess: (_, { baseId }) => {
      // Invalidate the specific base's tables query
      queryClient.invalidateQueries({ queryKey: queryKeys.tables(baseId) });
      // Also invalidate workspaces to update any workspace-level data
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useImportTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      base_id,
      workspace_id,
      title,
      description,
      order_index,
      file,
      onProgress,
    }: {
      base_id?: string; // Optional: required from sidebar, optional from home page
      workspace_id: string;
      title: string;
      description: string;
      order_index: number;
      file: File;
      onProgress?: (progressEvent: ProgressEvent) => void;
    }) => {
      return importTableService(
        {
          ...(base_id && { base_id }), // Only include base_id if provided
          workspace_id,
          title,
          description,
          order_index,
          file,
        },
        onProgress
      );
    },
    retry: false, // Disable automatic retries to prevent duplicate table creation
    onSuccess: (_, { base_id }) => {
      // Invalidate the specific base's tables query if base_id is provided
      if (base_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tables(base_id) });
      }
      // Also invalidate workspaces to update any workspace-level data
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

// =========================
// Column APIs
// =========================

export const useCreateField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, baseId, config }: { tableId: string; baseId: string, config: any }) => {
      const fieldParams = {
        model_id: tableId,
        base_id: baseId,
        title: config.title,
        uidt: config.uidt,
        meta: config.meta || {},
        order_index: config.order_index,
        description: config.description || '',
      };
      return createFieldService(fieldParams);
    },
    onSuccess: (_, { tableId, config }) => {
      // Invalidate source table
      queryClient.invalidateQueries({ queryKey: queryKeys.fields(tableId) });
      queryClient.invalidateQueries({ queryKey: ['tables', String(tableId)] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });

      // If this is a link field, also invalidate the target table's cache
      // Performance note: invalidateQueries with refetchType: 'active' only refetches
      // queries that are currently mounted/active. If the target table isn't open,
      // this has zero performance impact - no refetch happens.
      // Only when navigating to the target table will it refetch (which is when we want fresh data)
      if (config?.meta?.relation?.with) {
        const targetTableId = config.meta.relation.with;
        queryClient.invalidateQueries({
          queryKey: ['tables', String(targetTableId)],
          refetchType: 'active' // Only refetch if query is currently active (table is open)
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.fields(targetTableId),
          refetchType: 'active'
        });
      }
    },
  });
};


export const useUpdateField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fieldId, updatedValue }: { fieldId: string; updatedValue: any }) =>
      updateFieldService(fieldId, updatedValue),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });

      // Check if this is a type change (affects data structure - needs full refetch)
      const isTypeChange = variables.updatedValue.uidt !== undefined;

      if (isTypeChange) {
        // Type change: invalidate and refetch (data structure changed)
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && key[0] === 'tables';
          },
          refetchType: 'active', // Force refetch for type changes
        });
      } else {
        // Metadata change: Force refetch with refetchType: 'active' to bypass staleTime
        // This ensures the query refetches immediately even if within staleTime window
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            // Match ['tables', tableId] pattern - specific table queries only
            return Array.isArray(key) && key[0] === 'tables' && key.length === 2;
          },
          refetchType: 'active', // CRITICAL: Force immediate refetch, bypasses staleTime
        });
      }
    },
  });
};

export const useDeleteColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fieldId }: { tableId?: string; fieldId: string }) =>
      deleteFieldService(fieldId),
    onSuccess: (_, { tableId }) => {
      if (tableId) queryClient.invalidateQueries({ queryKey: queryKeys.fields(tableId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useReorderColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ source_column_id, target_column_id }: { source_column_id: string; target_column_id: string }) =>
      reorderColumnService({ source_column_id, target_column_id }),
    onSuccess: () => {
      // Invalidate table and workspace queries to refresh column order
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

// =========================
// View APIs
// =========================

export const useCreateView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ model_id, base_id, title, description, meta, type }: { model_id: string; base_id: string; title: string; description?: string; meta: Record<string, any>, type: string }) => {
      return createViewService({ model_id, base_id, title, description, meta, type });
    },
    onSuccess: (_, { model_id, base_id }) => {
      // Invalidate views query for this table
      queryClient.invalidateQueries({ queryKey: queryKeys.views(model_id) });
      // Invalidate the table query itself (used by TableViewRouteWrapper) to refresh views array
      queryClient.invalidateQueries({ queryKey: ['tables', model_id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      // Invalidate baseTables query to refresh views in sidebar
      if (base_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tables(base_id) });
      }
      // Also invalidate all base tables queries as fallback
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });
};

/**
 * Optimized hook for updating view appearance only (background color, text color, etc.)
 * Uses optimistic cache updates and minimal invalidation for performance.
 * 
 * This should be used for appearance-only updates to avoid triggering
 * unnecessary refetches of all tables, bases, and workspaces.
 */
export const useUpdateViewAppearance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewId, appearance, currentMeta }: { viewId: string; appearance: any; currentMeta?: any }) => {
      // Merge appearance into existing meta (from parameter or cache)
      const existingMeta = currentMeta || (queryClient.getQueryData(['view', String(viewId)]) as any)?.meta || {};
      const newMeta = {
        ...existingMeta,
        formViewAppearance: appearance
      };
      return updateViewService(viewId, { meta: newMeta });
    },
    onMutate: async ({ viewId, appearance }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['view', String(viewId)] });

      // Snapshot previous value for rollback
      const previousView = queryClient.getQueryData(['view', String(viewId)]);

      // Optimistically update the view cache
      queryClient.setQueryData(['view', String(viewId)], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          meta: {
            ...old.meta,
            formViewAppearance: appearance
          }
        };
      });

      return { previousView };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousView) {
        queryClient.setQueryData(['view', String(variables.viewId)], context.previousView);
      }
    },
    onSuccess: (_, { viewId }) => {
      // Only invalidate the specific view query to ensure consistency
      // No need to invalidate all views, tables, bases, or workspaces for appearance changes
      queryClient.invalidateQueries({ 
        queryKey: ['view', String(viewId)],
        refetchType: 'none' // Don't refetch, we already updated optimistically
      });
    },
  });
};

/**
 * Optimized hook for updating view meta only (cardOrder, appearance, etc.)
 * Uses optimistic cache updates and minimal invalidation for performance.
 * 
 * This should be used for meta-only updates (like Kanban cardOrder) to avoid triggering
 * unnecessary refetches of all tables, bases, and workspaces.
 */
export const useUpdateViewMeta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewId, meta, currentMeta }: { viewId: string; meta: any; currentMeta?: any }) => {
      // Merge meta into existing meta (from parameter or cache)
      const existingMeta = currentMeta || (queryClient.getQueryData(['view', String(viewId)]) as any)?.meta || {};
      const newMeta = {
        ...existingMeta,
        ...meta
      };
      return updateViewService(viewId, { meta: newMeta });
    },
    onMutate: async ({ viewId, meta }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['view', String(viewId)] });

      // Snapshot previous value for rollback
      const previousView = queryClient.getQueryData(['view', String(viewId)]);

      // Optimistically update the view cache
      queryClient.setQueryData(['view', String(viewId)], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          meta: {
            ...old.meta,
            ...meta
          }
        };
      });

      return { previousView };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousView) {
        queryClient.setQueryData(['view', String(variables.viewId)], context.previousView);
      }
    },
    onSuccess: (_, { viewId }) => {
      // Only invalidate the specific view query to ensure consistency
      // No need to invalidate all views, tables, bases, or workspaces for meta changes
      queryClient.invalidateQueries({ 
        queryKey: ['view', String(viewId)],
        refetchType: 'none' // Don't refetch, we already updated optimistically
      });
    },
  });
};

/**
 * Hook for updating view structure (title, description, type, fieldConfig, etc.)
 * This triggers full invalidation as structural changes affect multiple components.
 */
export const useUpdateView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewId, view }: { viewId: string; view: any }) =>
      updateViewService(viewId, view),
    onSuccess: (_, { viewId, view }) => {
      // Invalidate both listing and the specific view cache
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['view', String(viewId)] });
      // Invalidate views for the specific table (model_id)
      if (view?.model_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.views(view.model_id) });
        // Also invalidate the table query itself (used by TableViewRouteWrapper) to refresh views array
        queryClient.invalidateQueries({ queryKey: ['tables', view.model_id] });
        // Refetch the specific table immediately to get fresh views data (no performance impact - only one table)
        queryClient.refetchQueries({ queryKey: ['tables', view.model_id] });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      // Also invalidate all table queries to refresh view data (including baseTables which contains views)
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      // Invalidate baseTables queries - pattern: ['bases', baseId, 'tables']
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });
};

export const useDeleteView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewId: string) => deleteViewService(viewId),
    onSuccess: () => {
      // Invalidate all view-related queries
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      // Also invalidate all table queries to refresh views array (since we don't have model_id here)
      // This ensures TableViewRouteWrapper and sidebar both get updated
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['bases'] });
    },
  });
};

export const useViewsForTable = (tableId: string) => {
  return useQuery({
    queryKey: queryKeys.views(tableId),
    queryFn: () => getViewsByModelIdService(tableId),
    enabled: !!tableId,
  });
};

// =========================
// Row APIs
// =========================
export const useInsertRowData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ model_id, column_id, row_id, value }: { model_id: string; column_id: string; row_id: number; value: any }) =>
      insertRowDataService({ model_id, column_id, row_id, value }),
    onSuccess: (_, vars) => {
      // CRITICAL: Use refetchType: 'active' to bypass staleTime and update immediately
      // This ensures UI updates instantly after cell edits, regardless of cache age
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.records(vars.model_id),
        refetchType: 'active' // Force immediate refetch - bypasses staleTime
      });
      queryClient.invalidateQueries({ 
        queryKey: ['tables', String(vars.model_id)],
        refetchType: 'active' // Force immediate refetch - bypasses staleTime
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};


export const useDeleteRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ model_id, row_id }: { model_id: string; row_id: number }) =>
      deleteRowService({ model_id, row_id }),
    onSuccess: (_, { model_id }) => {
      // CRITICAL: Use refetchType: 'active' to bypass staleTime and update immediately
      // This ensures UI updates instantly after record deletion, regardless of cache age
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.records(model_id),
        refetchType: 'active' // Force immediate refetch - bypasses staleTime
      });
      queryClient.invalidateQueries({ 
        queryKey: ['tables', String(model_id)],
        refetchType: 'active' // Force immediate refetch - bypasses staleTime
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useBulkDeleteRecords = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ model_id, row_ids }: { model_id: string; row_ids: number[] }) =>
      bulkDeleteRowService({ model_id, row_ids }),
    onSuccess: (_, { model_id }) => {
      // CRITICAL: Use refetchType: 'active' to bypass staleTime and update immediately
      // This ensures UI updates instantly after bulk deletion, regardless of cache age
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.records(model_id),
        refetchType: 'active' // Force immediate refetch - bypasses staleTime
      });
      queryClient.invalidateQueries({ 
        queryKey: ['tables', String(model_id)],
        refetchType: 'active' // Force immediate refetch - bypasses staleTime
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

// Insert Relation Data
export const useInsertRelationData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ model_id, column_id, source_row_id, target_row_id, action, target_table_id: _target_table_id }: {
      model_id: string;
      column_id: string;
      source_row_id: number;
      target_row_id: number;
      action: 'link' | 'unlink';
      target_table_id?: string; // Optional - only used for cache invalidation
    }) =>
      insertRelationDataService({ model_id, column_id, source_row_id, target_row_id, action }),
    onSuccess: (_, { model_id, target_table_id }) => {
      // Invalidate source table
      queryClient.invalidateQueries({
        queryKey: queryKeys.records(model_id),
        refetchType: 'active' // Force immediate refetch for active queries
      });
      queryClient.invalidateQueries({
        queryKey: ['tables', String(model_id)],
        refetchType: 'active' // Force immediate refetch for active queries
      });
      
      // Invalidate target table if provided
      // Performance: refetchType: 'active' only refetches if target table is currently open
      // If target table isn't open, this has zero performance impact - no API call happens
      if (target_table_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.records(target_table_id),
          refetchType: 'active' // Only refetch if query is currently active (table is open)
        });
        queryClient.invalidateQueries({
          queryKey: ['tables', String(target_table_id)],
          refetchType: 'active' // Only refetch if query is currently active (table is open)
        });
      }
      
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

// Attachment hooks
export const useAddAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ model_id, column_id, row_id, files, onProgress }: {
      model_id: string;
      column_id: string;
      row_id: number;
      files: File[];
      onProgress?: (progressEvent: ProgressEvent) => void;
    }) =>
      addAttachmentService({ model_id, column_id, row_id, files, onProgress }),
    onSuccess: (_, { model_id }) => {
      // Invalidate table records to refresh attachment data
      queryClient.invalidateQueries({ queryKey: queryKeys.records(model_id) });
      queryClient.invalidateQueries({ queryKey: ['tables', String(model_id)] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useRemoveAttachments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ model_id, column_id, row_id, attachments }: {
      model_id: string;
      column_id: string;
      row_id: number;
      attachments: string[]
    }) =>
      removeAttachmentsService({ model_id, column_id, row_id, attachments }),
    onSuccess: (_, { model_id }) => {
      // Invalidate table records to refresh attachment data
      queryClient.invalidateQueries({ queryKey: queryKeys.records(model_id) });
      queryClient.invalidateQueries({ queryKey: ['tables', String(model_id)] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useUpdateAssetById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title?: string }) =>
      updateAssetByIdService(id, { title }),
    onSuccess: () => {
      // Invalidate all table queries to refresh asset data
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
};

export const useAddImage = () => {
  return useMutation({
    mutationFn: async ({ files, onProgress }: { files: File[]; onProgress?: (progressEvent: ProgressEvent) => void }) => {
      return await addImageService(files, onProgress);
    },
  });
};

// =========================
// User Profile APIs
// =========================

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: async () => {
      const result = await getUserProfileByIDService(userId);
      return result;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateUserProfile = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { first_name?: string; last_name?: string; display_name?: string; country?: string; dob?: string; timezone?: string }) => {
      // Only send fields that have values (not empty strings)
      const updateData = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
      );

      const result = await updateUserProfileService(userId, updateData);
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate React Query cache - this triggers automatic refetch in all components
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      // Update sessionStorage for next page load only (not for immediate UI)
      if (variables.display_name) {
        sessionStorage.setItem('user_display_name', variables.display_name);
      }
      // React Query handles all immediate UI updates automatically
    },
  });
};

export const useChangePassword = (userId: string) => {
  return useMutation({
    mutationFn: async (params: { old_password: string; new_password: string }) => {
      const result = await changePasswordService(userId, params);
      return result;
    },
  });
};

export const useUserAccessDetails = (userId: string | null, workspaceId?: string) => {
  return useQuery({
    queryKey: ['userAccessDetails', userId, workspaceId],
    queryFn: async () => {
      if (!userId) return null;
      const result = await getUserAccessDetailsService(userId, workspaceId) as any;
      // Extract the data from StandardResponse structure
      return result?.data || null;
    },
    enabled: !!userId,
    staleTime: 0, // Always consider data stale to allow refetching when invalidated
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
  });
};

export const useUserRolesAndAccess = (userId: string | null, scopeId?: string) => {
  return useQuery({
    queryKey: ['userRolesAndAccess', userId, scopeId],
    queryFn: async () => {
      if (!userId) return null;
      const result = await getUserRolesAndAccessService(userId, scopeId) as any;
      // Extract the data from StandardResponse structure
      return result?.data || null;
    },
    enabled: !!userId,
    staleTime: 0, // Always consider data stale to allow refetching when invalidated
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
  });
};

export const useAddOrUpdateAvatar = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avatarFile: File) => {
      const result = await addOrUpdateAvatarService(userId, avatarFile);
      return result;
    },
    onSuccess: () => {
      // Invalidate user profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
};


export const useRemoveAvatar = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await removeAvatarService(userId);
      return result;
    },
    onSuccess: () => {
      // Invalidate user profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
};

export const useGetRecordsByPagination = (modelId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pageNumber, pageSize }: { pageNumber: number; pageSize: number }) => {
      const result = await getAllRecordsService(modelId, { pageNumber, pageLimit: pageSize });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.records(modelId) });
    },
  });
};

// =========================
// Tenant & User APIs
// =========================

export const useGetTenantUsers = () => {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: async () => {
      try {
        const result = await getTenantUsersService() as any;
        const data = result?.data;
        if (data) {
          return Array.isArray(data) ? data : [];
        }
        return [];
      } catch (error: any) {
        console.error('❌ Tenant users query failed:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 0, // Always consider data stale to allow refetching
    refetchOnMount: 'always', // Always refetch when component mounts (e.g., when navigating to user tab)
  });
};

export const useGetUsersForAssign = () => {
  return useQuery({
    queryKey: ['usersForAssign'],
    queryFn: async () => {
      try {
        const result = await getUsersForAssignService() as any;
        const data = result?.data;
        if (data) {
          return Array.isArray(data) ? data : [];
        }
        return [];
      } catch (error: any) {
        console.error('❌ Users for assign query failed:', error);
        throw error;
      }
    },
    enabled: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};


export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      firstname: string;
      lastname: string;
      email: string;
    }) => {
      const result = await addUserService(userData);
      return result;
    },
    onSuccess: () => {
      // Invalidate tenant users query to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error: any) => {
      console.error('❌ Add tenant user failed:', error);
    }
  });
};

export const useEditUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      user_id: string;
      firstname?: string;
      lastname?: string;
      profile_pic?: File;
      is_coowner?: boolean;
      membership?: Array<{
        workspace_id: string;
        role: string;
        bases?: Array<{
          base_id: string;
          role: string;
        }>;
      }>;
    }) => {
      const result = await editUserService(userData);
      return result;
    },
    onSuccess: () => {
      // Invalidate tenant users query to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
    onError: (error: any) => {
      console.error('❌ Edit user failed:', error);
    }
  });
};

export const useRemoveTenantUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await removeUserService(userId);
      return result;
    },
    onSuccess: () => {
      // Invalidate tenant users query to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error: any) => {
      console.error('❌ Remove tenant user failed:', error);
    }
  });
};

export const useActivateTenantUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await activateTenantUserService(userId);
      return result;
    },
    onSuccess: () => {
      // Invalidate tenant users query to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error: any) => {
      console.error('❌ Activate tenant user failed:', error);
    }
  });
};

export const useDeactivateTenantUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!userId) {
        throw new Error('UserId not found. Please log in again.');
      }
      const result = await deactivateTenantUserService(userId);
      return result;
    },
    onSuccess: () => {
      // Invalidate tenant users query to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error: any) => {
      console.error('❌ Deactivate tenant user failed:', error);
    }
  });
};


export const useAssignUserToWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspace_id: string;
      user_ids: string[];
      access_level: string;
      bases_ids: string;
    }) => {
      const result = await assignUserToWorkspaceService(params);
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate user access details for all assigned users
      // This ensures "View Access Details" modal refetches updated data
      variables.user_ids.forEach(userId => {
        // Invalidate all userAccessDetails queries for this user
        // This matches ['userAccessDetails', userId] and ['userAccessDetails', userId, workspaceId]
        queryClient.invalidateQueries({
          queryKey: ['userAccessDetails', userId],
          exact: false // Match all queries starting with ['userAccessDetails', userId]
        });
      });

      // Invalidate workspaces query to refresh workspace members
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      // Invalidate tenant users query in case it affects user data
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error: any) => {
      console.error('❌ Assign user to workspace failed:', error);
    }
  });
};

export const useBulkAddMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceId: string;
      members: Array<{
        user_id: string;
        memberships: Array<{
          workspace_id: string;
          role: string;
          bases?: Array<{
            base_id: string;
            role: string;
          }>;
        }>;
      }>;
    }) => {
      const result = await bulkAddMembersService(params.workspaceId, { members: params.members });
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate user access details for all assigned users
      variables.members.forEach(member => {
        queryClient.invalidateQueries({
          queryKey: ['userAccessDetails', member.user_id],
          exact: false
        });
        // Invalidate userRolesAndAccess queries to refresh role display in MembersTable
        queryClient.invalidateQueries({
          queryKey: ['userRolesAndAccess', member.user_id],
          exact: false
        });
      });

      // Invalidate workspaces query to refresh workspace members
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      // Invalidate workspace members query
      queryClient.invalidateQueries({ queryKey: ['workspaceMembers', variables.workspaceId] });
      // Invalidate tenant users query in case it affects user data
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error: any) => {
      console.error('❌ Bulk add members failed:', error);
    }
  });
};

export const useRemoveAccessMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceId: string;
      accessId: string;
    }) => {
      return await removeAccessMemberService(params.workspaceId, params.accessId);
    },
    onSuccess: (_, variables) => {
      // Invalidate workspace members query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['workspaceMembers', variables.workspaceId]
      });
      queryClient.invalidateQueries({
        queryKey: ['workspaces']
      });
    },
  });
};

export const useRemoveUserFromWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workspaceId: string;
      user_id: string;
    }) => {
      const result = await removeUserFromWorkspaceService(params.workspaceId, {
        user_id: params.user_id
      });
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate user access details for the removed user
      // This ensures "View Access Details" modal refetches updated data
      queryClient.invalidateQueries({
        queryKey: ['userAccessDetails', variables.user_id],
        exact: false // Match all queries starting with ['userAccessDetails', userId]
      });
      // Invalidate userRolesAndAccess queries to refresh role display in MembersTable
      queryClient.invalidateQueries({
        queryKey: ['userRolesAndAccess', variables.user_id],
        exact: false
      });

      // Invalidate workspace members query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['workspace', variables.workspaceId, 'members'] });
      // Invalidate workspaces query
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      // Invalidate tenant users query
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
    onError: (error: any) => {
      console.error('❌ Remove user from workspace failed:', error);
    }
  });
};

export const useGetOrganization = () => {
  return useQuery({
    queryKey: ['organization'], 
    queryFn: async () => {
     try{
      const result = await getOrganizationService() as any;
      return result?.data;
     } catch (error: any) {
      console.error('❌ Get organization failed:', error);
      throw error;
     }
    },
    enabled: true,
    
  });
}

export const useGetOrganizationById = (organizationId: string) => {
  return useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
     try{
      const result = await getOrganizationServiceById(organizationId) as any;
      return result?.data;
     } catch (error: any) {
      console.error('❌ Get organization by ID failed:', error);
      throw error;
     }
    },
    enabled: !!organizationId,
  });
}

export const useUpdateOrganization = (organizationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updateData: { name?: string; description?: string; }) => {
      // Build payload with only provided fields, ensuring required fields are present
      const payload: { name: string; description: string } = {
        name: updateData.name || '',
        description: updateData.description || ''
      };
      const result = await updateOrganizationService(organizationId, payload);
      return result;
    },
    onSuccess: () => {
      // Invalidate organization query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (error: any) => {
      console.error('❌ Update organization failed:', error);
    }
  });
};
