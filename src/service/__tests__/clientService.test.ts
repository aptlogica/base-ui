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
  createWorkspaceService,
  getWorkspaceByIdService,
  getWorkspacesByUser,
  updateWorkspaceService,
  deleteWorkspaceService,
  getBasesByWorkspaceIdService,
  getWorkspaceMembersService,
  removeUserFromWorkspaceService,
  createBaseService,
  getBaseByIdService,
  getTablesByBaseIdService,
  updateBaseService,
  deleteBaseService,
  getBaseMembersService,
  removeUserFromBaseService,
  createTableService,
  getTableByIdService,
  getAllViewsService,
  getViewsByModelIdService,
  addRow,
  deleteRowService,
  bulkDeleteRowService,
  insertRowDataService,
  getAllRecordsService,
  insertRelationDataService,
  addAttachmentService,
  removeAttachmentsService,
  updateAttachmentService,
  importService,
  getTenantUsersService,
  getUsersForAssignService,
  addUserService,
  editUserService,
  deactivateTenantUserService,
  activateTenantUserService,
  removeUserService,
  getAllWorkspacesService,
  bulkAddBaseMembersService,
  getUserProfileByIDService,
  updateUserProfileService,
  getUserRolesAndAccessService,
  changePasswordService,
  removeAvatarService,
  bulkAddMembersService,
  updateTableService,
  deleteTableService,
  getColumnsByTableIdService,
  createFieldService,
  getFieldByIdService,
  updateFieldService,
  deleteFieldService,
  createViewService,
  getViewByIdService,
  updateViewService,
  deleteViewService,
  addImageService,
  getOrganizationService,
  updateOrganizationService,
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

  it('throws normalized errors for auth helpers', async () => {
    (client.auth as any).verifyOtp = vi.fn().mockRejectedValue(new Error('bad otp'));
    (client.auth as any).resendOtp = vi.fn().mockRejectedValue({});
    (client.auth as any).forgotPassword = vi.fn().mockRejectedValue({});
    (client.auth as any).resetPassword = vi.fn().mockRejectedValue({});

    await expect(verifyOtp({} as any)).rejects.toThrow('bad otp');
    await expect(resendOtp({} as any)).rejects.toThrow('Failed to resend OTP');
    await expect(forgotPassword({ email: 'user@example.com' })).rejects.toThrow('Failed to send reset password email');
    await expect(resetPassword({ token: 't', new_password: 'pw' })).rejects.toThrow('Failed to reset password');
  });

  it('handles getAllWorkspaces auth-validation and schema errors', async () => {
    localStorage.removeItem('user_id');
    sessionStorage.removeItem('user_id');
    await expect(getAllWorkspacesService()).rejects.toThrow('Missing required authentication data');

    sessionStorage.setItem('user_id', 'u1');
    (client.userService as any).getWorkspaces = vi.fn().mockRejectedValue({ message: 'schema invalid' });
    await expect(getAllWorkspacesService()).rejects.toThrow('Workspace access denied. Please log in again to refresh your session.');
  });

  it('proxies workspace/base/table/user/org service wrappers to SDK', async () => {
    sessionStorage.setItem('user_id', 'user-1');
    const workspaceApi = client.workspace as any;
    const baseApi = client.baseService as any;
    const tableApi = client.tableService as any;
    const userApi = client.userService as any;

    workspaceApi.create = vi.fn().mockResolvedValue({ data: { id: 'w1' } });
    workspaceApi.getById = vi.fn().mockResolvedValue({ data: { id: 'w1' } });
    workspaceApi.update = vi.fn().mockResolvedValue({ data: { id: 'w1' } });
    workspaceApi.delete = vi.fn().mockResolvedValue({ data: { ok: true } });
    workspaceApi.getBasesByWorkspaceId = vi.fn().mockResolvedValue({ data: [] });
    workspaceApi.getMembersWithRoles = vi.fn().mockResolvedValue({ data: [] });
    workspaceApi.removeAccessMember = vi.fn().mockResolvedValue({ data: { ok: true } });
    workspaceApi.removeUserFromWorkspace = vi.fn().mockResolvedValue({ data: { ok: true } });

    baseApi.create = vi.fn().mockResolvedValue({ data: { id: 'b1' } });
    baseApi.getById = vi.fn().mockResolvedValue({ data: { id: 'b1' } });
    baseApi.getTablesByBaseId = vi.fn().mockResolvedValue({ data: [] });
    baseApi.getAll = vi.fn().mockResolvedValue({ data: [] });
    baseApi.update = vi.fn().mockResolvedValue({ data: { id: 'b1' } });
    baseApi.delete = vi.fn().mockResolvedValue({ data: { ok: true } });
    baseApi.getMembersWithRoles = vi.fn().mockResolvedValue({ data: [] });
    baseApi.bulkAddMembers = vi.fn().mockResolvedValue({ data: { ok: true } });
    baseApi.removeAccessMember = vi.fn().mockResolvedValue({ data: { ok: true } });
    baseApi.removeUserFromBase = vi.fn().mockResolvedValue({ data: { ok: true } });
    baseApi.uploadImage = vi.fn().mockResolvedValue({ data: { ok: true } });

    tableApi.create = vi.fn().mockResolvedValue({ data: { id: 't1' } });
    tableApi.getById = vi.fn().mockResolvedValue({ data: { id: 't1' } });
    tableApi.getAll = vi.fn().mockResolvedValue({ data: [] });
    tableApi.update = vi.fn().mockResolvedValue({ data: { id: 't1' } });
    tableApi.delete = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.getColumnsByTableId = vi.fn().mockResolvedValue({ data: [] });
    tableApi.addColumn = vi.fn().mockResolvedValue({ data: { id: 'c1' } });
    tableApi.getColumnById = vi.fn().mockResolvedValue({ data: { id: 'c1' } });
    tableApi.updateColumn = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.deleteColumn = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.reorderColumn = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.createView = vi.fn().mockResolvedValue({ data: { id: 'v1' } });
    tableApi.getViewById = vi.fn().mockResolvedValue({ data: { id: 'v1' } });
    tableApi.updateView = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.deleteView = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.getAllColumns = vi.fn().mockResolvedValue({ data: [] });
    tableApi.getAllViews = vi.fn().mockResolvedValue({ data: [] });
    tableApi.getViewsByModelId = vi.fn().mockResolvedValue({ data: [] });
    tableApi.createRow = vi.fn().mockResolvedValue({ data: { id: 1 } });
    tableApi.deleteRow = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.bulkDeleteRow = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.insertRowData = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.getAllRecords = vi.fn().mockResolvedValue({ data: [] });
    tableApi.insertRelationData = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.addAttachment = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.removeAttachments = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.updateAttachment = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.import = vi.fn().mockResolvedValue({ data: { ok: true } });

    userApi.listUsers = vi.fn().mockResolvedValue({ data: [] });
    userApi.listUsersForAssign = vi.fn().mockResolvedValue({ data: [] });
    userApi.getWorkspaces = vi.fn().mockResolvedValue({ data: [] });
    userApi.getProfile = vi.fn().mockResolvedValue({ data: { id: 'u1' } });
    userApi.updateProfile = vi.fn().mockResolvedValue({ data: { id: 'u1' } });
    userApi.getUserAccessDetails = vi.fn().mockResolvedValue({ data: {} });
    userApi.getUserRolesAndAccess = vi.fn().mockResolvedValue({ data: {} });
    userApi.changePassword = vi.fn().mockResolvedValue({ data: { ok: true } });
    userApi.addOrUpdateAvatar = vi.fn().mockResolvedValue({ data: { ok: true } });
    userApi.removeAvatar = vi.fn().mockResolvedValue({ data: { ok: true } });
    userApi.addUser = vi.fn().mockResolvedValue({ data: { id: 'u1' } });
    userApi.editUser = vi.fn().mockResolvedValue({ data: { id: 'u1' } });
    userApi.deactivateUser = vi.fn().mockResolvedValue({ data: { ok: true } });
    userApi.activateUser = vi.fn().mockResolvedValue({ data: { ok: true } });
    userApi.removeUser = vi.fn().mockResolvedValue({ data: { ok: true } });
    workspaceApi.inviteUser = vi.fn().mockResolvedValue({ data: { ok: true } });
    workspaceApi.bulkAddMembers = vi.fn().mockResolvedValue({ data: { ok: true } });
    (client as any).assetService = (client as any).assetService || {};
    (client as any).organization = (client as any).organization || {};
    (client.assetService as any).addImage = vi.fn().mockResolvedValue({ data: { ok: true } });
    (client.organization as any).getAll = vi.fn().mockResolvedValue({ data: [] });
    (client.organization as any).update = vi.fn().mockResolvedValue({ data: { ok: true } });
    (client.organization as any).getById = vi.fn().mockResolvedValue({ data: { id: 'o1' } });


    await createWorkspaceService({ title: 'w' } as any);
    await getWorkspaceByIdService('w1');
    await getWorkspacesByUser();
    await updateWorkspaceService('w1', { title: 'W' });
    await deleteWorkspaceService('w1');
    await getBasesByWorkspaceIdService('w1');
    await getWorkspaceMembersService('w1');
    await removeUserFromWorkspaceService('w1', { user_id: 'u1' });

    await createBaseService({ title: 'b' });
    await getBaseByIdService('b1');
    await getTablesByBaseIdService('b1');
    await updateBaseService('b1', { title: 'B' });
    await deleteBaseService('b1');
    await getBaseMembersService('b1');
    await bulkAddBaseMembersService('b1', {
      workspaceId: 'w1',
      members: [{ user_id: 'u1', role: 'base-member' }],
    });
    await removeUserFromBaseService('b1', { user_id: 'u1' });

    await createTableService({ title: 't' });
    await getTableByIdService('t1', { includeColumns: true });
    await updateTableService('t1', { title: 't2' });
    await deleteTableService('t1');
    await getColumnsByTableIdService('t1');
    await createFieldService({ model_id: 'm1', title: 'C1' });
    await getFieldByIdService('c1');
    await updateFieldService('c1', { title: 'C2' });
    await deleteFieldService('c1');
    await createViewService({ model_id: 'm1', type: 'grid' });
    await getViewByIdService('v1');
    await getAllViewsService();
    await updateViewService('v1', { title: 'V2' });
    await deleteViewService('v1');
    await getViewsByModelIdService('m1');
    await addRow({ model_id: 'm1' });
    await deleteRowService({ model_id: 'm1', row_id: 1 });
    await bulkDeleteRowService({ model_id: 'm1', row_ids: [1, 2] });
    await insertRowDataService({ model_id: 'm1', column_id: 'c1', row_id: 1, value: 'x' });
    await getAllRecordsService('m1', { pageNumber: 1, pageLimit: 25 });
    await insertRelationDataService({ model_id: 'm1', column_id: 'c1', source_row_id: 1, target_row_id: 2, action: 'link' });
    await addAttachmentService({ model_id: 'm1', column_id: 'c1', row_id: 1, files: [] });
    await removeAttachmentsService({ model_id: 'm1', column_id: 'c1', row_id: 1, attachments: ['x'] });
    await updateAttachmentService({
      model_id: 'm1',
      column_id: 'c1',
      row_id: 1,
      asset_id: 'a1',
      content: { title: 'asset' },
    });
    await addImageService([new File(['a'], 'a.png')]);
    await importService({
      workspace_id: 'w1',
      order_index: 0,
      file: new File(['a'], 'a.csv'),
      config: {},
      primary_column: 'title',
    });

    await getTenantUsersService();
    await getUsersForAssignService();
    await getUserProfileByIDService('u1');
    await updateUserProfileService('u1', { display_name: 'User' });
    await getUserRolesAndAccessService('u1', 'w1');
    await changePasswordService('u1', { old_password: 'x', new_password: 'y' });
    await removeAvatarService('u1');
    await addUserService({ firstname: 'A', lastname: 'B', email: 'a@b.com' });
    await editUserService({ user_id: 'u1', firstname: 'A' });
    await deactivateTenantUserService('u1');
    await activateTenantUserService('u1');
    await removeUserService('u1');
    await bulkAddMembersService('w1', {
      members: [{
        user_id: 'u1',
        memberships: [{ workspace_id: 'w1', role: 'workspace-member' }],
      }],
    });
    await getOrganizationService();
    await updateOrganizationService('o1', { name: 'Org', description: 'desc' });
    expect(client.workspace.create).toHaveBeenCalled();
    expect(client.tableService.createRow).toHaveBeenCalledWith({ model_id: 'm1' });
    expect(client.organization.getAll).toHaveBeenCalled();
  });

  it('continues base update when image upload fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    sessionStorage.setItem('user_id', 'u1');
    (client.baseService as any).update = vi.fn().mockResolvedValue({ data: { id: 'b1' } });

    const result = await updateBaseService('b1', { title: 'Base', image: new File(['x'], 'x.png') });
    expect(result).toEqual({ data: { id: 'b1' } });
    expect((client.baseService as any).update).toHaveBeenCalledWith('b1', { title: 'Base', image: expect.any(File) });
    consoleErrorSpy.mockRestore();
  });

  it('refreshes expired token during auth check', async () => {
    const accessToken = createJwt({ exp: Math.floor(Date.now() / 1000) - 10, user_id: 'user-1' });
    const refreshToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const newAccess = createJwt({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 'user-1' });
    const newRefresh = createJwt({ exp: Math.floor(Date.now() / 1000) + 7200 });

    sessionStorage.setItem('_st_', accessToken);
    sessionStorage.setItem('_te_', String(Math.floor(Date.now() / 1000) - 10));
    sessionStorage.setItem('_rt_', refreshToken);
    sessionStorage.setItem('_rte_', String(Math.floor(Date.now() / 1000) + 3600));
    sessionStorage.setItem('user_id', 'user-1');

    (client.auth as any).refreshToken = vi.fn().mockResolvedValue({
      data: { data: { access_token: newAccess, refresh_token: newRefresh } },
    });

    await expect(isAuthenticated()).resolves.toBe(true);
    expect((client.auth as any).refreshToken).toHaveBeenCalledTimes(1);
    expect(getStoredAccessToken()).toBe(newAccess);
    expect(getStoredRefreshToken()).toBe(newRefresh);
  });

  it('retries an authenticated call once after 401 with refresh', async () => {
    const accessToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 'user-1' });
    const refreshToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 7200 });
    const newAccess = createJwt({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 'user-1' });

    sessionStorage.setItem('_st_', accessToken);
    sessionStorage.setItem('_te_', String(Math.floor(Date.now() / 1000) + 3600));
    sessionStorage.setItem('_rt_', refreshToken);
    sessionStorage.setItem('_rte_', String(Math.floor(Date.now() / 1000) + 7200));
    sessionStorage.setItem('user_id', 'user-1');

    (client.auth as any).refreshToken = vi.fn().mockResolvedValue({
      data: { data: { access_token: newAccess, refresh_token: refreshToken } },
    });

    const createSpy = vi.fn()
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ data: { id: 'w1' } });
    (client.workspace as any).create = createSpy;

    await expect(createWorkspaceService({ title: 'W' } as any)).resolves.toEqual({ data: { id: 'w1' } });
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect((client.auth as any).refreshToken).toHaveBeenCalledTimes(1);
  });

  it('initializes client token from storage', async () => {
    const setAuthSpy = vi.spyOn(client, 'setAuth');
    const accessToken = createJwt({ exp: Math.floor(Date.now() / 1000) + 3600, user_id: 'user-1' });
    sessionStorage.setItem('_st_', accessToken);
    sessionStorage.setItem('_te_', String(Math.floor(Date.now() / 1000) + 3600));

    const svc = await import('../clientService');
    await svc.initializeClientToken();

    expect(setAuthSpy).toHaveBeenCalledWith(accessToken);
  });

  it('initializes workspace/base headers from navigation store state', async () => {
    const setHeadersSpy = vi.spyOn(client, 'setHeaders');
    vi.doMock('../../stores/navigationStore', () => ({
      useNavigationStore: {
        getState: () => ({
          selectedWorkspaceId: 'w-nav',
          selectedBaseId: 'b-nav',
        }),
      },
    }));

    const svc = await import('../clientService');
    await svc.initializeClientToken();

    expect(setHeadersSpy).toHaveBeenCalledWith({ workspace: 'w-nav', base: 'b-nav' });
  });

  it('uses localStorage user_id for authenticated state fallback', async () => {
    sessionStorage.setItem('_st_', 'access-token');
    localStorage.setItem('user_id', 'user-local');
    await expect(isAuthenticated()).resolves.toBe(true);
  });

  it('returns false when tab is locked', async () => {
    sessionStorage.setItem('sb_tab_locked', '1');
    sessionStorage.setItem('_st_', 'access-token');
    sessionStorage.setItem('user_id', 'user-1');

    await expect(isAuthenticated()).resolves.toBe(false);

    sessionStorage.removeItem('sb_tab_locked');
  });

  it('forceLogout does not hard-redirect when already on login route', async () => {
    const setAuthSpy = vi.spyOn(client, 'setAuth');
    sessionStorage.setItem('user_id', 'user-1');
    (globalThis as any).location.pathname = '/login';
    (globalThis as any).location.href = '/login';

    vi.useFakeTimers();
    await forceLogout();
    vi.runAllTimers();

    expect(setAuthSpy).toHaveBeenCalledWith('');
    expect((globalThis as any).location.href).toBe('/login');
    vi.useRealTimers();
  });

  it('stores user_role when login token contains a string role', async () => {
    const accessToken = createJwt({
      exp: Math.floor(Date.now() / 1000) + 3600,
      roles: 'workspace-owner',
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
        },
      },
    });

    await login({ email: 'user@example.com', password: 'pw' } as any);
    expect(sessionStorage.getItem('user_role')).toBe('workspace-owner');
  });
});
