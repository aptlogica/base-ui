import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useAutomations,
  useCreateAutomation,
  useUpdateAutomation,
  useRunAutomation,
  useDeleteAutomation,
} from '../useApi';
import {
  getAutomationsService,
  createAutomationService,
  updateAutomationService,
  runAutomationService,
  deleteAutomationService,
} from '../../service/clientService';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../../service/clientService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../service/clientService')>()),
  getAutomationsService: vi.fn(),
  createAutomationService: vi.fn(),
  updateAutomationService: vi.fn(),
  runAutomationService: vi.fn(),
  deleteAutomationService: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);
const invalidateQueries = vi.fn();

// Options passed to useQuery / useMutation by a hook
const queryOptions = (hook: () => unknown): any => {
  renderHook(hook);
  return mockUseQuery.mock.calls.at(-1)?.[0];
};
const mutationOptions = (hook: () => unknown): any => {
  renderHook(hook);
  return mockUseMutation.mock.calls.at(-1)?.[0];
};

const AUTOMATIONS_KEY = ['tables', 't1', 'automations'];

describe('automation hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({} as any);
    mockUseMutation.mockReturnValue({} as any);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as any);
  });

  describe('useAutomations', () => {
    it('loads the automations of the table', async () => {
      vi.mocked(getAutomationsService).mockResolvedValue({ data: [] });
      const opts = queryOptions(() => useAutomations('t1'));

      expect(opts.queryKey).toEqual(AUTOMATIONS_KEY);
      expect(opts.enabled).toBe(true);
      await opts.queryFn();
      expect(getAutomationsService).toHaveBeenCalledWith('t1');
    });

    it('selects the data array, or an empty list', () => {
      const opts = queryOptions(() => useAutomations('t1'));
      const items = [{ id: 'a1' }];
      expect(opts.select({ data: items })).toBe(items);
      expect(opts.select(undefined)).toEqual([]);
      expect(opts.select({})).toEqual([]);
    });

    it('is disabled without a table id', () => {
      expect(queryOptions(() => useAutomations('')).enabled).toBe(false);
    });
  });

  it('useCreateAutomation creates and refreshes the table list', async () => {
    const opts = mutationOptions(() => useCreateAutomation());
    const params = { model_id: 't1', title: 'Log', type: 'trigger' as const, context: 'CREATE TRIGGER x', event: 'AFTER INSERT' };

    expect(opts.mutationFn).toBe(createAutomationService);
    opts.onSuccess({}, params);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: AUTOMATIONS_KEY });
  });

  it('useUpdateAutomation sends the update without the table id', async () => {
    vi.mocked(updateAutomationService).mockResolvedValue({ data: {} as any });
    const opts = mutationOptions(() => useUpdateAutomation());

    await opts.mutationFn({ id: 'a1', tableId: 't1', title: 'Log', context: 'q', event: 'AFTER INSERT' });
    expect(updateAutomationService).toHaveBeenCalledWith({ id: 'a1', title: 'Log', context: 'q', event: 'AFTER INSERT' });

    opts.onSuccess({}, { id: 'a1', tableId: 't1' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: AUTOMATIONS_KEY });
  });

  it('useRunAutomation runs by id and refreshes the table list', async () => {
    vi.mocked(runAutomationService).mockResolvedValue({ data: {} as any });
    const opts = mutationOptions(() => useRunAutomation());

    await opts.mutationFn({ id: 'a1', tableId: 't1' });
    expect(runAutomationService).toHaveBeenCalledWith('a1');

    opts.onSuccess({}, { id: 'a1', tableId: 't1' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: AUTOMATIONS_KEY });
  });

  it('useDeleteAutomation deletes by id and refreshes the table list', async () => {
    vi.mocked(deleteAutomationService).mockResolvedValue({});
    const opts = mutationOptions(() => useDeleteAutomation());

    await opts.mutationFn({ id: 'a1', tableId: 't1' });
    expect(deleteAutomationService).toHaveBeenCalledWith('a1');

    opts.onSuccess({}, { id: 'a1', tableId: 't1' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: AUTOMATIONS_KEY });
  });
});
