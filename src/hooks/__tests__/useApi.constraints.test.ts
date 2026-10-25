import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useTableConstraints,
  useCheckTableConstraint,
  useCreateTableConstraint,
  useUpdateTableConstraint,
  useDeleteTableConstraint,
} from '../useApi';
import {
  getTableConstraintsService,
  checkTableConstraintService,
  createTableConstraintService,
  updateTableConstraintService,
  deleteTableConstraintService,
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
  getTableConstraintsService: vi.fn(),
  checkTableConstraintService: vi.fn(),
  createTableConstraintService: vi.fn(),
  updateTableConstraintService: vi.fn(),
  deleteTableConstraintService: vi.fn(),
}));

const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);
const invalidateQueries = vi.fn();

const queryOptions = (hook: () => unknown): any => {
  renderHook(hook);
  return mockUseQuery.mock.calls.at(-1)?.[0];
};
const mutationOptions = (hook: () => unknown): any => {
  renderHook(hook);
  return mockUseMutation.mock.calls.at(-1)?.[0];
};

const KEY = ['tables', 't1', 'constraints'];

describe('table constraint hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({} as any);
    mockUseMutation.mockReturnValue({} as any);
    vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as any);
  });

  it('useTableConstraints loads one type, and selects the data or an empty list', async () => {
    const opts = queryOptions(() => useTableConstraints('t1', 'check'));

    expect(opts.queryKey).toEqual([...KEY, 'check']);
    expect(opts.enabled).toBe(true);
    await opts.queryFn();
    expect(getTableConstraintsService).toHaveBeenCalledWith('t1', 'check');
    const items = [{ id: 'k1' }];
    expect(opts.select({ data: items })).toBe(items);
    expect(opts.select(undefined)).toEqual([]);
  });

  it('useTableConstraints is disabled without a table id', () => {
    expect(queryOptions(() => useTableConstraints('', 'check')).enabled).toBe(false);
  });

  it('useCheckTableConstraint only calls the service', () => {
    expect(mutationOptions(useCheckTableConstraint).mutationFn).toBe(checkTableConstraintService);
  });

  it('useCreateTableConstraint refreshes the list of the table', () => {
    const opts = mutationOptions(useCreateTableConstraint);

    expect(opts.mutationFn).toBe(createTableConstraintService);
    opts.onSuccess(undefined, { model_id: 't1' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: KEY });
  });

  it('useUpdateTableConstraint drops the table id before calling the service', async () => {
    const opts = mutationOptions(useUpdateTableConstraint);

    await opts.mutationFn({ id: 'k1', tableId: 't1', title: 'New' });
    expect(updateTableConstraintService).toHaveBeenCalledWith({ id: 'k1', title: 'New' });
    opts.onSuccess(undefined, { tableId: 't1' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: KEY });
  });

  it('useDeleteTableConstraint deletes by id and refreshes the list', async () => {
    const opts = mutationOptions(useDeleteTableConstraint);

    await opts.mutationFn({ id: 'k1', tableId: 't1' });
    expect(deleteTableConstraintService).toHaveBeenCalledWith('k1');
    opts.onSuccess(undefined, { tableId: 't1' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: KEY });
  });
});
