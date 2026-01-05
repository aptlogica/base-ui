import { useQuery } from '@tanstack/react-query';
import { getFieldByIdService } from '../service/clientService';

/**
 * Hook to fetch the source column configuration for a lookup field
 * Uses lookup_column_id from field.meta to fetch the actual source column
 */
export const useLookupSourceColumn = (lookupColumnId: string | undefined) => {
  return useQuery({
    queryKey: ['lookupSourceColumn', lookupColumnId],
    queryFn: async () => {
      if (!lookupColumnId) return null;
      
      try {
        const result = await getFieldByIdService(lookupColumnId);
        // Extract the column data from the response
        const column = result?.data?.column || result?.data || result;
        
        // Parse meta if it's a string
        if (column?.meta && typeof column.meta === 'string') {
          try {
            column.meta = JSON.parse(column.meta);
          } catch {
            // If parsing fails, keep as is
          }
        }
        
        return column;
      } catch (error) {
        console.error('Error fetching lookup source column:', error);
        return null;
      }
    },
    enabled: !!lookupColumnId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

