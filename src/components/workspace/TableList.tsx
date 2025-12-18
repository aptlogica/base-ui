import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../../hooks/useNavigation';
import TableOptionsMenu from '../tables/TableOptionsMenu';
import {
  useUpdateTable,
  useDeleteTable,
  useTableViews,
} from '../../hooks/useApi';
import useWorkspaceData from '../../hooks/useWorkspaceData';
import { VIEW_ICONS } from '../../types/viewTypes';
import { useNavigationActions } from '../../hooks/useNavigationActions';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../../utils/dateUtils';

const NocoDBIcon = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
    <LucideIcons.Database size={16} color="var(--color-bg-brand-primary)" />
  </span>
);

// Utility function to truncate text
const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.length > maxLength ? `${trimmed.substring(0, maxLength)}...` : trimmed;
};
interface TableListProps {
  baseId?: string;
}

const TableList: React.FC<TableListProps> = ({ baseId }) => {
  const [error, setError] = useState<string | null>(null);
  const [openTable, setOpenTable] = useState<string | null>(null);
  const navigate = useNavigate();
  const { navigateToTable } = useNavigation();
  const queryClient = useQueryClient();

  // TanStack Query hooks
  const updateTableMutation = useUpdateTable();
  const deleteTableMutation = useDeleteTable();
  // Use shared workspace data hook to get base tables (keeps contract same as previous)
  const { baseTables, _raw } = useWorkspaceData(undefined, baseId || undefined);
  const tablesLoading = _raw?.baseTablesQuery?.isLoading;
  const tablesError = _raw?.baseTablesQuery?.error;
  const { handleTableDeletion } = useNavigationActions();

  // Extract tables from the response structure
  const tables = React.useMemo(() => {
    if (!baseTables?.data) return [];
    return baseTables.data.map((item: any) => ({
      id: item.model.id,
      title: item.model.title,
      description: item.model.description,
      alias: item.model.alias,
      base_id: item.model.base_id,
      workspace_id: item.model.workspace_id,
      created_time: item.model.created_time,
      last_modified_time: item.model.last_modified_time,
    }));
  }, [baseTables]);

  // Fetch views for the currently expanded table
  const { data: viewsResponse, isLoading: viewsLoading } = useTableViews(openTable || '');

  // Update error state based on query error
  useEffect(() => {
    if (tablesError) {
      setError('Failed to load tables data');
    } else {
      setError(null);
    }
  }, [tablesError]);

  const handleTableExpand = (tableId: string) => {
    if (openTable === tableId) {
      setOpenTable(null);
    } else {
      setOpenTable(tableId);
    }
  };

  // TanStack Query automatically handles cache invalidation

  const handleEditTable = async (tableId: string, updates: { title?: string; description?: string }) => {
    try {
      await updateTableMutation.mutateAsync({
        tableId,
        params: {
          ...updates,
          last_modified_time: new Date().toISOString()
        }
      });

      // Invalidate and refetch the base tables query to update UI
      await queryClient.invalidateQueries({
        queryKey: ['bases', baseId, 'tables']
      });

      // Also refetch the specific query
      await queryClient.refetchQueries({
        queryKey: ['bases', baseId, 'tables']
      });
    } catch (err) {
      console.error('Failed to update table:', err);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      // Find the table to get its baseId
      const table = tables.find(t => t.id === tableId);
      if (!table) {
        console.error('Table not found for deletion');
        return;
      }

      // Actually call the delete API mutation
      await deleteTableMutation.mutateAsync({
        tableId: table.id,
        baseId: table.base_id || baseId || ''
      });

      // Then handle navigation cleanup
      await handleTableDeletion(tableId);

      // Close the table if it was open
      if (openTable === tableId) {
        setOpenTable(null);
      }

      // Invalidate queries to refresh the list
      await queryClient.invalidateQueries({
        queryKey: ['bases', baseId, 'tables']
      });
    } catch (err) {
      console.error('Failed to delete table:', err);
      // Show error to user
      alert(`Failed to delete table. Please try again.`);
    }
  };

  if (tablesLoading) return <div className="p-8 text-gray-400">Loading tables...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!baseId) return <div className="p-8 text-gray-400">No base selected. Please select a base from the sidebar.</div>;
  if (!tables || tables.length === 0) return <div className="p-8 text-gray-400">No tables found in this base.</div>;

  return (
    <div className="bg-card rounded-lg shadow border mt-2">
      <div className="mb-4">
        {/* Header */}
        <div className="grid rounded-tl-lg rounded-tr-lg grid-cols-12 px-6 py-3 border-b text-xs text-gray-700 font-semibold hover:text-gray-900">
          <div className="col-span-4 flex items-center gap-2">Name</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Source</div>
          <div className="col-span-2">Created On</div>
          <div className="col-span-1">Actions</div>
        </div>
        {/* Removed Create Table Button and Modal */}
        <div className="max-h-96 overflow-y-auto">
          {tables.map((table: any) => (
            <React.Fragment key={table.id}>
              <div
                className="grid grid-cols-12 items-center px-6 pt-3 hover:bg-main transition cursor-pointer group"
                style={{ fontWeight: 600 }}
              >
                <div className="h-7 col-span-4 flex items-center gap-2 transition-all ease-in duration-200">
                  <button className="mr-1 flex items-center" onClick={() => handleTableExpand(table.id)}>
                    <LucideIcons.ChevronDown
                      size={15}
                      className={`transition-transform ${openTable === table.id ? '' : '-rotate-90'} group-hover:bg-main`}
                    />
                  </button>
                  <LucideIcons.Sheet size={15} color="#2563eb" />
                  <span
                    className="cursor-pointer font-medium text-[var(--color-text-primary)] truncate"
                    style={{ maxWidth: '200px' }}
                    onClick={e => {
                      e.stopPropagation();
                      // Always navigate to the grid view for this table via central navigation
                      navigateToTable(table.workspace_id || '', table.base_id || baseId || '', table.id);
                    }}
                  >
                    {table.title}
                  </span>
                </div>
                <div className="col-span-3 text-secondary font-normal">
                  {table.description ? (
                    <span
                      className="block truncate cursor-help"
                      title={table.description}
                      style={{ maxWidth: '200px' }}
                    >
                      {truncateText(table.description, 50)}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">No description</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <NocoDBIcon />
                </div>
                <div className="col-span-2 text-xs font-normal">
                  {(() => {
                    // Use table's created_time if it's a real date, otherwise show "N/A"
                    const tableCreatedAt = table.created_time || table.createdOn;

                    // Check if it's a placeholder date
                    if (!tableCreatedAt || tableCreatedAt === '0001-01-01T00:00:00Z' || tableCreatedAt === '1970-01-01T00:00:00Z') {
                      return 'N/A';
                    }

                    return formatDate(tableCreatedAt);
                  })()}
                </div>
                <div className="col-span-1 flex items-center justify-start gap-2">
                  <TableOptionsMenu
                    table={table}
                    onRename={(newName) => handleEditTable(table.id, { title: newName })}
                    onEditDescription={(description) => handleEditTable(table.id, { description })}
                    onDelete={() => handleDeleteTable(table.id)}
                    portaled={true}
                    align="right"
                    existingTables={tables.map(t => ({ id: t.id, title: t.title, name: t.title }))}
                  />
                </div>
              </div>
              {/* Table views: only show for expanded table, fetch dynamically */}
              {openTable === table.id && (
                <div className="bg-gray-50 border-l-4">
                  {viewsLoading ? (
                    <div className="grid grid-cols-12 items-center px-6 py-2 ml-6">
                      <div className="col-span-12 flex items-center gap-2 text-sm text-gray-500">
                        <LucideIcons.Loader2 size={16} className="animate-spin" />
                        Loading views...
                      </div>
                    </div>
                  ) : viewsResponse?.data && viewsResponse.data.length > 0 ? (
                    viewsResponse.data.map((view: any) => {
                      const displayType = view.type ? view.type.charAt(0).toUpperCase() + view.type.slice(1) : 'Grid';
                      const viewType = view.type || 'grid';
                      const viewIconInfo = VIEW_ICONS[viewType as keyof typeof VIEW_ICONS] || VIEW_ICONS.grid;
                      const IconComponent = viewIconInfo.icon;
                      return (
                        <div
                          key={view.id}
                          className="grid grid-cols-12 items-center px-6 py-2 ml-7 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/base/${baseId}/table/${table.id}/${view.id}`);
                          }}
                        >
                          <div className="col-span-4 flex items-center gap-2 hover:translate-x-1 transition-all ease-in duration-200">
                            <IconComponent size={16} style={{ color: viewIconInfo.color }} />
                            <span className="text-sm text-gray-700">{view.title || view.name || displayType}</span>
                          </div>
                          <div className="col-span-3 text-sm text-gray-500">{displayType} View</div>
                          <div className="col-span-2"></div>  
                          <div className="col-span-2 text-xs text-gray-400">{formatDate(view.created_time)}</div>
                          <div className="col-span-1"></div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-12 items-center px-6 py-2 ml-6">
                      <div className="col-span-12 text-sm text-gray-500">
                        No views available for this table
                      </div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableList; 