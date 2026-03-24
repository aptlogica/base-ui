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

  it('does not fallback immediately when selected workspace is newly created and pending sync', () => {
    const setSelectedWorkspace = vi.fn();
    const setWorkspace = vi.fn();
    const navigateAndPersist = vi.fn();
    const workspaces = [{ id: 'ws1' }];

    sessionStorage.setItem('pending_new_workspace', JSON.stringify({
      id: 'ws-new',
      createdAt: Date.now(),
    }));

    renderHook(() =>
      useWorkspaceSelection(
        workspaces,
        true,
        null,
        'ws-new',
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist
      )
    );

    expect(setSelectedWorkspace).not.toHaveBeenCalled();
    expect(setWorkspace).not.toHaveBeenCalled();
  });

  it('syncs selectedWorkspace object when stored id is valid', () => {
    const setSelectedWorkspace = vi.fn();
    const setWorkspace = vi.fn();
    const navigateAndPersist = vi.fn();
    const workspaces = [{ id: 'ws1' }, { id: 'ws2' }];

    renderHook(() =>
      useWorkspaceSelection(
        workspaces,
        true,
        null,
        'ws2',
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist
      )
    );

    expect(setSelectedWorkspace).toHaveBeenCalledWith(workspaces[1]);
    expect(setWorkspace).not.toHaveBeenCalled();
  });

  it('falls back when pending workspace marker is expired', () => {
    const setSelectedWorkspace = vi.fn();
    const setWorkspace = vi.fn();
    const navigateAndPersist = vi.fn();
    const workspaces = [{ id: 'ws1' }];

    sessionStorage.setItem('pending_new_workspace', JSON.stringify({
      id: 'ws1',
      createdAt: Date.now() - 60_000,
    }));

    renderHook(() =>
      useWorkspaceSelection(
        workspaces,
        true,
        null,
        'ws1',
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist
      )
    );

    expect(setSelectedWorkspace).toHaveBeenCalledWith(workspaces[0]);
  });

  it('does nothing when restore is not completed', () => {
    const setSelectedWorkspace = vi.fn();
    const setWorkspace = vi.fn();
    const navigateAndPersist = vi.fn();
    const workspaces = [{ id: 'ws1' }];

    renderHook(() =>
      useWorkspaceSelection(
        workspaces,
        false,
        null,
        null,
        setSelectedWorkspace,
        setWorkspace,
        navigateAndPersist
      )
    );

    expect(setSelectedWorkspace).not.toHaveBeenCalled();
    expect(setWorkspace).not.toHaveBeenCalled();
    expect(navigateAndPersist).not.toHaveBeenCalled();
  });
});
