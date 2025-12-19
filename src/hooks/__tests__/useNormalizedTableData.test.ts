import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNormalizedTableData, fieldUtils } from '../useNormalizedTableData';
import * as useApi from '../useApi';

// Mock dependencies
vi.mock('../useApi');

describe('useNormalizedTableData', () => {
  const mockUseTable = vi.mocked(useApi.useTable);
  const mockUseViewById = vi.mocked(useApi.useViewById);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseTable.mockReturnValue({ 
      data: null, 
      isLoading: false, 
      error: null 
    } as any);
    mockUseViewById.mockReturnValue({ 
      data: null, 
      isLoading: false, 
      error: null 
    } as any);
  });

  describe('loading states', () => {
    it('should return loading true when table is loading', () => {
      mockUseTable.mockReturnValue({ 
        data: null, 
        isLoading: true, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.table).toBeNull();
    });

    it('should return loading true when view is loading', () => {
      mockUseTable.mockReturnValue({ 
        data: { data: { model: {}, columns: [], records: [], views: [] } }, 
        isLoading: false, 
        error: null 
      } as any);
      mockUseViewById.mockReturnValue({ 
        data: null, 
        isLoading: true, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1', 'view-1'));

      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading false when both queries complete', () => {
      mockUseTable.mockReturnValue({ 
        data: { data: { model: {}, columns: [], records: [], views: [] } }, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should expose non-auth errors', () => {
      const error = new Error('Network error');
      mockUseTable.mockReturnValue({ 
        data: null, 
        isLoading: false, 
        error 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.error).toBe('Network error');
    });

    it('should hide auth errors (401)', () => {
      const error = { message: 'Token expired', response: { status: 401 } };
      mockUseTable.mockReturnValue({ 
        data: null, 
        isLoading: false, 
        error 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.error).toBeNull();
    });

    it('should hide auth errors (403)', () => {
      const error = { message: 'Unauthorized', response: { status: 403 } };
      mockUseTable.mockReturnValue({ 
        data: null, 
        isLoading: false, 
        error 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.error).toBeNull();
    });

    it('should hide "Token expired" message errors', () => {
      const error = { message: 'Token expired' };
      mockUseTable.mockReturnValue({ 
        data: null, 
        isLoading: false, 
        error 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.error).toBeNull();
    });
  });

  describe('data normalization', () => {
    const mockTableData = {
      data: {
        model: {
          id: 'table-1',
          title: 'Test Table',
          description: 'A test table',
          alias: 'test_table',
          base_id: 'base-1',
          workspace_id: 'ws-1',
          meta: { color: 'blue' },
          created_at: '2024-01-01',
          updated_at: '2024-01-02'
        },
        columns: [
          {
            id: 'col-1',
            title: 'Name',
            column_name: 'name',
            uidt: 'text',
            description: 'Name field',
            meta: { width: 200 },
            required: true,
            system: false,
            virtual: false,
            order_index: 1
          },
          {
            id: 'col-2',
            title: 'Status',
            column_name: 'status',
            uidt: 'select',
            meta: { options: ['Active', 'Inactive'] },
            required: false,
            system: false,
            virtual: false,
            is_hidden: true,
            order_index: 2
          }
        ],
        records: [
          {
            id: 'rec-1',
            name: 'Record 1',
            status: 'Active',
            created_at: '2024-01-01',
            updated_at: '2024-01-02'
          }
        ],
        views: [
          {
            id: 'view-1',
            title: 'Grid View',
            description: 'Default grid',
            type: 'grid',
            alias: 'grid_view',
            config: { pageSize: 25 },
            meta: { color: 'red' },
            is_default: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-02'
          }
        ]
      }
    };

    it('should normalize table data', () => {
      mockUseTable.mockReturnValue({ 
        data: mockTableData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.table).toEqual({
        id: 'table-1',
        title: 'Test Table',
        description: 'A test table',
        alias: 'test_table',
        baseId: 'base-1',
        workspaceId: 'ws-1',
        meta: { color: 'blue' },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      });
    });

    it('should normalize fields', () => {
      mockUseTable.mockReturnValue({ 
        data: mockTableData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.fields).toHaveLength(2);
      expect(result.current.fields[0]).toMatchObject({
        id: 'col-1',
        name: 'Name',
        title: 'Name',
        columnName: 'name',
        type: 'text',
        description: 'Name field',
        required: true,
        system: false,
        virtual: false,
        hidden: false
      });
      expect(result.current.fields[1]).toMatchObject({
        id: 'col-2',
        hidden: true
      });
    });

    it('should normalize records', () => {
      mockUseTable.mockReturnValue({ 
        data: mockTableData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.records).toHaveLength(1);
      expect(result.current.records[0]).toMatchObject({
        id: 'rec-1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      });
      expect(result.current.records[0].data).toEqual({
        id: 'rec-1',
        name: 'Record 1',
        status: 'Active',
        created_at: '2024-01-01',
        updated_at: '2024-01-02'
      });
    });

    it('should normalize views', () => {
      mockUseTable.mockReturnValue({ 
        data: mockTableData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.views).toHaveLength(1);
      expect(result.current.views[0]).toEqual({
        id: 'view-1',
        title: 'Grid View',
        description: 'Default grid',
        type: 'grid',
        alias: 'grid_view',
        config: { pageSize: 25 },
        meta: { color: 'red' },
        isDefault: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02'
      });
    });

    it('should find current view by id', () => {
      mockUseTable.mockReturnValue({ 
        data: mockTableData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1', 'view-1'));

      expect(result.current.view).not.toBeNull();
      expect(result.current.view?.id).toBe('view-1');
    });

    it('should return null view when viewId not found', () => {
      mockUseTable.mockReturnValue({ 
        data: mockTableData, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1', 'view-999'));

      expect(result.current.view).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle missing table data', () => {
      mockUseTable.mockReturnValue({ 
        data: null, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.table).toBeNull();
      expect(result.current.fields).toEqual([]);
      expect(result.current.records).toEqual([]);
      expect(result.current.views).toEqual([]);
    });

    it('should handle empty arrays', () => {
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
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.fields).toEqual([]);
      expect(result.current.records).toEqual([]);
      expect(result.current.views).toEqual([]);
    });

    it('should handle missing optional fields', () => {
      mockUseTable.mockReturnValue({ 
        data: { 
          data: { 
            model: { 
              id: 'table-1', 
              title: 'Test',
              alias: 'test',
              base_id: 'base-1',
              workspace_id: 'ws-1',
              created_at: '2024-01-01',
              updated_at: '2024-01-01'
            }, 
            columns: [], 
            records: [], 
            views: [] 
          } 
        }, 
        isLoading: false, 
        error: null 
      } as any);

      const { result } = renderHook(() => useNormalizedTableData('table-1'));

      expect(result.current.table?.description).toBe('');
      expect(result.current.table?.meta).toEqual({});
    });
  });
});

describe('fieldUtils', () => {
  describe('getFieldType', () => {
    it('should return type from type property', () => {
      expect(fieldUtils.getFieldType({ type: 'text' })).toBe('text');
    });

    it('should return type from uidt property', () => {
      expect(fieldUtils.getFieldType({ uidt: 'number' })).toBe('number');
    });

    it('should return type from dt property', () => {
      expect(fieldUtils.getFieldType({ dt: 'date' })).toBe('date');
    });

    it('should default to text', () => {
      expect(fieldUtils.getFieldType({})).toBe('text');
    });
  });

  describe('getFieldConfig', () => {
    it('should return config property', () => {
      const config = { width: 200 };
      expect(fieldUtils.getFieldConfig({ config })).toBe(config);
    });

    it('should fallback to meta', () => {
      const meta = { width: 200 };
      expect(fieldUtils.getFieldConfig({ meta })).toBe(meta);
    });

    it('should return empty object if neither exists', () => {
      expect(fieldUtils.getFieldConfig({})).toEqual({});
    });
  });

  describe('getFieldOptions', () => {
    it('should return options from config', () => {
      const options = ['A', 'B', 'C'];
      expect(fieldUtils.getFieldOptions({ config: { options } })).toEqual(options);
    });

    it('should return empty array if no options', () => {
      expect(fieldUtils.getFieldOptions({})).toEqual([]);
    });
  });

  describe('boolean flags', () => {
    it('should check required flag', () => {
      expect(fieldUtils.isFieldRequired({ required: true })).toBe(true);
      expect(fieldUtils.isFieldRequired({ required: false })).toBe(false);
      expect(fieldUtils.isFieldRequired({})).toBe(false);
    });

    it('should check system flag', () => {
      expect(fieldUtils.isFieldSystem({ system: true })).toBe(true);
      expect(fieldUtils.isFieldSystem({ system: false })).toBe(false);
    });

    it('should check hidden flag from multiple properties', () => {
      expect(fieldUtils.isFieldHidden({ hidden: true })).toBe(true);
      expect(fieldUtils.isFieldHidden({ is_hidden: true })).toBe(true);
      expect(fieldUtils.isFieldHidden({ deleted: true })).toBe(true);
      expect(fieldUtils.isFieldHidden({})).toBe(false);
    });
  });

  describe('getFieldName', () => {
    it('should return name property', () => {
      expect(fieldUtils.getFieldName({ name: 'Name' })).toBe('Name');
    });

    it('should fallback to title', () => {
      expect(fieldUtils.getFieldName({ title: 'Title' })).toBe('Title');
    });

    it('should fallback to column_name', () => {
      expect(fieldUtils.getFieldName({ column_name: 'column' })).toBe('column');
    });

    it('should default to Untitled', () => {
      expect(fieldUtils.getFieldName({})).toBe('Untitled');
    });
  });
});
