import {
  useWorkspaces, useWorkspaceById, useWorkspaceBases, useBaseById, useBaseTables, useTable, useTableViews, useViewById,
  useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace,
  useCreateBase, // useUpdateBase, // Not available in useApi
  useDeleteBase,
  useCreateTable, useUpdateTable, useDeleteTable,
  useCreateField, useUpdateField, useDeleteColumn,
  useCreateView, useUpdateView, useDeleteView,
  useAddRow, useInsertRowData, useDeleteRecord
} from '../../../hooks/useApi';
import { isTenantSchemaAvailable } from '../../../service/clientService';

export const useWorkspaceDataService = (workspaceId?: string, baseId?: string, tableId?: string, viewId?: string) => {
  const tenantReady = isTenantSchemaAvailable();

  // Queries
  const workspacesQuery = useWorkspaces();
  const workspaceByIdQuery = useWorkspaceById(workspaceId || '');
  const workspaceBasesQuery = useWorkspaceBases(workspaceId || '');
  const baseByIdQuery = useBaseById(baseId || '');
  const baseTablesQuery = useBaseTables(baseId || '');
  const tableByIdQuery = useTable(tableId, {pageNumber:1, pageLimit: 30});
  const tableViewsQuery = useTableViews(tableId || '');
  const viewByIdQuery = useViewById(viewId || '');

  // Mutations
  const createWorkspaceMutation = useCreateWorkspace();
  const updateWorkspaceMutation = useUpdateWorkspace();
  const deleteWorkspaceMutation = useDeleteWorkspace();
  const createBaseMutation = useCreateBase();
  // const updateBaseMutation = useUpdateBase(); // Not available
  const deleteBaseMutation = useDeleteBase();
  const createTableMutation = useCreateTable();
  const updateTableMutation = useUpdateTable();
  const deleteTableMutation = useDeleteTable();
  const createFieldMutation = useCreateField();
  const updateFieldMutation = useUpdateField();
  const deleteFieldMutation = useDeleteColumn();
  const createViewMutation = useCreateView();
  const updateViewMutation = useUpdateView();
  const deleteViewMutation = useDeleteView();
  const addRowMutation = useAddRow();
  const insertRowDataMutation = useInsertRowData();
  const deleteRecordMutation = useDeleteRecord();

  return {
    tenantReady,
    // Queries
    workspacesQuery,
    workspaceByIdQuery,
    workspaceBasesQuery,
    baseByIdQuery,
    baseTablesQuery,
    tableByIdQuery,
    tableViewsQuery,
    viewByIdQuery,
    // Loading & Error states
    workspacesLoading: workspacesQuery.isLoading,
    basesLoading: workspaceBasesQuery.isLoading,
    tablesLoading: baseTablesQuery.isLoading,
    viewsLoading: tableViewsQuery.isLoading,
    workspacesError: workspacesQuery.error,
    basesError: workspaceBasesQuery.error,
    tablesError: baseTablesQuery.error,
    viewsError: tableViewsQuery.error,
    // Mutations
    createWorkspaceMutation,
    updateWorkspaceMutation,
    deleteWorkspaceMutation,
    createBaseMutation,
    // updateBaseMutation, // Not available
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
  };
};
