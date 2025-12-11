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
import { isTenantSchemaAvailable } from '../service/clientService';


export const useWorkspaceData = (selectedWorkspaceId?: string, selectedBaseId?: string) => {
  const tenantReady = isTenantSchemaAvailable();

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
    // If tenant schema not ready, show loading so UI waits for login flow to finish
    if (!tenantReady) return true;
    return !!(workspacesQuery.isLoading || workspaceBasesQuery.isLoading || baseTablesQuery.isLoading);
  }, [tenantReady, workspacesQuery.isLoading, workspaceBasesQuery.isLoading, baseTablesQuery.isLoading]);

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
