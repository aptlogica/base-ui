import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrontendPagination } from './useFrontendPagination';

type InfiniteScrollPaginationOptions<T> = {
  data: T[];
  pageSize: number;
  initialPage?: number;
  loadMoreOffsetPx?: number;
  loadingDelayMs?: number;
};

export const useInfiniteScrollPagination = <T,>({
  data,
  pageSize,
  initialPage = 1,
  loadMoreOffsetPx = 200,
  loadingDelayMs = 300,
}: InfiniteScrollPaginationOptions<T>) => {
  const {
    allLoadedData,
    loadNextPage,
    hasMore,
    totalItems,
  } = useFrontendPagination({
    data,
    pageSize,
    initialPage,
  });

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    setIsLoadingMore(true);
    loadNextPage();
    // Brief loading state for better UX (since loadNextPage is synchronous)
    setTimeout(() => setIsLoadingMore(false), loadingDelayMs);
  }, [loadNextPage, loadingDelayMs]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasMore || isLoadingMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < loadMoreOffsetPx) {
        handleLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, handleLoadMore, loadMoreOffsetPx]);

  return {
    paginatedData: allLoadedData,
    hasMore,
    totalItems,
    isLoadingMore,
    handleLoadMore,
    scrollContainerRef,
  };
};
