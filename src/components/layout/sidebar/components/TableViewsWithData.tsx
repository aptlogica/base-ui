import React from 'react';
import { useTableViews } from '../../../../hooks/useApi';
import { TableViews } from './TableViews';
import { TableViewsProps } from '../types';

/**
 * Wrapper component that fetches views only when table is expanded
 * This prevents fetching views for all tables upfront (60+ API calls)
 * 
 * Performance benefits:
 * - Zero API calls on initial load
 * - Views fetched only when table is expanded
 * - React Query caching (2min staleTime) makes repeated expands instant
 */
export const TableViewsWithData: React.FC<Omit<TableViewsProps, 'views'>> = (props) => {
  const { table } = props;
  
  // Only fetch views when this component is rendered (table is expanded)
  // useTableViews has caching (2min staleTime), so repeated expands are fast
  const { data: viewsResponse, isLoading } = useTableViews(table.id);
  const views = viewsResponse?.data || [];
  
  return <TableViews {...props} views={views} />;
};

