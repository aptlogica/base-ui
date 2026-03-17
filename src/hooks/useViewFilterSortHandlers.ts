// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useCallback } from 'react';

export type ViewFilterType = { column: string; operator: string; value: string };

export interface ViewFilterSortHandlersOptions<TSort> {
  filters: ViewFilterType[];
  setFilters: (filters: ViewFilterType[]) => void;
  setDraftFilter?: (filter: ViewFilterType | null) => void;
  isReadOnly?: boolean;
  persistFilters?: (filters: ViewFilterType[]) => Promise<void> | void;
  persistSorts?: (sorts: TSort[]) => Promise<void> | void;
  sanitizeSorts?: (sorts: TSort[]) => TSort[];
}

export function useViewFilterSortHandlers<TSort>({
  filters,
  setFilters,
  setDraftFilter,
  isReadOnly = false,
  persistFilters,
  persistSorts,
  sanitizeSorts,
}: ViewFilterSortHandlersOptions<TSort>) {
  const handleRealTimeFilter = useCallback((filter: ViewFilterType | null) => {
    setDraftFilter?.(filter);
  }, [setDraftFilter]);

  const handleAddFilter = useCallback(async (filter: ViewFilterType) => {
    const newFilters = [...filters, filter];
    setFilters(newFilters);
    setDraftFilter?.(null);

    if (!isReadOnly && persistFilters) {
      await persistFilters(newFilters);
    }
  }, [filters, isReadOnly, persistFilters, setDraftFilter, setFilters]);

  const handleRemoveFilter = useCallback(async (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);

    if (!isReadOnly && persistFilters) {
      await persistFilters(newFilters);
    }
  }, [filters, isReadOnly, persistFilters, setFilters]);

  const handleUpdateFilter = useCallback(async (index: number, updates: Partial<ViewFilterType>) => {
    if (index < 0 || index >= filters.length) return;

    const updatedFilter = { ...filters[index], ...updates };
    if (updates.value === '' && !updatedFilter.value) {
      await handleRemoveFilter(index);
      return;
    }

    const newFilters = filters.map((filter, i) =>
      i === index ? updatedFilter : filter
    );
    setFilters(newFilters);

    if (!isReadOnly && persistFilters) {
      await persistFilters(newFilters);
    }
  }, [filters, handleRemoveFilter, isReadOnly, persistFilters, setFilters]);

  const handleSortChange = useCallback(async (newSorts: TSort[]) => {
    const nextSorts = sanitizeSorts ? sanitizeSorts(newSorts) : newSorts;
    if (!isReadOnly && persistSorts) {
      await persistSorts(nextSorts);
    }
  }, [isReadOnly, persistSorts, sanitizeSorts]);

  return {
    handleRealTimeFilter,
    handleAddFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleSortChange,
  };
}
