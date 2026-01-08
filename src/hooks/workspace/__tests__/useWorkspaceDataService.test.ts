/**
 * Comprehensive Unit Tests for useWorkspaceDataService.ts
 *
 * This test suite covers all queries and mutations exposed by the data service:
 * - Query initialization with correct parameters
 * - Loading and error state derivation
 * - Mutation exposure
 * - Parameter handling (empty strings for undefined IDs)
 *
 * Testing patterns:
 * - AAA (Arrange-Act-Assert)
 * - Isolated tests with mocked dependencies
 * - State verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useWorkspaceDataService } from '../useWorkspaceDataService';

// ============================================================================
// Mock Setup
// ============================================================================

// Type for mock query objects
interface MockQuery {
  data: any;
  isLoading: boolean;
  error: Error | null;
  refetch: ReturnType<typeof vi.fn>;
}

// Mock all useApi hooks
const mockWorkspacesQuery: MockQuery = {
  data: null as any,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const mockWorkspaceByIdQuery: MockQuery = {
  data: null as any,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const mockWorkspaceBasesQuery: MockQuery = {
  data: null as any,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const mockBaseByIdQuery: MockQuery = {
  data: null as any,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const mockBaseTablesQuery: MockQuery = {
  data: null as any,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const mockTableByIdQuery: MockQuery = {
  data: null as any,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const mockTableViewsQuery: MockQuery = {
  data: null as any,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const mockViewByIdQuery: MockQuery = {
  data: null as any,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

// Mutation mocks
const createMockMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
  isSuccess: false,
  data: null as any,
  reset: vi.fn(),
});

const mockCreateWorkspaceMutation = createMockMutation();
const mockUpdateWorkspaceMutation = createMockMutation();
const mockDeleteWorkspaceMutation = createMockMutation();
const mockCreateBaseMutation = createMockMutation();
const mockDeleteBaseMutation = createMockMutation();
const mockCreateTableMutation = createMockMutation();
const mockUpdateTableMutation = createMockMutation();
const mockDeleteTableMutation = createMockMutation();
const mockCreateFieldMutation = createMockMutation();
const mockUpdateFieldMutation = createMockMutation();
const mockDeleteFieldMutation = createMockMutation();
const mockCreateViewMutation = createMockMutation();
const mockUpdateViewMutation = createMockMutation();
const mockDeleteViewMutation = createMockMutation();
const mockAddRowMutation = createMockMutation();
const mockInsertRowDataMutation = createMockMutation();
const mockDeleteRecordMutation = createMockMutation();

// Track calls to hooks with parameters
const useWorkspaceByIdSpy = vi.fn((_id: string) => mockWorkspaceByIdQuery);
const useWorkspaceBasesSpy = vi.fn((_id: string) => mockWorkspaceBasesQuery);
const useBaseByIdSpy = vi.fn((_id: string) => mockBaseByIdQuery);
const useBaseTablesSpy = vi.fn((_id: string) => mockBaseTablesQuery);
const useTableSpy = vi.fn((_id: string) => mockTableByIdQuery);
const useTableViewsSpy = vi.fn((_id: string) => mockTableViewsQuery);
const useViewByIdSpy = vi.fn((_id: string) => mockViewByIdQuery);

vi.mock('../../useApi', () => ({
  useWorkspaces: () => mockWorkspacesQuery,
  useWorkspaceById: (id: string) => useWorkspaceByIdSpy(id),
  useWorkspaceBases: (id: string) => useWorkspaceBasesSpy(id),
  useBaseById: (id: string) => useBaseByIdSpy(id),
  useBaseTables: (id: string) => useBaseTablesSpy(id),
  useTable: (id: string) => useTableSpy(id),
  useTableViews: (id: string) => useTableViewsSpy(id),
  useViewById: (id: string) => useViewByIdSpy(id),
  useCreateWorkspace: () => mockCreateWorkspaceMutation,
  useUpdateWorkspace: () => mockUpdateWorkspaceMutation,
  useDeleteWorkspace: () => mockDeleteWorkspaceMutation,
  useCreateBase: () => mockCreateBaseMutation,
  useDeleteBase: () => mockDeleteBaseMutation,
  useCreateTable: () => mockCreateTableMutation,
  useUpdateTable: () => mockUpdateTableMutation,
  useDeleteTable: () => mockDeleteTableMutation,
  useCreateField: () => mockCreateFieldMutation,
  useUpdateField: () => mockUpdateFieldMutation,
  useDeleteColumn: () => mockDeleteFieldMutation,
  useCreateView: () => mockCreateViewMutation,
  useUpdateView: () => mockUpdateViewMutation,
  useDeleteView: () => mockDeleteViewMutation,
  useAddRow: () => mockAddRowMutation,
  useInsertRowData: () => mockInsertRowDataMutation,
  useDeleteRecord: () => mockDeleteRecordMutation,
}));

// ============================================================================
// Test Utilities
// ============================================================================

const resetAllMocks = () => {
  // Reset query states
  mockWorkspacesQuery.data = null;
  mockWorkspacesQuery.isLoading = false;
  mockWorkspacesQuery.error = null;

  mockWorkspaceByIdQuery.data = null;
  mockWorkspaceByIdQuery.isLoading = false;
  mockWorkspaceByIdQuery.error = null;

  mockWorkspaceBasesQuery.data = null;
  mockWorkspaceBasesQuery.isLoading = false;
  mockWorkspaceBasesQuery.error = null;

  mockBaseByIdQuery.data = null;
  mockBaseByIdQuery.isLoading = false;
  mockBaseByIdQuery.error = null;

  mockBaseTablesQuery.data = null;
  mockBaseTablesQuery.isLoading = false;
  mockBaseTablesQuery.error = null;

  mockTableByIdQuery.data = null;
  mockTableByIdQuery.isLoading = false;
  mockTableByIdQuery.error = null;

  mockTableViewsQuery.data = null;
  mockTableViewsQuery.isLoading = false;
  mockTableViewsQuery.error = null;

  mockViewByIdQuery.data = null;
  mockViewByIdQuery.isLoading = false;
  mockViewByIdQuery.error = null;

  // Clear spy calls
  vi.clearAllMocks();
};

beforeEach(() => {
  resetAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// QUERY EXPOSURE TESTS
// ============================================================================

describe('Query Exposure', () => {
  it('should expose all query objects', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesQuery).toBeDefined();
    expect(result.current.workspaceByIdQuery).toBeDefined();
    expect(result.current.workspaceBasesQuery).toBeDefined();
    expect(result.current.baseByIdQuery).toBeDefined();
    expect(result.current.baseTablesQuery).toBeDefined();
    expect(result.current.tableByIdQuery).toBeDefined();
    expect(result.current.tableViewsQuery).toBeDefined();
    expect(result.current.viewByIdQuery).toBeDefined();
  });

  it('should return workspaces query data', () => {
    const workspacesData = [{ id: 'ws-1', title: 'Workspace 1' }];
    mockWorkspacesQuery.data = workspacesData;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesQuery.data).toEqual(workspacesData);
  });

  it('should return workspace by id query data', () => {
    const workspaceData = { data: { id: 'ws-1', title: 'Test Workspace' } };
    mockWorkspaceByIdQuery.data = workspaceData;

    const { result } = renderHook(() => useWorkspaceDataService('ws-1'));

    expect(result.current.workspaceByIdQuery.data).toEqual(workspaceData);
  });

  it('should return workspace bases query data', () => {
    const basesData = { data: [{ id: 'base-1', title: 'Base 1' }] };
    mockWorkspaceBasesQuery.data = basesData;

    const { result } = renderHook(() => useWorkspaceDataService('ws-1'));

    expect(result.current.workspaceBasesQuery.data).toEqual(basesData);
  });

  it('should return base by id query data', () => {
    const baseData = { data: { id: 'base-1', title: 'Test Base' } };
    mockBaseByIdQuery.data = baseData;

    const { result } = renderHook(() => useWorkspaceDataService(undefined, 'base-1'));

    expect(result.current.baseByIdQuery.data).toEqual(baseData);
  });

  it('should return base tables query data', () => {
    const tablesData = { data: [{ model: { id: 'table-1' } }] };
    mockBaseTablesQuery.data = tablesData;

    const { result } = renderHook(() => useWorkspaceDataService(undefined, 'base-1'));

    expect(result.current.baseTablesQuery.data).toEqual(tablesData);
  });

  it('should return table by id query data', () => {
    const tableData = { data: { id: 'table-1', title: 'Test Table' } };
    mockTableByIdQuery.data = tableData;

    const { result } = renderHook(() => useWorkspaceDataService(undefined, undefined, 'table-1'));

    expect(result.current.tableByIdQuery.data).toEqual(tableData);
  });

  it('should return table views query data', () => {
    const viewsData = [{ id: 'view-1', title: 'View 1' }];
    mockTableViewsQuery.data = viewsData;

    const { result } = renderHook(() => useWorkspaceDataService(undefined, undefined, 'table-1'));

    expect(result.current.tableViewsQuery.data).toEqual(viewsData);
  });

  it('should return view by id query data', () => {
    const viewData = { id: 'view-1', title: 'Test View' };
    mockViewByIdQuery.data = viewData;

    const { result } = renderHook(() => useWorkspaceDataService(undefined, undefined, undefined, 'view-1'));

    expect(result.current.viewByIdQuery.data).toEqual(viewData);
  });
});

// ============================================================================
// PARAMETER HANDLING TESTS
// ============================================================================

describe('Parameter Handling', () => {
  it('should pass empty string when workspaceId is undefined', () => {
    renderHook(() => useWorkspaceDataService());

    expect(useWorkspaceByIdSpy).toHaveBeenCalledWith('');
    expect(useWorkspaceBasesSpy).toHaveBeenCalledWith('');
  });

  it('should pass workspaceId to workspace queries', () => {
    renderHook(() => useWorkspaceDataService('ws-123'));

    expect(useWorkspaceByIdSpy).toHaveBeenCalledWith('ws-123');
    expect(useWorkspaceBasesSpy).toHaveBeenCalledWith('ws-123');
  });

  it('should pass empty string when baseId is undefined', () => {
    renderHook(() => useWorkspaceDataService());

    expect(useBaseByIdSpy).toHaveBeenCalledWith('');
    expect(useBaseTablesSpy).toHaveBeenCalledWith('');
  });

  it('should pass baseId to base queries', () => {
    renderHook(() => useWorkspaceDataService(undefined, 'base-456'));

    expect(useBaseByIdSpy).toHaveBeenCalledWith('base-456');
    expect(useBaseTablesSpy).toHaveBeenCalledWith('base-456');
  });

  it('should pass empty string when tableId is undefined', () => {
    renderHook(() => useWorkspaceDataService());

    expect(useTableSpy).toHaveBeenCalledWith('');
    expect(useTableViewsSpy).toHaveBeenCalledWith('');
  });

  it('should pass tableId to table queries', () => {
    renderHook(() => useWorkspaceDataService(undefined, undefined, 'table-789'));

    expect(useTableSpy).toHaveBeenCalledWith('table-789');
    expect(useTableViewsSpy).toHaveBeenCalledWith('table-789');
  });

  it('should pass empty string when viewId is undefined', () => {
    renderHook(() => useWorkspaceDataService());

    expect(useViewByIdSpy).toHaveBeenCalledWith('');
  });

  it('should pass viewId to view query', () => {
    renderHook(() => useWorkspaceDataService(undefined, undefined, undefined, 'view-101'));

    expect(useViewByIdSpy).toHaveBeenCalledWith('view-101');
  });

  it('should pass all IDs when all provided', () => {
    renderHook(() => useWorkspaceDataService('ws-1', 'base-2', 'table-3', 'view-4'));

    expect(useWorkspaceByIdSpy).toHaveBeenCalledWith('ws-1');
    expect(useWorkspaceBasesSpy).toHaveBeenCalledWith('ws-1');
    expect(useBaseByIdSpy).toHaveBeenCalledWith('base-2');
    expect(useBaseTablesSpy).toHaveBeenCalledWith('base-2');
    expect(useTableSpy).toHaveBeenCalledWith('table-3');
    expect(useTableViewsSpy).toHaveBeenCalledWith('table-3');
    expect(useViewByIdSpy).toHaveBeenCalledWith('view-4');
  });
});

// ============================================================================
// LOADING STATE TESTS
// ============================================================================

describe('Loading States', () => {
  it('should expose workspacesLoading from workspacesQuery.isLoading', () => {
    mockWorkspacesQuery.isLoading = true;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesLoading).toBe(true);
  });

  it('should expose basesLoading from workspaceBasesQuery.isLoading', () => {
    mockWorkspaceBasesQuery.isLoading = true;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.basesLoading).toBe(true);
  });

  it('should expose tablesLoading from baseTablesQuery.isLoading', () => {
    mockBaseTablesQuery.isLoading = true;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.tablesLoading).toBe(true);
  });

  it('should expose viewsLoading from tableViewsQuery.isLoading', () => {
    mockTableViewsQuery.isLoading = true;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.viewsLoading).toBe(true);
  });

  it('should return false for all loading states when not loading', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesLoading).toBe(false);
    expect(result.current.basesLoading).toBe(false);
    expect(result.current.tablesLoading).toBe(false);
    expect(result.current.viewsLoading).toBe(false);
  });

  it('should return multiple loading states correctly', () => {
    mockWorkspacesQuery.isLoading = true;
    mockBaseTablesQuery.isLoading = true;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesLoading).toBe(true);
    expect(result.current.basesLoading).toBe(false);
    expect(result.current.tablesLoading).toBe(true);
    expect(result.current.viewsLoading).toBe(false);
  });
});

// ============================================================================
// ERROR STATE TESTS
// ============================================================================

describe('Error States', () => {
  it('should expose workspacesError from workspacesQuery.error', () => {
    const error = new Error('Failed to fetch workspaces');
    mockWorkspacesQuery.error = error;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesError).toBe(error);
  });

  it('should expose basesError from workspaceBasesQuery.error', () => {
    const error = new Error('Failed to fetch bases');
    mockWorkspaceBasesQuery.error = error;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.basesError).toBe(error);
  });

  it('should expose tablesError from baseTablesQuery.error', () => {
    const error = new Error('Failed to fetch tables');
    mockBaseTablesQuery.error = error;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.tablesError).toBe(error);
  });

  it('should expose viewsError from tableViewsQuery.error', () => {
    const error = new Error('Failed to fetch views');
    mockTableViewsQuery.error = error;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.viewsError).toBe(error);
  });

  it('should return null for all error states when no errors', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesError).toBeNull();
    expect(result.current.basesError).toBeNull();
    expect(result.current.tablesError).toBeNull();
    expect(result.current.viewsError).toBeNull();
  });

  it('should return multiple error states correctly', () => {
    const wsError = new Error('Workspace error');
    const tableError = new Error('Table error');
    mockWorkspacesQuery.error = wsError;
    mockBaseTablesQuery.error = tableError;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesError).toBe(wsError);
    expect(result.current.basesError).toBeNull();
    expect(result.current.tablesError).toBe(tableError);
    expect(result.current.viewsError).toBeNull();
  });
});

// ============================================================================
// MUTATION EXPOSURE TESTS
// ============================================================================

describe('Mutation Exposure', () => {
  it('should expose workspace mutations', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.createWorkspaceMutation).toBeDefined();
    expect(result.current.updateWorkspaceMutation).toBeDefined();
    expect(result.current.deleteWorkspaceMutation).toBeDefined();
  });

  it('should expose base mutations', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.createBaseMutation).toBeDefined();
    expect(result.current.deleteBaseMutation).toBeDefined();
  });

  it('should expose table mutations', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.createTableMutation).toBeDefined();
    expect(result.current.updateTableMutation).toBeDefined();
    expect(result.current.deleteTableMutation).toBeDefined();
  });

  it('should expose field mutations', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.createFieldMutation).toBeDefined();
    expect(result.current.updateFieldMutation).toBeDefined();
    expect(result.current.deleteFieldMutation).toBeDefined();
  });

  it('should expose view mutations', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.createViewMutation).toBeDefined();
    expect(result.current.updateViewMutation).toBeDefined();
    expect(result.current.deleteViewMutation).toBeDefined();
  });

  it('should expose row/record mutations', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.addRowMutation).toBeDefined();
    expect(result.current.insertRowDataMutation).toBeDefined();
    expect(result.current.deleteRecordMutation).toBeDefined();
  });

  it('should return the same mutation objects on each render', () => {
    const { result, rerender } = renderHook(() => useWorkspaceDataService());

    const initialCreateWorkspace = result.current.createWorkspaceMutation;
    const initialCreateBase = result.current.createBaseMutation;

    rerender();

    expect(result.current.createWorkspaceMutation).toBe(initialCreateWorkspace);
    expect(result.current.createBaseMutation).toBe(initialCreateBase);
  });
});

// ============================================================================
// MUTATION INTERFACE TESTS
// ============================================================================

describe('Mutation Interface', () => {
  it('should expose mutate function on createWorkspaceMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.createWorkspaceMutation.mutate).toBe('function');
    expect(typeof result.current.createWorkspaceMutation.mutateAsync).toBe('function');
  });

  it('should expose mutate function on createBaseMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.createBaseMutation.mutate).toBe('function');
    expect(typeof result.current.createBaseMutation.mutateAsync).toBe('function');
  });

  it('should expose mutate function on createTableMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.createTableMutation.mutate).toBe('function');
    expect(typeof result.current.createTableMutation.mutateAsync).toBe('function');
  });

  it('should expose mutate function on updateTableMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.updateTableMutation.mutate).toBe('function');
    expect(typeof result.current.updateTableMutation.mutateAsync).toBe('function');
  });

  it('should expose mutate function on deleteTableMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.deleteTableMutation.mutate).toBe('function');
    expect(typeof result.current.deleteTableMutation.mutateAsync).toBe('function');
  });

  it('should expose mutate function on createViewMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.createViewMutation.mutate).toBe('function');
    expect(typeof result.current.createViewMutation.mutateAsync).toBe('function');
  });

  it('should expose mutate function on deleteViewMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.deleteViewMutation.mutate).toBe('function');
    expect(typeof result.current.deleteViewMutation.mutateAsync).toBe('function');
  });

  it('should expose mutate function on addRowMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.addRowMutation.mutate).toBe('function');
    expect(typeof result.current.addRowMutation.mutateAsync).toBe('function');
  });

  it('should expose mutate function on deleteRecordMutation', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.deleteRecordMutation.mutate).toBe('function');
    expect(typeof result.current.deleteRecordMutation.mutateAsync).toBe('function');
  });
});

// ============================================================================
// QUERY REFETCH TESTS
// ============================================================================

describe('Query Refetch', () => {
  it('should expose refetch on workspacesQuery', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    expect(typeof result.current.workspacesQuery.refetch).toBe('function');
  });

  it('should expose refetch on workspaceByIdQuery', () => {
    const { result } = renderHook(() => useWorkspaceDataService('ws-1'));

    expect(typeof result.current.workspaceByIdQuery.refetch).toBe('function');
  });

  it('should expose refetch on workspaceBasesQuery', () => {
    const { result } = renderHook(() => useWorkspaceDataService('ws-1'));

    expect(typeof result.current.workspaceBasesQuery.refetch).toBe('function');
  });

  it('should expose refetch on baseByIdQuery', () => {
    const { result } = renderHook(() => useWorkspaceDataService(undefined, 'base-1'));

    expect(typeof result.current.baseByIdQuery.refetch).toBe('function');
  });

  it('should expose refetch on baseTablesQuery', () => {
    const { result } = renderHook(() => useWorkspaceDataService(undefined, 'base-1'));

    expect(typeof result.current.baseTablesQuery.refetch).toBe('function');
  });

  it('should expose refetch on tableByIdQuery', () => {
    const { result } = renderHook(() => useWorkspaceDataService(undefined, undefined, 'table-1'));

    expect(typeof result.current.tableByIdQuery.refetch).toBe('function');
  });

  it('should expose refetch on tableViewsQuery', () => {
    const { result } = renderHook(() => useWorkspaceDataService(undefined, undefined, 'table-1'));

    expect(typeof result.current.tableViewsQuery.refetch).toBe('function');
  });

  it('should expose refetch on viewByIdQuery', () => {
    const { result } = renderHook(() => useWorkspaceDataService(undefined, undefined, undefined, 'view-1'));

    expect(typeof result.current.viewByIdQuery.refetch).toBe('function');
  });
});

// ============================================================================
// COMBINED STATES TESTS
// ============================================================================

describe('Combined States', () => {
  it('should handle loading and error states simultaneously', () => {
    mockWorkspacesQuery.isLoading = true;
    mockBaseTablesQuery.error = new Error('Table error');

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesLoading).toBe(true);
    expect(result.current.tablesError).toEqual(new Error('Table error'));
  });

  it('should handle all queries with data simultaneously', () => {
    mockWorkspacesQuery.data = [{ id: 'ws-1' }];
    mockWorkspaceBasesQuery.data = { data: [{ id: 'base-1' }] };
    mockBaseTablesQuery.data = { data: [{ model: { id: 'table-1' } }] };
    mockTableViewsQuery.data = [{ id: 'view-1' }];

    const { result } = renderHook(() => useWorkspaceDataService('ws-1', 'base-1', 'table-1'));

    expect(result.current.workspacesQuery.data).toEqual([{ id: 'ws-1' }]);
    expect(result.current.workspaceBasesQuery.data).toEqual({ data: [{ id: 'base-1' }] });
    expect(result.current.baseTablesQuery.data).toEqual({ data: [{ model: { id: 'table-1' } }] });
    expect(result.current.tableViewsQuery.data).toEqual([{ id: 'view-1' }]);
  });

  it('should transition from loading to data state', () => {
    mockWorkspacesQuery.isLoading = true;

    const { result, rerender } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesLoading).toBe(true);
    expect(result.current.workspacesQuery.data).toBeNull();

    // Simulate data loaded
    mockWorkspacesQuery.isLoading = false;
    mockWorkspacesQuery.data = [{ id: 'ws-1' }];

    rerender();

    expect(result.current.workspacesLoading).toBe(false);
    expect(result.current.workspacesQuery.data).toEqual([{ id: 'ws-1' }]);
  });

  it('should transition from loading to error state', () => {
    mockWorkspacesQuery.isLoading = true;

    const { result, rerender } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesLoading).toBe(true);
    expect(result.current.workspacesError).toBeNull();

    // Simulate error
    mockWorkspacesQuery.isLoading = false;
    mockWorkspacesQuery.error = new Error('Network error');

    rerender();

    expect(result.current.workspacesLoading).toBe(false);
    expect(result.current.workspacesError).toEqual(new Error('Network error'));
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle empty string IDs same as undefined', () => {
    renderHook(() => useWorkspaceDataService('', '', '', ''));

    expect(useWorkspaceByIdSpy).toHaveBeenCalledWith('');
    expect(useWorkspaceBasesSpy).toHaveBeenCalledWith('');
    expect(useBaseByIdSpy).toHaveBeenCalledWith('');
    expect(useBaseTablesSpy).toHaveBeenCalledWith('');
    expect(useTableSpy).toHaveBeenCalledWith('');
    expect(useTableViewsSpy).toHaveBeenCalledWith('');
    expect(useViewByIdSpy).toHaveBeenCalledWith('');
  });

  it('should handle parameter changes correctly', () => {
    const { rerender } = renderHook(
      ({ wsId, baseId }) => useWorkspaceDataService(wsId, baseId),
      { initialProps: { wsId: 'ws-1', baseId: 'base-1' } }
    );

    expect(useWorkspaceByIdSpy).toHaveBeenLastCalledWith('ws-1');
    expect(useBaseByIdSpy).toHaveBeenLastCalledWith('base-1');

    rerender({ wsId: 'ws-2', baseId: 'base-2' });

    expect(useWorkspaceByIdSpy).toHaveBeenLastCalledWith('ws-2');
    expect(useBaseByIdSpy).toHaveBeenLastCalledWith('base-2');
  });

  it('should handle null data gracefully', () => {
    mockWorkspacesQuery.data = null;
    mockWorkspaceBasesQuery.data = null;
    mockBaseTablesQuery.data = null;
    mockTableViewsQuery.data = null;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesQuery.data).toBeNull();
    expect(result.current.workspaceBasesQuery.data).toBeNull();
    expect(result.current.baseTablesQuery.data).toBeNull();
    expect(result.current.tableViewsQuery.data).toBeNull();
  });

  it('should handle undefined data gracefully', () => {
    mockWorkspacesQuery.data = undefined;

    const { result } = renderHook(() => useWorkspaceDataService());

    expect(result.current.workspacesQuery.data).toBeUndefined();
  });
});

// ============================================================================
// RETURN VALUE COMPLETENESS
// ============================================================================

describe('Return Value Completeness', () => {
  it('should return all expected properties', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    // Queries
    expect(result.current).toHaveProperty('workspacesQuery');
    expect(result.current).toHaveProperty('workspaceByIdQuery');
    expect(result.current).toHaveProperty('workspaceBasesQuery');
    expect(result.current).toHaveProperty('baseByIdQuery');
    expect(result.current).toHaveProperty('baseTablesQuery');
    expect(result.current).toHaveProperty('tableByIdQuery');
    expect(result.current).toHaveProperty('tableViewsQuery');
    expect(result.current).toHaveProperty('viewByIdQuery');

    // Loading states
    expect(result.current).toHaveProperty('workspacesLoading');
    expect(result.current).toHaveProperty('basesLoading');
    expect(result.current).toHaveProperty('tablesLoading');
    expect(result.current).toHaveProperty('viewsLoading');

    // Error states
    expect(result.current).toHaveProperty('workspacesError');
    expect(result.current).toHaveProperty('basesError');
    expect(result.current).toHaveProperty('tablesError');
    expect(result.current).toHaveProperty('viewsError');

    // Workspace mutations
    expect(result.current).toHaveProperty('createWorkspaceMutation');
    expect(result.current).toHaveProperty('updateWorkspaceMutation');
    expect(result.current).toHaveProperty('deleteWorkspaceMutation');

    // Base mutations
    expect(result.current).toHaveProperty('createBaseMutation');
    expect(result.current).toHaveProperty('deleteBaseMutation');

    // Table mutations
    expect(result.current).toHaveProperty('createTableMutation');
    expect(result.current).toHaveProperty('updateTableMutation');
    expect(result.current).toHaveProperty('deleteTableMutation');

    // Field mutations
    expect(result.current).toHaveProperty('createFieldMutation');
    expect(result.current).toHaveProperty('updateFieldMutation');
    expect(result.current).toHaveProperty('deleteFieldMutation');

    // View mutations
    expect(result.current).toHaveProperty('createViewMutation');
    expect(result.current).toHaveProperty('updateViewMutation');
    expect(result.current).toHaveProperty('deleteViewMutation');

    // Row/Record mutations
    expect(result.current).toHaveProperty('addRowMutation');
    expect(result.current).toHaveProperty('insertRowDataMutation');
    expect(result.current).toHaveProperty('deleteRecordMutation');
  });

  it('should return exactly 33 properties', () => {
    const { result } = renderHook(() => useWorkspaceDataService());

    const keys = Object.keys(result.current);
    expect(keys.length).toBe(33);
  });
});
