import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../stores/navigationStore';
import { getTablesByBaseIdService, getViewsByModelIdService } from '../service/clientService';

/**
 * Hook to navigate to the first table's first view of a base
 * This is used when clicking on a base card from the homepage
 */
export const useNavigateToBaseFirstView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedWorkspaceId, navigateToView, navigateToTable, navigateToBase } = useNavigationStore();

  const navigateToFirstView = async (baseId: string) => {
    if (!selectedWorkspaceId) {
      throw new Error('No workspace selected');
    }

    try {
      // Fetch tables for this base
      const tablesResponse = await queryClient.fetchQuery({
        queryKey: ['bases', baseId, 'tables'],
        queryFn: () => getTablesByBaseIdService(baseId),
      });

      // Type assertion to handle SDK response which may have data or be the array directly
      const tablesData = tablesResponse as { data?: unknown[] } | unknown[] | undefined;
      const tables = (Array.isArray(tablesData) ? tablesData : (tablesData as { data?: unknown[] })?.data) || [];
      
      if (tables.length === 0) {
        // No tables, navigate to workspace homepage
        navigateToBase(selectedWorkspaceId, baseId);
        navigate(`/workspace/${selectedWorkspaceId}`);
        return;
      }

      const firstTable = tables[0] as { id?: string; model?: { id?: string } } | undefined;
      const tableId = firstTable?.id || firstTable?.model?.id;
      
      if (!tableId) {
        // Invalid table, navigate to workspace homepage
        navigateToBase(selectedWorkspaceId, baseId);
        navigate(`/workspace/${selectedWorkspaceId}`);
        return;
      }
      
      // Fetch views for the first table
      const viewsResponse = await queryClient.fetchQuery({
        queryKey: ['tables', tableId, 'views'],
        queryFn: () => getViewsByModelIdService(tableId),
      });

      // Type assertion to handle SDK response which may have data or be the array directly
      const viewsData = viewsResponse as { data?: unknown[] } | unknown[] | undefined;
      const views = (Array.isArray(viewsData) ? viewsData : (viewsData as { data?: unknown[] })?.data) || [];
      
      if (views.length > 0) {
        // Navigate to first view
        const firstView = views[0] as { id: string } | undefined;
        if (firstView?.id) {
          navigateToView(selectedWorkspaceId, baseId, tableId, firstView.id);
          navigate(`/workspace/${selectedWorkspaceId}/base/${baseId}/table/${tableId}/${firstView.id}`);
        }
      } else {
        // No views, navigate to table with grid view
        navigateToTable(selectedWorkspaceId, baseId, tableId);
        navigate(`/workspace/${selectedWorkspaceId}/base/${baseId}/table/${tableId}/grid`);
      }
    } catch (error) {
      console.error('Failed to navigate to base first view:', error);
      // Fallback: navigate to workspace homepage
      navigateToBase(selectedWorkspaceId, baseId);
      navigate(`/workspace/${selectedWorkspaceId}`);
      // Don't throw error - we've handled it by navigating to workspace homepage
    }
  };

  return { navigateToFirstView };
};

