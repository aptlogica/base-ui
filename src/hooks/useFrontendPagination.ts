import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface UseFrontendPaginationOptions<T> {
  data: T[];
  pageSize?: number;
  initialPage?: number;
}

interface UseFrontendPaginationReturn<T> {
  // Current page data
  paginatedData: T[];
  
  // Pagination state
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
  hasPrev: boolean;
  
  // Actions
  loadNextPage: () => void;
  loadPrevPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
  
  // For infinite scroll - get all loaded pages combined
  allLoadedData: T[];
}

/**
 * Frontend pagination hook with infinite scroll support
 * Loads pages incrementally as user scrolls (not traditional page numbers)
 */
export function useFrontendPagination<T>({
  data,
  pageSize = 30,
  initialPage = 1,
}: UseFrontendPaginationOptions<T>): UseFrontendPaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Reset to page 1 when data changes (new filter/search)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]); // Reset when dataset size changes
  
  const totalPages = Math.ceil(data.length / pageSize);
  const totalItems = data.length;
  
  // For infinite scroll: return all pages up to currentPage
  const allLoadedData = useMemo(() => {
    const end = currentPage * pageSize;
    return data.slice(0, end);
  }, [data, currentPage, pageSize]);
  
  // Current page data (for compatibility, but we'll use allLoadedData for rendering)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);
  
  const hasMore = currentPage < totalPages;
  const hasPrev = currentPage > 1;
  
  const loadNextPage = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);
  
  const loadPrevPage = useCallback(() => {
    if (hasPrev) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrev]);
  
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);
  
  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  return {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    hasMore,
    hasPrev,
    loadNextPage,
    loadPrevPage,
    goToPage,
    reset,
    allLoadedData, // Use this for rendering - contains all loaded pages
  };
}

