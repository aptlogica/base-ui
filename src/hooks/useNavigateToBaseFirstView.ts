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

      const tables = tablesResponse?.data || [];
      
      if (tables.length === 0) {
        // No tables, navigate to base page
        navigateToBase(selectedWorkspaceId, baseId);
        navigate(`/base/${baseId}`);
        return;
      }

      const firstTable = tables[0];
      const tableId = firstTable.id || firstTable.model?.id;
      
      if (!tableId) {
        // Invalid table, navigate to homepage
        navigateToBase(selectedWorkspaceId, baseId);
        navigate(`/homepage`);
        return;
      }
      
      // Fetch views for the first table
      const viewsResponse = await queryClient.fetchQuery({
        queryKey: ['tables', tableId, 'views'],
        queryFn: () => getViewsByModelIdService(tableId),
      });

      const views = viewsResponse?.data || [];
      
      if (views.length > 0) {
        // Navigate to first view
        const firstView = views[0];
        navigateToView(selectedWorkspaceId, baseId, tableId, firstView.id);
        navigate(`/base/${baseId}/table/${tableId}/${firstView.id}`);
      } else {
        // No views, navigate to table with grid view
        navigateToTable(selectedWorkspaceId, baseId, tableId);
        navigate(`/base/${baseId}/table/${tableId}/grid`);
      }
    } catch (error) {
      console.error('Failed to navigate to base first view:', error);
      // Fallback: navigate to homepage
      navigateToBase(selectedWorkspaceId, baseId);
      navigate(`/homepage`);
      throw error;
    }
  };

  return { navigateToFirstView };
};

