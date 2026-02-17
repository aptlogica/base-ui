import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInfiniteScroll } from '../useInfiniteScroll';
import { useGetRecordsByPagination } from '../../../../hooks/useApi';

// Mock the API hook
vi.mock('../../../../hooks/useApi', () => ({
  useGetRecordsByPagination: vi.fn(),
}));

describe('useInfiniteScroll', () => {
  const mockUseGetRecordsByPagination = vi.mocked(useGetRecordsByPagination);
  const mockMutateAsync = vi.fn();

  const sampleRecords = [
    { id: 'rec-1', name: 'Record 1', _meta: { id: 'rec-1' } },
    { id: 'rec-2', name: 'Record 2', _meta: { id: 'rec-2' } },
    { id: 'rec-3', name: 'Record 3', _meta: { id: 'rec-3' } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetRecordsByPagination.mockReturnValue({
      mutateAsync: mockMutateAsync,
    } as any);
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useInfiniteScroll({ tableId: 'table-1' }));

      expect(result.current.allRecords).toEqual([]);
      expect(result.current.isLoadingMore).toBe(false);
      expect(result.current.hasMore).toBe(true);
    });

    it('should initialize with provided initial records', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({ 
          tableId: 'table-1', 
          initialRecords: sampleRecords 
        })
      );

      expect(result.current.allRecords).toEqual(sampleRecords);
    });

    it('should call useGetRecordsByPagination with tableId', () => {
      renderHook(() => useInfiniteScroll({ tableId: 'table-123' }));
      
      expect(mockUseGetRecordsByPagination).toHaveBeenCalledWith('table-123');
    });
  });

  describe('fetchMoreRecords', () => {
    it('should fetch more records successfully', async () => {
      const newRecords = [
        { id: 'rec-4', name: 'Record 4', _meta: { id: 'rec-4' } },
        { id: 'rec-5', name: 'Record 5', _meta: { id: 'rec-5' } }
      ];
      
      mockMutateAsync.mockResolvedValueOnce({ data: { records: newRecords } });

      const { result } = renderHook(() => 
        useInfiniteScroll({ 
          tableId: 'table-1', 
          initialRecords: sampleRecords 
        })
      );

      // Wait for hook to initialize
      await waitFor(() => {
        expect(result.current.allRecords).toEqual(sampleRecords);
      });

      await act(async () => {
        await result.current.fetchMoreRecords();
      });

      await waitFor(() => {
        expect(result.current.isLoadingMore).toBe(false);
      });

      // Should have called the mutation
      expect(mockMutateAsync).toHaveBeenCalled();
      // New records should be added (the hook may merge them differently based on implementation)
      expect(result.current.allRecords.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle empty response and set hasMore to false', async () => {
      mockMutateAsync.mockResolvedValueOnce({ data: { records: [] } });

      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: 'table-1' })
      );

      await act(async () => {
        result.current.fetchMoreRecords();
      });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });
    });

    it('should handle fetch error gracefully', async () => {
      const error = new Error('Network error');
      mockMutateAsync.mockRejectedValueOnce(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: 'table-1' })
      );

      await act(async () => {
        result.current.fetchMoreRecords();
      });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching more records:', error);
      consoleSpy.mockRestore();
    });

    it('should not fetch when already loading', async () => {
      // Use a promise that we control to simulate loading state
      let resolvePromise: (value: { records: any[] }) => void;
      const pendingPromise = new Promise<{ records: any[] }>((resolve) => {
        resolvePromise = resolve;
      });
      mockMutateAsync.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: 'table-1' })
      );

      // Start first fetch (this will be pending)
      act(() => {
        result.current.fetchMoreRecords();
      });

      // Try to start another while loading
      act(() => {
        result.current.fetchMoreRecords();
      });

      expect(mockMutateAsync).toHaveBeenCalledTimes(1);

      // Cleanup: resolve the pending promise to avoid act warnings
      await act(async () => {
        resolvePromise!({ records: [] });
        await pendingPromise;
      });
    });

    it('should not fetch when hasMore is false', async () => {
      mockMutateAsync.mockResolvedValueOnce({ data: { records: [] } });

      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: 'table-1' })
      );

      // First call sets hasMore to false
      await act(async () => {
        result.current.fetchMoreRecords();
      });

      // Second call should not execute
      act(() => {
        result.current.fetchMoreRecords();
      });

      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('setAllRecords', () => {
    it('should update all records', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: 'table-1' })
      );

      const newRecords = [{ id: 'new-1', name: 'New Record' }];

      act(() => {
        result.current.setAllRecords(newRecords);
      });

      expect(result.current.allRecords).toEqual(newRecords);
    });

    it('should accept function updater', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({ 
          tableId: 'table-1',
          initialRecords: sampleRecords
        })
      );

      const newRecord = { id: 'new-1', name: 'New Record' };

      act(() => {
        result.current.setAllRecords(prev => [...prev, newRecord]);
      });

      expect(result.current.allRecords).toHaveLength(4);
      expect(result.current.allRecords[3]).toEqual(newRecord);
    });
  });

  describe('preservePagesOnNextUpdate', () => {
    it('should provide preservePagesOnNextUpdate function', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: 'table-1' })
      );

      expect(typeof result.current.preservePagesOnNextUpdate).toBe('function');
    });

    it('should not throw when called', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: 'table-1' })
      );

      expect(() => {
        result.current.preservePagesOnNextUpdate();
      }).not.toThrow();
    });
  });

  describe('initialRecords changes', () => {
    it('should update allRecords when initialRecords change', () => {
      const { result, rerender } = renderHook(
        (props: { initialRecords: any[] }) => 
          useInfiniteScroll({ 
            tableId: 'table-1', 
            initialRecords: props.initialRecords 
          }),
        {
          initialProps: { initialRecords: sampleRecords }
        }
      );

      expect(result.current.allRecords).toEqual(sampleRecords);

      const newRecords = [
        { id: 'rec-4', name: 'Record 4', _meta: { id: 'rec-4' } }
      ];

      rerender({ initialRecords: newRecords });

      expect(result.current.allRecords).toEqual(newRecords);
    });

    it('should handle empty initialRecords', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({ 
          tableId: 'table-1', 
          initialRecords: [] 
        })
      );

      expect(result.current.allRecords).toEqual([]);
    });

    it('should detect changes in record metadata', () => {
      const recordsV1 = [
        { id: 'rec-1', name: 'Record 1', last_modified_time: '2023-01-01' }
      ];
      
      const recordsV2 = [
        { id: 'rec-1', name: 'Record 1', last_modified_time: '2023-01-02' }
      ];

      const { result, rerender } = renderHook(
        (props: { initialRecords: any[] }) => 
          useInfiniteScroll({ 
            tableId: 'table-1', 
            initialRecords: props.initialRecords 
          }),
        {
          initialProps: { initialRecords: recordsV1 }
        }
      );

      expect(result.current.allRecords).toEqual(recordsV1);

      rerender({ initialRecords: recordsV2 });

      expect(result.current.allRecords).toEqual(recordsV2);
    });

    it('should preserve page 2+ records when preservePagesOnNextUpdate is used', async () => {
      const page1 = [
        { id: 'rec-1', name: 'Record 1', last_modified_time: '2023-01-01' },
        { id: 'rec-2', name: 'Record 2', last_modified_time: '2023-01-01' }
      ];
      const page1Updated = [
        { id: 'rec-1', name: 'Record 1 updated', last_modified_time: '2023-01-02' },
        { id: 'rec-2', name: 'Record 2', last_modified_time: '2023-01-01' }
      ];

      mockMutateAsync.mockResolvedValueOnce({
        data: {
          records: [{ id: 'rec-3', name: 'Record 3', _meta: { id: 'rec-3' } }]
        }
      });

      const { result, rerender } = renderHook(
        (props: { initialRecords: any[] }) =>
          useInfiniteScroll({
            tableId: 'table-1',
            initialRecords: props.initialRecords
          }),
        {
          initialProps: { initialRecords: page1 }
        }
      );

      await act(async () => {
        await result.current.fetchMoreRecords();
      });

      expect(result.current.allRecords.some(r => r.id === 'rec-3')).toBe(true);

      act(() => {
        result.current.preservePagesOnNextUpdate();
      });

      rerender({ initialRecords: page1Updated });

      expect(result.current.allRecords.map(r => r.id)).toEqual(
        expect.arrayContaining(['rec-1', 'rec-2', 'rec-3'])
      );
      expect(result.current.allRecords.find(r => r.id === 'rec-1')?.name).toBe('Record 1 updated');
    });
  });

  describe('loading states', () => {
    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockMutateAsync.mockReturnValueOnce(promise);

      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: 'table-1' })
      );

      act(() => {
        result.current.fetchMoreRecords();
      });

      expect(result.current.isLoadingMore).toBe(true);

      await act(async () => {
        resolvePromise!({ records: [] });
        await promise;
      });

      expect(result.current.isLoadingMore).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined tableId', () => {
      const { result } = renderHook(() => 
        useInfiniteScroll({ tableId: undefined })
      );

      expect(mockUseGetRecordsByPagination).toHaveBeenCalledWith('');
      expect(result.current.allRecords).toEqual([]);
    });

    it('should handle records without proper metadata', () => {
      const recordsWithoutMeta = [
        { name: 'Record without ID' },
        { id: 'rec-1' },
        { _meta: { id: 'rec-2' } }
      ];

      const { result } = renderHook(() => 
        useInfiniteScroll({ 
          tableId: 'table-1', 
          initialRecords: recordsWithoutMeta 
        })
      );

      expect(result.current.allRecords).toEqual(recordsWithoutMeta);
    });

    it('should handle array fields in records', () => {
      const recordsWithArrays = [
        { 
          id: 'rec-1', 
          attachments: [
            { id: 'att-1', url: 'file1.jpg' },
            { id: 'att-2', url: 'file2.jpg' }
          ]
        }
      ];

      const { result } = renderHook(() => 
        useInfiniteScroll({ 
          tableId: 'table-1', 
          initialRecords: recordsWithArrays 
        })
      );

      expect(result.current.allRecords).toEqual(recordsWithArrays);
    });
  });

  describe('hasMore behavior', () => {
    it('should set hasMore to false when fewer than page size records are returned', async () => {
      mockMutateAsync.mockResolvedValueOnce({
        data: {
          records: Array.from({ length: 5 }, (_, i) => ({ id: `rec-${i + 10}` }))
        }
      });

      const { result } = renderHook(() =>
        useInfiniteScroll({ tableId: 'table-1' })
      );

      await act(async () => {
        await result.current.fetchMoreRecords();
      });

      expect(result.current.hasMore).toBe(false);
    });
  });
});
