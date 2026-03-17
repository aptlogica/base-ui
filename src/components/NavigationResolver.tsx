// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useEffect, useRef, useState, useContext, type Dispatch, type SetStateAction } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
import { useWorkspaces, useWorkspaceBases, useBaseTables, useTableViews } from '../hooks/useApi';
import { useNavigationStore } from '../stores/navigationStore';
import { replaceNavigate } from '../utils/navigationRedirect';
import { getBestNavigationTarget } from '../utils/navigationPersistence';
import { usePluginStore } from '../stores/pluginStore';
import { Base, BasesResponse, TableItem, TablesResponse, View, ViewsResponse, Workspace } from '../types/api.types';

type BooleanRef = { current: boolean };

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/auth/callback'];

const isPublicRoutePath = (path: string): boolean =>
  PUBLIC_ROUTES.some(route => path === route || path.startsWith(route + '/'));

const VIEW_TYPE_SLUGS = new Set(['grid', 'form', 'gallery', 'kanban', 'calendar', 'gantt']);

const isExcludedWorkspaceRoute = (path: string, excludedRoutes: string[]): boolean => {
  if (path.includes('/settings') || path.includes('/administrator')) {
    return true;
  }
  if (path === '/workspace') {
    return true;
  }
  return excludedRoutes.some(route => path === route || path.startsWith(route + '/'));
};

const handleExcludedRouteSkip = (
  shouldSkipExcluded: boolean,
  resolvedRef: BooleanRef,
  initialNavigationDoneRef: BooleanRef,
  isResolving: boolean,
  setIsResolving: Dispatch<SetStateAction<boolean>>,
): boolean => {
  if (!shouldSkipExcluded) {
    return false;
  }
  if (!resolvedRef.current || isResolving) {
    setIsResolving(false);
    resolvedRef.current = true;
    initialNavigationDoneRef.current = true;
  }
  return true;
};

const handlePublicOrAuthGuard = (
  isPublicRoute: boolean,
  hasUserId: boolean,
  restoreCompleted: boolean,
  isResolving: boolean,
  setIsResolving: Dispatch<SetStateAction<boolean>>,
): boolean => {
  if (!(isPublicRoute || !hasUserId || !restoreCompleted)) {
    return false;
  }

  if (isPublicRoute) {
    if (isResolving) {
      setIsResolving(false);
    }
    return true;
  }

  if (!hasUserId) {
    if (isResolving) {
      setIsResolving(false);
    }
    return true;
  }

  if (!restoreCompleted) {
    return true;
  }

  return true;
};

const handleAlreadyResolvedOnExpectedPath = (
  resolvedRef: BooleanRef,
  currentPath: string,
  expectedPath: string | null,
  shouldSkipExcluded: boolean,
  isResolving: boolean,
  setIsResolving: Dispatch<SetStateAction<boolean>>,
): boolean => {
  if (!(resolvedRef.current && (currentPath === expectedPath || shouldSkipExcluded))) {
    return false;
  }

  if (isResolving) {
    setIsResolving(false);
  }

  return true;
};

interface ResolvedPathMismatchParams {
  resolvedRef: BooleanRef;
  currentPath: string;
  expectedPath: string | null;
  hasNavigationState: boolean;
  isInitialNavigation: boolean;
  shouldSkipExcluded: boolean;
  isResolving: boolean;
  setIsResolving: Dispatch<SetStateAction<boolean>>;
}

const handleResolvedPathMismatch = (params: ResolvedPathMismatchParams): boolean => {
  const {
    resolvedRef,
    currentPath,
    expectedPath,
    hasNavigationState,
    isInitialNavigation,
    shouldSkipExcluded,
    isResolving,
    setIsResolving,
  } = params;
  if (!(resolvedRef.current && currentPath !== expectedPath)) {
    return false;
  }

  if (shouldSkipExcluded) {
    if (isResolving) {
      setIsResolving(false);
    }
    return true;
  }

  if (isInitialNavigation && hasNavigationState) {
    if (!isResolving) {
      resolvedRef.current = false;
      setIsResolving(true);
    }
  } else if (isResolving) {
    setIsResolving(false);
  }

  return !isInitialNavigation || !hasNavigationState;
};

