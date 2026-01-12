import { beforeEach, describe, it, expect, vi } from 'vitest';
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
} from '../navigationPersistence';

function createMemoryStorage() {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(i: number) {
      return Array.from(store.keys())[i] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  } as Storage;
}

describe('navigationPersistence', () => {
  beforeEach(() => {
    // Overwrite any prior test stubs with a spec-compliant storage.
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: createMemoryStorage(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('should save/get/has/clear navigation state (user-scoped)', () => {
    const state = { workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' };

    expect(hasLastNavigation('u1')).toBe(false);
    saveLastNavigation(state, 'u1');
    expect(hasLastNavigation('u1')).toBe(true);

    expect(getLastNavigation('u1')).toEqual(state);

    clearLastNavigation('u1');
    expect(hasLastNavigation('u1')).toBe(false);
    expect(getLastNavigation('u1')).toEqual({ workspaceId: null, baseId: null, tableId: null, viewId: null });
  });

  it('clearAllLastNavigation should remove all prefixed session keys and legacy localStorage keys', () => {
    sessionStorage.setItem('serenibase_session_nav', 'x');
    sessionStorage.setItem('serenibase_session_nav_u1', 'x');
    sessionStorage.setItem('other', 'y');

    localStorage.setItem('serenibase_last_navigation', 'x');
    localStorage.setItem('serenibase_last_navigation_u1', 'x');
    localStorage.setItem('other', 'y');

    clearAllLastNavigation();

    expect(sessionStorage.getItem('serenibase_session_nav')).toBeNull();
    expect(sessionStorage.getItem('serenibase_session_nav_u1')).toBeNull();
    expect(sessionStorage.getItem('other')).toBe('y');

    expect(localStorage.getItem('serenibase_last_navigation')).toBeNull();
    expect(localStorage.getItem('serenibase_last_navigation_u1')).toBeNull();
    expect(localStorage.getItem('other')).toBe('y');
  });

  it('cleanupOldTokenKeys should remove known legacy token keys', () => {
    sessionStorage.setItem('_st_exp', '1');
    sessionStorage.setItem('_rt_exp', '2');

    cleanupOldTokenKeys();

    expect(sessionStorage.getItem('_st_exp')).toBeNull();
    expect(sessionStorage.getItem('_rt_exp')).toBeNull();
  });

  it('getBestNavigationTarget should use lastNav if valid and present', () => {
    const workspaces = [
      {
        id: 'w1',
        bases: [
          {
            id: 'b1',
            tables: [
              { id: 't1', views: [{ id: 'v1' }, { id: 'v2' }] },
            ],
          },
        ],
      },
    ];

    const path = getBestNavigationTarget(workspaces as any, {
      workspaceId: 'w1',
      baseId: 'b1',
      tableId: 't1',
      viewId: 'v2',
    });

    expect(path).toBe('/workspace/w1/base/b1/table/t1/v2');
  });

  it('getBestNavigationTarget should fall back to first items and grid when no views', () => {
    const workspaces = [
      {
        id: 'w1',
        bases: [
          {
            id: 'b1',
            tables: [
              { id: 't1', views: [] },
            ],
          },
        ],
      },
    ];

    expect(getBestNavigationTarget(workspaces as any)).toBe('/workspace/w1/base/b1/table/t1/grid');
  });

  it('getBestNavigationTarget should handle nested table model ids', () => {
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

    expect(getBestNavigationTarget(workspaces as any)).toBe('/workspace/w1/base/b1/table/t1/v1');
  });

  it('resolveWorkspaceIdFromBaseId should find workspace id or null', () => {
    const workspaces = [{ id: 'w1', bases: [{ id: 'b1' }] }, { id: 'w2', bases: [] }];
    expect(resolveWorkspaceIdFromBaseId('b1', workspaces as any)).toBe('w1');
    expect(resolveWorkspaceIdFromBaseId('missing', workspaces as any)).toBeNull();
    expect(resolveWorkspaceIdFromBaseId('', workspaces as any)).toBeNull();
  });

  it('getSafeNavigationTarget should return first valid path or /workspace', () => {
    expect(getSafeNavigationTarget(null as any)).toBe('/workspace');

    const workspaces = [
      {
        id: 'w1',
        bases: [
          {
            id: 'b1',
            tables: [{ id: 't1', views: [{ id: 'v1' }] }],
          },
        ],
      },
    ];

    expect(getSafeNavigationTarget(workspaces as any)).toBe('/workspace/w1/base/b1/table/t1/v1');
  });
});
