import { usePluginStore } from '../../stores/pluginStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { useAuth } from '../../auth/AuthContext';
import { useCurrentUser } from '../../auth/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const useWorkspaceStateManager = () => {
  const navigate = useNavigate();
  const { user: authUser, restoreCompleted } = useAuth();
  const currentUser = useCurrentUser();

  // Plugin Store (UI state)
  const {
    flyoutOpen,
    flyoutMode,
    flyoutWidth,
    currentPlugin,
    isTransitioning,
    selectedWorkspace: pluginStoreSelectedWorkspace,
    openFlyout,
    closeFlyout,
    setFlyoutMode,
    setFlyoutWidth,
    toggleFlyout,
    setTransitioning,
    setSelectedWorkspace: setPluginStoreSelectedWorkspace,
  } = usePluginStore();

  // Navigation Store (Persistent navigation state)
  const {
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
  } = useNavigationStore();

  // Local UI state for modals/popovers
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateBaseWorkspaceId, setShowCreateBaseWorkspaceId] = useState<string | null>(null);
  const [showCreateTableBaseId, setShowCreateTableBaseId] = useState<string | null>(null);
  const [showCreateViewModal, setShowCreateViewModal] = useState<{ tableId: string; viewType: string } | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [popoverRef, setPopoverRef] = useState<any>(null);

  return {
    // Auth & User
    authUser,
    currentUser,
    restoreCompleted,
    // Plugin Store
    flyoutOpen, flyoutMode, flyoutWidth, currentPlugin, isTransitioning,
    pluginStoreSelectedWorkspace,
    openFlyout, closeFlyout, setFlyoutMode, setFlyoutWidth, toggleFlyout, setTransitioning, setPluginStoreSelectedWorkspace,
    // Navigation Store
    selectedWorkspaceId, selectedBaseId, selectedTableId, selectedViewId,
    expandedBases, expandedTables,
    toggleBaseExpansion, toggleTableExpansion,
    setWorkspace, setBase, setTable, setView,
    loadUserNavigation, saveUserNavigation, navigateToLastLocation,
    navigateToFirstTableView, navigateToFirstBase, navigateAndPersist,
    // Local UI State
    showCreateWorkspace, setShowCreateWorkspace,
    showCreateBaseWorkspaceId, setShowCreateBaseWorkspaceId,
    showCreateTableBaseId, setShowCreateTableBaseId,
    showCreateViewModal, setShowCreateViewModal,
    editingTableId, setEditingTableId,
    editingViewId, setEditingViewId,
    popoverRef, setPopoverRef,
    // Router
    navigate,
  };
};
