import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGalleryData } from '../useGalleryData';
import * as useApi from '../../../../hooks/useApi';

vi.mock('../../../../hooks/useApi');

describe('useGalleryData', () => {
  const mockUseTable = vi.mocked(useApi.useTable);
  const mockUseUpdateView = vi.mocked(useApi.useUpdateView);
  const mockUseDeleteRecord = vi.mocked(useApi.useDeleteRecord);

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTable.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn().mockResolvedValue({ data: null }),
    } as any);

    mockUseUpdateView.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
    } as any);

    mockUseDeleteRecord.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
    } as any);
  });

  describe('loading states', () => {
    it('should return loading true when table is loading', () => {
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.tableData).toBeUndefined();
    });

    it('should return loading false when table data is loaded', () => {
      mockUseTable.mockReturnValue({
        data: { data: { model: {}, columns: [], records: [], views: [] } },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should expose errors from table query', () => {
      const error = new Error('Failed to load table');
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.error).toBe(error);
    });
  });

  describe('data unwrapping', () => {
    it('should unwrap StandardResponse data', () => {
      const tableData = { model: { id: 'table-1' }, columns: [], records: [], views: [] };
      mockUseTable.mockReturnValue({
        data: { data: tableData },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.tableData).toEqual(tableData);
    });

    it('should handle already unwrapped data', () => {
      const tableData = { model: { id: 'table-1' }, columns: [], records: [], views: [] };
      mockUseTable.mockReturnValue({
        data: tableData,
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.tableData).toEqual(tableData);
    });
  });

  describe('processed data', () => {
    it('should return empty arrays when no table data', () => {
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.columns).toEqual([]);
      expect(result.current.galleryItems).toEqual([]);
      expect(result.current.attachmentFields).toEqual([]);
      expect(result.current.view).toBeNull();
    });

    it('should process columns correctly', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.columns).toHaveLength(2);
      expect(result.current.columns[0]).toMatchObject({
        id: '1',
        key: 'title',
        title: 'Title',
      });
    });

    it('should filter out excluded fields', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'lookup_field', title: 'Lookup', uidt: 'lookup', order_index: 1 },
        { id: '3', column_name: 'created_time', title: 'Created Time', uidt: 'createdTime', order_index: 2 },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      // Only 'text' type should remain, 'lookup' and 'createdTime' are filtered out
      expect(result.current.columns.length).toBeLessThan(columns.length);
      expect(result.current.columns.length).toBe(1);
    });

    it('should identify attachment fields', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
        { id: '3', column_name: 'file', title: 'File', type: 'attachment', uidt: 'attachment', order_index: 2 },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.attachmentFields).toHaveLength(2);
    });

    it('should select first attachment field by default', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.attachmentField).toBeDefined();
      expect(result.current.attachmentField?.id).toBe('2');
    });

    it('should use attachment field from view meta', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
        { id: '3', column_name: 'file', title: 'File', uidt: 'attachment', order_index: 2 },
      ];

      const views = [
        { id: 'view-1', type: 'gallery', meta: { attachment_field_id: '3' } }
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records: [], 
            views 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1', viewId: 'view-1' }));

      expect(result.current.attachmentField?.id).toBe('3');
    });
  });

  describe('gallery items processing', () => {
    it('should create gallery items from records', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
      ];

      const records = [
        { id: 'rec-1', data: { title: 'Item 1' } },
        { id: 'rec-2', data: { title: 'Item 2' } },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records, 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.galleryItems).toHaveLength(2);
      expect(result.current.galleryItems[0].title).toBe('Item 1');
      expect(result.current.galleryItems[1].title).toBe('Item 2');
    });

    it('should extract images from attachment field', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
      ];

      const records = [
        { 
          id: 'rec-1', 
          data: { 
            title: 'Item 1',
            image: [
              { id: 'img-1', url: 'http://example.com/1.jpg', thumbnail_url: 'http://example.com/1_thumb.jpg' }
            ]
          } 
        },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records, 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.galleryItems[0].allImages).toHaveLength(1);
      expect(result.current.galleryItems[0].imageUrl).toBe('http://example.com/1_thumb.jpg');
    });

    it('should filter out invalid attachments', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
      ];

      const records = [
        { 
          id: 'rec-1', 
          data: { 
            title: 'Item 1',
            image: [
              { id: 'img-1', url: 'http://example.com/1.jpg' },
              null,
              {},
              { id: 'img-2' },
            ]
          } 
        },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records, 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.galleryItems[0].allImages).toHaveLength(1);
    });

    it('should handle multiple images per record', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
      ];

      const records = [
        { 
          id: 'rec-1', 
          data: { 
            title: 'Item 1',
            image: [
              { id: 'img-1', url: 'http://example.com/1.jpg', thumbnail_url: 'http://example.com/1_thumb.jpg' },
              { id: 'img-2', url: 'http://example.com/2.jpg', thumbnail_url: 'http://example.com/2_thumb.jpg' },
              { id: 'img-3', url: 'http://example.com/3.jpg', thumbnail_url: 'http://example.com/3_thumb.jpg' },
            ]
          } 
        },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records, 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.galleryItems[0].allImages).toHaveLength(3);
      expect(result.current.galleryItems[0].imageUrl).toBe('http://example.com/1_thumb.jpg');
    });

    it('should use default title when title field is missing', () => {
      const columns = [
        { id: '2', column_name: 'image', title: 'Image', uidt: 'attachment', order_index: 1 },
      ];

      const records = [
        { id: 'rec-1', data: {} },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records, 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.galleryItems[0].title).toBe('Record rec-1');
    });

    it('should build metadata from non-system fields', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0, system: false },
        { id: '2', column_name: 'description', title: 'Description', uidt: 'text', order_index: 1, system: false },
        { id: '3', column_name: 'created_at', title: 'Created At', uidt: 'created_at', order_index: 2, system: true },
      ];

      const records = [
        { 
          id: 'rec-1', 
          data: { 
            title: 'Item 1',
            description: 'Description 1',
            created_at: '2024-01-01'
          } 
        },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records, 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.galleryItems[0].metadata).toHaveProperty('Title', 'Item 1');
      expect(result.current.galleryItems[0].metadata).toHaveProperty('Description', 'Description 1');
    });
  });

  describe('refresh', () => {
    it('should call refetch on refresh', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({ data: null });
      mockUseTable.mockReturnValue({
        data: { data: { model: {}, columns: [], records: [], views: [] } },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      result.current.refresh();

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('deleteRecord', () => {
    it('should call deleteRecord mutation', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      mockUseDeleteRecord.mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      mockUseTable.mockReturnValue({
        data: { data: { model: { id: 'table-1' }, columns: [], records: [], views: [] } },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      // Use numeric string since Number() is called on the recordId
      await result.current.deleteRecord('123');

      expect(mockMutateAsync).toHaveBeenCalledWith({
        model_id: 'table-1',
        row_id: 123,
      });
    });

    it('should handle deleteRecord when tableId is missing', async () => {
      // Suppress expected console output for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockMutateAsync = vi.fn();
      mockUseDeleteRecord.mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: '' }));

      await result.current.deleteRecord('rec-123');

      expect(mockMutateAsync).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateView', () => {
    it('should update view with merged meta', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      mockUseUpdateView.mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      const views = [
        { id: 'view-1', type: 'gallery', meta: { existing: 'value' } }
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns: [], 
            records: [], 
            views 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1', viewId: 'view-1' }));

      await result.current.updateView('view-1', { new: 'value' });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        viewId: 'view-1',
        view: {
          meta: {
            existing: 'value',
            new: 'value',
          },
        },
      });
    });

    it('should handle nested meta structure', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      mockUseUpdateView.mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      const views = [
        { id: 'view-1', type: 'gallery', meta: { existing: 'value', meta: { nested: 'value' } } }
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns: [], 
            records: [], 
            views 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1', viewId: 'view-1' }));

      await result.current.updateView('view-1', { new: 'value' });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        viewId: 'view-1',
        view: {
          meta: {
            existing: 'value',
            new: 'value',
          },
        },
      });
    });

    it('should not update when view is not found', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      mockUseUpdateView.mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns: [], 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1', viewId: 'view-1' }));

      await result.current.updateView('view-1', { new: 'value' });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('updateViewConfig', () => {
    it('should update view config', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      mockUseUpdateView.mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      const views = [
        { id: 'view-1', type: 'gallery', meta: { filters: [] } }
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns: [], 
            records: [], 
            views 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1', viewId: 'view-1' }));

      await result.current.updateViewConfig('view-1', { attachment_field_id: 'field-1' });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        viewId: 'view-1',
        view: {
          meta: {
            filters: [],
            attachment_field_id: 'field-1',
          },
        },
      });
    });

    it('should log error when view is not found', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      mockUseUpdateView.mockReturnValue({
        mutateAsync: mockMutateAsync,
      } as any);

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns: [], 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1', viewId: 'view-1' }));

      await result.current.updateViewConfig('view-1', { attachment_field_id: 'field-1' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('No current view found for updateViewConfig');
      expect(mockMutateAsync).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns: [], 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.columns).toEqual([]);
      expect(result.current.attachmentFields).toEqual([]);
    });

    it('should handle empty records array', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.galleryItems).toEqual([]);
    });

    it('should handle records without data property', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
      ];

      const records = [
        { id: 'rec-1', title: 'Item 1' },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records, 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.galleryItems).toHaveLength(1);
    });

    it('should handle columns without order_index', () => {
      const columns = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text' },
        { id: '2', column_name: 'description', title: 'Description', uidt: 'text' },
      ];

      mockUseTable.mockReturnValue({
        data: { 
          data: { 
            model: { id: 'table-1' }, 
            columns, 
            records: [], 
            views: [] 
          } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn().mockResolvedValue({ data: null }),
      } as any);

      const { result } = renderHook(() => useGalleryData({ tableId: 'table-1' }));

      expect(result.current.columns[0].position).toBe(0);
      expect(result.current.columns[1].position).toBe(1);
    });
  });
});
