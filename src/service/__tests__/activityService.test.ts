import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDeviceInfo,
  createLoginSession,
  isSameDevice,
  getUserActivity,
  updateUserActivity,
  clearUserActivity,
} from '../activityService';
import { client } from '../clientService';

const setNavigatorProperty = (key: string, value: unknown) => {
  Object.defineProperty(globalThis.navigator, key, {
    value,
    configurable: true,
  });
};

describe('activityService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();

    setNavigatorProperty('userAgent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0');
    (globalThis.navigator as any).userAgentData = {
      brands: [{ brand: 'Microsoft Edge', version: '120' }],
    };
    setNavigatorProperty('language', 'en-US');
    setNavigatorProperty('deviceMemory', 8);

    vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ timeZone: 'UTC' }),
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads device info with userAgentData', () => {
    const info = getDeviceInfo();
    expect(info.browser).toBe('Edge');
    expect(info.browser_version).toBe('120');
    expect(info.os).toBe('Windows');
    expect(info.device_type).toBe('desktop');
    expect(info.timezone).toBe('UTC');
    expect(info.language).toBe('en-US');
    expect(info.device_memory).toBe(8);
  });

  it('creates a login session with timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-11T10:00:00.000Z'));

    const session = createLoginSession();
    expect(session.login_at).toBe('2026-02-11T10:00:00.000Z');
    expect(session.browser).toBe('Edge');
  });

  it('compares sessions for same device', () => {
    const base = {
      browser: 'Chrome',
      browser_version: '120',
      os: 'Windows',
      device_type: 'desktop',
      login_at: '2026-02-10T00:00:00.000Z',
    };

    expect(isSameDevice(base, { ...base })).toBe(true);
    expect(isSameDevice(base, { ...base, device_type: 'mobile' })).toBe(false);
  });

  it('returns activity data when present', async () => {
    const activity = {
      last_workspace_id: 'w1',
      last_updated_at: '2026-02-11T00:00:00.000Z',
    };
    (client.userService as any).getProfile = vi.fn().mockResolvedValue({
      data: { activity_data: activity },
    });

    const result = await getUserActivity('user-1');
    expect(result).toEqual(activity);
  });

  it('merges login sessions when updating activity', async () => {
    const loginSessions = [
      {
        browser: 'Chrome',
        browser_version: '120',
        os: 'Windows',
        device_type: 'desktop',
        login_at: '2026-02-10T00:00:00.000Z',
      },
    ];

    (client.userService as any).getProfile = vi.fn().mockResolvedValue({
      data: { activity_data: { login_sessions: loginSessions, last_updated_at: '2026-02-10T00:00:00.000Z' } },
    });
    (client.userService as any).updateProfile = vi.fn().mockResolvedValue({ data: { success: true } });

    await updateUserActivity('user-1', {
      last_workspace_id: 'w2',
      last_updated_at: '2026-02-11T00:00:00.000Z',
    });

    expect((client.userService as any).updateProfile).toHaveBeenCalledWith('user-1', {
      activity_data: {
        last_workspace_id: 'w2',
        last_updated_at: '2026-02-11T00:00:00.000Z',
        login_sessions: loginSessions,
      },
    });
  });

  it('clears activity data', async () => {
    (client.userService as any).updateProfile = vi.fn().mockResolvedValue({ data: { success: true } });
    await clearUserActivity('user-1');
    expect((client.userService as any).updateProfile).toHaveBeenCalledWith('user-1', {
      activity_data: null,
    });
  });
});
