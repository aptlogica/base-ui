import { useWorkspaceDataService } from './useWorkspaceDataService';
import { useWorkspaceStateManager } from './useWorkspaceStateManager';
import { useMemo, useEffect, useCallback, useState } from 'react';
import { useToast } from '../../components/common/Toast';
import { useNavigation } from '../../hooks/useNavigation';
import { useNavigationActions } from '../../hooks/useNavigationActions';

/**
 * Centralized business logic for workspace operations
 * This layer orchestrates data and state management
 */
export const useWorkspaceBusinessLogic = () => {
  const toast = useToast();
  const { navigateToBase, navigateToTable, navigateToView } = useNavigation();
  const { handleTableDeletion, handleViewDeletion: navigationHandleViewDeletion } = useNavigationActions();

  // Centralized Data Service
  const {
    tenantReady,
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
    updateWorkspaceMutation,
    deleteWorkspaceMutation,
    createBaseMutation,
    deleteBaseMutation,
    createTableMutation,
    updateTableMutation,
    deleteTableMutation,
    createFieldMutation,
    updateFieldMutation,
    deleteFieldMutation,
    createViewMutation,
    updateViewMutation,
    deleteViewMutation,
    addRowMutation,
    insertRowDataMutation,
    deleteRecordMutation,
  } = useWorkspaceDataService(
    useWorkspaceStateManager().selectedWorkspaceId || undefined,
    useWorkspaceStateManager().selectedBaseId || undefined,
    useWorkspaceStateManager().selectedTableId || undefined,
    useWorkspaceStateManager().selectedViewId || undefined
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
    flyoutMode, flyoutOpen, isTransitioning,
  } = useWorkspaceStateManager();

  // Derived state
  const workspaces = workspacesQuery.data;
  const currentWorkspace = workspaceByIdQuery.data?.data;
  const workspaceBases = workspaceBasesQuery.data;
  const selectedBase = baseByIdQuery.data?.data;
  const baseTables = baseTablesQuery.data;
  const selectedTable = tableByIdQuery.data?.data;
  const tableViews = tableViewsQuery.data;
  const selectedView = viewByIdQuery.data;

  // State to force refetch of views when needed (kept for backward compatibility, but no longer used)
  // React Query mutations already invalidate view queries automatically
  const [viewsRefetchTrigger, setViewsRefetchTrigger] = useState(0);

  // Use baseTables directly - views will be fetched on-demand when tables are expanded
  // This prevents fetching views for all tables upfront (60+ API calls)
  const enrichedBaseTables = baseTables;

  
  // Debug logging for workspace tracking
  useEffect(() => {
  }, [selectedWorkspaceId, currentWorkspace, selectedBaseId, selectedBase, workspaceBases?.data?.length, baseTables?.data?.length]);

  // Loading and error states
  // Removed tableViewsLoading - views are now fetched on-demand, not during initial load
  const loading = workspacesLoading || basesLoading || tablesLoading || viewsLoading || !tenantReady;
  const error = workspacesError || basesError || tablesError || viewsError;

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

      if (!(newWorkspace as any)?.data?.id) {
        onError?.('Failed to create workspace. Please try again.');
        return;
      }

      const workspaceData = (newWorkspace as any).data;
      const firstBase = workspaceData.bases?.[0];
      const firstTable = firstBase?.tables?.[0]?.model;
      const firstView = firstBase?.tables?.[0]?.views?.[0];

      if (firstBase && firstTable && authUser?.id) {
        try {
          navigateAndPersist(workspaceData.id, firstBase.id, firstTable.id, authUser.id);
          navigate(`/base/${firstBase.id}/table/${firstTable.id}/grid`);
        } catch (navErr) {
          
        }
      } else {
        navigate(`/homepage`);
      }

      onSuccess?.(workspaceData);
    } catch (error) {
      
      onError?.('Failed to create workspace. Please try again.');
    }
  }, [createWorkspaceMutation, authUser?.id, navigateAndPersist, navigate]);

  const handleCreateBaseForWorkspace = useCallback(async ({ name, description }: { name: string; description: string }) => {
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return;
    }

    try {
      const newBase = await createBaseMutation.mutateAsync({
        title: name,
        description: description || '',
        workspace_id: currentWorkspace.id,
      });

      setShowCreateBaseWorkspaceId(null);
      navigateToBase(currentWorkspace.id, newBase.data.id);
      toast.success('Base created successfully');
    } catch (err) {
      
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
      
      await handleTableDeletion(table.id);

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
      
      await navigationHandleViewDeletion(view.id);

      // Trigger refetch of views
      setViewsRefetchTrigger(prev => prev + 1);

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

  // Additional UI state for sidebar
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [config, setConfig] = useState((window as any).__workspaceConfig || {});
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [workspaceError, setWorkspaceError] = useState('');
  const [isError, setIsError] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);

  // Navigation service effect
  useEffect(() => {
    const navService = (window as any).__navigationService;
    if (navService) {
      setMenuItems(navService.getMenuItems());
      const unsubscribe = navService.subscribe(() => setMenuItems(navService.getMenuItems()));
      return unsubscribe;
    }
  }, []);

  // Workspace config effect
  useEffect(() => {
    const handler = () => setConfig({ ...(window as any).__workspaceConfig });
    window.addEventListener('workspace-config-changed', handler);
    return () => window.removeEventListener('workspace-config-changed', handler);
  }, []);

  // Process workspace data from TanStack Query
  // CRITICAL: This effect must always sync selectedWorkspace with selectedWorkspaceId from store
  // On browser reload, the store has the ID but workspace object needs to be restored
  useEffect(() => {
    if (!restoreCompleted) return;
    if (!workspaces || !Array.isArray(workspaces) || workspaces.length === 0) return;

    // Priority 1: If store has selectedWorkspaceId (from activity_data or previous selection), sync the workspace object
    // This is critical for browser reload - store has ID, need to restore workspace object
    if (selectedWorkspaceId) {
      const savedWorkspace = workspaces.find(ws => ws.id === selectedWorkspaceId);
      if (savedWorkspace) {
        // Workspace exists - sync it (even if selectedWorkspace is already set)
        // This ensures workspace selection is restored on browser reload
        if (!selectedWorkspace || selectedWorkspace.id !== savedWorkspace.id) {
          setSelectedWorkspace(savedWorkspace);
          // Defensive: ensure store also has the ID
          setWorkspace(savedWorkspace.id);
        }
      } else {
        // Workspace ID in store doesn't exist in loaded workspaces
        // This could happen if workspace was deleted or user lost access
        // FALLBACK: Always select first workspace when saved workspace is invalid
        if (workspaces.length > 0) {
          setSelectedWorkspace(workspaces[0]);
          setWorkspace(workspaces[0].id);
        }
      }
    } else {
      // No workspace selected in store (no activity_data) - FALLBACK: auto-select first one
      // This is the fallback when user has no activity_data (newly assigned user or refresh)
      // Priority is given to activity_data, but if none exists, first workspace is the default
      if (workspaces.length > 0) {
        const firstWorkspace = workspaces[0];
        setSelectedWorkspace(firstWorkspace);
        setWorkspace(firstWorkspace.id);
        // Persist the selection for refresh scenarios
        if (authUser?.id) {
          navigateAndPersist(firstWorkspace.id, null as any, null as any, authUser.id);
        }
      }
    }
  }, [workspaces, restoreCompleted, selectedWorkspace, selectedWorkspaceId, setWorkspace]);

  // Auto-select first base when workspace is selected but no base is selected
  useEffect(() => {
    if (selectedWorkspaceId && !selectedBaseId && workspaceBases?.data && Array.isArray(workspaceBases.data) && workspaceBases.data.length > 0) {
      const firstBase = workspaceBases.data[0];
      navigateToBase(selectedWorkspaceId, firstBase.id);
    }
  }, [selectedWorkspaceId, selectedBaseId, workspaceBases?.data, navigateToBase]);

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
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      setWorkspaceError('Workspace name is required');
      setIsError(true);
      return;
    }

    await handleCreateWorkspace(
      newWorkspaceName,
      newWorkspaceDescription,
      (workspace: any) => {
        setSelectedWorkspace(workspace);
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
    const pathname = window.location.pathname;
    return pathname.startsWith('/base/') || pathname.startsWith('/table/') || pathname === '/workspace';
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
    // View refetch trigger
    setViewsRefetchTrigger,
    // Mutations (for direct access if needed)
    createWorkspaceMutation,
    createBaseMutation,
    createTableMutation,
    createViewMutation,
    updateTableMutation,
    deleteTableMutation,
    deleteViewMutation,
    // Additional UI state
    menuItems,
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
    flyoutMode, flyoutOpen, isTransitioning,
    // Navigation functions
    navigateToBase, navigateToTable, navigateToView,
  };
};