const finalizeResolutionIfNeeded = (
  resolvedRef: BooleanRef,
  initialNavigationDoneRef: BooleanRef,
  isResolving: boolean,
  setIsResolving: Dispatch<SetStateAction<boolean>>,
): void => {
  if (!resolvedRef.current || isResolving) {
    resolvedRef.current = true;
    initialNavigationDoneRef.current = true;
    setIsResolving(false);
  }
};

interface InitialNavigationResetParams {
  hasNavigationState: boolean;
  currentPath: string;
  expectedPath: string | null;
  resolvedRef: BooleanRef;
  restoreCompleted: boolean;
  isInitialNavigation: boolean;
  shouldSkipExcluded: boolean;
  isResolving: boolean;
  setIsResolving: Dispatch<SetStateAction<boolean>>;
}

const resetResolutionForInitialNavigationIfNeeded = (params: InitialNavigationResetParams): void => {
  const {
    hasNavigationState,
    currentPath,
    expectedPath,
    resolvedRef,
    restoreCompleted,
    isInitialNavigation,
    shouldSkipExcluded,
    isResolving,
    setIsResolving,
  } = params;

  const shouldReset =
    hasNavigationState &&
    currentPath !== expectedPath &&
    resolvedRef.current &&
    restoreCompleted &&
    isInitialNavigation &&
    !shouldSkipExcluded &&
    !isResolving;

  if (shouldReset) {
    resolvedRef.current = false;
    setIsResolving(true);
  }
};

interface AlreadyOnExpectedPathParams {
  hasNavigationState: boolean;
  currentPath: string;
  expectedPath: string | null;
  resolvedRef: BooleanRef;
  setIsResolving: Dispatch<SetStateAction<boolean>>;
}

const handleAlreadyOnExpectedPathMatch = (params: AlreadyOnExpectedPathParams): boolean => {
  const { hasNavigationState, currentPath, expectedPath, resolvedRef, setIsResolving } = params;

  if (!(hasNavigationState && currentPath === expectedPath)) {
    return false;
  }

  resolvedRef.current = true;
  setIsResolving(false);
  return true;
};

const shouldWaitForWorkspaces = (
  workspacesLoading: boolean,
  workspacesData: unknown,
): boolean => workspacesLoading || !workspacesData;

interface SavedNavigationParams {
  hasNavigationState: boolean;
  selectedWorkspaceId: string | null;
  selectedBaseId: string | null;
  selectedTableId: string | null;
  selectedViewId: string | null;
  shouldSkipExcluded: boolean;
  isResolving: boolean;
  setIsResolving: Dispatch<SetStateAction<boolean>>;
  workspaceBasesData: unknown;
  basesLoading: boolean;
  baseTablesData: unknown;
  tablesLoading: boolean;
  tableViewsData: unknown;
  viewsLoading: boolean;
  workspaces: Workspace[];
  currentPath: string;
  navigate: ReturnType<typeof useNavigate>;
  openFlyout: (pluginId: string) => void;
  resolvedRef: BooleanRef;
  initialNavigationDoneRef: BooleanRef;
}



const isSavedNavigationDataPending = (params: SavedNavigationParams): boolean => {
  const {
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    basesLoading,
    tablesLoading,
    viewsLoading,
  } = params;

  if (!selectedBaseId || !selectedTableId || !selectedViewId) {
    return true;
  }

  if (selectedWorkspaceId && basesLoading) {
    return true;
  }

  if (selectedBaseId && tablesLoading) {
    return true;
  }

  if (selectedTableId && viewsLoading) {
    return true;
  }

  return false;
};

const getAllBasesForSavedNavigation = (
  workspaceBasesData: unknown,
  workspaces: Workspace[],
): Base[] => {
  const basesFromData = (workspaceBasesData as BasesResponse | null | undefined)?.data;

  let basesFromQuery: Base[] = [];
  if (Array.isArray(basesFromData)) {
    basesFromQuery = basesFromData;
  } else if (Array.isArray(workspaceBasesData)) {
    basesFromQuery = workspaceBasesData as Base[];
  }

  if (basesFromQuery.length > 0) {
    return basesFromQuery;
  }

  if (!Array.isArray(workspaces)) {
    return [];
  }

  return workspaces.flatMap((ws) => (Array.isArray(ws?.bases) ? ws.bases : []));
};

