import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKanbanData } from '../useKanbanData';

const mockUseTable = vi.fn();
const mockUseAddRow = vi.fn();
const mockUseInsertRowData = vi.fn();
const mockUseDeleteRecord = vi.fn();
const mockUseUpdateField = vi.fn();
const mockUseUpdateView = vi.fn();
const mockUseUpdateViewMeta = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useTable: () => mockUseTable(),
  useAddRow: () => mockUseAddRow(),
  useInsertRowData: () => mockUseInsertRowData(),
  useDeleteRecord: () => mockUseDeleteRecord(),
  useUpdateField: () => mockUseUpdateField(),
  useUpdateView: () => mockUseUpdateView(),
  useUpdateViewMeta: () => mockUseUpdateViewMeta()
}));

describe('useKanbanData Hook', () => {
  const mockTableData = {
    model: { id: 'table1', title: 'Test Table', base_id: 'base1' },
    columns: [
      { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
      { id: '2', column_name: 'status', title: 'Status', uidt: 'select', order_index: 1 }
    ],
    records: [],
    views: [{ id: 'view1', type: 'kanban', meta: {} }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseTable.mockReturnValue({
      data: { data: mockTableData },
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    mockUseAddRow.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ data: { id: 'new1' } })
    });

    mockUseInsertRowData.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({})
    });

    mockUseDeleteRecord.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({})
    });

    mockUseUpdateField.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({})
    });

    mockUseUpdateView.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({})
    });

    mockUseUpdateViewMeta.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({})
    });
  });

  describe('Data Loading', () => {
    it('should return tableData when loaded', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.tableData).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return loading state', () => {
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.tableData).toBeUndefined();
    });

    it('should return error state', () => {
      const testError = new Error('Failed to load');
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error: testError,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.error).toBe(testError);
      expect(result.current.tableData).toBeUndefined();
    });

    it('should filter excluded columns', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.tableData?.columns).toBeDefined();
    });
  });

  describe('CRUD Operations', () => {
    it('should provide addRow function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.addRow).toBeDefined();
      expect(result.current.addRow.mutateAsync).toBeInstanceOf(Function);
    });

    it('should provide insertRowData function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.insertRowData).toBeDefined();
      expect(result.current.insertRowData.mutateAsync).toBeInstanceOf(Function);
    });

    it('should provide deleteRecord function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.deleteRecord).toBeDefined();
      expect(result.current.deleteRecord.mutateAsync).toBeInstanceOf(Function);
    });

    it('should provide updateField function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.updateField).toBeDefined();
      expect(result.current.updateField.mutateAsync).toBeInstanceOf(Function);
    });

    it('should provide updateView function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.updateView).toBeDefined();
      expect(result.current.updateView.mutateAsync).toBeInstanceOf(Function);
    });

    it('should provide updateViewMeta function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.updateViewMeta).toBeDefined();
      expect(result.current.updateViewMeta.mutateAsync).toBeInstanceOf(Function);
    });
  });

  describe('Business Operations', () => {
    it('should provide moveCard function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.moveCard).toBeInstanceOf(Function);
    });

    it('should provide createCard function', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.createCard).toBeInstanceOf(Function);

      const cardId = await result.current.createCard({ title: 'New Card' });
      expect(cardId).toBe('new1');
    });

    it('should provide duplicateCard function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.duplicateCard).toBeInstanceOf(Function);
    });

    it('should provide deleteCard function', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      await result.current.deleteCard('card1');

      expect(mockUseDeleteRecord().mutateAsync).toHaveBeenCalled();
    });

    it('should provide updateFieldOptions function', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      await result.current.updateFieldOptions('2', ['Option 1', 'Option 2']);

      expect(mockUseUpdateField().mutateAsync).toHaveBeenCalled();
    });

    it('should provide persistStackOrder function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      expect(result.current.persistStackOrder).toBeInstanceOf(Function);
    });

    it('should provide changeGroupByColumn function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      expect(result.current.changeGroupByColumn).toBeInstanceOf(Function);
    });

    it('should provide updateViewConfig function', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      expect(result.current.updateViewConfig).toBeInstanceOf(Function);
    });
  });

  describe('Refresh', () => {
    it('should provide refresh function', () => {
      const mockRefetch = vi.fn();
      mockUseTable.mockReturnValue({
        data: { data: mockTableData },
        isLoading: false,
        error: null,
        refetch: mockRefetch
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      result.current.refresh();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined tableData', () => {
      mockUseTable.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.tableData).toBeUndefined();
    });

    it('should handle null tableData', () => {
      mockUseTable.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      expect(result.current.tableData).toBeUndefined();
    });

    it('should handle empty string tableId', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: '' }));

      expect(result.current).toBeDefined();
    });

    it('should handle undefined viewId', () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: undefined }));

      expect(result.current).toBeDefined();
    });

    it('should handle createCard with empty initialValues', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      const cardId = await result.current.createCard({});
      expect(cardId).toBe('new1');
    });

    it('should handle updateFieldOptions with non-existent field', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      await result.current.updateFieldOptions('999', ['Option']);

      expect(mockUseUpdateField().mutateAsync).not.toHaveBeenCalled();
    });

    it('should handle persistStackOrder without viewId', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      await result.current.persistStackOrder(['stack1', 'stack2']);

      expect(mockUseUpdateView().mutateAsync).not.toHaveBeenCalled();
    });

    it('should handle changeGroupByColumn without viewId', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      const column: any = { id: '2', type: 'select' };
      await result.current.changeGroupByColumn(column);

      expect(mockUseUpdateView().mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('updateViewConfig Function', () => {
    it('should call updateView with meta when updates contain meta', async () => {
      const viewsWithMeta = [{ 
        id: 'view1', 
        type: 'kanban', 
        meta: { existingKey: 'existingValue' } 
      }];
      
      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, views: viewsWithMeta } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      await result.current.updateViewConfig('view1', { meta: { newKey: 'newValue' } });

      expect(mockUseUpdateView().mutateAsync).toHaveBeenCalled();
    });

    it('should call updateView directly when view not found', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      await result.current.updateViewConfig('nonexistent', { someUpdate: true });

      expect(mockUseUpdateView().mutateAsync).toHaveBeenCalledWith({ 
        viewId: 'nonexistent', 
        view: { someUpdate: true } 
      });
    });

    it('should handle updates without meta property', async () => {
      const viewsWithMeta = [{ 
        id: 'view1', 
        type: 'kanban', 
        meta: { existingKey: 'value' } 
      }];
      
      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, views: viewsWithMeta } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      await result.current.updateViewConfig('view1', { cardOrder: { stack1: ['card1'] } });

      expect(mockUseUpdateView().mutateAsync).toHaveBeenCalled();
    });

    it('should handle view with nested meta.meta structure', async () => {
      const viewsWithNestedMeta = [{ 
        id: 'view1', 
        type: 'kanban', 
        meta: { 
          meta: { nestedValue: true },
          normalValue: 'test'
        } 
      }];
      
      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, views: viewsWithNestedMeta } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      await result.current.updateViewConfig('view1', { meta: { anotherKey: 'value' } });

      expect(mockUseUpdateView().mutateAsync).toHaveBeenCalled();
    });
  });

  describe('persistStackOrder Function', () => {
    it('should persist stack order with viewId', async () => {
      const viewsWithMeta = [{ 
        id: 'view1', 
        type: 'kanban', 
        meta: { existingConfig: true } 
      }];
      
      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, views: viewsWithMeta } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      await result.current.persistStackOrder(['stack1', 'stack2', 'stack3']);

      expect(mockUseUpdateView().mutateAsync).toHaveBeenCalledWith({
        viewId: 'view1',
        view: {
          meta: {
            existingConfig: true,
            stackOrder: ['stack1', 'stack2', 'stack3']
          }
        }
      });
    });

    it('should use config fallback when meta is undefined', async () => {
      const viewsWithConfig = [{ 
        id: 'view1', 
        type: 'kanban', 
        config: { configValue: true } 
      }];
      
      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, views: viewsWithConfig } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      await result.current.persistStackOrder(['a', 'b']);

      expect(mockUseUpdateView().mutateAsync).toHaveBeenCalled();
    });
  });

  describe('changeGroupByColumn Function', () => {
    it('should change group by column with viewId', async () => {
      const viewsWithMeta = [{ 
        id: 'view1', 
        type: 'kanban', 
        meta: { existingMeta: true } 
      }];
      
      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, views: viewsWithMeta } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      const column: any = { id: '3', type: 'select' };
      await result.current.changeGroupByColumn(column);

      expect(mockUseUpdateView().mutateAsync).toHaveBeenCalledWith({
        viewId: 'view1',
        view: {
          model_id: 'table1',
          meta: {
            existingMeta: true,
            view_target_field: '3'
          }
        }
      });
    });

    it('should not update when column id is missing', async () => {
      const viewsWithMeta = [{ id: 'view1', type: 'kanban', meta: {} }];
      
      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, views: viewsWithMeta } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1', viewId: 'view1' }));

      const column: any = { type: 'select' }; // No id
      await result.current.changeGroupByColumn(column);

      expect(mockUseUpdateView().mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('updateFieldOptions Function', () => {
    it('should update field options for existing field', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      await result.current.updateFieldOptions('2', [
        { option: 'Option A', color: '#ff0000' },
        { option: 'Option B', color: '#00ff00' }
      ]);

      expect(mockUseUpdateField().mutateAsync).toHaveBeenCalled();
    });

    it('should merge with existing field meta', async () => {
      const columnsWithMeta = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'status', title: 'Status', uidt: 'select', order_index: 1, meta: { existingMeta: true } }
      ];

      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, columns: columnsWithMeta } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      await result.current.updateFieldOptions('2', ['New Option']);

      expect(mockUseUpdateField().mutateAsync).toHaveBeenCalledWith({
        fieldId: '2',
        updatedValue: {
          meta: {
            existingMeta: true,
            options: ['New Option']
          }
        }
      });
    });
  });

  describe('createCard with Initial Values', () => {
    it('should set initial values for non-attachment fields', async () => {
      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      await result.current.createCard({ 
        title: 'New Card', 
        status: 'To Do' 
      });

      expect(mockUseInsertRowData().mutateAsync).toHaveBeenCalled();
    });

    it('should skip attachment fields when setting initial values', async () => {
      const columnsWithAttachment = [
        { id: '1', column_name: 'title', title: 'Title', uidt: 'text', order_index: 0 },
        { id: '2', column_name: 'files', title: 'Files', uidt: 'attachment', type: 'attachment', order_index: 1 }
      ];

      mockUseTable.mockReturnValue({
        data: { data: { ...mockTableData, columns: columnsWithAttachment } },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      await result.current.createCard({ 
        title: 'New Card',
        files: ['file.pdf']
      });

      // Should have been called for title but not files
      const calls = mockUseInsertRowData().mutateAsync.mock.calls;
      const hasAttachmentCall = calls.some((call: any) => call[0]?.column_id === '2');
      expect(hasAttachmentCall).toBe(false);
    });

    it('should handle createCard when insertRowData fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockUseInsertRowData.mockReturnValue({
        mutateAsync: vi.fn().mockRejectedValue(new Error('Insert failed'))
      });

      const { result } = renderHook(() => useKanbanData({ tableId: 'table1' }));

      // Should not throw, just log warning
      const cardId = await result.current.createCard({ title: 'Test' });
      expect(cardId).toBe('new1');
      await Promise.resolve();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });});
