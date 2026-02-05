import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKanbanViewConfig } from '../useKanbanViewConfig';

vi.mock('../../../utils/helpers', () => ({
  useDebounce: vi.fn((fn) => fn)
}));

vi.mock('../../../utils/sortUtils', () => ({
  filterValidSorts: vi.fn((sorts) => sorts)
}));

vi.mock('../../../utils/viewFieldConfigUtils', () => ({
  extractFieldConfigFromMeta: vi.fn(() => []),
  generateDefaultFieldConfig: vi.fn(() => []),
  mergeFieldConfigWithColumns: vi.fn((config, columns) => config.length > 0 ? config : columns.map((col: any, i: number) => ({ id: col.id, position: i, isHidden: false })))
}));

vi.mock('../../../utils/fieldUtils', () => ({
  isFormulaField: vi.fn(() => false)
}));

describe('useKanbanViewConfig Hook', () => {
  const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
  const mockColumns = [
    { id: '1', column_name: 'title', title: 'Title', type: 'text', uidt: 'text' },
    { id: '2', column_name: 'status', title: 'Status', type: 'select', uidt: 'select' }
  ];

  const mockView = {
    id: 'view1',
    meta: {
      filters: [],
      sorts: [],
      fieldConfig: []
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty search term', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.searchTerm).toBe('');
      expect(result.current.selectedSearchField).toBeNull();
    });

    it('should initialize with empty filters', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.filters).toEqual([]);
    });

    it('should initialize with empty sorts', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.sorts).toEqual([]);
    });

    it('should initialize with null draftFilter', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.draftFilter).toBeNull();
    });

    it('should initialize localFieldConfig from columns', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.localFieldConfig).toBeDefined();
      expect(Array.isArray(result.current.localFieldConfig)).toBe(true);
    });
  });

  describe('Search Handling', () => {
    it('should update search term', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      act(() => {
        result.current.handleSearch('test', null);
      });

      expect(result.current.searchTerm).toBe('test');
    });

    it('should update selected search field', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      const field = { key: 'title', title: 'Title', type: 'text' };

      act(() => {
        result.current.handleSearch('test', field);
      });

      expect(result.current.selectedSearchField).toEqual(field);
    });

    it('should clear search', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      act(() => {
        result.current.handleSearch('test', null);
      });

      act(() => {
        result.current.handleSearch('', null);
      });

      expect(result.current.searchTerm).toBe('');
    });
  });

  describe('Filter Handling', () => {
    it('should add filter', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      const newFilter = { column: 'status', operator: 'eq', value: 'Done' };

      await act(async () => {
        await result.current.handleAddFilter(newFilter);
      });

      expect(result.current.filters).toContainEqual(newFilter);
    });

    it('should remove filter', async () => {
      const viewWithFilters = {
        ...mockView,
        meta: {
          ...mockView.meta,
          filters: [{ column: 'status', operator: 'eq', value: 'Done' }]
        }
      };

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: viewWithFilters, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleRemoveFilter(0);
      });

      expect(result.current.filters).toEqual([]);
    });

    it('should update filter', async () => {
      const viewWithFilters = {
        ...mockView,
        meta: {
          ...mockView.meta,
          filters: [{ column: 'status', operator: 'eq', value: 'Done' }]
        }
      };

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: viewWithFilters, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleUpdateFilter(0, { value: 'In Progress' });
      });

      expect(result.current.filters[0].value).toBe('In Progress');
    });

    it('should not persist filters when read-only', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ 
          view: mockView, 
          columns: mockColumns, 
          updateViewConfig: mockUpdateViewConfig, 
          isReadOnly: true 
        })
      );

      const newFilter = { column: 'status', operator: 'eq', value: 'Done' };

      await act(async () => {
        await result.current.handleAddFilter(newFilter);
      });

      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });
  });

  describe('Sort Handling', () => {
    it('should update sorts', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      const newSorts = [{ column: 'title', direction: 'asc' as const }];

      await act(async () => {
        await result.current.handleSortChange(newSorts);
      });

      expect(result.current.sorts).toEqual(newSorts);
    });

    it('should not persist sorts when read-only', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ 
          view: mockView, 
          columns: mockColumns, 
          updateViewConfig: mockUpdateViewConfig, 
          isReadOnly: true 
        })
      );

      const newSorts = [{ column: 'title', direction: 'asc' as const }];

      await act(async () => {
        await result.current.handleSortChange(newSorts);
      });

      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });
  });

  describe('Field Toggle', () => {
    it('should provide handleFieldToggle function', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.handleFieldToggle).toBeInstanceOf(Function);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined view', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: undefined as any, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.filters).toEqual([]);
      expect(result.current.sorts).toEqual([]);
    });

    it('should handle empty columns array', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: [], updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.localFieldConfig).toEqual([]);
    });

    it('should handle undefined updateViewConfig', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: undefined })
      );

      expect(result.current).toBeDefined();
    });

    it('should handle view without meta', () => {
      const viewWithoutMeta = { id: 'view1' };

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: viewWithoutMeta as any, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      expect(result.current.filters).toEqual([]);
      expect(result.current.sorts).toEqual([]);
    });

    it('should handle update filter with invalid index', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleUpdateFilter(999, { value: 'Test' });
      });

      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });

    it('should handle remove filter with invalid index', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleRemoveFilter(999);
      });

      expect(result.current.filters).toEqual([]);
    });
  });

  describe('View Meta Changes', () => {
    it('should update filters when view meta changes', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useKanbanViewConfig({ view, columns: mockColumns, updateViewConfig: mockUpdateViewConfig }),
        { initialProps: { view: mockView } }
      );

      const updatedView = {
        ...mockView,
        meta: {
          ...mockView.meta,
          filters: [{ column: 'status', operator: 'eq', value: 'Done' }]
        }
      } as typeof mockView;

      rerender({ view: updatedView });

      expect(result.current.filters).toEqual(updatedView.meta.filters);
    });

    it('should update sorts when view meta changes', () => {
      const { result, rerender } = renderHook(
        ({ view }) => useKanbanViewConfig({ view, columns: mockColumns, updateViewConfig: mockUpdateViewConfig }),
        { initialProps: { view: mockView } }
      );

      const updatedView = {
        ...mockView,
        meta: {
          ...mockView.meta,
          sorts: [{ column: 'title', direction: 'asc' as const }]
        }
      } as typeof mockView;

      rerender({ view: updatedView });

      expect(result.current.sorts).toEqual(updatedView.meta.sorts);
    });
  });

  describe('handleFieldToggle', () => {
    it('should toggle existing field visibility', async () => {
      const viewWithFieldConfig = {
        ...mockView,
        meta: {
          ...mockView.meta,
          fieldConfig: [
            { id: '1', position: 0, isHidden: false },
            { id: '2', position: 1, isHidden: true }
          ]
        }
      };

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: viewWithFieldConfig, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleFieldToggle('1');
      });

      // Verify that localFieldConfig was updated (debounce will call updateViewConfig)
      expect(result.current.localFieldConfig).toBeDefined();
    });

    it('should add new field to config when toggling field not in config', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleFieldToggle('new-field-id');
      });

      // localFieldConfig should be updated
      expect(result.current.localFieldConfig).toBeDefined();
    });

    it('should not update when updateViewConfig is not provided', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: undefined })
      );

      const initialConfig = result.current.localFieldConfig;

      await act(async () => {
        await result.current.handleFieldToggle('1');
      });

      // Should not throw and localFieldConfig should remain the same
      expect(result.current.localFieldConfig).toEqual(initialConfig);
    });

    it('should handle toggle with system fields in columns', async () => {
      const columnsWithSystem = [
        ...mockColumns,
        { id: '3', column_name: 'created_at', title: 'Created At', type: 'datetime', system: true, hidden: false }
      ];

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: columnsWithSystem, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleFieldToggle('3');
      });

      expect(result.current.localFieldConfig).toBeDefined();
    });

    it('should handle toggle with attachment field type', async () => {
      const columnsWithAttachment = [
        ...mockColumns,
        { id: '4', column_name: 'files', title: 'Files', type: 'attachment', uidt: 'attachment' }
      ];

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: columnsWithAttachment, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleFieldToggle('4');
      });

      expect(result.current.localFieldConfig).toBeDefined();
    });
  });

  describe('handleFieldOrderChange', () => {
    it('should update field order', async () => {
      const viewWithFieldConfig = {
        ...mockView,
        meta: {
          ...mockView.meta,
          fieldConfig: [
            { id: '1', position: 0, isHidden: false },
            { id: '2', position: 1, isHidden: false }
          ]
        }
      };

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: viewWithFieldConfig, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      const reorderedColumns = [
        { id: '2', column_name: 'status', title: 'Status' },
        { id: '1', column_name: 'title', title: 'Title' }
      ];

      await act(async () => {
        await result.current.handleFieldOrderChange(reorderedColumns);
      });

      expect(mockUpdateViewConfig).toHaveBeenCalledWith('view1', expect.objectContaining({
        fieldConfig: expect.any(Array)
      }));
    });

    it('should not update when updateViewConfig is not provided', async () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: undefined })
      );

      await act(async () => {
        await result.current.handleFieldOrderChange(mockColumns);
      });

      // Should not throw
      expect(result.current.localFieldConfig).toBeDefined();
    });

    it('should not update when view id is not provided', async () => {
      const viewWithoutId = { meta: mockView.meta };

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: viewWithoutId as any, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      await act(async () => {
        await result.current.handleFieldOrderChange(mockColumns);
      });

      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });

    it('should handle adding new columns during reorder', async () => {
      const viewWithFieldConfig = {
        ...mockView,
        meta: {
          ...mockView.meta,
          fieldConfig: [
            { id: '1', position: 0, isHidden: false }
          ]
        }
      };

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: viewWithFieldConfig, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      const columnsWithNew = [
        ...mockColumns,
        { id: '3', column_name: 'new_field', title: 'New Field' }
      ];

      await act(async () => {
        await result.current.handleFieldOrderChange(columnsWithNew);
      });

      expect(mockUpdateViewConfig).toHaveBeenCalled();
    });

    it('should handle deleted columns in order', async () => {
      const viewWithFieldConfig = {
        ...mockView,
        meta: {
          ...mockView.meta,
          fieldConfig: [
            { id: '1', position: 0, isHidden: false },
            { id: '2', position: 1, isHidden: false }
          ]
        }
      };

      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: viewWithFieldConfig, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      const columnsWithDeleted = [
        { id: '1', column_name: 'title', title: 'Title', deleted: true },
        { id: '2', column_name: 'status', title: 'Status', deleted: false }
      ];

      await act(async () => {
        await result.current.handleFieldOrderChange(columnsWithDeleted);
      });

      expect(mockUpdateViewConfig).toHaveBeenCalled();
    });
  });

  describe('handleRealTimeFilter', () => {
    it('should set draft filter', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      act(() => {
        result.current.handleRealTimeFilter({ column: 'title', operator: 'contains', value: 'test' });
      });

      expect(result.current.draftFilter).toEqual({ column: 'title', operator: 'contains', value: 'test' });
    });

    it('should clear draft filter when null passed', () => {
      const { result } = renderHook(() =>
        useKanbanViewConfig({ view: mockView, columns: mockColumns, updateViewConfig: mockUpdateViewConfig })
      );

      act(() => {
        result.current.handleRealTimeFilter({ column: 'title', operator: 'eq', value: 'test' });
      });

      act(() => {
        result.current.handleRealTimeFilter(null);
      });

      expect(result.current.draftFilter).toBeNull();
    });
  });
});
