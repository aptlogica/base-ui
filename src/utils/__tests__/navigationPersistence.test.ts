import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLastNavigation,
  saveLastNavigation,
  hasLastNavigation,
  clearLastNavigation,
  clearAllLastNavigation,
  cleanupOldTokenKeys,
  getBestNavigationTarget,
  resolveWorkspaceIdFromBaseId,
  getSafeNavigationTarget,
  cleanupWorkspaceNavigation,
  cleanupBaseNavigation,
  cleanupTableNavigation,
  cleanupViewNavigation,
} from '../navigationPersistence';

describe('navigationPersistence', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('saves and retrieves last navigation', () => {
    saveLastNavigation({ workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' }, 'u1');
    expect(hasLastNavigation('u1')).toBe(true);
    expect(getLastNavigation('u1')).toEqual({
      workspaceId: 'w1',
      baseId: 'b1',
      tableId: 't1',
      viewId: 'v1',
    });
  });

  it('handles missing data gracefully', () => {
    expect(getLastNavigation('u-missing')).toEqual({
      workspaceId: null,
      baseId: null,
      tableId: null,
      viewId: null,
    });
    expect(hasLastNavigation('u-missing')).toBe(false);
  });

  it('returns empty navigation on invalid JSON and handles storage errors', () => {
    sessionStorage.setItem('serenibase_session_nav_u1', '{bad json');
    expect(getLastNavigation('u1')).toEqual({
      workspaceId: null,
      baseId: null,
      tableId: null,
      viewId: null,
    });

    const getItemSpy = vi.spyOn(sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(hasLastNavigation('u1')).toBe(false);
    getItemSpy.mockRestore();
  });

  it('clears navigation for a user and all users', () => {
    saveLastNavigation({ workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' }, 'u1');
    clearLastNavigation('u1');
    expect(hasLastNavigation('u1')).toBe(false);

    sessionStorage.setItem('serenibase_session_nav_u2', JSON.stringify({ workspaceId: 'w2' }));
    localStorage.setItem('serenibase_last_navigation_u2', JSON.stringify({ workspaceId: 'w2' }));
    clearAllLastNavigation();
    expect(sessionStorage.getItem('serenibase_session_nav_u2')).toBeNull();
    expect(localStorage.getItem('serenibase_last_navigation_u2')).toBeNull();
  });

  it('cleans up old token keys', () => {
    sessionStorage.setItem('_st_exp', '1');
    sessionStorage.setItem('_rt_exp', '1');
    cleanupOldTokenKeys();
    expect(sessionStorage.getItem('_st_exp')).toBeNull();
    expect(sessionStorage.getItem('_rt_exp')).toBeNull();
  });

  it('builds best navigation target from lastNav when valid', () => {
    const workspaces = [
      {
        id: 'w1',
        bases: [
          {
            id: 'b1',
            tables: [
              { id: 't1', views: [{ id: 'v1' }] },
            ],
          },
        ],
      },
    ];
    const target = getBestNavigationTarget(workspaces, {
      workspaceId: 'w1',
      baseId: 'b1',
      tableId: 't1',
      viewId: 'v1',
    });
    expect(target).toBe('/workspace/w1/base/b1/table/t1/v1');
  });

  it('builds best navigation target using nested model id', () => {
    const workspaces = [
      {
        id: 'w1',
        bases: [
          {
            id: 'b1',
            tables: [
              { model: { id: 't1' }, views: [{ id: 'v1' }] },
            ],
          },
        ],
      },
    ];
    const target = getBestNavigationTarget(workspaces, {
      workspaceId: 'w1',
      baseId: 'b1',
      tableId: 't1',
      viewId: 'v1',
    });
    expect(target).toBe('/workspace/w1/base/b1/table/t1/v1');
  });

  it('returns null when workspaces is null and /workspace when empty', () => {
    expect(getBestNavigationTarget(null)).toBeNull();
    expect(getBestNavigationTarget([])).toBe('/workspace');
  });

  it('falls back to first available path when lastNav is invalid', () => {
    const workspaces = [
      { id: 'w1', bases: [{ id: 'b1', tables: [{ id: 't1', views: [{ id: 'v1' }] }] }] },
    ];
    const target = getBestNavigationTarget(workspaces, {
      workspaceId: 'w1',
      baseId: 'missing',
      tableId: 't1',
      viewId: 'v1',
    });
    expect(target).toBe('/workspace/w1/base/b1/table/t1/v1');
  });

  it('falls back to first workspace path when no lastNav', () => {
    const workspaces = [{ id: 'w1', bases: [] }];
    expect(getBestNavigationTarget(workspaces)).toBe('/workspace/w1');
  });

  it('returns grid path when table has no views', () => {
    const workspaces = [
      { id: 'w1', bases: [{ id: 'b1', tables: [{ id: 't1', views: [] }] }] },
    ];
    expect(getBestNavigationTarget(workspaces)).toBe('/workspace/w1/base/b1/table/t1/grid');
  });

  it('returns workspace path when base has no tables', () => {
    const workspaces = [
      { id: 'w1', bases: [{ id: 'b1', tables: [] }] },
    ];
    expect(getBestNavigationTarget(workspaces)).toBe('/workspace/w1');
  });

  it('resolves workspace id from base id', () => {
    const workspaces = [{ id: 'w1', bases: [{ id: 'b1' }] }];
    expect(resolveWorkspaceIdFromBaseId('b1', workspaces)).toBe('w1');
    expect(resolveWorkspaceIdFromBaseId('missing', workspaces)).toBeNull();
  });

  it('returns null when baseId is missing or workspaces empty', () => {
    expect(resolveWorkspaceIdFromBaseId('', [])).toBeNull();
    expect(resolveWorkspaceIdFromBaseId('b1', [])).toBeNull();
  });

  it('returns safe navigation target from available workspaces', () => {
    const workspaces = [
      {
        id: 'w1',
        bases: [{ id: 'b1', tables: [{ id: 't1', views: [] }] }],
      },
    ];
    expect(getSafeNavigationTarget(workspaces)).toBe('/workspace/w1/base/b1/table/t1/grid');
  });

  it('returns workspace path when safe target has no bases or tables', () => {
    expect(getSafeNavigationTarget([])).toBe('/workspace');
    expect(getSafeNavigationTarget([{ id: 'w1', bases: [] }])).toBe('/workspace/w1');
  });

  it('cleans up navigation when items are deleted', () => {
    saveLastNavigation({ workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' }, 'u1');
    expect(cleanupWorkspaceNavigation('w1', 'u1')).toBe(true);
    expect(getLastNavigation('u1').workspaceId).toBeNull();

    saveLastNavigation({ workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' }, 'u1');
    expect(cleanupBaseNavigation('b1', 'u1')).toBe(true);
    expect(getLastNavigation('u1').baseId).toBeNull();

    saveLastNavigation({ workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' }, 'u1');
    expect(cleanupTableNavigation('t1', 'u1')).toBe(true);
    expect(getLastNavigation('u1').tableId).toBeNull();

    saveLastNavigation({ workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' }, 'u1');
    expect(cleanupViewNavigation('v1', 'u1')).toBe(true);
    expect(getLastNavigation('u1').viewId).toBeNull();
  });

  it('returns false when cleanup is not needed', () => {
    saveLastNavigation({ workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' }, 'u1');
    expect(cleanupWorkspaceNavigation('w2', 'u1')).toBe(false);
    expect(cleanupBaseNavigation('b2', 'u1')).toBe(false);
    expect(cleanupTableNavigation('t2', 'u1')).toBe(false);
    expect(cleanupViewNavigation('v2', 'u1')).toBe(false);
  });
});
