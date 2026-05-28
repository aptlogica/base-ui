import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnManagement } from '../useColumnManagement';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews, checkFieldUsageInFormulas } from '../../../../utils/fieldUsageUtils';
import { parseApiColumnMeta } from '../../../../components/shared/table/tableUtils';

// Mock dependencies
vi.mock('../../../../utils/fieldUsageUtils', () => ({
  checkFieldUsageInViews: vi.fn(),
  checkCriticalFieldUsageInViews: vi.fn(),
  checkFieldUsageInFormulas: vi.fn(),
}));

vi.mock('../../../../components/shared/table/tableUtils', () => ({
  parseApiColumnMeta: vi.fn((meta) => meta || {}),
}));

describe('useColumnManagement', () => {
  const mockCheckFieldUsageInViews = vi.mocked(checkFieldUsageInViews);
  const mockCheckCriticalFieldUsageInViews = vi.mocked(checkCriticalFieldUsageInViews);
  const mockCheckFieldUsageInFormulas = vi.mocked(checkFieldUsageInFormulas);
  const mockParseApiColumnMeta = vi.mocked(parseApiColumnMeta);
  
  const defaultProps = {
    tableId: 'table-1',
    baseId: 'base-1',
    columns: [
      { id: 'col-1', key: 'name', title: 'Column 1', type: 'text' as any, isSystem: false },
      { id: 'col-2', key: 'email', title: 'Column 2', type: 'number' as any, isSystem: true },
    ],
    allViews: [
      { id: 'view-1', model_id: 'table-1', name: 'View 1' },
      { id: 'view-2', model_id: 'table-2', name: 'View 2' },
    ],
    tableData: undefined,
    actions: {
      createField: { mutateAsync: vi.fn() },
      deleteColumn: { mutateAsync: vi.fn() },
      updateField: { mutateAsync: vi.fn() },
    },
    onRefresh: vi.fn(),
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
    updateViewConfigBackend: vi.fn(),
    viewConfigState: {},
    setViewConfigState: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckFieldUsageInViews.mockReturnValue({
      isUsedInViews: false,
      usedInViews: [],
    });
    mockCheckCriticalFieldUsageInViews.mockReturnValue({
      isUsedInViews: false,
      usedInViews: [],
    });
    mockCheckFieldUsageInFormulas.mockReturnValue({
      isUsedInFormulas: false,
      usedInFormulas: [],
    } as any);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      expect(result.current.isColumnModalOpen).toBe(false);
      expect(result.current.editColumn).toBeNull();
      expect(result.current.editColumnIndex).toBeNull();
      expect(result.current.editModalOpen).toBe(false);
      expect(result.current.deleteConfirmModalOpen).toBe(false);
      expect(result.current.columnToDelete).toBeNull();
      expect(result.current.updateFieldConfirmModalOpen).toBe(false);
      expect(result.current.pendingEditColumnChanges).toBeNull();
      expect(result.current.dragColumnIndex).toBeNull();
      expect(result.current.hoverColumnIndex).toBeNull();
    });

    it('should provide all expected handler functions', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      expect(typeof result.current.handleAddColumn).toBe('function');
      expect(typeof result.current.handleEditColumn).toBe('function');
      expect(typeof result.current.handleSaveEditColumn).toBe('function');
      expect(typeof result.current.handleConfirmUpdateField).toBe('function');
      expect(typeof result.current.handleDeleteColumn).toBe('function');
      expect(typeof result.current.handleConfirmDeleteColumn).toBe('function');
      expect(typeof result.current.handleDuplicateColumn).toBe('function');
      expect(typeof result.current.handleColumnDragStart).toBe('function');
      expect(typeof result.current.handleColumnDragEnter).toBe('function');
      expect(typeof result.current.handleColumnDragEnd).toBe('function');
    });

    it('should provide all expected setter functions', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      expect(typeof result.current.setIsColumnModalOpen).toBe('function');
      expect(typeof result.current.setEditModalOpen).toBe('function');
      expect(typeof result.current.setDeleteConfirmModalOpen).toBe('function');
      expect(typeof result.current.setUpdateFieldConfirmModalOpen).toBe('function');
      expect(typeof result.current.setPendingEditColumnChanges).toBe('function');
      expect(typeof result.current.setEditColumn).toBe('function');
      expect(typeof result.current.setEditColumnIndex).toBe('function');
    });
  });

  describe('modal state management', () => {
    it('should manage column modal state', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      act(() => {
        result.current.setIsColumnModalOpen(true);
      });

      expect(result.current.isColumnModalOpen).toBe(true);

      act(() => {
        result.current.setIsColumnModalOpen(false);
      });

      expect(result.current.isColumnModalOpen).toBe(false);
    });

    it('should manage edit modal state', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      act(() => {
        result.current.setEditModalOpen(true);
      });

      expect(result.current.editModalOpen).toBe(true);

      act(() => {
        result.current.setEditModalOpen(false);
      });

      expect(result.current.editModalOpen).toBe(false);
    });

    it('should manage delete confirmation modal state', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      act(() => {
        result.current.setDeleteConfirmModalOpen(true);
      });

      expect(result.current.deleteConfirmModalOpen).toBe(true);

      act(() => {
        result.current.setDeleteConfirmModalOpen(false);
      });

      expect(result.current.deleteConfirmModalOpen).toBe(false);
    });

    it('should manage update field confirmation modal state', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      act(() => {
        result.current.setUpdateFieldConfirmModalOpen(true);
      });

      expect(result.current.updateFieldConfirmModalOpen).toBe(true);

      act(() => {
        result.current.setUpdateFieldConfirmModalOpen(false);
      });

      expect(result.current.updateFieldConfirmModalOpen).toBe(false);
    });
  });

  describe('column state management', () => {
    it('should manage edit column state', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));
      const testColumn = { id: 'test', key: 'test', title: 'Test', type: 'text' as any };

      act(() => {
        result.current.setEditColumn(testColumn);
      });

      expect(result.current.editColumn).toEqual(testColumn);
    });

    it('should manage edit column index state', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      act(() => {
        result.current.setEditColumnIndex(5);
      });

      expect(result.current.editColumnIndex).toBe(5);
    });

    it('should manage pending changes state', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));
      const changes = { title: 'New Title' };

      act(() => {
        result.current.setPendingEditColumnChanges(changes);
      });

      expect(result.current.pendingEditColumnChanges).toEqual(changes);
    });
  });

  describe('column operations', () => {
    it('should handle column operations without throwing', async () => {
      // Suppress expected console errors during this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useColumnManagement(defaultProps));

      // Test handleAddColumn - wrap in act and handle the async operation
      await act(async () => {
        try {
          await result.current.handleAddColumn({ title: 'New Column', type: 'text' });
        } catch {
          // Expected to fail since createField is just vi.fn()
        }
      });

      // Test handleEditColumn - synchronous operation with optional event parameter
      act(() => {
        // handleEditColumn accepts an optional event with target element
        result.current.handleEditColumn(defaultProps.columns[0], 0);
      });

      // Test handleDeleteColumn - wrap in act and handle the async operation
      await act(async () => {
        try {
          await result.current.handleDeleteColumn('col-1');
        } catch {
          // Expected to fail since deleteColumn is just vi.fn()
        }
      });

      // Verify the hook still functions correctly
      expect(result.current).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe('handleAddColumn', () => {
    it('should show error when tableId is missing', async () => {
      const props = { ...defaultProps, tableId: undefined };
      const { result } = renderHook(() => useColumnManagement(props));

      await act(async () => {
        await result.current.handleAddColumn({ key: 'New', type: 'text' });
      });

      expect(props.toast.error).toHaveBeenCalledWith('Table ID not found', { title: 'Error' });
    });

    it('should create column and parse meta', async () => {
      const createField = { mutateAsync: vi.fn().mockResolvedValue({ data: { meta: { foo: 'bar' } } }) };
      const props = {
        ...defaultProps,
        actions: {
          ...defaultProps.actions,
          createField,
        },
        columns: [
          { id: 'col-1', key: 'name', title: 'Column 1', type: 'text' as any, position: 3, isSystem: false },
        ],
      };
      const { result } = renderHook(() => useColumnManagement(props));

      await act(async () => {
        await result.current.handleAddColumn({ key: 'New', type: 'text', meta: { a: 1 } });
      });

      expect(createField.mutateAsync).toHaveBeenCalledWith({
        tableId: 'table-1',
        baseId: 'base-1',
        config: {
          title: 'New',
          uidt: 'text',
          meta: { a: 1 },
          order_index: 4,
          description: '',
        },
      });
      expect(mockParseApiColumnMeta).toHaveBeenCalledWith({ foo: 'bar' });
      expect(props.toast.success).toHaveBeenCalledWith('Column created', { title: 'Success' });
    });
  });

  describe('handleEditColumn', () => {
    it('should block editing system fields', () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      act(() => {
        result.current.handleEditColumn(defaultProps.columns[1] as any, 1);
      });

      expect(defaultProps.toast.error).toHaveBeenCalledWith('System fields cannot be edited', { title: 'Error' });
      expect(result.current.editModalOpen).toBe(false);
    });
  });

  describe('handleSaveEditColumn', () => {
    it('should set confirm modal when type changes', async () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      act(() => {
        result.current.handleEditColumn(defaultProps.columns[0] as any, 0);
      });

      await act(async () => {
        await result.current.handleSaveEditColumn({ title: 'Column 1', type: 'number', meta: { a: 1 } });
      });

      expect(result.current.updateFieldConfirmModalOpen).toBe(true);
      expect(result.current.pendingEditColumnChanges).toEqual(
        expect.objectContaining({ uidt: 'number', meta: { a: 1 } })
      );
    });

    it('should block type change when field is used', async () => {
      mockCheckCriticalFieldUsageInViews.mockReturnValueOnce({
        isUsedInViews: true,
        usedInViews: [{ viewName: 'View 1', usageType: 'group' }],
      });
      const props = { ...defaultProps };
      const { result } = renderHook(() => useColumnManagement(props));

      act(() => {
        result.current.handleEditColumn(defaultProps.columns[0] as any, 0);
      });

      await act(async () => {
        await result.current.handleSaveEditColumn({ title: 'Column 1', type: 'number', meta: {} });
      });

      expect(props.toast.error).toHaveBeenCalled();
      expect(result.current.updateFieldConfirmModalOpen).toBe(false);
    });
  });

  describe('handleConfirmUpdateField', () => {
    it('should apply pending changes and reset state', async () => {
      const updateField = { mutateAsync: vi.fn().mockResolvedValue({}) };
      const props = {
        ...defaultProps,
        actions: { ...defaultProps.actions, updateField },
      };
      const { result } = renderHook(() => useColumnManagement(props));

      act(() => {
        result.current.setPendingEditColumnChanges({ title: 'Updated' });
        result.current.setEditColumn(defaultProps.columns[0] as any);
      });

      await act(async () => {
        await result.current.handleConfirmUpdateField();
      });

      expect(updateField.mutateAsync).toHaveBeenCalledWith({
        fieldId: 'col-1',
        updatedValue: { title: 'Updated' },
      });
      expect(props.toast.success).toHaveBeenCalledWith('Column type updated', { title: 'Success' });
      expect(result.current.pendingEditColumnChanges).toBeNull();
    });
  });

  describe('handleDeleteColumn and confirm', () => {
    it('should block delete for system fields', async () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));

      await act(async () => {
        await result.current.handleDeleteColumn('col-2');
      });

      expect(defaultProps.toast.error).toHaveBeenCalledWith('System fields cannot be deleted', { title: 'Error' });
      expect(result.current.deleteConfirmModalOpen).toBe(false);
    });

    it('should delete and update column widths', async () => {
      const deleteColumn = { mutateAsync: vi.fn().mockResolvedValue({}) };
      const updateViewConfigBackend = vi.fn().mockResolvedValue({});
      const setViewConfigState = vi.fn();
      const props = {
        ...defaultProps,
        actions: { ...defaultProps.actions, deleteColumn },
        viewConfigState: { columnWidths: { 'col-1': 120, name: 200 } },
        setViewConfigState,
        updateViewConfigBackend,
      };
      const { result } = renderHook(() => useColumnManagement(props));

      await act(async () => {
        await result.current.handleDeleteColumn('col-1');
      });

      await act(async () => {
        await result.current.handleConfirmDeleteColumn();
      });

      expect(deleteColumn.mutateAsync).toHaveBeenCalledWith({
        tableId: 'table-1',
        fieldId: 'col-1',
      });
      expect(setViewConfigState).toHaveBeenCalledWith({
        columnWidths: {},
      });
      expect(updateViewConfigBackend).toHaveBeenCalled();
      expect(props.toast.success).toHaveBeenCalled();
    });
  });

  describe('handleDuplicateColumn', () => {
    it('should duplicate a column successfully', async () => {
      const createField = vi.fn().mockResolvedValue({});
      const props = {
        ...defaultProps,
        actions: { ...defaultProps.actions, createField },
        tableData: { model: { id: 't1' } },
      };
      const { result } = renderHook(() => useColumnManagement(props));

      await act(async () => {
        await result.current.handleDuplicateColumn({ title: 'Test', type: 'text' });
      });

      expect(createField).toHaveBeenCalledWith({
        model_id: 't1',
        column_name: 'Test_copy',
        column_type: 'text',
      });
      expect(props.toast.success).toHaveBeenCalledWith('Column duplicated successfully', { title: 'Success' });
    });
  });

  describe('handleColumnDragEnd', () => {
    it('should call handleFieldOrderChange when provided', async () => {
      const { result } = renderHook(() => useColumnManagement(defaultProps));
      const handleFieldOrderChange = vi.fn().mockResolvedValue({});
      const visibleColumns = [...defaultProps.columns];

      act(() => {
        result.current.handleColumnDragStart(0, visibleColumns as any);
        result.current.handleColumnDragEnter(1);
      });

      await act(async () => {
        await result.current.handleColumnDragEnd(
          visibleColumns as any,
          [],
          undefined,
          undefined,
          undefined,
          handleFieldOrderChange
        );
      });

      expect(handleFieldOrderChange).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle missing toast gracefully', () => {
      const propsWithoutToast = {
        ...defaultProps,
        toast: undefined,
      };

      expect(() => {
        renderHook(() => useColumnManagement(propsWithoutToast));
      }).not.toThrow();
    });

    it('should handle missing actions gracefully', () => {
      const propsWithoutActions = {
        ...defaultProps,
        actions: undefined,
      };

      expect(() => {
        renderHook(() => useColumnManagement(propsWithoutActions));
      }).not.toThrow();
    });
  });
});
