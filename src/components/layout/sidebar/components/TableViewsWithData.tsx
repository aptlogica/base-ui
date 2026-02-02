import React from 'react';
import { useTableViews } from '../../../../hooks/useApi';
import { TableViews } from './TableViews';
import { TableViewsProps } from '../types';

export const TableViewsWithData: React.FC<Omit<TableViewsProps, 'views'>> = (props) => {
  const { table } = props;
  // Only fetch views when this component is rendered (table is expanded)
  // useTableViews has caching (2min staleTime), so repeated expands are fast
  const { data: viewsResponse } = useTableViews(table.id);
  const response = viewsResponse as { data?: unknown[] } | undefined;
  const views = Array.isArray(response?.data) ? response.data : [];
  
  return <TableViews {...props} views={views} />;
};

