import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFrontendPagination } from '../useFrontendPagination';

describe('useFrontendPagination', () => {
  const testData = Array.from({ length: 100 }, (_, i) => i + 1);

  it('should initialize with correct values', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30 })
    );

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(4);
    expect(result.current.totalItems).toBe(100);
    expect(result.current.allLoadedData).toHaveLength(30);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.hasPrev).toBe(false);
  });

  it('should load next page', async () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30 })
    );

    act(() => {
      result.current.loadNextPage();
    });

    // Wait for requestAnimationFrame to complete
    await act(async () => {
      await new Promise(resolve => requestAnimationFrame(resolve));
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.allLoadedData).toHaveLength(60);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.hasPrev).toBe(true);
  });

  it('should load previous page', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30, initialPage: 2 })
    );

    act(() => {
      result.current.loadPrevPage();
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasPrev).toBe(false);
  });

  it('should go to specific page', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30 })
    );

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.allLoadedData).toHaveLength(90);
  });

  it('should reset to first page', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30, initialPage: 3 })
    );

    act(() => {
      result.current.reset();
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.allLoadedData).toHaveLength(30);
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: [], pageSize: 30 })
    );

    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.allLoadedData).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
  });

  it('should handle last page correctly', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30, initialPage: 4 })
    );

    // Note: useEffect resets to page 1 on mount when data.length changes
    // So we need to navigate to page 4 after mount
    act(() => {
      result.current.goToPage(4);
    });

    expect(result.current.currentPage).toBe(4);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.hasPrev).toBe(true);
    expect(result.current.allLoadedData).toHaveLength(100);
  });

  it('should not load beyond last page', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30, initialPage: 4 })
    );

    // Navigate to last page first
    act(() => {
      result.current.goToPage(4);
    });

    act(() => {
      result.current.loadNextPage();
    });

    expect(result.current.currentPage).toBe(4);
  });

  it('should not load before first page', () => {
    const { result } = renderHook(() =>
      useFrontendPagination({ data: testData, pageSize: 30 })
    );

    act(() => {
      result.current.loadPrevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('should reset when data changes', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useFrontendPagination({ data, pageSize: 30, initialPage: 3 }),
      { initialProps: { data: testData } }
    );

    // Navigate to page 3 after mount (since useEffect resets to 1)
    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);

    // Change data - this should reset to page 1
    const newData = Array.from({ length: 50 }, (_, i) => i + 1);
    rerender({ data: newData });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalItems).toBe(50);
  });
});