const getTablesForSavedNavigation = (
  baseTablesData: unknown,
  base: Base | undefined,
): TableItem[] => {
  const tablesFromData = (baseTablesData as TablesResponse | null | undefined)?.data;

  let tablesFromQuery: TableItem[] = [];
  if (Array.isArray(tablesFromData)) {
    tablesFromQuery = tablesFromData;
  } else if (Array.isArray(baseTablesData)) {
    tablesFromQuery = baseTablesData as TableItem[];
  }

  if (tablesFromQuery.length > 0) {
    return tablesFromQuery;
  }

  if (base && Array.isArray(base.tables)) {
    return base.tables as TableItem[];
  }

  return [];
};

const getAllViewsForSavedNavigation = (tableViewsData: unknown, table: TableItem | undefined): View[] => {
  const viewsFromData = (tableViewsData as ViewsResponse | null | undefined)?.data;

  let viewsFromApi: View[] = [];
  if (Array.isArray(viewsFromData)) {
    viewsFromApi = viewsFromData;
  } else if (Array.isArray(tableViewsData)) {
    viewsFromApi = tableViewsData as View[];
  }

  if (viewsFromApi.length > 0) {
    return viewsFromApi;
  }

  const viewsFromTable = Array.isArray(table?.views) ? table.views as View[] : [];
  return viewsFromTable;
};

const isSavedViewValid = (allViews: View[], selectedViewId: string | null): boolean => {
  if (!selectedViewId) {
    return false;
  }

  if (selectedViewId === 'grid') {
    return true;
  }

  return Array.isArray(allViews) && allViews.some((v: any) => v?.id === selectedViewId);
};

interface NavigateSavedViewParams {
  base: Base | undefined;
  table: TableItem | undefined;
  viewOk: boolean;
  selectedWorkspaceId: string | null;
  selectedBaseId: string | null;
  selectedTableId: string | null;
  selectedViewId: string | null;
  shouldSkipExcluded: boolean;
  currentPath: string;
  isResolving: boolean;
  setIsResolving: Dispatch<SetStateAction<boolean>>;
  navigate: ReturnType<typeof useNavigate>;
  openFlyout: (pluginId: string) => void;
  resolvedRef: BooleanRef;
  initialNavigationDoneRef: BooleanRef;
}

const navigateToSavedViewIfValid = (params: NavigateSavedViewParams): boolean => {
  const {
    base,
    table,
    viewOk,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    shouldSkipExcluded,
    currentPath,
    isResolving,
    setIsResolving,
    navigate,
    openFlyout,
    resolvedRef,
    initialNavigationDoneRef,
  } = params;

  if (!(base && table && viewOk && selectedWorkspaceId && selectedBaseId && selectedTableId && selectedViewId)) {
    return false;
  }

  const targetPath = `/workspace/${selectedWorkspaceId}/base/${selectedBaseId}/table/${selectedTableId}/${selectedViewId}`;

  if (shouldSkipExcluded) {
    if (isResolving) {
      setIsResolving(false);
    }
    return true;
  }

  if (currentPath !== targetPath) {
    const { navigateToView } = useNavigationStore.getState();
    navigateToView(selectedWorkspaceId, selectedBaseId, selectedTableId, selectedViewId);
    openFlyout('workspace-flyout-menu');
    replaceNavigate(navigate, targetPath);
  }

  if (!resolvedRef.current || isResolving) {
    resolvedRef.current = true;
    initialNavigationDoneRef.current = true;
    setIsResolving(false);
  }

  return true;
};

const handleSavedNavigationState = (params: SavedNavigationParams): boolean => {
  const {
    hasNavigationState,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    shouldSkipExcluded,
    isResolving,
    setIsResolving,
    workspaceBasesData,
    baseTablesData,
    tableViewsData,
    workspaces,
    currentPath,
    navigate,
    openFlyout,
    resolvedRef,
    initialNavigationDoneRef,
  } = params;

  if (!(hasNavigationState && selectedWorkspaceId)) {
    return false;
  }

  if (shouldSkipExcluded) {
    if (isResolving) {
      setIsResolving(false);
    }
    return true;
  }

  if (isSavedNavigationDataPending(params)) {
    return true;
  }

  const allBases = getAllBasesForSavedNavigation(workspaceBasesData, workspaces);
  const base = Array.isArray(allBases) && allBases.length > 0
    ? allBases.find((b) => b?.id === selectedBaseId)
    : undefined;

  const tablesForBase = getTablesForSavedNavigation(baseTablesData, base);

  const table = Array.isArray(tablesForBase) && tablesForBase.length > 0
    ? tablesForBase.find((t) => {
      const tableIdMatch =
        t?.model?.id === selectedTableId ||
        t?.id === selectedTableId ||
        t?.table_id === selectedTableId;
      return tableIdMatch;
    })
    : undefined;

  const allViews = getAllViewsForSavedNavigation(tableViewsData, table);
  const viewOk = isSavedViewValid(allViews, selectedViewId || null);

  return navigateToSavedViewIfValid({
    base,
    table,
    viewOk,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    shouldSkipExcluded,
    currentPath,
    isResolving,
    setIsResolving,
    navigate,
    openFlyout,
    resolvedRef,
    initialNavigationDoneRef,
  });
};

