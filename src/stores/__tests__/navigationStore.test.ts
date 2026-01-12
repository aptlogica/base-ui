import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/navigationPersistence', () => ({
  saveLastNavigation: vi.fn(),
  getLastNavigation: vi.fn(() => ({ workspaceId: null, baseId: null, tableId: null, viewId: null })),
  resolveWorkspaceIdFromBaseId: vi.fn(() => null),
  getSafeNavigationTarget: vi.fn(() => '/workspace'),
}));

vi.mock('../../service/activityService', () => ({
  updateUserActivity: vi.fn(async () => undefined),
  getUserActivity: vi.fn(async () => null),
  clearUserActivity: vi.fn(async () => undefined),
  createLoginSession: vi.fn(() => ({
    browser: 'Chrome',
    browser_version: '1',
    os: 'Windows',
    device_type: 'desktop',
    timezone: 'UTC',
    language: 'en',
    device_memory: 8,
    login_at: '2025-01-01T00:00:00.000Z',
  })),
}));

describe('navigationStore', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Ensure a clean store per test by re-importing after resetModules
    const mod = await import('../navigationStore');
    mod.useNavigationStore.getState().reset();
  });

  it('should have expected initial state', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const s = useNavigationStore.getState();

    expect(s.selectedWorkspaceId).toBeNull();
    expect(s.selectedBaseId).toBeNull();
    expect(s.selectedTableId).toBeNull();
    expect(s.selectedViewId).toBeNull();
    expect(s.expandedBases).toEqual([]);
    expect(s.expandedTables).toEqual([]);
  });

  it('navigateToWorkspace should set workspace and reset hierarchy', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    useNavigationStore.getState().navigateToWorkspace('w1');

    const s = useNavigationStore.getState();
    expect(s.selectedWorkspaceId).toBe('w1');
    expect(s.selectedBaseId).toBeNull();
    expect(s.selectedTableId).toBeNull();
    expect(s.selectedViewId).toBeNull();
    expect(s.expandedBases).toEqual([]);
    expect(s.expandedTables).toEqual([]);
  });

  it('navigateToBase should expand base and reset table/view', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    useNavigationStore.getState().navigateToBase('w1', 'b1');

    const s = useNavigationStore.getState();
    expect(s.selectedWorkspaceId).toBe('w1');
    expect(s.selectedBaseId).toBe('b1');
    expect(s.selectedTableId).toBeNull();
    expect(s.selectedViewId).toBeNull();
    expect(s.expandedBases).toEqual(['b1']);
    expect(s.expandedTables).toEqual([]);
  });

  it('navigateToTable should expand base/table and reset view', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    useNavigationStore.getState().navigateToTable('w1', 'b1', 't1');

    const s = useNavigationStore.getState();
    expect(s.selectedWorkspaceId).toBe('w1');
    expect(s.selectedBaseId).toBe('b1');
    expect(s.selectedTableId).toBe('t1');
    expect(s.selectedViewId).toBeNull();
    expect(s.expandedBases).toContain('b1');
    expect(s.expandedTables).toContain('t1');
  });

  it('navigateToView should set full hierarchy and expand base/table', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    useNavigationStore.getState().navigateToView('w1', 'b1', 't1', 'v1');

    const s = useNavigationStore.getState();
    expect(s.selectedWorkspaceId).toBe('w1');
    expect(s.selectedBaseId).toBe('b1');
    expect(s.selectedTableId).toBe('t1');
    expect(s.selectedViewId).toBe('v1');
    expect(s.expandedBases).toContain('b1');
    expect(s.expandedTables).toContain('t1');
  });

  it('toggleBaseExpansion/toggleTableExpansion should add/remove ids', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const store = useNavigationStore.getState();

    store.toggleBaseExpansion('b1');
    expect(useNavigationStore.getState().expandedBases).toEqual(['b1']);
    store.toggleBaseExpansion('b1');
    expect(useNavigationStore.getState().expandedBases).toEqual([]);

    store.toggleTableExpansion('t1');
    expect(useNavigationStore.getState().expandedTables).toEqual(['t1']);
    store.toggleTableExpansion('t1');
    expect(useNavigationStore.getState().expandedTables).toEqual([]);
  });

  it('getNavigationPath should build best available path', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const store = useNavigationStore.getState();

    expect(store.getNavigationPath()).toBe('/workspace');

    store.navigateToWorkspace('w1');
    expect(useNavigationStore.getState().getNavigationPath()).toBe('/workspace/w1');

    store.navigateToBase('w1', 'b1');
    expect(useNavigationStore.getState().getNavigationPath()).toBe('/workspace/w1');

    store.navigateToTable('w1', 'b1', 't1');
    expect(useNavigationStore.getState().getNavigationPath()).toBe('/workspace/w1/base/b1/table/t1/grid');

    store.navigateToView('w1', 'b1', 't1', 'v1');
    expect(useNavigationStore.getState().getNavigationPath()).toBe('/workspace/w1/base/b1/table/t1/v1');
  });

  it('saveUserNavigation should NOT overwrite storage when workspaceId is null', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const { saveLastNavigation } = await import('../../utils/navigationPersistence');

    useNavigationStore.getState().reset();
    useNavigationStore.getState().saveUserNavigation('u1');

    expect(saveLastNavigation).not.toHaveBeenCalled();
  });

  it('saveUserNavigation should persist when workspaceId exists', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const { saveLastNavigation } = await import('../../utils/navigationPersistence');

    useNavigationStore.getState().navigateToView('w1', 'b1', 't1', 'v1');
    useNavigationStore.getState().saveUserNavigation('u1');

    expect(saveLastNavigation).toHaveBeenCalledWith(
      { workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' },
      'u1'
    );
  });

  it('loadUserNavigation should load and set state from persistence', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const { getLastNavigation } = await import('../../utils/navigationPersistence');

    vi.mocked(getLastNavigation).mockReturnValueOnce({
      workspaceId: 'w1',
      baseId: 'b1',
      tableId: 't1',
      viewId: 'v1',
    });

    useNavigationStore.getState().loadUserNavigation('u1');
    const s = useNavigationStore.getState();

    expect(s.selectedWorkspaceId).toBe('w1');
    expect(s.selectedBaseId).toBe('b1');
    expect(s.selectedTableId).toBe('t1');
    expect(s.selectedViewId).toBe('v1');
  });

  it('updateActivityData should call updateUserActivity and preserve sessions on logout', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const activity = await import('../../service/activityService');

    // existing activity with a session
    vi.mocked(activity.getUserActivity).mockResolvedValueOnce({
      last_workspace_id: 'w0',
      last_base_id: 'b0',
      last_table_id: 't0',
      last_view_id: 'v0',
      login_sessions: [
        { browser: 'Chrome', browser_version: '1', os: 'Windows', device_type: 'desktop', login_at: 'old', timezone: 'UTC', language: 'en', device_memory: 8 },
      ],
      last_updated_at: 'x',
    } as any);

    useNavigationStore.getState().navigateToView('w1', 'b1', 't1', 'v1');

    await useNavigationStore.getState().updateActivityData('u1', false);

    expect(activity.updateUserActivity).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(activity.updateUserActivity).mock.calls[0][1] as any;

    // navigation should reflect current state
    expect(payload).toMatchObject({
      last_workspace_id: 'w1',
      last_base_id: 'b1',
      last_table_id: 't1',
      last_view_id: 'v1',
    });

    // on logout, sessions preserved (not updated)
    expect(payload.login_sessions).toHaveLength(1);
    expect(payload.login_sessions[0].login_at).toBe('old');
  });

  it('updateActivityData should upsert session on login and cap to 15', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const activity = await import('../../service/activityService');

    const existingSessions = Array.from({ length: 20 }).map((_, i) => ({
      browser: 'Other',
      browser_version: String(i),
      os: 'X',
      device_type: 'desktop',
      timezone: 'UTC',
      language: 'en',
      device_memory: 8,
      login_at: `s${i}`,
    }));

    vi.mocked(activity.getUserActivity).mockResolvedValueOnce({
      login_sessions: existingSessions,
      last_updated_at: 'x',
    } as any);

    await useNavigationStore.getState().updateActivityData('u1', true);

    const payload = vi.mocked(activity.updateUserActivity).mock.calls[0][1] as any;
    expect(payload.login_sessions.length).toBe(15);
    // our mocked createLoginSession is always Chrome/1/Windows/desktop
    expect(payload.login_sessions[0]).toMatchObject({ browser: 'Chrome', browser_version: '1' });
  });

  it('loadFromActivityData should set state and return true only when full path exists', async () => {
    const { useNavigationStore } = await import('../navigationStore');
    const activity = await import('../../service/activityService');

    vi.mocked(activity.getUserActivity).mockResolvedValueOnce({
      last_workspace_id: 'w1',
      last_base_id: 'b1',
      last_table_id: 't1',
      last_view_id: 'v1',
    } as any);

    const ok = await useNavigationStore.getState().loadFromActivityData('u1');
    expect(ok).toBe(true);

    vi.mocked(activity.getUserActivity).mockResolvedValueOnce({
      last_workspace_id: 'w1',
      last_base_id: null,
      last_table_id: null,
      last_view_id: null,
    } as any);

    const ok2 = await useNavigationStore.getState().loadFromActivityData('u1');
    expect(ok2).toBe(false);
  });
});
