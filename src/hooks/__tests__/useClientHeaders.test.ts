import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClientHeaders } from '../useClientHeaders';
import * as clientService from '../../service/clientService';
import { useNavigationStore } from '../../stores/navigationStore';

// Mock the dependencies
vi.mock('../../service/clientService', () => ({
  updateClientWorkspaceAndBase: vi.fn()
}));

vi.mock('../../stores/navigationStore', () => {
  const useNavigationStore = vi.fn();
  (useNavigationStore as any).getState = vi.fn(() => ({
    selectedWorkspaceId: null,
    selectedBaseId: null,
  }));
  return { useNavigationStore };
});

describe('useClientHeaders', () => {
  const mockUpdateClientWorkspaceAndBase = vi.mocked(clientService.updateClientWorkspaceAndBase);
  const mockUseNavigationStore = vi.mocked(useNavigationStore);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateClientWorkspaceAndBase with initial workspace and base IDs', () => {
    mockUseNavigationStore.mockImplementation((selector: any) => {
      const state = {
        selectedWorkspaceId: 'workspace-1',
        selectedBaseId: 'base-1'
      };
      return selector(state);
    });

    renderHook(() => useClientHeaders());

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith('workspace-1', 'base-1');
    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledTimes(1);
  });

  it('should call updateClientWorkspaceAndBase with null values when no selection', () => {
    mockUseNavigationStore.mockImplementation((selector: any) => {
      const state = {
        selectedWorkspaceId: null,
        selectedBaseId: null
      };
      return selector(state);
    });

    renderHook(() => useClientHeaders());

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith(null, null);
  });

  it('should call updateClientWorkspaceAndBase with only workspace ID', () => {
    mockUseNavigationStore.mockImplementation((selector: any) => {
      const state = {
        selectedWorkspaceId: 'workspace-1',
        selectedBaseId: null
      };
      return selector(state);
    });

    renderHook(() => useClientHeaders());

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith('workspace-1', null);
  });

  it('should call updateClientWorkspaceAndBase with undefined values', () => {
    mockUseNavigationStore.mockImplementation((selector: any) => {
      const state = {
        selectedWorkspaceId: undefined,
        selectedBaseId: undefined
      };
      return selector(state);
    });

    renderHook(() => useClientHeaders());

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should update headers when workspace ID changes', () => {
    let workspaceId = 'workspace-1';
    
    mockUseNavigationStore.mockImplementation((selector: any) => {
      const state = {
        selectedWorkspaceId: workspaceId,
        selectedBaseId: 'base-1'
      };
      return selector(state);
    });

    const { rerender } = renderHook(() => useClientHeaders());

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith('workspace-1', 'base-1');

    // Change workspace ID
    workspaceId = 'workspace-2';
    rerender();

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith('workspace-2', 'base-1');
    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledTimes(2);
  });

  it('should update headers when base ID changes', () => {
    let baseId = 'base-1';
    
    mockUseNavigationStore.mockImplementation((selector: any) => {
      const state = {
        selectedWorkspaceId: 'workspace-1',
        selectedBaseId: baseId
      };
      return selector(state);
    });

    const { rerender } = renderHook(() => useClientHeaders());

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith('workspace-1', 'base-1');

    // Change base ID
    baseId = 'base-2';
    rerender();

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith('workspace-1', 'base-2');
    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledTimes(2);
  });

  it('should update headers when both workspace and base IDs change', () => {
    let workspaceId = 'workspace-1';
    let baseId = 'base-1';
    
    mockUseNavigationStore.mockImplementation((selector: any) => {
      const state = {
        selectedWorkspaceId: workspaceId,
        selectedBaseId: baseId
      };
      return selector(state);
    });

    const { rerender } = renderHook(() => useClientHeaders());

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith('workspace-1', 'base-1');

    // Change both IDs
    workspaceId = 'workspace-2';
    baseId = 'base-2';
    rerender();

    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledWith('workspace-2', 'base-2');
    expect(mockUpdateClientWorkspaceAndBase).toHaveBeenCalledTimes(2);
  });
});
