// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
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
        // Type assertion to handle SDK response which may have data.column, data, or be the column directly
        const response = result as unknown as Record<string, unknown> | undefined;

        // Helper to safely extract column from response
        const extractColumn = (resp: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
          if (!resp || typeof resp !== 'object') return undefined;

          if ('data' in resp && resp.data && typeof resp.data === 'object') {
            const data = resp.data as Record<string, unknown>;
            if ('column' in data) {
              return data.column as Record<string, unknown>;
            }
            return data;
          }

          return resp;
        };

        const column = extractColumn(response);

        // Parse meta if it's a string
        if (column && 'meta' in column && typeof column.meta === 'string') {
          try {
            column.meta = JSON.parse(column.meta) as unknown;
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
    // Always verify source-column metadata when table remounts/navigation occurs.
    // This prevents stale lookup formatting after source field config updates.
    refetchOnMount: 'always',
    refetchOnReconnect: false,
  });
};

