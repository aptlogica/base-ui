import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGridData } from '../useGridData';
import * as useApi from '../../../../hooks/useApi';

// Mock the API hooks
vi.mock('../../../../hooks/useApi', () => ({
  useTable: vi.fn(),
  useAddRow: vi.fn(),
  useDeleteRecord: vi.fn(),
  useBulkDeleteRecords: vi.fn(),
  useInsertRowData: vi.fn(),
  useBulkUpdateColumn: vi.fn(),
  useUpdateField: vi.fn(),
  useDeleteColumn: vi.fn(),
  useCreateField: vi.fn(),
  useUpdateView: vi.fn(),
}));

describe('useGridData', () => {
  const mockUseTable = vi.mocked(useApi.useTable);
  const mockUseAddRow = vi.mocked(useApi.useAddRow);
  const mockUseDeleteRecord = vi.mocked(useApi.useDeleteRecord);
  const mockUseBulkDeleteRecords = vi.mocked(useApi.useBulkDeleteRecords);
  const mockUseInsertRowData = vi.mocked(useApi.useInsertRowData);
  const mockUseBulkUpdateColumn = vi.mocked(useApi.useBulkUpdateColumn);
  const mockUseUpdateField = vi.mocked(useApi.useUpdateField);
  const mockUseDeleteColumn = vi.mocked(useApi.useDeleteColumn);
  const mockUseCreateField = vi.mocked(useApi.useCreateField);
  const mockUseUpdateView = vi.mocked(useApi.useUpdateView);

  const mockCrudOperations = {
    addRow: vi.fn(),
    deleteRecord: vi.fn(),
    bulkDeleteRecords: vi.fn(),
    insertRowData: vi.fn(),
    bulkUpdateColumn: vi.fn(),
    updateField: vi.fn(),
    deleteColumn: vi.fn(),
    createField: vi.fn(),
    updateView: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseTable.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      dataUpdatedAt: Date.now(),
    } as any);

    mockUseAddRow.mockReturnValue(mockCrudOperations.addRow as any);
    mockUseDeleteRecord.mockReturnValue(mockCrudOperations.deleteRecord as any);
    mockUseBulkDeleteRecords.mockReturnValue(mockCrudOperations.bulkDeleteRecords as any);
    mockUseInsertRowData.mockReturnValue(mockCrudOperations.insertRowData as any);
    mockUseBulkUpdateColumn.mockReturnValue(mockCrudOperations.bulkUpdateColumn as any);
    mockUseUpdateField.mockReturnValue(mockCrudOperations.updateField as any);
    mockUseDeleteColumn.mockReturnValue(mockCrudOperations.deleteColumn as any);
    mockUseCreateField.mockReturnValue(mockCrudOperations.createField as any);
    mockUseUpdateView.mockReturnValue(mockCrudOperations.updateView as any);
  });

  describe('initialization', () => {
    it('should call useTable with string tableId', () => {
      renderHook(() => useGridData({ tableId: '123' }));

      expect(mockUseTable).toHaveBeenCalledWith('123');
    });

    it('should initialize all CRUD operations', () => {
      renderHook(() => useGridData({ tableId: '123' }));

      expect(mockUseAddRow).toHaveBeenCalled();
      expect(mockUseDeleteRecord).toHaveBeenCalled();
      expect(mockUseBulkDeleteRecords).toHaveBeenCalled();
      expect(mockUseInsertRowData).toHaveBeenCalled();
      expect(mockUseBulkUpdateColumn).toHaveBeenCalled();
      expect(mockUseUpdateField).toHaveBeenCalled();
      expect(mockUseDeleteColumn).toHaveBeenCalled();
      expect(mockUseCreateField).toHaveBeenCalled();
      expect(mockUseUpdateView).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should return loading true when table query is loading', () => {
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading false when table query is not loading', () => {
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return error from table query', () => {
      const testError = new Error('Table fetch failed');
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error: testError,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.error).toBe(testError);
    });

    it('should return null error when table query succeeds', () => {
      mockUseTable.mockReturnValue({
        data: { model: {}, columns: [] },
        isLoading: false,
        error: null,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.error).toBeNull();
    });
  });

  describe('tableData processing', () => {
    it('should return undefined when no data', () => {
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.tableData).toBeUndefined();
    });

    it('should process direct TableData format', () => {
      const tableData = {
        model: { id: 'table-1', name: 'Test Table' },
        columns: [{ id: 'col-1', name: 'Column 1' }],
      };

      mockUseTable.mockReturnValue({
        data: tableData,
        isLoading: false,
        error: null,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.tableData).toEqual(tableData);
    });

    it('should process wrapped TableResponse format', () => {
      const tableData = {
        model: { id: 'table-1', name: 'Test Table' },
        columns: [{ id: 'col-1', name: 'Column 1' }],
      };
      const wrappedData = { data: tableData };

      mockUseTable.mockReturnValue({
        data: wrappedData,
        isLoading: false,
        error: null,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.tableData).toEqual(tableData);
    });

    it('should return undefined for malformed data without model', () => {
      const malformedData = { columns: [] };

      mockUseTable.mockReturnValue({
        data: malformedData,
        isLoading: false,
        error: null,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.tableData).toBeUndefined();
    });

    it('should return undefined for malformed data without columns', () => {
      const malformedData = { model: { id: 'table-1' } };

      mockUseTable.mockReturnValue({
        data: malformedData,
        isLoading: false,
        error: null,
        dataUpdatedAt: Date.now(),
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.tableData).toBeUndefined();
    });
  });

  describe('CRUD operations', () => {
    it('should return all CRUD operation functions', () => {
      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(result.current.addRow).toBe(mockCrudOperations.addRow);
      expect(result.current.deleteRecord).toBe(mockCrudOperations.deleteRecord);
      expect(result.current.bulkDeleteRecords).toBe(mockCrudOperations.bulkDeleteRecords);
      expect(result.current.insertRowData).toBe(mockCrudOperations.insertRowData);
      expect(result.current.bulkUpdateColumn).toBe(mockCrudOperations.bulkUpdateColumn);
      expect(result.current.updateField).toBe(mockCrudOperations.updateField);
      expect(result.current.deleteColumn).toBe(mockCrudOperations.deleteColumn);
      expect(result.current.createField).toBe(mockCrudOperations.createField);
      expect(result.current.updateView).toBe(mockCrudOperations.updateView);
    });

    it('should provide refresh function from table query', () => {
      const mockRefetch = vi.fn().mockResolvedValue({});
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        dataUpdatedAt: Date.now(),
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      expect(typeof result.current.refresh).toBe('function');
      
      result.current.refresh();
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('should handle updateRowOrder correctly', async () => {
      // Suppress expected console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // When tableData is not available, updateRowOrder should throw
      const { result } = renderHook(() => useGridData({ tableId: '123' }));

      const orderedIds = [1, 2, 3];
      await expect(result.current.updateRowOrder(orderedIds)).rejects.toThrow('Table data not available');

      consoleSpy.mockRestore();
    });
  });

  describe('memoization and reactivity', () => {
    it('should update when dataUpdatedAt changes', () => {
      const tableData = {
        model: { id: 'table-1', name: 'Test Table' },
        columns: [{ id: 'col-1', name: 'Column 1' }],
      };

      const { result, rerender } = renderHook(() => useGridData({ tableId: '123' }));

      // Initial render with first dataUpdatedAt
      mockUseTable.mockReturnValue({
        data: tableData,
        isLoading: false,
        error: null,
        dataUpdatedAt: 1000,
      } as any);

      rerender();
      const firstResult = result.current.tableData;

      // Update with new dataUpdatedAt
      mockUseTable.mockReturnValue({
        data: { ...tableData, model: { ...tableData.model, name: 'Updated Table' } },
        isLoading: false,
        error: null,
        dataUpdatedAt: 2000,
      } as any);

      rerender();
      const secondResult = result.current.tableData;

      expect(firstResult).not.toBe(secondResult);
    });
  });

  describe('edge cases', () => {
    it('should handle numeric tableId correctly', () => {
      renderHook(() => useGridData({ tableId: 123 as any }));

      expect(mockUseTable).toHaveBeenCalledWith('123');
    });

    it('should handle empty string tableId', () => {
      renderHook(() => useGridData({ tableId: '' }));

      expect(mockUseTable).toHaveBeenCalledWith('');
    });

    it('should handle optional viewId parameter', () => {
      const { result } = renderHook(() => useGridData({ 
        tableId: '123', 
        viewId: 'view-456' 
      }));

      // Should still work normally with viewId present
      expect(result.current).toBeDefined();
      expect(typeof result.current.updateView).toBe('function');
    });
  });
});
