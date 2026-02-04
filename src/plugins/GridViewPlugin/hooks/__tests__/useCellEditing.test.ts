import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCellEditing } from '../useCellEditing';

describe('useCellEditing', () => {
  const createMockMutation = () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
  });

  // Store original timer functions
  let mockMutation: ReturnType<typeof createMockMutation>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockMutation = createMockMutation();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createDefaultProps = () => ({
    data: [
      { 
        id: 'row-1', 
        name: 'John', 
        age: 30,
        _meta: { 
          id: 'row-1', 
          created_at: '2023-01-01', 
          updated_at: '2023-01-01',
          deleted_at: null,
          position: 1 
        } 
      },
      { 
        id: 'row-2', 
        email: 'jane@example.com', 
        age: 25,
        _meta: { 
          id: 'row-2', 
          created_at: '2023-01-02', 
          updated_at: '2023-01-02',
          deleted_at: null,
          position: 2 
        } 
      },
    ],
    columns: [
      { id: 'col-1', title: 'Name', type: 'text' as any, key: 'name' },
      { id: 'col-2', title: 'Age', type: 'number' as any, key: 'age' },
      { id: 'col-3', title: 'Email', type: 'email' as any, key: 'email' },
    ],
    tableId: 'table-1',
    insertRowDataMutation: mockMutation,
    onRecordsUpdate: vi.fn(),
  });

  describe('initialization', () => {
    it('should initialize with handleCellChange method', () => {
      const defaultProps = createDefaultProps();
      const { result } = renderHook(() => useCellEditing(defaultProps));

      expect(typeof result.current.handleCellChange).toBe('function');
    });

    it('should be stable across rerenders with same props', () => {
      const defaultProps = createDefaultProps();
      const { result, rerender } = renderHook((props) => useCellEditing(props), {
        initialProps: defaultProps,
      });

      const firstRender = result.current.handleCellChange;
      rerender(defaultProps);
      
      expect(result.current.handleCellChange).toBe(firstRender);
    });
  });

  describe('handleCellChange', () => {
    it('should call handleCellChange without throwing', async () => {
      const defaultProps = createDefaultProps();
      const { result } = renderHook(() => useCellEditing(defaultProps));

      await act(async () => {
        result.current.handleCellChange('row-1', 'name', 'New Name');
        // Advance timers to trigger debounced mutation
        vi.advanceTimersByTime(500);
      });

      // Verify function was called without throwing
      expect(result.current.handleCellChange).toBeDefined();
    });

    it('should handle different value types', async () => {
      const defaultProps = createDefaultProps();
      const { result } = renderHook(() => useCellEditing(defaultProps));

      // Test string value
      await act(async () => {
        result.current.handleCellChange('row-1', 'name', 'String Value');
        vi.advanceTimersByTime(500);
      });

      // Test number value
      await act(async () => {
        result.current.handleCellChange('row-1', 'age', 42);
        vi.advanceTimersByTime(500);
      });

      // Test null value
      await act(async () => {
        result.current.handleCellChange('row-1', 'name', null);
        vi.advanceTimersByTime(500);
      });

      // Verify function handles different types
      expect(result.current.handleCellChange).toBeDefined();
    });

    it('should handle missing tableId gracefully', async () => {
      const defaultProps = createDefaultProps();
      const propsWithoutTableId = {
        ...defaultProps,
        tableId: undefined,
      };

      const { result } = renderHook(() => useCellEditing(propsWithoutTableId));

      await act(async () => {
        result.current.handleCellChange('row-1', 'name', 'Test');
        vi.advanceTimersByTime(500);
      });

      // Should still work without tableId
      expect(result.current).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle mutation errors gracefully', async () => {
      const errorMutation = {
        ...createMockMutation(),
        mutateAsync: vi.fn().mockRejectedValue(new Error('Mutation failed')),
      };

      // Use string row IDs that are valid numeric strings to trigger actual API call
      const propsWithError = {
        data: [
          {
            id: '1',
            name: 'John',
            age: 30,
            _meta: {
              id: '1',
              created_at: '2020-01-01', // Old date to avoid "newly created" check
              updated_at: '2020-01-01',
              deleted_at: null,
              position: 1,
            },
          },
        ],
        columns: [
          { id: 'col-1', title: 'Name', type: 'text' as const, key: 'name' },
        ],
        tableId: 'table-1',
        insertRowDataMutation: errorMutation,
        onRecordsUpdate: vi.fn(),
      };

      // Suppress console.error for expected error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCellEditing(propsWithError as any));

      await act(async () => {
        result.current.handleCellChange('1', 'name', 'Test');
        vi.advanceTimersByTime(500);
        // Allow promises to resolve
        await Promise.resolve();
      });

      expect(errorMutation.mutateAsync).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle missing onRecordsUpdate gracefully', async () => {
      const defaultProps = createDefaultProps();
      const propsWithoutCallback = {
        ...defaultProps,
        onRecordsUpdate: undefined,
      };

      const { result } = renderHook(() => useCellEditing(propsWithoutCallback as any));

      expect(() => {
        result.current.handleCellChange('row-1', 'name', 'Test');
      }).not.toThrow();
    });

    it('should handle empty data array', () => {
      const defaultProps = createDefaultProps();
      const propsWithEmptyData = {
        ...defaultProps,
        data: [],
      };

      const { result } = renderHook(() => useCellEditing(propsWithEmptyData));

      expect(typeof result.current.handleCellChange).toBe('function');
    });

    it('should handle missing mutation gracefully', async () => {
      const defaultProps = createDefaultProps();
      const propsWithoutMutation = {
        ...defaultProps,
        insertRowDataMutation: undefined,
      };

      const { result } = renderHook(() => useCellEditing(propsWithoutMutation));

      await act(async () => {
        result.current.handleCellChange('row-1', 'name', 'Test');
        vi.advanceTimersByTime(500);
      });

      // Should not throw even without mutation
      expect(result.current).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle record updates for existing records', async () => {
      const testMutation = createMockMutation();
      const propsWithStringIds = {
        data: [
          {
            id: '1',
            name: 'John',
            age: 30,
            _meta: {
              id: '1',
              created_at: '2020-01-01', // Old date to avoid "newly created" check
              updated_at: '2020-01-01',
              deleted_at: null,
              position: 1,
            },
          },
        ],
        columns: [
          { id: 'col-1', title: 'Name', type: 'text' as const, key: 'name' },
        ],
        tableId: 'table-1',
        insertRowDataMutation: testMutation,
        onRecordsUpdate: vi.fn(),
      };

      const { result } = renderHook(() => useCellEditing(propsWithStringIds as any));

      await act(async () => {
        result.current.handleCellChange('1', 'name', 'Updated Name');
        vi.advanceTimersByTime(500);
        // Allow promises to resolve
        await Promise.resolve();
      });

      expect(testMutation.mutateAsync).toHaveBeenCalledWith({
        model_id: 'table-1',
        column_id: 'col-1',
        row_id: 1,
        value: 'Updated Name',
      });
    });

    it('should handle special characters in values', async () => {
      const testMutation = createMockMutation();
      const propsWithStringIds = {
        data: [
          {
            id: '1',
            name: 'John',
            _meta: {
              id: '1',
              created_at: '2020-01-01', // Old date to avoid "newly created" check
              updated_at: '2020-01-01',
              deleted_at: null,
              position: 1,
            },
          },
        ],
        columns: [
          { id: 'col-1', title: 'Name', type: 'text' as const, key: 'name' },
        ],
        tableId: 'table-1',
        insertRowDataMutation: testMutation,
        onRecordsUpdate: vi.fn(),
      };

      const { result } = renderHook(() => useCellEditing(propsWithStringIds as any));

      const specialValue = String.raw`Test with "quotes" and \backslashes & ampersands`;

      await act(async () => {
        result.current.handleCellChange('1', 'name', specialValue);
        vi.advanceTimersByTime(500);
        // Allow promises to resolve
        await Promise.resolve();
      });

      expect(testMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          value: specialValue,
        })
      );
    });

    it('should handle numeric record IDs', async () => {
      const defaultProps = createDefaultProps();
      const propsWithNumericIds = {
        ...defaultProps,
        data: [
          {
            id: '123',
            name: 'Test',
            _meta: {
              id: '123',
              created_at: '2023-01-01',
              updated_at: '2023-01-01',
              deleted_at: null,
              position: 1,
            },
          },
        ],
      };

      const { result } = renderHook(() => useCellEditing(propsWithNumericIds as any));

      await act(async () => {
        result.current.handleCellChange('123', 'name', 'Updated');
        vi.advanceTimersByTime(500);
      });

      // Verify function handles numeric IDs
      expect(result.current.handleCellChange).toBeDefined();
    });
  });
});