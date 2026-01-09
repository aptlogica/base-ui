import { useWorkspaceDataService } from './useWorkspaceDataService';
import { useWorkspaceStateManager } from './useWorkspaceStateManager';
import { useEffect, useCallback, useState } from 'react';
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
  const loading = workspacesLoading || basesLoading || tablesLoading || viewsLoading;
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

      // Update navigation store with new workspace ID immediately
      // This ensures bases query refetches with the new workspaceId
      if (workspaceData?.id) {
        setWorkspace(workspaceData.id);
      }

      // Navigate after a brief delay to ensure state updates and query invalidation are processed
      // This prevents blank page issues when navigating immediately after workspace creation
      requestAnimationFrame(() => {
      if (firstBase && firstTable && authUser?.id) {
        try {
          navigateAndPersist(workspaceData.id, firstBase.id, firstTable.id, authUser.id);
          navigate(`/base/${firstBase.id}/table/${firstTable.id}/grid`);
        } catch (navErr) {
            console.error('Navigation error after workspace creation:', navErr);
            // Fallback to homepage if navigation fails
            navigate(`/homepage`);
        }
      } else {
          // Navigate to homepage if no base/table exists
          // Use replace to avoid adding to history stack
          navigate(`/homepage`, { replace: true });
      }
      });

      onSuccess?.(workspaceData);
    } catch (error) {
      
      onError?.('Failed to create workspace. Please try again.');
    }
  }, [createWorkspaceMutation, authUser?.id, navigateAndPersist, navigate]);

  const handleCreateBaseForWorkspace = useCallback(async ({ name, description, image }: { name: string; description: string; image?: File | null }) => {
    if (!currentWorkspace) {
      toast.error('No workspace selected');
      return;
    }

    try {
      const newBase = await createBaseMutation.mutateAsync({
        title: name,
        description: description || '',
        workspace_id: currentWorkspace.id,
        image: image || undefined,
      });

      setShowCreateBaseWorkspaceId(null);
      // COMMENTED OUT: Navigation to table on base creation
      // navigateToBase(currentWorkspace.id, newBase.data.id);
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
  // FALLBACK: Always ensure a workspace is selected when workspaces are available
  useEffect(() => {
    if (!restoreCompleted) return;
    if (!workspaces || !Array.isArray(workspaces) || workspaces.length === 0) return;

    // Check if selectedWorkspace is null or invalid (workspace doesn't exist in list)
    const isSelectedWorkspaceInvalid = !selectedWorkspace || 
      (selectedWorkspace.id && !workspaces.find(ws => ws.id === selectedWorkspace.id));

    // Priority 1: If store has selectedWorkspaceId (from activity_data or previous selection), sync the workspace object
    // This is critical for browser reload - store has ID, need to restore workspace object
    // FIX: Only sync workspace object, don't call setWorkspace() which triggers save and can cause loops
    if (selectedWorkspaceId) {
      const savedWorkspace = workspaces.find(ws => ws.id === selectedWorkspaceId);
      if (savedWorkspace) {
        // Workspace exists - sync the workspace object ONLY (don't update store ID - it's already correct)
        // This ensures workspace selection is restored on browser reload without triggering saves
        if (!selectedWorkspace || selectedWorkspace.id !== savedWorkspace.id) {
          setSelectedWorkspace(savedWorkspace);
          // DON'T call setWorkspace() here - selectedWorkspaceId is already correct in store
          // Calling setWorkspace() would trigger a save and potentially cause a restore loop
        }
      } else {
        // Workspace ID in store doesn't exist in loaded workspaces
        // This could happen if workspace was deleted or user lost access
        // FALLBACK: Always select first workspace when saved workspace is invalid
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
    } else {
      // No workspace selected in store - ONLY auto-select on initial load (not after user changes)
      // FIX: Check if this is initial load by checking if AppInitializer has completed
      // We should only auto-select if there's truly no saved state AND it's initial load
      // Don't auto-select if user just changed workspace (that would override their choice)
      const hasInitialized = sessionStorage.getItem('nav_initialized') === 'true';
      
      // Only auto-select first workspace if:
      // 1. This is initial load (not initialized yet)
      // 2. No workspace is selected
      // 3. Workspaces are available
      if (!hasInitialized && workspaces.length > 0) {
        const firstWorkspace = workspaces[0];
        setSelectedWorkspace(firstWorkspace);
        setWorkspace(firstWorkspace.id);
        // Mark as initialized to prevent future auto-selection
        sessionStorage.setItem('nav_initialized', 'true');
        // Persist the selection for refresh scenarios
        if (authUser?.id) {
          navigateAndPersist(firstWorkspace.id, null as any, null as any, authUser.id);
        }
      }
    }

    // ADDITIONAL SAFETY CHECK: If selectedWorkspace is null or invalid but workspaces are available,
    // always fallback to first workspace. This handles edge cases where selection gets lost unexpectedly.
    // This ensures workspace selection never disappears when workspaces are available.
    if (isSelectedWorkspaceInvalid && workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      // Only update if we don't already have a valid selection
      if (!selectedWorkspaceId || !workspaces.find(ws => ws.id === selectedWorkspaceId)) {
        setSelectedWorkspace(firstWorkspace);
        setWorkspace(firstWorkspace.id);
        // Persist the selection for refresh scenarios
        if (authUser?.id) {
          navigateAndPersist(firstWorkspace.id, null as any, null as any, authUser.id);
        }
      }
    }
  }, [workspaces, restoreCompleted, selectedWorkspace, selectedWorkspaceId, setWorkspace, authUser, navigateAndPersist]);

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
        // Update both the workspace object and the selectedWorkspaceId in navigation store
        setSelectedWorkspace(workspace);
        if (workspace?.id) {
          setWorkspace(workspace.id); // This updates selectedWorkspaceId in navigation store
        }
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
