import { describe, it, expect, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { invalidateBaseQueries } from '../queryInvalidation';

describe('invalidateBaseQueries', () => {
  it('invalidates workspace bases, workspaces and allBases queries', () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidateBaseQueries(queryClient, 'ws-1');

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['workspaces', 'ws-1', 'bases'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['workspaces'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['allBases'] });
  });
});
