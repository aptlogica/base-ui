// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useMemo } from 'react';
import {
  useWorkspaces,
  useWorkspaceBases,
  useBaseTables,
  useCreateWorkspace,
  useCreateBase,
  useCreateTable,
  useCreateView,
  useUpdateTable,
} from './useApi';


export const useWorkspaceData = (selectedWorkspaceId?: string, selectedBaseId?: string) => {
  const workspacesQuery = useWorkspaces();
  const workspaceBasesQuery = useWorkspaceBases(selectedWorkspaceId || '');
  const baseTablesQuery = useBaseTables(selectedBaseId || '');

  const createWorkspaceMutation = useCreateWorkspace();
  const createBaseMutation = useCreateBase();
  const createTableMutation = useCreateTable();
  const createViewMutation = useCreateView();
  const updateTableMutation = useUpdateTable();

  // Aggregate loading & error state
  const loading = useMemo(() => {
    return !!(workspacesQuery.isLoading || workspaceBasesQuery.isLoading || baseTablesQuery.isLoading);
  }, [workspacesQuery.isLoading, workspaceBasesQuery.isLoading, baseTablesQuery.isLoading]);

  const error = useMemo(() => {
    return workspacesQuery.error || workspaceBasesQuery.error || baseTablesQuery.error || null;
  }, [workspacesQuery.error, workspaceBasesQuery.error, baseTablesQuery.error]);

  return {
    // queries
    workspaces: workspacesQuery.data,
    workspaceBases: workspaceBasesQuery.data,
    baseTables: baseTablesQuery.data,
    // loading / error
    loading,
    error,
    // mutations
    createWorkspaceMutation,
    createBaseMutation,
    createTableMutation,
    createViewMutation,
    updateTableMutation,
    // raw query objects in case callers need extra metadata
    _raw: {
      workspacesQuery,
      workspaceBasesQuery,
      baseTablesQuery,
    }
  };
};

export default useWorkspaceData;
