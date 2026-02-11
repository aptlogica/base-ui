import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  validateAuthData,
  isAuthenticated,
  forceLogout,
  updateClientWorkspaceAndBase,
  login,
  logout,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  client,
} from '../clientService';

const createJwt = (payload: Record<string, unknown>) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64 = (input: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(input)).toString('base64url');
  return `${base64(header)}.${base64(payload)}.sig`;
};

describe('clientService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('reads stored access and refresh tokens', () => {
    sessionStorage.setItem('_st_', 'access-token');
    sessionStorage.setItem('_rt_', 'refresh-token');
    expect(getStoredAccessToken()).toBe('access-token');
    expect(getStoredRefreshToken()).toBe('refresh-token');
  });

  it('validates auth data based on user_id', () => {
    const missing = validateAuthData();
    expect(missing.isValid).toBe(false);
    expect(missing.missing).toContain('User ID');

    sessionStorage.setItem('user_id', 'user-1');
    const valid = validateAuthData();
    expect(valid.isValid).toBe(true);
    expect(valid.missing).toEqual([]);
  });

  it('updates client headers for workspace/base', () => {
    const setHeadersSpy = vi.spyOn(client, 'setHeaders');
    updateClientWorkspaceAndBase('w1', 'b1');
    expect(setHeadersSpy).toHaveBeenCalledWith({ workspace: 'w1', base: 'b1' });
  });

  it('forces logout and redirects to login', async () => {
    const setAuthSpy = vi.spyOn(client, 'setAuth');
    sessionStorage.setItem('user_id', 'user-1');
    localStorage.setItem('user_id', 'user-1');
    (globalThis as any).location.pathname = '/home';

    vi.useFakeTimers();
    await forceLogout();
    vi.runAllTimers();

    expect(sessionStorage.getItem('user_id')).toBeNull();
    expect(localStorage.getItem('user_id')).toBeNull();
    expect(setAuthSpy).toHaveBeenCalledWith('');
    expect((globalThis as any).location.href).toBe('/login');
    vi.useRealTimers();
  });

  it('checks authenticated state when token and user_id exist', async () => {
    sessionStorage.setItem('_st_', 'access-token');
    sessionStorage.setItem('user_id', 'user-1');
    await expect(isAuthenticated()).resolves.toBe(true);
  });

  it('logs in and stores user data', async () => {
    const accessToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
      roles: ['admin'],
      user_id: 'user-1',
      email: 'user@example.com',
      email_verified: true,
    });
    const refreshToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 7200 });

    (client.auth as any).login = vi.fn().mockResolvedValue({
      data: {
        token: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
        user: {
          id: 'user-1',
          email: 'user@example.com',
          display_name: 'User One',
          avatar: 'avatar.png',
          timezone: 'UTC',
          country: 'US',
        },
      },
    });

    await login({ email: 'user@example.com', password: 'pw' } as any);

    expect(sessionStorage.getItem('user_id')).toBe('user-1');
    expect(sessionStorage.getItem('user_role')).toBe('admin');
    expect(sessionStorage.getItem('_st_')).toBe(accessToken);
  });

  it('logs out and clears tokens', async () => {
    (client.auth as any).logout = vi.fn().mockResolvedValue({ data: { success: true } });
    sessionStorage.setItem('_st_', 'access-token');
    sessionStorage.setItem('_rt_', 'refresh-token');

    await logout();
    expect(sessionStorage.getItem('_st_')).toBeNull();
    expect(sessionStorage.getItem('_rt_')).toBeNull();
  });

  it('proxies auth actions', async () => {
    (client.auth as any).verifyOtp = vi.fn().mockResolvedValue({ data: { success: true } });
    (client.auth as any).resendOtp = vi.fn().mockResolvedValue({ data: { success: true } });
    (client.auth as any).forgotPassword = vi.fn().mockResolvedValue({ data: { success: true } });
    (client.auth as any).resetPassword = vi.fn().mockResolvedValue({ data: { success: true } });

    await expect(verifyOtp({} as any)).resolves.toEqual({ data: { success: true } });
    await expect(resendOtp({} as any)).resolves.toEqual({ data: { success: true } });
    await expect(forgotPassword({ email: 'user@example.com' })).resolves.toEqual({ data: { success: true } });
    await expect(resetPassword({ token: 't', new_password: 'pw' })).resolves.toEqual({ data: { success: true } });
  });
});
