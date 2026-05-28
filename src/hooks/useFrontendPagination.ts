// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useState, useMemo, useCallback, useEffect } from 'react';

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

  // Loading state for infinite scroll UX
  isLoadingMore: boolean;
  
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [prevDataLength, setPrevDataLength] = useState(data.length);
  
  // Reset behavior:
  // - Data shrinks (usually filter/search tightened): reset to first page.
  // - Data grows (new row append): preserve currently loaded pages.
  useEffect(() => {
    if (data.length < prevDataLength) {
      setCurrentPage(1);
      setIsLoadingMore(false);
    }
    setPrevDataLength(data.length);
  }, [data.length, prevDataLength]);
  
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

  // When the page changes (after a load), clear the loading flag.
  useEffect(() => {
    if (isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [currentPage, isLoadingMore]);
  
  const loadNextPage = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    // Defer page increment so the UI has a chance to paint the loading state.
    // This improves infinite-scroll UX even though paging is computed locally.
    requestAnimationFrame(() => {
      setCurrentPage(prev => prev + 1);
    });
  }, [hasMore, isLoadingMore]);
  
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
    isLoadingMore,
    loadNextPage,
    loadPrevPage,
    goToPage,
    reset,
    allLoadedData, // Use this for rendering - contains all loaded pages
  };
}