interface NewUserParams {
  hasNavigationState: boolean;
  isInitialNavigation: boolean;
  workspaces: Workspace[];
  currentPath: string;
  closeFlyout: () => void;
  navigate: ReturnType<typeof useNavigate>;
  selectedWorkspaceId: string | null;
  selectedBaseId: string | null;
  resolvedRef: BooleanRef;
  initialNavigationDoneRef: BooleanRef;
  isResolving: boolean;
  setIsResolving: Dispatch<SetStateAction<boolean>>;
}

const handleNewUserInitialNavigation = (params: NewUserParams): boolean => {
  const {
    hasNavigationState,
    isInitialNavigation,
    workspaces,
    currentPath,
    closeFlyout,
    navigate,
    selectedWorkspaceId,
    selectedBaseId,
    resolvedRef,
    initialNavigationDoneRef,
    isResolving,
    setIsResolving,
  } = params;

  if (!( !hasNavigationState && isInitialNavigation )) {
    return false;
  }

  if (workspaces.length > 0 && (currentPath === '/' || currentPath === '/workspace')) {
    const firstWorkspace = workspaces[0];
    closeFlyout();
    const { setWorkspace } = useNavigationStore.getState();
    setWorkspace(firstWorkspace.id);
    replaceNavigate(navigate, `/workspace/${firstWorkspace.id}`);
  }

  if (workspaces.length > 0) {
    const firstWorkspace = workspaces[0];
    if (firstWorkspace?.bases && firstWorkspace.bases.length > 0) {
      const firstBase = firstWorkspace.bases[0];
      const { setWorkspace, setBase } = useNavigationStore.getState();
      if (selectedWorkspaceId !== firstWorkspace.id || selectedBaseId !== firstBase.id) {
        setWorkspace(firstWorkspace.id);
        setBase(firstBase.id);
      }
    }
  }

  if (!resolvedRef.current || isResolving) {
    resolvedRef.current = true;
    initialNavigationDoneRef.current = true;
    setIsResolving(false);
  }

  return true;
};

interface AutoSelectParams {
  isInitialNavigation: boolean;
  currentPath: string;
  shouldSkipExcluded: boolean;
  workspaces: Workspace[];
  navigate: ReturnType<typeof useNavigate>;
  openFlyout: (pluginId: string) => void;
  resolvedRef: BooleanRef;
  initialNavigationDoneRef: BooleanRef;
  isResolving: boolean;
  setIsResolving: Dispatch<SetStateAction<boolean>>;
}

const handleAutoSelectBestTarget = (params: AutoSelectParams): boolean => {
  const {
    isInitialNavigation,
    currentPath,
    shouldSkipExcluded,
    workspaces,
    navigate,
    openFlyout,
    resolvedRef,
    initialNavigationDoneRef,
    isResolving,
    setIsResolving,
  } = params;

  const isRootPath = currentPath === '/' || currentPath === '/workspace';
  if (!(isInitialNavigation && isRootPath && !shouldSkipExcluded)) {
    return false;
  }

  if (workspaces.length === 0) {
    return false;
  }

  const targetPath = getBestNavigationTarget(workspaces);
  if (!targetPath || currentPath === targetPath || targetPath === '/workspace') {
    return false;
  }

  const regex = /^\/workspace\/([^/]+)\/base\/([^/]+)\/table\/([^/]+)\/([^/]+)$/;
  const pathMatch = regex.exec(targetPath);

  if (pathMatch) {
    const [, workspaceId, baseId, tableId, viewId] = pathMatch;

    if (workspaceId && baseId && tableId && viewId) {
      const { navigateToView } = useNavigationStore.getState();
      navigateToView(workspaceId, baseId, tableId, viewId);
      openFlyout('workspace-flyout-menu');
      replaceNavigate(navigate, targetPath);
      if (!resolvedRef.current || isResolving) {
        resolvedRef.current = true;
        initialNavigationDoneRef.current = true;
        setIsResolving(false);
      }
      return true;
    }

    return false;
  }

  replaceNavigate(navigate, targetPath);
  if (!resolvedRef.current || isResolving) {
    resolvedRef.current = true;
    initialNavigationDoneRef.current = true;
    setIsResolving(false);
  }
  return true;
};

