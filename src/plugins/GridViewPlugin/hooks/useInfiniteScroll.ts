import { useState, useEffect, useCallback, useRef } from 'react';
import { useGetRecordsByPagination } from '../../../hooks/useApi';

interface UseInfiniteScrollOptions {
  tableId?: string;
  initialRecords?: any[];
}

export function useInfiniteScroll({
  tableId,
  initialRecords = [],
}: UseInfiniteScrollOptions) {
  const [allRecords, setAllRecords] = useState(initialRecords);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Get the mutation function for fetching paginated records
  const { mutateAsync: fetchPaginatedRecords } = useGetRecordsByPagination(tableId || '');

  // Use ref to track previous initialRecords to avoid infinite loops
  const prevInitialRecordsRef = useRef<any[]>(initialRecords);
  const prevInitialRecordsStringRef = useRef<string>('');
  
  // Track if we should preserve pages 2+ on next update (only for safe operations like adding rows)
  const shouldPreservePagesRef = useRef(false);

  // Reset records when initialRecords actually changes (by comparing serialized content)
  useEffect(() => {
    // Optimized comparison: Only compare record IDs and last_modified_time
    // This is much faster than comparing all fields and still detects most changes
    // For attachment fields specifically, we rely on optimistic updates in useCellEditing
    // and the API refetch will update initialRecords with new last_modified_time
    const currentString = initialRecords.length === 0 
      ? 'empty' 
      : initialRecords.map(r => {
        const id = r?.id || r?._meta?.id || '';
        const lastModified = r?.last_modified_time || r?.updated_at || '';
        // For arrays (like attachments), include length and first item ID for quick change detection
        // This is much faster than stringifying entire arrays
        const arrayFields = Object.keys(r || {})
          .filter(key => Array.isArray(r[key]) && !['id', 'created_at', 'updated_at', '_meta'].includes(key))
          .map(key => {
            const arr = r[key] as any[];
            const firstId = arr.length > 0 ? (arr[0]?.id || arr[0]?.url || '') : '';
            return `${key}:${arr.length}:${firstId}`;
          })
          .join('|');
        return `${id}|${lastModified}|${arrayFields}`;
      }).join('||');
    
    const prevString = prevInitialRecordsStringRef.current;

    // Only update if content actually changed
    if (currentString !== prevString) {
      const shouldPreserve = shouldPreservePagesRef.current && currentPage > 1;
      
      if (shouldPreserve) {
        // Smart merge: Update records by ID, remove deleted ones, keep pages 2+
        setAllRecords(prev => {
          const page1Ids = new Set(initialRecords.map(r => r?.id || r?._meta?.id));
          
          // Update page 1 records
          const updatedPage1 = initialRecords;
          
          // Keep pages 2+ (records not in page 1)
          const beyondPage1 = prev.filter(r => {
            const id = r?.id || r?._meta?.id;
            return id && !page1Ids.has(id);
          });
          
          // Merge and deduplicate
          const merged = [...updatedPage1, ...beyondPage1];
          
          // Remove duplicates (in case a record moved between pages)
          const seen = new Set();
          return merged.filter(r => {
            const id = r?.id || r?._meta?.id;
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
          });
        });
        
        // Reset flag after use
        shouldPreservePagesRef.current = false;
      } else {
        // Reset everything (for delete, reorder, etc.) - safer default
        setAllRecords(initialRecords);
        setCurrentPage(1);
        setHasMore(true);
      }
      
      setIsLoadingMore(false);
      prevInitialRecordsRef.current = initialRecords;
      prevInitialRecordsStringRef.current = currentString;
    }
  }, [initialRecords, currentPage]);

  // Use ref to access latest allRecords in callback
  const allRecordsRef = useRef(allRecords);
  useEffect(() => {
    allRecordsRef.current = allRecords;
  }, [allRecords]);

  // Memoized function to fetch more records
  const fetchMoreRecords = useCallback(async () => {
    if (isLoadingMore || !hasMore || !tableId) return;

    setIsLoadingMore(true);
    try {
      const result = await fetchPaginatedRecords({
        pageSize: 30,
        pageNumber: currentPage + 1
      });
      const newRecords = result?.data?.records || [];

      if (newRecords.length < 30) {
        setHasMore(false);
      }

      if (newRecords.length > 0) {
        setAllRecords(prev => {
          const updatedRecords = [...prev, ...newRecords];
          return updatedRecords;
        });
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching more records:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, tableId, fetchPaginatedRecords, currentPage]);

  // Method to preserve pages 2+ on next update (call before operations like adding rows)
  const preservePagesOnNextUpdate = useCallback(() => {
    shouldPreservePagesRef.current = true;
  }, []);

  return {
    allRecords,
    setAllRecords,
    isLoadingMore,
    hasMore,
    fetchMoreRecords,
    preservePagesOnNextUpdate,
  };
}

