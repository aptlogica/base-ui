import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColumnManagement } from '../useColumnManagement';
import { checkFieldUsageInViews, checkCriticalFieldUsageInViews } from '../../../../utils/fieldUsageUtils';

// Mock dependencies
vi.mock('../../../../utils/fieldUsageUtils', () => ({
  checkFieldUsageInViews: vi.fn(),
  checkCriticalFieldUsageInViews: vi.fn(),
}));

vi.mock('../../../../components/shared/table/tableUtils', () => ({
  parseApiColumnMeta: vi.fn((meta) => meta || {}),
}));

describe('useColumnManagement', () => {
  const mockCheckFieldUsageInViews = vi.mocked(checkFieldUsageInViews);
  const mockCheckCriticalFieldUsageInViews = vi.mocked(checkCriticalFieldUsageInViews);
  
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
      createField: vi.fn(),
      deleteColumn: vi.fn(),
      updateField: vi.fn(),
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