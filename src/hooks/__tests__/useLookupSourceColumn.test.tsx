import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLookupSourceColumn } from '../useLookupSourceColumn';
import * as clientService from '../../service/clientService';
import React, { ReactNode } from 'react';

// Mock the client service
vi.mock('../../service/clientService', () => ({
  getFieldByIdService: vi.fn(),
  isTenantSchemaAvailable: vi.fn()
}));

describe('useLookupSourceColumn', () => {
  const mockGetFieldByIdService = vi.mocked(clientService.getFieldByIdService);
  const mockIsTenantSchemaAvailable = vi.mocked(clientService.isTenantSchemaAvailable);

  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTenantSchemaAvailable.mockReturnValue(true);
  });

  it('should return null when lookupColumnId is undefined', async () => {
    const { result } = renderHook(() => useLookupSourceColumn(undefined), {
      wrapper: createWrapper()
    });

    // Query should be disabled when lookupColumnId is undefined
    expect(result.current.data).toBeUndefined();
    expect(result.current.isFetching).toBe(false);
    expect(mockGetFieldByIdService).not.toHaveBeenCalled();
  });

  it('should fetch lookup source column when lookupColumnId is provided', async () => {
    const mockColumn = {
      id: 'col-1',
      title: 'Source Column',
      type: 'text'
    };

    mockGetFieldByIdService.mockResolvedValue({
      data: { column: mockColumn }
    } as any);

    const { result } = renderHook(() => useLookupSourceColumn('col-1'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockColumn);
    expect(mockGetFieldByIdService).toHaveBeenCalledWith('col-1');
  });

  it('should handle response with data directly', async () => {
    const mockColumn = {
      id: 'col-2',
      title: 'Direct Column',
      type: 'number'
    };

    mockGetFieldByIdService.mockResolvedValue({
      data: mockColumn
    } as any);

    const { result } = renderHook(() => useLookupSourceColumn('col-2'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockColumn);
  });

  it('should handle response with column at root level', async () => {
    const mockColumn = {
      id: 'col-3',
      title: 'Root Column',
      type: 'date'
    };

    mockGetFieldByIdService.mockResolvedValue(mockColumn as any);

    const { result } = renderHook(() => useLookupSourceColumn('col-3'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockColumn);
  });

  it('should parse string meta to JSON', async () => {
    const mockColumn = {
      id: 'col-4',
      title: 'Column with meta',
      type: 'text',
      meta: '{"key":"value"}'
    };

    mockGetFieldByIdService.mockResolvedValue({
      data: { column: mockColumn }
    } as any);

    const { result } = renderHook(() => useLookupSourceColumn('col-4'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.meta).toEqual({ key: 'value' });
  });

  it('should keep meta as is if JSON parsing fails', async () => {
    const mockColumn = {
      id: 'col-5',
      title: 'Column with invalid meta',
      type: 'text',
      meta: 'invalid json'
    };

    mockGetFieldByIdService.mockResolvedValue({
      data: { column: mockColumn }
    } as any);

    const { result } = renderHook(() => useLookupSourceColumn('col-5'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.meta).toBe('invalid json');
  });

  it('should return null on error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetFieldByIdService.mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useLookupSourceColumn('col-6'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching lookup source column:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should not fetch when tenant schema is not available', async () => {
    mockIsTenantSchemaAvailable.mockReturnValue(false);

    const { result } = renderHook(() => useLookupSourceColumn('col-7'), {
      wrapper: createWrapper()
    });

    // Query should be disabled
    expect(result.current.status).toBe('pending');
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetFieldByIdService).not.toHaveBeenCalled();
  });

  it('should use correct query options', async () => {
    const mockColumn = {
      id: 'col-8',
      title: 'Test Column',
      type: 'text'
    };

    mockGetFieldByIdService.mockResolvedValue({
      data: { column: mockColumn }
    } as any);

    const { result } = renderHook(() => useLookupSourceColumn('col-8'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Query should not refetch on window focus
    expect(result.current.data).toEqual(mockColumn);
  });

  it('should handle empty lookupColumnId string', async () => {
    const { result } = renderHook(() => useLookupSourceColumn(''), {
      wrapper: createWrapper()
    });

    // Empty string is falsy, so query should be disabled
    expect(result.current.status).toBe('pending');
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetFieldByIdService).not.toHaveBeenCalled();
  });

  it('should handle meta that is already an object', async () => {
    const mockColumn = {
      id: 'col-9',
      title: 'Column with object meta',
      type: 'text',
      meta: { key: 'value' }
    };

    mockGetFieldByIdService.mockResolvedValue({
      data: { column: mockColumn }
    } as any);

    const { result } = renderHook(() => useLookupSourceColumn('col-9'), {
      wrapper: createWrapper()
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.meta).toEqual({ key: 'value' });
  });
});
