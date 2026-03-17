// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useState, useCallback } from 'react';
import { SortState } from '../types/grid.types';

export const useTableSort = () => {
  const [sortConfig, setSortConfig] = useState<SortState>({
    column: null,
    direction: 'asc'
  });

  const handleSort = useCallback((column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        column,
        direction: 'asc'
      };
    });
  }, []);

  return {
    sortConfig,
    handleSort
  };
};