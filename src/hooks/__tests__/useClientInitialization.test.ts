import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClientInitialization } from '../useClientInitialization';
import * as clientService from '../../service/clientService';

// Mock the client service
vi.mock('../../service/clientService', () => ({
  initializeClientToken: vi.fn(),
  getTenantSchema: vi.fn(),
  isAuthenticated: vi.fn()
}));

describe('useClientInitialization', () => {
  const mockInitializeClientToken = vi.mocked(clientService.initializeClientToken);
  const mockGetTenantSchema = vi.mocked(clientService.getTenantSchema);
  const mockIsAuthenticated = vi.mocked(clientService.isAuthenticated);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTenantSchema.mockReturnValue('tenant-schema');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockInitializeClientToken.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClientInitialization());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isInitialized).toBe(false);
  });

  it('should initialize successfully when authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockInitializeClientToken.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClientInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInitialized).toBe(true);
    expect(mockIsAuthenticated).toHaveBeenCalledOnce();
    expect(mockInitializeClientToken).toHaveBeenCalledOnce();
  });

  it('should not initialize when not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(false);

    const { result } = renderHook(() => useClientInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInitialized).toBe(false);
    expect(mockIsAuthenticated).toHaveBeenCalledOnce();
    expect(mockInitializeClientToken).not.toHaveBeenCalled();
  });

  it('should handle initialization errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockIsAuthenticated.mockRejectedValue(new Error('Auth failed'));

    const { result } = renderHook(() => useClientInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInitialized).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to initialize client:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle token initialization errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockIsAuthenticated.mockResolvedValue(true);
    mockInitializeClientToken.mockRejectedValue(new Error('Token init failed'));

    const { result } = renderHook(() => useClientInitialization());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInitialized).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should return tenant schema', async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockInitializeClientToken.mockResolvedValue(undefined);
    mockGetTenantSchema.mockReturnValue('custom-tenant-schema');

    const { result } = renderHook(() => useClientInitialization());

    expect(result.current.tenantSchema).toBe('custom-tenant-schema');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tenantSchema).toBe('custom-tenant-schema');
  });

  it('should only initialize once on mount', async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockInitializeClientToken.mockResolvedValue(undefined);

    const { rerender } = renderHook(() => useClientInitialization());

    await waitFor(() => {
      expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);
    });

    // Rerender should not trigger another initialization
    rerender();

    expect(mockIsAuthenticated).toHaveBeenCalledTimes(1);
    expect(mockInitializeClientToken).toHaveBeenCalledTimes(1);
  });

  it('should set loading to false after successful initialization', async () => {
    mockIsAuthenticated.mockResolvedValue(true);
    mockInitializeClientToken.mockResolvedValue(undefined);

    const { result } = renderHook(() => useClientInitialization());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInitialized).toBe(true);
  });

  it('should set loading to false after failed initialization', async () => {
    mockIsAuthenticated.mockResolvedValue(false);

    const { result } = renderHook(() => useClientInitialization());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isInitialized).toBe(false);
  });
});
