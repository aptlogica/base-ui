import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useNavigateToBaseFirstView } from '../useNavigateToBaseFirstView';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

// react-router-dom: mock useNavigate and capture calls
const navigateSpy = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  } as unknown as typeof import('react-router-dom');
});

// Mock services that are called by the hook
vi.mock('../../service/clientService', () => ({
  getTablesByBaseIdService: vi.fn(),
  getViewsByModelIdService: vi.fn(),
}));
// Mock Zustand navigation store with dynamic state
let selectedWorkspaceId: string | null = 'ws-1';
const navigateToBase = vi.fn();
const navigateToTable = vi.fn();
const navigateToView = vi.fn();

vi.mock('../../stores/navigationStore', () => ({
  useNavigationStore: () => ({
    selectedWorkspaceId,
    navigateToBase,
    navigateToTable,
    navigateToView,
  }),
}));

// ----------------------------------------------------------------------------
// Test utilities
// ----------------------------------------------------------------------------

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(BrowserRouter, null, children)
    )
  );

  return { queryClient, wrapper };
};

// ----------------------------------------------------------------------------
// Setup/reset before each test
// ----------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  selectedWorkspaceId = 'ws-1';
});

afterEach(() => {
  vi.clearAllMocks();
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('useNavigateToBaseFirstView', () => {
  it('throws when no workspace is selected', async () => {
    // Arrange
    selectedWorkspaceId = null;
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useNavigateToBaseFirstView(), { wrapper });

    // Act & Assert
    await expect(result.current.navigateToFirstView('base-1')).rejects.toThrow('No workspace selected');
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(navigateToBase).not.toHaveBeenCalled();
  });

  it('navigates to base when there are no tables', async () => {
    // Arrange
    const { queryClient, wrapper } = createWrapper();
    const fetchSpy = vi.spyOn(queryClient, 'fetchQuery').mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => useNavigateToBaseFirstView(), { wrapper });

    // Act
    await result.current.navigateToFirstView('base-1');

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(navigateToBase).toHaveBeenCalledWith('ws-1', 'base-1');
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1');
    expect(navigateToTable).not.toHaveBeenCalled();
    expect(navigateToView).not.toHaveBeenCalled();
  });

  it('navigates to homepage when first table has no id', async () => {
    // Arrange
    const { queryClient, wrapper } = createWrapper();
    const fetchSpy = vi.spyOn(queryClient, 'fetchQuery').mockResolvedValueOnce({ data: [{}] });
    const { result } = renderHook(() => useNavigateToBaseFirstView(), { wrapper });

    // Act
    await result.current.navigateToFirstView('base-1');

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(navigateToBase).toHaveBeenCalledWith('ws-1', 'base-1');
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1');
    expect(navigateToTable).not.toHaveBeenCalled();
    expect(navigateToView).not.toHaveBeenCalled();
  });

  it('supports table id from model.id and navigates to first view when available', async () => {
    // Arrange
    const { queryClient, wrapper } = createWrapper();
    const fetchSpy = vi.spyOn(queryClient, 'fetchQuery')
      .mockResolvedValueOnce({ data: [{ model: { id: 'tbl-xyz' } }] })
      .mockResolvedValueOnce({ data: [{ id: 'view-1' }] });
    const { result } = renderHook(() => useNavigateToBaseFirstView(), { wrapper });

    // Act
    await result.current.navigateToFirstView('base-1');

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(navigateToView).toHaveBeenCalledWith('ws-1', 'base-1', 'tbl-xyz', 'view-1');
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1/base/base-1/table/tbl-xyz/view-1');
  });

  it('navigates to first view when views exist', async () => {
    // Arrange
    const { queryClient, wrapper } = createWrapper();
    const fetchSpy = vi.spyOn(queryClient, 'fetchQuery')
      .mockResolvedValueOnce({ data: [{ id: 'table-1' }] })
      .mockResolvedValueOnce({ data: [{ id: 'view-1' }, { id: 'view-2' }] });
    const { result } = renderHook(() => useNavigateToBaseFirstView(), { wrapper });

    // Act
    await result.current.navigateToFirstView('base-1');

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(navigateToView).toHaveBeenCalledWith('ws-1', 'base-1', 'table-1', 'view-1');
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1/base/base-1/table/table-1/view-1');
  });

  it('navigates to grid when no views exist', async () => {
    // Arrange
    const { queryClient, wrapper } = createWrapper();
    const fetchSpy = vi.spyOn(queryClient, 'fetchQuery')
      .mockResolvedValueOnce({ data: [{ id: 'table-1' }] })
      .mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => useNavigateToBaseFirstView(), { wrapper });

    // Act
    await result.current.navigateToFirstView('base-1');

    // Assert
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(navigateToTable).toHaveBeenCalledWith('ws-1', 'base-1', 'table-1');
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1/base/base-1/table/table-1/grid');
    expect(navigateToView).not.toHaveBeenCalled();
  });

  it('falls back to base page on fetch error and does not throw', async () => {
    // Arrange
    const { queryClient, wrapper } = createWrapper();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(queryClient, 'fetchQuery').mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useNavigateToBaseFirstView(), { wrapper });

    // Act
    await result.current.navigateToFirstView('base-1');

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    expect(navigateToBase).toHaveBeenCalledWith('ws-1', 'base-1');
    expect(navigateSpy).toHaveBeenCalledWith('/workspace/ws-1');
    consoleSpy.mockRestore();
  });
});