/**
 * NavigationResolver - Resolves and navigates to saved view BEFORE workspace page renders
 * 
 * This component runs BEFORE any private route renders to:
 * 1. Load activity_data (already loaded during login into navigation store)
 * 2. Wait for workspaces to load
 * 3. Validate saved navigation state exists in current workspace tree
 * 4. Navigate directly to saved view OR first available workspace/base/table/view
 * 
 * This prevents flashing the workspace page before redirecting to saved view.
 */
export const NavigationResolver: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResolving, setIsResolving] = useState(true);
  const resolvedRef = useRef(false);
  const initialNavigationDoneRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Safely get auth context - handle case where AuthProvider might not be ready yet
  // Use useContext directly to avoid throwing error during hot reload or initial mount
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const restoreCompleted = authContext?.restoreCompleted || false;

  const {
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
  } = useNavigationStore();

  // Flyout management
  const { openFlyout, closeFlyout } = usePluginStore();

  // Load workspaces to validate navigation state
  const { data: workspacesData, isLoading: workspacesLoading } = useWorkspaces();
  const { data: workspaceBasesData, isLoading: basesLoading } = useWorkspaceBases(selectedWorkspaceId || '');
  const { data: baseTablesData, isLoading: tablesLoading } = useBaseTables(selectedBaseId || '');
  // Fetch views for the selected table (needed to validate view exists)
  const { data: tableViewsData, isLoading: viewsLoading } = useTableViews(selectedTableId || '');

  // Reset navigation flags when user changes
  useEffect(() => {
    if (!user?.id) {
      return;
    }

    if (lastUserIdRef.current === user.id) {
      return;
    }

    resolvedRef.current = false;
    initialNavigationDoneRef.current = false;
    lastUserIdRef.current = user.id;
  }, [user?.id]);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    const isPublicRoute = isPublicRoutePath(location.pathname);

    const excludedRoutes = ['/workspace', '/reset-password'];
    const currentPath = location.pathname;
    const currentExcluded = isExcludedWorkspaceRoute(currentPath, excludedRoutes);

    const isViewSlug = selectedViewId && VIEW_TYPE_SLUGS.has(selectedViewId.toLowerCase());
    const hasNavigationState = !!(selectedWorkspaceId && selectedBaseId && selectedTableId && selectedViewId && !isViewSlug);
    const expectedPath = hasNavigationState
      ? `/workspace/${selectedWorkspaceId}/base/${selectedBaseId}/table/${selectedTableId}/${selectedViewId}`
      : null;

    const isInitialPath = currentPath === '/' || currentPath === '/workspace';
    const isInitialNavigation = isInitialPath && !initialNavigationDoneRef.current;

    const isWorkspaceRoot = currentPath === '/workspace';
    const shouldSkipExcluded = currentExcluded && !(isWorkspaceRoot && isInitialNavigation);

    if (handleExcludedRouteSkip(shouldSkipExcluded, resolvedRef, initialNavigationDoneRef, isResolving, setIsResolving)) {
      return;
    }

    resetResolutionForInitialNavigationIfNeeded({
      hasNavigationState,
      currentPath,
      expectedPath,
      resolvedRef,
      restoreCompleted,
      isInitialNavigation,
      shouldSkipExcluded,
      isResolving,
      setIsResolving,
    });

    if (handlePublicOrAuthGuard(isPublicRoute, !!user?.id, restoreCompleted, isResolving, setIsResolving)) {
      return;
    }

    if (handleAlreadyResolvedOnExpectedPath(resolvedRef, currentPath, expectedPath, shouldSkipExcluded, isResolving, setIsResolving)) {
      return;
    }

    if (handleResolvedPathMismatch({
      resolvedRef,
      currentPath,
      expectedPath,
      hasNavigationState,
      isInitialNavigation,
      shouldSkipExcluded,
      isResolving,
      setIsResolving,
    })) {
      return;
    }

    if (handleAlreadyOnExpectedPathMatch({
      hasNavigationState,
      currentPath,
      expectedPath,
      resolvedRef,
      setIsResolving,
    })) {
      return;
    }

    if (shouldWaitForWorkspaces(workspacesLoading, workspacesData)) {
      return;
    }

    const workspaces = Array.isArray(workspacesData) ? workspacesData : [];

    if (handleSavedNavigationState({
      hasNavigationState,
      selectedWorkspaceId: selectedWorkspaceId || null,
      selectedBaseId: selectedBaseId || null,
      selectedTableId: selectedTableId || null,
      selectedViewId: selectedViewId || null,
      shouldSkipExcluded,
      isResolving,
      setIsResolving,
      workspaceBasesData,
      basesLoading,
      baseTablesData,
      tablesLoading,
      tableViewsData,
      viewsLoading,
      workspaces,
      currentPath,
      navigate,
      openFlyout,
      resolvedRef,
      initialNavigationDoneRef,
    })) {
      return;
    }

    if (handleNewUserInitialNavigation({
      hasNavigationState,
      isInitialNavigation,
      workspaces,
      currentPath,
      closeFlyout,
      navigate,
      selectedWorkspaceId: selectedWorkspaceId || null,
      selectedBaseId: selectedBaseId || null,
      resolvedRef,
      initialNavigationDoneRef,
      isResolving,
      setIsResolving,
    })) {
      return;
    }

    if (handleAutoSelectBestTarget({
      isInitialNavigation,
      currentPath,
      shouldSkipExcluded,
      workspaces,
      navigate,
      openFlyout,
      resolvedRef,
      initialNavigationDoneRef,
      isResolving,
      setIsResolving,
    })) {
      return;
    }

    finalizeResolutionIfNeeded(resolvedRef, initialNavigationDoneRef, isResolving, setIsResolving);
  }, [
    user?.id,
    restoreCompleted,
    location.pathname,
    workspacesData,
    workspacesLoading,
    workspaceBasesData,
    basesLoading,
    baseTablesData,
    tablesLoading,
    tableViewsData,
    viewsLoading,
    selectedWorkspaceId,
    selectedBaseId,
    selectedTableId,
    selectedViewId,
    navigate,
  ]);

  // Validate URL when workspaces change (e.g., after member removal)
  // This ensures users are redirected if they lose access to the current workspace/base
  useEffect(() => {
    if (!workspacesData || workspacesLoading) return;
    if (!user?.id || !restoreCompleted) return;
    if (isResolving) return; // Don't interfere with ongoing resolution

    const workspaces = Array.isArray(workspacesData) ? workspacesData : [];
    const currentPath = location.pathname;

    // Skip validation on excluded routes (settings, etc.)
    const excludedRoutes = ['/workspace', '/projects', '/settings', '/administrator'];
    const isExcluded = excludedRoutes.some(route => currentPath.includes(route));
    if (isExcluded) return;

    // If no workspaces at all, stay on /workspace and let HomePage show "no workspaces" message
    if (workspaces.length === 0) {
      const { setWorkspace, setBase, setTable, setView } = useNavigationStore.getState();
      setWorkspace(null);
      setBase(null);
      setTable(null);
      setView(null);
      if (currentPath !== '/workspace' && currentPath !== '/') {
        replaceNavigate(navigate, '/workspace');
      }
      resolvedRef.current = true;
      initialNavigationDoneRef.current = true;
      setIsResolving(false);
      return;
    }

    if (!selectedWorkspaceId) {
      return;
    }

    const currentWorkspace = workspaces.find((ws) => ws.id === selectedWorkspaceId);
    if (!currentWorkspace) {
      const targetPath = getBestNavigationTarget(workspaces);
      if (targetPath) {
        replaceNavigate(navigate, targetPath);
        return;
      }

      const firstWorkspace = workspaces[0];
      const { setWorkspace } = useNavigationStore.getState();
      setWorkspace(firstWorkspace.id);
      replaceNavigate(navigate, `/workspace/${firstWorkspace.id}`);
    }
  }, [workspacesData, workspacesLoading, selectedWorkspaceId, user?.id, restoreCompleted, location.pathname, navigate, isResolving]);

  const isPublicRoute = isPublicRoutePath(location.pathname);

  if (isPublicRoute || !user?.id) {
    return null;
  }

  return <></>;
};

