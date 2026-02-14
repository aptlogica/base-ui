import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableViewConfig, FilterType, GroupByItem, SortType } from '../useTableViewConfig';
import { GridColumn } from '../../types/grid.types';

// Mock dependencies
vi.mock('../../../utils/helpers', () => ({
  useDebounce: vi.fn((value) => value),
}));

vi.mock('../../../utils/pluginUtils', () => ({
  parseFieldConfig: vi.fn((config) => ({
    filters: config?.filters || [],
    groupBy: config?.groupBy || [],
    sorts: config?.sorts || [],
    columnWidths: config?.columnWidths || {},
    fieldConfig: config?.fieldConfig || []
  })),
}));

vi.mock('../../../utils/sortUtils', () => ({
  filterValidSorts: vi.fn((sorts) => sorts),
}));

describe('useTableViewConfig', () => {
  const mockUpdateViewMutation = {
    mutateAsync: vi.fn(),
  };

  const sampleColumns: GridColumn[] = [
    { id: 'col-1', key: 'title', title: 'Title', type: 'text', isSystem: false },
    { id: 'col-2', key: 'description', title: 'Description', type: 'text', isSystem: false },
    { id: 'col-3', key: 'created_at', title: 'Created At', type: 'datetime', isSystem: true },
  ];

  const defaultOptions = {
    baseMeta: {},
    effectiveViewId: 'view-1',
    columns: sampleColumns,
    updateViewMutation: mockUpdateViewMutation,
    searchableColumns: sampleColumns.filter(col => !col.isSystem),
    isReadOnly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      expect(result.current.viewConfigState).toEqual({
        filters: [],
        groupBy: [],
        sorts: [],
        columnWidths: {},
      });
      expect(result.current.searchTerm).toBe('');
      expect(result.current.selectedSearchField).toEqual({
        key: 'title',
        title: 'Title',
        type: 'text'
      });
      expect(result.current.realTimeFilter).toBeNull();
    });

    it('should initialize with provided baseMeta', () => {
      const baseMeta = {
        filters: [{ column: 'title', operator: 'contains', value: 'test' }],
        sorts: [{ column: 'title', direction: 'asc' }],
        columnWidths: { 'col-1': 200 }
      };

      const { result } = renderHook(() => 
        useTableViewConfig({ ...defaultOptions, baseMeta })
      );

      expect(result.current.viewConfigState.filters).toEqual(baseMeta.filters);
      expect(result.current.viewConfigState.sorts).toEqual(baseMeta.sorts);
      expect(result.current.viewConfigState.columnWidths).toEqual(baseMeta.columnWidths);
    });

    it('should handle empty searchableColumns', () => {
      const { result } = renderHook(() => 
        useTableViewConfig({ ...defaultOptions, searchableColumns: [] })
      );

      expect(result.current.selectedSearchField).toBeNull();
    });
  });

  describe('view configuration state', () => {
    it('should update viewConfigState', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      const newState = {
        filters: [{ column: 'title', operator: 'equals', value: 'test' }] as FilterType[],
        groupBy: [] as GroupByItem[],
        sorts: [{ column: 'title', direction: 'desc' }] as SortType[],
        columnWidths: { 'col-1': 300 },
      };

      act(() => {
        result.current.setViewConfigState(newState);
      });

      expect(result.current.viewConfigState).toEqual(newState);
    });

    it('should support function updater for viewConfigState', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      act(() => {
        result.current.setViewConfigState(prev => ({
          ...prev,
          filters: [{ column: 'title', operator: 'contains', value: 'new' }],
        }));
      });

      expect(result.current.viewConfigState.filters).toEqual([
        { column: 'title', operator: 'contains', value: 'new' }
      ]);
    });
  });

  describe('search functionality', () => {
    it('should update searchTerm', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      act(() => {
        result.current.setSearchTerm('new search term');
      });

      expect(result.current.searchTerm).toBe('new search term');
    });

    it('should update selectedSearchField', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      const newField = { key: 'description', title: 'Description', type: 'text' };

      act(() => {
        result.current.setSelectedSearchField(newField);
      });

      expect(result.current.selectedSearchField).toEqual(newField);
    });
  });

  describe('local field configuration', () => {
    it('should initialize localFieldConfig from columns', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      expect(result.current.localFieldConfig).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'col-1', position: 0 }),
          expect.objectContaining({ id: 'col-2', position: 1 }),
          expect.objectContaining({ id: 'col-3', position: 2 }),
        ])
      );
    });

    it('should hide system fields by default except Title', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      const titleField = result.current.localFieldConfig.find(f => f.id === 'col-1');
      const systemField = result.current.localFieldConfig.find(f => f.id === 'col-3');

      expect(titleField?.isHidden).toBe(false);
      expect(systemField?.isHidden).toBe(true);
    });

    it('should update localFieldConfig', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      const newFieldConfig = [
        { id: 'col-2', position: 0, isHidden: false },
        { id: 'col-1', position: 1, isHidden: true },
      ];

      act(() => {
        result.current.setLocalFieldConfig(newFieldConfig);
      });

      expect(result.current.localFieldConfig).toEqual(newFieldConfig);
    });
  });

  describe('visible columns', () => {
    it('should return visible columns based on field config', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      const visibleColumns = result.current.visibleColumns;
      
      // Should include non-hidden columns
      expect(visibleColumns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'col-1' }),
          expect.objectContaining({ id: 'col-2' }),
        ])
      );
      
      // Should not include hidden system columns
      expect(visibleColumns.find(c => c.id === 'col-3')).toBeUndefined();
    });
  });

  describe('filter operations', () => {
    it('should provide handleAddFilter function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleAddFilter).toBe('function');
    });

    it('should provide handleRemoveFilter function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleRemoveFilter).toBe('function');
    });

    it('should provide handleUpdateFilter function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleUpdateFilter).toBe('function');
    });

    it('should provide handleRealTimeFilter function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleRealTimeFilter).toBe('function');
    });
  });

  describe('groupBy operations', () => {
    it('should provide handleGroupByChange function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleGroupByChange).toBe('function');
    });
  });

  describe('sort operations', () => {
    it('should provide handleSortChange function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleSortChange).toBe('function');
    });
  });

  describe('field management', () => {
    it('should provide handleEnsureAllFieldsRegistered function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleEnsureAllFieldsRegistered).toBe('function');
    });

    it('should provide handleFieldToggle function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleFieldToggle).toBe('function');
    });

    it('should provide handleFieldOrderChange function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.handleFieldOrderChange).toBe('function');
    });

  });

  describe('backend synchronization', () => {
    it('should provide updateViewConfigBackend function', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));
      expect(typeof result.current.updateViewConfigBackend).toBe('function');
    });

    it('should call updateViewMutation when available', async () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      await act(async () => {
        await result.current.updateViewConfigBackend({ filters: [] });
      });

      expect(mockUpdateViewMutation.mutateAsync).toHaveBeenCalled();
    });

    it('should handle missing updateViewMutation gracefully', async () => {
      const { result } = renderHook(() => 
        useTableViewConfig({ 
          ...defaultOptions, 
          updateViewMutation: undefined 
        })
      );

      await act(async () => {
        await result.current.updateViewConfigBackend({ filters: [] });
      });

      // Should not throw
      expect(mockUpdateViewMutation.mutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('real-time filtering', () => {
    it('should manage realTimeFilter state', () => {
      const { result } = renderHook(() => useTableViewConfig(defaultOptions));

      expect(result.current.realTimeFilter).toBeNull();
    });
  });

  describe('readonly mode', () => {
    it('should handle readonly mode', () => {
      const { result } = renderHook(() => 
        useTableViewConfig({ ...defaultOptions, isReadOnly: true })
      );

      // Should still provide all functions in readonly mode
      expect(typeof result.current.handleAddFilter).toBe('function');
      expect(typeof result.current.handleRemoveFilter).toBe('function');
      expect(typeof result.current.handleFieldToggle).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle missing baseMeta', () => {
      const { result } = renderHook(() => 
        useTableViewConfig({ ...defaultOptions, baseMeta: undefined })
      );

      expect(result.current.viewConfigState).toEqual({
        filters: [],
        groupBy: [],
        sorts: [],
        columnWidths: {},
      });
    });

    it('should handle columns without ids', () => {
      const columnsWithoutIds: GridColumn[] = [
        { key: 'title', title: 'Title', type: 'text' as const },
        { id: 'col-2', key: 'description', title: 'Description', type: 'text' as const },
      ];

      const { result } = renderHook(() => 
        useTableViewConfig({ 
          ...defaultOptions, 
          columns: columnsWithoutIds,
          searchableColumns: columnsWithoutIds.filter(c => c.id)
        })
      );

      // Should only include columns with valid IDs in field config
      expect(result.current.localFieldConfig).toHaveLength(1);
      expect(result.current.localFieldConfig[0].id).toBe('col-2');
    });

    it('should handle invalid field config in baseMeta', () => {
      const invalidBaseMeta = {
        fieldConfig: 'invalid-string-instead-of-array'
      };

      const { result } = renderHook(() => 
        useTableViewConfig({ 
          ...defaultOptions, 
          baseMeta: invalidBaseMeta 
        })
      );

      // Should fall back to generating from columns
      expect(Array.isArray(result.current.localFieldConfig)).toBe(true);
      expect(result.current.localFieldConfig.length).toBeGreaterThan(0);
    });
  });
});
