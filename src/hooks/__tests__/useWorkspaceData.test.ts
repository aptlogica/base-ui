import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkspaceData } from '../useWorkspaceData';
import * as useApi from '../useApi';
import * as clientService from '../../service/clientService';

// Mock dependencies
vi.mock('../useApi', () => ({
  useWorkspaces: vi.fn(),
  useWorkspaceBases: vi.fn(),
  useBaseTables: vi.fn(),
  useCreateWorkspace: vi.fn(),
  useCreateBase: vi.fn(),
  useCreateTable: vi.fn(),
  useCreateView: vi.fn(),
  useUpdateTable: vi.fn(),
}));
vi.mock('../../service/clientService', () => ({
  isTenantSchemaAvailable: vi.fn(),
}));

describe('useWorkspaceData', () => {
  const mockUseWorkspaces = vi.mocked(useApi.useWorkspaces);
  const mockUseWorkspaceBases = vi.mocked(useApi.useWorkspaceBases);
  const mockUseBaseTables = vi.mocked(useApi.useBaseTables);
  const mockUseCreateWorkspace = vi.mocked(useApi.useCreateWorkspace);
  const mockUseCreateBase = vi.mocked(useApi.useCreateBase);
  const mockUseCreateTable = vi.mocked(useApi.useCreateTable);
  const mockUseCreateView = vi.mocked(useApi.useCreateView);
  const mockUseUpdateTable = vi.mocked(useApi.useUpdateTable);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock values
    mockUseWorkspaces.mockReturnValue({ data: [], isLoading: false, error: null } as any);
    mockUseWorkspaceBases.mockReturnValue({ data: [], isLoading: false, error: null } as any);
    mockUseBaseTables.mockReturnValue({ data: [], isLoading: false, error: null } as any);
    mockUseCreateWorkspace.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn() } as any);
    mockUseCreateBase.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn() } as any);
    mockUseCreateTable.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn() } as any);
    mockUseCreateView.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn() } as any);
    mockUseUpdateTable.mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn() } as any);
  });

  describe('data queries', () => {
    it('should return workspaces data', () => {
      const workspacesData = [
        { id: 'ws-1', name: 'Workspace 1' },
        { id: 'ws-2', name: 'Workspace 2' }
      ];
      mockUseWorkspaces.mockReturnValue({ data: workspacesData, isLoading: false, error: null } as any);

      const { result } = renderHook(() => useWorkspaceData());

      expect(result.current.workspaces).toEqual(workspacesData);
    });

    it('should return workspace bases data', () => {
      const basesData = [
        { id: 'base-1', name: 'Base 1' },
        { id: 'base-2', name: 'Base 2' }
      ];
      mockUseWorkspaceBases.mockReturnValue({ data: basesData, isLoading: false, error: null } as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1'));

      expect(result.current.workspaceBases).toEqual(basesData);
    });

    it('should return base tables data', () => {
      const tablesData = [
        { id: 'table-1', name: 'Table 1' },
        { id: 'table-2', name: 'Table 2' }
      ];
      mockUseBaseTables.mockReturnValue({ data: tablesData, isLoading: false, error: null } as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1', 'base-1'));

      expect(result.current.baseTables).toEqual(tablesData);
    });

    it('should pass empty string when workspaceId is undefined', () => {
      renderHook(() => useWorkspaceData());

      expect(mockUseWorkspaceBases).toHaveBeenCalledWith('');
    });

    it('should pass empty string when baseId is undefined', () => {
      renderHook(() => useWorkspaceData('ws-1'));

      expect(mockUseBaseTables).toHaveBeenCalledWith('');
    });
  });

  describe('loading state', () => {
    it('should return loading true when workspaces query is loading', () => {
      mockUseWorkspaces.mockReturnValue({ data: [], isLoading: true, error: null } as any);

      const { result } = renderHook(() => useWorkspaceData());

      expect(result.current.loading).toBe(true);
    });

    it('should return loading true when workspace bases query is loading', () => {
      mockUseWorkspaceBases.mockReturnValue({ data: [], isLoading: true, error: null } as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1'));

      expect(result.current.loading).toBe(true);
    });

    it('should return loading true when base tables query is loading', () => {
      mockUseBaseTables.mockReturnValue({ data: [], isLoading: true, error: null } as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1', 'base-1'));

      expect(result.current.loading).toBe(true);
    });

    it('should return loading false when all queries complete', () => {
      mockUseWorkspaces.mockReturnValue({ data: [], isLoading: false, error: null } as any);
      mockUseWorkspaceBases.mockReturnValue({ data: [], isLoading: false, error: null } as any);
      mockUseBaseTables.mockReturnValue({ data: [], isLoading: false, error: null } as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1', 'base-1'));

      expect(result.current.loading).toBe(false);
    });
  });

  describe('error state', () => {
    it('should return error from workspaces query', () => {
      const error = new Error('Workspaces error');
      mockUseWorkspaces.mockReturnValue({ data: [], isLoading: false, error } as any);

      const { result } = renderHook(() => useWorkspaceData());

      expect(result.current.error).toBe(error);
    });

    it('should return error from workspace bases query', () => {
      const error = new Error('Bases error');
      mockUseWorkspaceBases.mockReturnValue({ data: [], isLoading: false, error } as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1'));

      expect(result.current.error).toBe(error);
    });

    it('should return error from base tables query', () => {
      const error = new Error('Tables error');
      mockUseBaseTables.mockReturnValue({ data: [], isLoading: false, error } as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1', 'base-1'));

      expect(result.current.error).toBe(error);
    });

    it('should return null when no errors', () => {
      const { result } = renderHook(() => useWorkspaceData());

      expect(result.current.error).toBeNull();
    });

    it('should return first error when multiple queries have errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      mockUseWorkspaces.mockReturnValue({ data: [], isLoading: false, error: error1 } as any);
      mockUseWorkspaceBases.mockReturnValue({ data: [], isLoading: false, error: error2 } as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1'));

      expect(result.current.error).toBe(error1);
    });
  });

  describe('mutations', () => {
    it('should return all mutation functions', () => {
      const createWorkspaceMutation = { mutate: vi.fn() };
      const createBaseMutation = { mutate: vi.fn() };
      const createTableMutation = { mutate: vi.fn() };
      const createViewMutation = { mutate: vi.fn() };
      const updateTableMutation = { mutate: vi.fn() };

      mockUseCreateWorkspace.mockReturnValue(createWorkspaceMutation as any);
      mockUseCreateBase.mockReturnValue(createBaseMutation as any);
      mockUseCreateTable.mockReturnValue(createTableMutation as any);
      mockUseCreateView.mockReturnValue(createViewMutation as any);
      mockUseUpdateTable.mockReturnValue(updateTableMutation as any);

      const { result } = renderHook(() => useWorkspaceData());

      expect(result.current.createWorkspaceMutation).toBe(createWorkspaceMutation);
      expect(result.current.createBaseMutation).toBe(createBaseMutation);
      expect(result.current.createTableMutation).toBe(createTableMutation);
      expect(result.current.createViewMutation).toBe(createViewMutation);
      expect(result.current.updateTableMutation).toBe(updateTableMutation);
    });
  });

  describe('raw query objects', () => {
    it('should return raw query objects', () => {
      const workspacesQuery = { data: [], isLoading: false, error: null };
      const workspaceBasesQuery = { data: [], isLoading: false, error: null };
      const baseTablesQuery = { data: [], isLoading: false, error: null };

      mockUseWorkspaces.mockReturnValue(workspacesQuery as any);
      mockUseWorkspaceBases.mockReturnValue(workspaceBasesQuery as any);
      mockUseBaseTables.mockReturnValue(baseTablesQuery as any);

      const { result } = renderHook(() => useWorkspaceData('ws-1', 'base-1'));

      expect(result.current._raw.workspacesQuery).toBe(workspacesQuery);
      expect(result.current._raw.workspaceBasesQuery).toBe(workspaceBasesQuery);
      expect(result.current._raw.baseTablesQuery).toBe(baseTablesQuery);
    });
  });
});
