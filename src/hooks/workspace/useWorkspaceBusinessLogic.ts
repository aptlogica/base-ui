import { useWorkspaceDataService } from './useWorkspaceDataService';
import { useWorkspaceStateManager } from './useWorkspaceStateManager';
import { useEffect, useCallback, useState } from 'react';
import { useToast } from '../../components/common/Toast';
import { useNavigation } from '../../hooks/useNavigation';
import { useNavigationActions } from '../../hooks/useNavigationActions';
import { useWorkspaceSelection } from './useWorkspaceSelection';

/**
 * Centralized business logic for workspace operations
 * This layer orchestrates data and state management
 */
export const useWorkspaceBusinessLogic = () => {
  const toast = useToast();
  const { navigateToBase, navigateToTable, navigateToView } = useNavigation();
  const { handleTableDeletion, handleViewDeletion: navigationHandleViewDeletion } = useNavigationActions();
  const workspaceState = useWorkspaceStateManager();

  // Centralized Data Service
  const {
    workspacesQuery,
    workspaceByIdQuery,
    workspaceBasesQuery,
    baseByIdQuery,
    baseTablesQuery,
    tableByIdQuery,
    tableViewsQuery,
    viewByIdQuery,
    workspacesLoading,
    basesLoading,
    tablesLoading,
    viewsLoading,
    workspacesError,
    basesError,
    tablesError,
    viewsError,
    createWorkspaceMutation,
    createBaseMutation,
    createTableMutation,
    updateTableMutation,
    deleteTableMutation,
    createViewMutation,
    deleteViewMutation,
  } = useWorkspaceDataService(
    workspaceState.selectedWorkspaceId || undefined,
    workspaceState.selectedBaseId || undefined,
    workspaceState.selectedTableId || undefined,
    workspaceState.selectedViewId || undefined
  );

  // Centralized State Manager
  const {
    authUser,
    currentUser,
    restoreCompleted,
    pluginStoreSelectedWorkspace,
    setPluginStoreSelectedWorkspace,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    expandedBases,
    expandedTables,
    toggleBaseExpansion,
    toggleTableExpansion,
    setWorkspace,
    setBase,
    setTable,
    setView,
    loadUserNavigation,
    saveUserNavigation,
    navigateToLastLocation,
    navigateToFirstTableView,
    navigateToFirstBase,
    navigateAndPersist,
    showCreateWorkspace, setShowCreateWorkspace,
    showCreateBaseWorkspaceId, setShowCreateBaseWorkspaceId,
    showCreateTableBaseId, setShowCreateTableBaseId,
    showCreateViewModal, setShowCreateViewModal,
    editingTableId, setEditingTableId,
    editingViewId, setEditingViewId,
    popoverRef, setPopoverRef,
    navigate,
    // Plugin store state
    flyoutOpen,
  } = workspaceState;

  // Derived state with proper type guards
  const workspaces = workspacesQuery.data;
  const currentWorkspace = (workspaceByIdQuery.data as { data?: any } | undefined)?.data;
  const workspaceBases = (workspaceBasesQuery.data as { data?: any } | undefined);
  const selectedBase = (baseByIdQuery.data as { data?: any } | undefined)?.data;
  const baseTables = (baseTablesQuery.data as { data?: any } | undefined);
  const selectedTable = (tableByIdQuery.data as { data?: any } | undefined)?.data;
  const tableViews = tableViewsQuery.data;
  const selectedView = viewByIdQuery.data;


  // Use baseTables directly - views will be fetched on-demand when tables are expanded
  // This prevents fetching views for all tables upfront (60+ API calls)
  const enrichedBaseTables = baseTables;

  // State to force refetch of views when needed (used by Sidebar and TableViews components)

  

  // Loading and error states
  // Removed tableViewsLoading - views are now fetched on-demand, not during initial load
  const loading = workspacesLoading || basesLoading || tablesLoading || viewsLoading;
  const error = workspacesError || basesError || tablesError || viewsError;

  // Additional UI state for sidebar
  const [config, setConfig] = useState((globalThis as any).__workspaceConfig || {});
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [workspaceError, setWorkspaceError] = useState('');
  const [isError, setIsError] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);

  // Business logic functions
  const handleCreateWorkspace = useCallback(async (
    workspaceName: string,
    workspaceDescription: string,
    onSuccess?: (workspace: any) => void,
    onError?: (error: string) => void
  ) => {
    if (!workspaceName.trim()) {
      onError?.('Workspace name is required');
      return;
    }

    try {
      const newWorkspace: any = await createWorkspaceMutation.mutateAsync({
        workspace: {
          title: workspaceName,
          description: workspaceDescription?.trim?.() || '',
        }
      });

      const workspaceData = newWorkspace?.data;
      if (!workspaceData?.id) {
        onError?.('Failed to create workspace. Please try again.');
        return;
      }
      const firstBase = workspaceData.bases?.[0];
      const firstTable = firstBase?.tables?.[0];
      const firstTableId = firstTable?.model?.id || firstTable?.id;

      // Update navigation store with new workspace ID immediately
      // This ensures bases query refetches with the new workspaceId
      if (workspaceData?.id) {
        setWorkspace(workspaceData.id);
        // Also update selectedWorkspace state so dropdown shows the new workspace
        setSelectedWorkspace(workspaceData);
        // Note: workspaces query is updated optimistically in useCreateWorkspace
      }

      // Navigate after a brief delay to ensure state updates and query invalidation are processed
      // This prevents blank page issues when navigating immediately after workspace creation
      requestAnimationFrame(() => {
      if (firstBase?.id && firstTableId && authUser?.id) {
        try {
          navigateAndPersist(workspaceData.id, firstBase.id, firstTableId, authUser.id);
          navigate(`/workspace/${workspaceData.id}/base/${firstBase.id}/table/${firstTableId}/grid`);
        } catch (error_) {
            console.error('Navigation error after workspace creation:', error_);
            // Fallback to workspace homepage if navigation fails
            navigate(`/workspace/${workspaceData.id}`, { replace: true });
        }
      } else {
          // Navigate to workspace homepage if no base/table exists
          // Use replace to avoid adding to history stack
          navigate(`/workspace/${workspaceData.id}`, { replace: true });
      }
      });

      onSuccess?.(workspaceData);
    } catch (error_) {
      console.error('Failed to create workspace:', error_);
      onError?.('Failed to create workspace. Please try again.');
    }
  }, [createWorkspaceMutation, authUser?.id, navigateAndPersist, navigate, setWorkspace, setSelectedWorkspace]);

  const handleCreateBaseForWorkspace = useCallback(async ({ name, description, image }: { name: string; description: string; image?: File | null }) => {
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return;
    }

    try {
      await createBaseMutation.mutateAsync({
        title: name,
        description: description || '',
        workspace_id: currentWorkspace.id,
        image: image || undefined,
      });

      setShowCreateBaseWorkspaceId(null);
      toast.success('Base created successfully');
    } catch (err) {
      console.error('Failed to create base:', err);
      toast.error('Failed to create base. Please try again.');
      throw err;
    }
  }, [currentWorkspace, createBaseMutation, navigateToBase, toast]);

  const handleEditTable = useCallback(async (tableId: string, updates: { title?: string; description?: string }) => {
    try {
      await updateTableMutation.mutateAsync({
        tableId,
        params: { 
          ...updates,
          updated_at: new Date().toISOString()
        }
      });
      
      // Invalidate relevant queries to trigger UI updates
      // This ensures the table list and other components refresh
      if (workspacesQuery) {
        workspacesQuery.refetch();
      }
      if (baseTablesQuery) {
        baseTablesQuery.refetch();
      }
      if (tableByIdQuery) {
        tableByIdQuery.refetch();
      }
      
      toast.success('Table updated successfully');
    } catch (err) {
      
      toast.error('Failed to update table. Please try again.');
      throw err;
    }
  }, [updateTableMutation, toast, workspacesQuery, baseTablesQuery, tableByIdQuery]);

  const handleDeleteTable = useCallback(async (table: any) => {
    try {
      const isCurrentlySelected = selectedTableId === table.id;
      
      // Call the delete mutation which will handle cache invalidation
      await deleteTableMutation.mutateAsync({ 
        tableId: table.id, 
        baseId: table.base_id 
      });
      
      handleTableDeletion(table.id);

      toggleTableExpansion(table.id);

      if (isCurrentlySelected) {
        const remainingTables = baseTables?.data?.filter((item: any) => item.model.id !== table.id) || [];
        if (remainingTables.length > 0) {
          const firstTable = remainingTables[0].model;
          navigateToTable(firstTable.workspace_id, firstTable.base_id, firstTable.id);
        } else {
          navigateToBase(table.workspace_id, table.base_id);
        }
      }

      toast.success(`Table "${table.title || table.name}" deleted successfully`);
    } catch (error) {
      
      toast.error('Failed to delete table. Please try again.');
      throw error;
    }
  }, [selectedTableId, selectedBaseId, baseTables, handleTableDeletion, toggleTableExpansion, navigateToTable, navigateToBase, toast, deleteTableMutation]);

  const handleDeleteView = useCallback(async (view: any) => {
    try {
      const isCurrentlySelected = selectedViewId === view.id;
      
      navigationHandleViewDeletion(view.id);

      // Trigger refetch of views (removed setViewsRefetchTrigger)

      if (isCurrentlySelected) {
        if (selectedTableId && selectedBaseId && selectedWorkspaceId) {
          navigateToTable(selectedWorkspaceId, selectedBaseId, selectedTableId);
        } else if (selectedBaseId && selectedWorkspaceId) {
          navigateToBase(selectedWorkspaceId, selectedBaseId);
        }
      }

      toast.success(`View "${view.title || view.name}" deleted successfully`);
    } catch (error) {
      
      toast.error('Failed to delete view. Please try again.');
      throw error;
    }
  }, [selectedViewId, selectedTableId, selectedBaseId, selectedWorkspaceId, navigationHandleViewDeletion, navigateToTable, navigateToBase, toast]);

  // Helper functions for active state
  const isTableActive = useCallback((baseId: string, tableId: string) => {
    return selectedBaseId === baseId && selectedTableId === tableId;
  }, [selectedBaseId, selectedTableId]);

  const isViewActive = useCallback((baseId: string, tableId: string, viewId: string) => {
    return selectedBaseId === baseId && selectedTableId === tableId && selectedViewId === viewId;
  }, [selectedBaseId, selectedTableId, selectedViewId]);

  // Workspace config effect
  useEffect(() => {
    const handler = () => setConfig({ ...(globalThis as any).__workspaceConfig });
    globalThis.addEventListener('workspace-config-changed', handler);
    return () => globalThis.removeEventListener('workspace-config-changed', handler);
  }, []);

  // Reset create workspace form state when modal closes (covers all close paths)
  useEffect(() => {
    if (showCreateWorkspace) return;
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setWorkspaceError('');
    setIsError(false);
  }, [showCreateWorkspace]);

  // Use extracted hook for workspace selection synchronization
  useWorkspaceSelection(
    workspaces,
    restoreCompleted,
    selectedWorkspace,
    selectedWorkspaceId,
    setSelectedWorkspace,
    setWorkspace,
    navigateAndPersist
  );

  // Auto-select first base when workspace is selected but no base is selected
  // FIX: Only auto-select on initial load, not after user changes
  useEffect(() => {
    if (!restoreCompleted) return; // Wait for restore to complete
    if (selectedWorkspaceId && !selectedBaseId && workspaceBases?.data && Array.isArray(workspaceBases.data) && workspaceBases.data.length > 0) {
      // Only auto-select if this is initial load (no base was ever selected)
      // Don't auto-select if user just changed workspace (that would override their choice)
      const hasInitialized = sessionStorage.getItem('nav_initialized') === 'true';
      if (!hasInitialized) {
        const firstBase = workspaceBases.data[0];
        navigateToBase(selectedWorkspaceId, firstBase.id);
        sessionStorage.setItem('nav_initialized', 'true');
      }
    }
  }, [selectedWorkspaceId, selectedBaseId, workspaceBases?.data, navigateToBase, restoreCompleted]);

  // Ensure we always have a workspace selected (fallback for refresh scenarios)
  // This runs after restoreCompleted to catch cases where workspace wasn't selected during initial restore
  useEffect(() => {
    if (!restoreCompleted) return;
    if (!workspaces || !Array.isArray(workspaces) || workspaces.length === 0) return;
    if (selectedWorkspaceId) return; // Already have a workspace selected
    
    // No workspace selected - auto-select first one (fallback for refresh when no activity_data)
    const firstWorkspace = workspaces[0];
    setWorkspace(firstWorkspace.id);
    setSelectedWorkspace(firstWorkspace);
    
    if (authUser?.id) {
      navigateAndPersist(firstWorkspace.id, null as any, null as any, authUser.id);
    }
  }, [restoreCompleted, workspaces, selectedWorkspaceId, setWorkspace, setSelectedWorkspace, authUser?.id, navigateAndPersist]);

  // Form submission handler
  const handleFormSubmit = useCallback(async (e:React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      setWorkspaceError('Workspace name is required');
      setIsError(true);
      return;
    }

    await handleCreateWorkspace(
      newWorkspaceName,
      newWorkspaceDescription,
      () => {
        // Workspace is already set in handleCreateWorkspace (both store and selectedWorkspace state)
        // Just clean up UI state here
        setShowCreateWorkspace(false);
        setNewWorkspaceName('');
        setNewWorkspaceDescription('');
        setWorkspaceError('');
        setIsError(false);
      },
      (error: string) => {
        setWorkspaceError(error);
        setIsError(true);
      }
    );
  }, [newWorkspaceName, newWorkspaceDescription, handleCreateWorkspace, setShowCreateWorkspace]);

  // Helper functions
  const isAnyBaseActive = useCallback(() => {
    const pathname = globalThis.location.pathname;
    return pathname.includes('/base/') || pathname.startsWith('/workspace/');
  }, []);

  const findFirstBase = useCallback(() => {
    // Base selection is now handled by SidebarFlyoutMenu with useWorkspaceBases hook
    return null;
  }, []);

  return {
    // Data
    workspaces,
    currentWorkspace,
    workspaceBases,
    selectedBase,
    baseTables: enrichedBaseTables,
    selectedTable,
    tableViews,
    selectedView,
    // Loading & Error
    loading,
    error,
    basesLoading,
    // State & Actions
    authUser,
    currentUser,
    restoreCompleted,
    pluginStoreSelectedWorkspace,
    setPluginStoreSelectedWorkspace,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    expandedBases,
    expandedTables,
    toggleBaseExpansion,
    toggleTableExpansion,
    setWorkspace,
    setBase,
    setTable,
    setView,
    loadUserNavigation,
    saveUserNavigation,
    navigateToLastLocation,
    navigateToFirstTableView,
    navigateToFirstBase,
    navigateAndPersist,
    showCreateWorkspace, setShowCreateWorkspace,
    showCreateBaseWorkspaceId, setShowCreateBaseWorkspaceId,
    showCreateTableBaseId, setShowCreateTableBaseId,
    showCreateViewModal, setShowCreateViewModal,
    editingTableId, setEditingTableId,
    editingViewId, setEditingViewId,
    popoverRef, setPopoverRef,
    navigate,
    // Business Logic
    handleCreateWorkspace,
    handleCreateBaseForWorkspace,
    handleEditTable,
    handleDeleteTable,
    handleDeleteView,
    isTableActive,
    isViewActive,
    createWorkspaceMutation,
    createBaseMutation,
    createTableMutation,
    createViewMutation,
    updateTableMutation,
    deleteTableMutation,
    deleteViewMutation,
    // Additional UI state
    config,
    workspaceDropdownOpen, setWorkspaceDropdownOpen,
    newWorkspaceName, setNewWorkspaceName,
    newWorkspaceDescription, setNewWorkspaceDescription,
    workspaceError, setWorkspaceError,
    isError, setIsError,
    selectedWorkspace, setSelectedWorkspace,
    handleFormSubmit,
    isAnyBaseActive,
    findFirstBase,
    // Plugin store state
    flyoutOpen,
    // Navigation functions
    navigateToBase, navigateToTable, navigateToView,
  };
};
