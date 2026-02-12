import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkspaceSelection } from '../useWorkspaceSelection';

vi.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

describe('useWorkspaceSelection', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('auto-selects first workspace on initial load', () => {
    const setSelectedWorkspace = vi.fn();
    const setWorkspace = vi.fn();
    const navigateAndPersist = vi.fn();
    const workspaces = [{ id: 'ws1' }, { id: 'ws2' }];

    renderHook(() =>
      useWorkspaceSelection(
        workspaces,
        true,
        null,
        null,
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist
      )
    );

    expect(setSelectedWorkspace).toHaveBeenCalledWith(workspaces[0]);
    expect(setWorkspace).toHaveBeenCalledWith('ws1');
    expect(navigateAndPersist).toHaveBeenCalledWith('ws1', null, null, 'user-1');
  });

  it('falls back when stored id is invalid', () => {
    const setSelectedWorkspace = vi.fn();
    const setWorkspace = vi.fn();
    const navigateAndPersist = vi.fn();
    const workspaces = [{ id: 'ws1' }];

    renderHook(() =>
      useWorkspaceSelection(
        workspaces,
        true,
        null,
        'missing',
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist
      )
    );

    expect(setSelectedWorkspace).toHaveBeenCalledWith(workspaces[0]);
    expect(setWorkspace).toHaveBeenCalledWith('ws1');
  });
});
