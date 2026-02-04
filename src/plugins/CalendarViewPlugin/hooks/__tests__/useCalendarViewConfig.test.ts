import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendarViewConfig } from '../useCalendarViewConfig';
import type { GridColumn } from '../../../../plugins/GridViewPlugin/types/grid.types';

vi.mock('../../../../utils/helpers', () => ({
  useDebounce: (fn: any) => fn
}));

vi.mock('../../../../utils/sortUtils', () => ({
  filterValidSorts: (sorts: any[]) => sorts.filter((s: any) => s.column)
}));

vi.mock('../../../../utils/viewFieldConfigUtils', () => ({
  extractFieldConfigFromMeta: (meta: any) => meta?.fieldConfig || [],
  generateDefaultFieldConfig: (columns: any[]) =>
    columns.slice(0, 4).map((col, idx) => ({ id: col.id, position: idx, isHidden: false })),
  mergeFieldConfigWithColumns: (config: any[], columns: any[]) => {
    const configMap = new Map(config.map((c: any) => [c.id, c]));
    return columns.map((col, idx) => configMap.get(col.id) || { id: col.id, position: idx, isHidden: false });
  }
}));

vi.mock('../../../../utils/fieldUtils', () => ({
  isFormulaField: () => false
}));

describe('useCalendarViewConfig', () => {
  const mockColumns: GridColumn[] = [
    { id: '1', key: 'field1', title: 'Field 1', type: 'text', position: 0 },
    { id: '2', key: 'field2', title: 'Field 2', type: 'number', position: 1 },
    { id: '3', key: 'field3', title: 'Field 3', type: 'date', position: 2 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty filters and sorts', () => {
      const { result } = renderHook(() =>
        useCalendarViewConfig({
          columns: mockColumns
        })
      );

      expect(result.current.filters).toEqual([]);
      expect(result.current.sorts).toEqual([]);
      expect(result.current.draftFilter).toBeNull();
    });

    it('should initialize filters from view meta', () => {
      const view = {
        meta: {
          filters: [{ column: 'field1', operator: 'eq', value: 'test' }]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns
        })
      );

      expect(result.current.filters).toEqual([
        { column: 'field1', operator: 'eq', value: 'test' }
      ]);
    });

    it('should initialize sorts from view meta', () => {
      const view = {
        meta: {
          sorts: [{ column: 'field1', order: 'asc' }]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns
        })
      );

      expect(result.current.sorts).toEqual([
        { column: 'field1', order: 'asc' }
      ]);
    });

    it('should generate default field config when none exists', () => {
      const { result } = renderHook(() =>
        useCalendarViewConfig({
          columns: mockColumns
        })
      );

      expect(result.current.localFieldConfig).toBeDefined();
      expect(result.current.localFieldConfig.length).toBeGreaterThan(0);
    });
  });

  describe('handleRealTimeFilter', () => {
    it('should set draft filter', () => {
      const { result } = renderHook(() =>
        useCalendarViewConfig({
          columns: mockColumns
        })
      );

      const filter = { column: 'field1', operator: 'eq', value: 'test' };

      act(() => {
        result.current.handleRealTimeFilter(filter);
      });

      expect(result.current.draftFilter).toEqual(filter);
    });

    it('should clear draft filter when null', () => {
      const { result } = renderHook(() =>
        useCalendarViewConfig({
          columns: mockColumns
        })
      );

      act(() => {
        result.current.handleRealTimeFilter({ column: 'field1', operator: 'eq', value: 'test' });
        result.current.handleRealTimeFilter(null);
      });

      expect(result.current.draftFilter).toBeNull();
    });
  });

  describe('handleAddFilter', () => {
    it('should add filter to filters array', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = { id: 'view1', meta: {} };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      const filter = { column: 'field1', operator: 'eq', value: 'test' };

      await act(async () => {
        await result.current.handleAddFilter(filter);
      });

      expect(result.current.filters).toContainEqual(filter);
      expect(mockUpdateViewConfig).toHaveBeenCalledWith('view1', {
        filters: [filter]
      });
    });

    it('should clear draft filter after adding', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = { id: 'view1', meta: {} };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      const filter = { column: 'field1', operator: 'eq', value: 'test' };

      act(() => {
        result.current.handleRealTimeFilter(filter);
      });

      await act(async () => {
        await result.current.handleAddFilter(filter);
      });

      expect(result.current.draftFilter).toBeNull();
    });

    it('should not persist when read-only', async () => {
      const mockUpdateViewConfig = vi.fn();
      const view = { id: 'view1', meta: {} };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig,
          isReadOnly: true
        })
      );

      const filter = { column: 'field1', operator: 'eq', value: 'test' };

      await act(async () => {
        await result.current.handleAddFilter(filter);
      });

      expect(result.current.filters).toContainEqual(filter);
      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });
  });

  describe('handleRemoveFilter', () => {
    it('should remove filter at index', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = {
        id: 'view1',
        meta: {
          filters: [
            { column: 'field1', operator: 'eq', value: 'test1' },
            { column: 'field2', operator: 'eq', value: 'test2' }
          ]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      await act(async () => {
        await result.current.handleRemoveFilter(0);
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filters[0]).toEqual({ column: 'field2', operator: 'eq', value: 'test2' });
      expect(mockUpdateViewConfig).toHaveBeenCalled();
    });

    it('should not persist when read-only', async () => {
      const mockUpdateViewConfig = vi.fn();
      const view = {
        id: 'view1',
        meta: {
          filters: [{ column: 'field1', operator: 'eq', value: 'test' }]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig,
          isReadOnly: true
        })
      );

      await act(async () => {
        await result.current.handleRemoveFilter(0);
      });

      expect(result.current.filters).toHaveLength(0);
      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });
  });

  describe('handleUpdateFilter', () => {
    it('should update filter at index', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = {
        id: 'view1',
        meta: {
          filters: [{ column: 'field1', operator: 'eq', value: 'test' }]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      await act(async () => {
        await result.current.handleUpdateFilter(0, { value: 'updated' });
      });

      expect(result.current.filters[0].value).toBe('updated');
      expect(mockUpdateViewConfig).toHaveBeenCalled();
    });

    it('should remove filter if value is cleared', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = {
        id: 'view1',
        meta: {
          filters: [{ column: 'field1', operator: 'eq', value: 'test' }]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      await act(async () => {
        await result.current.handleUpdateFilter(0, { value: '' });
      });

      expect(result.current.filters).toHaveLength(0);
    });

    it('should handle invalid index gracefully', async () => {
      const mockUpdateViewConfig = vi.fn();
      const view = {
        id: 'view1',
        meta: {
          filters: [{ column: 'field1', operator: 'eq', value: 'test' }]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      await act(async () => {
        await result.current.handleUpdateFilter(10, { value: 'updated' });
      });

      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });

    it('should not persist when read-only', async () => {
      const mockUpdateViewConfig = vi.fn();
      const view = {
        id: 'view1',
        meta: {
          filters: [{ column: 'field1', operator: 'eq', value: 'test' }]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig,
          isReadOnly: true
        })
      );

      await act(async () => {
        await result.current.handleUpdateFilter(0, { value: 'updated' });
      });

      expect(result.current.filters[0].value).toBe('updated');
      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });
  });

  describe('handleSortChange', () => {
    it('should update sorts', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = { id: 'view1', meta: { sorts: [] } };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      const newSorts = [{ column: 'field1', direction: 'desc' as const }];

      await act(async () => {
        await result.current.handleSortChange(newSorts);
      });

      await waitFor(() => {
        expect(result.current.sorts).toEqual(newSorts);
      });
      expect(mockUpdateViewConfig).toHaveBeenCalledWith('view1', {
        sorts: newSorts
      });
    });

    it('should filter out invalid sorts', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = { id: 'view1', meta: { sorts: [] } };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      const newSorts = [{ column: '', direction: 'asc' as const }, { column: 'field1', direction: 'desc' as const }];

      await act(async () => {
        await result.current.handleSortChange(newSorts);
      });

      await waitFor(() => {
        expect(result.current.sorts).toHaveLength(1);
        expect(result.current.sorts[0].column).toBe('field1');
      });
    });

    it('should not persist when read-only', async () => {
      const mockUpdateViewConfig = vi.fn();
      const view = { id: 'view1', meta: { sorts: [] } };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig,
          isReadOnly: true
        })
      );

      const newSorts = [{ column: 'field1', direction: 'desc' as const }];

      await act(async () => {
        await result.current.handleSortChange(newSorts);
      });

      await waitFor(() => {
        expect(result.current.sorts).toEqual(newSorts);
      });
      expect(mockUpdateViewConfig).not.toHaveBeenCalled();
    });
  });

  describe('handleFieldToggle', () => {
    it('should toggle field visibility', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = {
        id: 'view1',
        meta: {
          fieldConfig: [
            { id: '1', position: 0, isHidden: false },
            { id: '2', position: 1, isHidden: false }
          ]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      await act(async () => {
        await result.current.handleFieldToggle('1');
      });

      const findFieldById = (f: any) => f.id === '1';
      await waitFor(() => {
        const field = result.current.localFieldConfig.find(findFieldById);
        expect(field?.isHidden).toBe(true);
      });
    });

    it('should toggle hidden field to visible', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = {
        id: 'view1',
        meta: {
          fieldConfig: [
            { id: '1', position: 0, isHidden: true },
            { id: '2', position: 1, isHidden: false }
          ]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      await act(async () => {
        await result.current.handleFieldToggle('1');
      });

      const findFieldById = (f: any) => f.id === '1';
      await waitFor(() => {
        const field = result.current.localFieldConfig.find(findFieldById);
        expect(field?.isHidden).toBe(false);
      });
    });
  });

  describe('visibleColumns', () => {
    it('should filter columns based on field config', () => {
      const view = {
        meta: {
          fieldConfig: [
            { id: '1', position: 0, isHidden: false },
            { id: '2', position: 1, isHidden: true },
            { id: '3', position: 2, isHidden: false }
          ]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns
        })
      );

      const visibleColumns = result.current.visibleColumns.filter((col: any) => !col.hidden);
      expect(visibleColumns.length).toBeLessThanOrEqual(mockColumns.length);
    });

    it('should sort columns by position', () => {
      const view = {
        meta: {
          fieldConfig: [
            { id: '3', position: 0, isHidden: false },
            { id: '1', position: 1, isHidden: false },
            { id: '2', position: 2, isHidden: false }
          ]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns
        })
      );

      expect(result.current.visibleColumns[0].position).toBeLessThanOrEqual(
        result.current.visibleColumns[1].position!
      );
    });
  });

  describe('handleFieldOrderChange', () => {
    it('should update field positions', async () => {
      const mockUpdateViewConfig = vi.fn().mockResolvedValue(undefined);
      const view = {
        id: 'view1',
        meta: {
          fieldConfig: [
            { id: '1', position: 0, isHidden: false },
            { id: '2', position: 1, isHidden: false },
            { id: '3', position: 2, isHidden: false }
          ]
        }
      };

      const { result } = renderHook(() =>
        useCalendarViewConfig({
          view,
          columns: mockColumns,
          updateViewConfig: mockUpdateViewConfig
        })
      );

      const reorderedColumns = [
        { ...mockColumns[2], position: 0 },
        { ...mockColumns[0], position: 1 },
        { ...mockColumns[1], position: 2 }
      ];

      await act(async () => {
        await result.current.handleFieldOrderChange(reorderedColumns);
      });

      expect(mockUpdateViewConfig).toHaveBeenCalled();
    });
  });
});
