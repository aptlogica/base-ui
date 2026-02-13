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
  getTablesByWorkspaceIdService,
  updateWorkspaceService,
  deleteWorkspaceService,
  getBasesByWorkspaceIdService,
  getWorkspaceMembersService,
  removeAccessMemberService,
  removeUserFromWorkspaceService,
  createBaseService,
  getBaseByIdService,
  getTablesByBaseIdService,
  getAllBasesService,
  updateBaseService,
  deleteBaseService,
  getBaseMembersService,
  removeBaseAccessMemberService,
  removeUserFromBaseService,
  createTableService,
  getTableByIdService,
  getAllTablesService,
  getAllFieldsService,
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
  updateAssetByIdService,
  importTableService,
  getTenantUsersService,
  getUsersForAssignService,
  addUserService,
  editUserService,
  deactivateTenantUserService,
  activateTenantUserService,
  removeUserService,
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

  it('proxies workspace/base/table/user/org service wrappers to SDK', async () => {
    sessionStorage.setItem('user_id', 'user-1');
    const workspaceApi = client.workspace as any;
    const baseApi = client.baseService as any;
    const tableApi = client.tableService as any;
    const userApi = client.userService as any;

    workspaceApi.create = vi.fn().mockResolvedValue({ data: { id: 'w1' } });
    workspaceApi.getById = vi.fn().mockResolvedValue({ data: { id: 'w1' } });
    workspaceApi.getTablesByWorkspaceId = vi.fn().mockResolvedValue({ data: [] });
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
    baseApi.removeAccessMember = vi.fn().mockResolvedValue({ data: { ok: true } });
    baseApi.removeUserFromBase = vi.fn().mockResolvedValue({ data: { ok: true } });

    tableApi.create = vi.fn().mockResolvedValue({ data: { id: 't1' } });
    tableApi.getById = vi.fn().mockResolvedValue({ data: { id: 't1' } });
    tableApi.getAll = vi.fn().mockResolvedValue({ data: [] });
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
    tableApi.updateAssetById = vi.fn().mockResolvedValue({ data: { ok: true } });
    tableApi.import = vi.fn().mockResolvedValue({ data: { ok: true } });

    userApi.listUsers = vi.fn().mockResolvedValue({ data: [] });
    userApi.listUsersForAssign = vi.fn().mockResolvedValue({ data: [] });
    userApi.getWorkspaces = vi.fn().mockResolvedValue({ data: [] });
    userApi.addUser = vi.fn().mockResolvedValue({ data: { id: 'u1' } });
    userApi.editUser = vi.fn().mockResolvedValue({ data: { id: 'u1' } });
    userApi.deactivateUser = vi.fn().mockResolvedValue({ data: { ok: true } });
    userApi.activateUser = vi.fn().mockResolvedValue({ data: { ok: true } });
    userApi.removeUser = vi.fn().mockResolvedValue({ data: { ok: true } });


    await createWorkspaceService({ title: 'w' } as any);
    await getWorkspaceByIdService('w1');
    await getWorkspacesByUser();
    await getTablesByWorkspaceIdService('w1');
    await updateWorkspaceService('w1', { title: 'W' });
    await deleteWorkspaceService('w1');
    await getBasesByWorkspaceIdService('w1');
    await getWorkspaceMembersService('w1');
    await removeAccessMemberService('w1', 'a1');
    await removeUserFromWorkspaceService('w1', { user_id: 'u1' });

    await createBaseService({ title: 'b' });
    await getBaseByIdService('b1');
    await getTablesByBaseIdService('b1');
    await getAllBasesService();
    await updateBaseService('b1', { title: 'B' });
    await deleteBaseService('b1');
    await getBaseMembersService('b1');
    await removeBaseAccessMemberService('b1', 'a1');
    await removeUserFromBaseService('b1', { user_id: 'u1' });

    await createTableService({ title: 't' });
    await getTableByIdService('t1', { includeColumns: true });
    await getAllTablesService();
    await getAllFieldsService();
    await getAllViewsService();
    await getViewsByModelIdService('m1');
    await addRow('m1');
    await deleteRowService({ model_id: 'm1', row_id: 1 });
    await bulkDeleteRowService({ model_id: 'm1', row_ids: [1, 2] });
    await insertRowDataService({ model_id: 'm1', column_id: 'c1', row_id: 1, value: 'x' });
    await getAllRecordsService('m1', { pageNumber: 1, pageLimit: 25 });
    await insertRelationDataService({ model_id: 'm1', column_id: 'c1', source_row_id: 1, target_row_id: 2, action: 'link' });
    await addAttachmentService({ model_id: 'm1', column_id: 'c1', row_id: 1, files: [] });
    await removeAttachmentsService({ model_id: 'm1', column_id: 'c1', row_id: 1, attachments: ['x'] });
    await updateAssetByIdService('a1', { title: 'asset' });
    await importTableService({ workspace_id: 'w1', title: 'T', description: '', order_index: 0, file: new File(['a'], 'a.csv') });

    await getTenantUsersService();
    await getUsersForAssignService();
    await addUserService({ firstname: 'A', lastname: 'B', email: 'a@b.com' });
    await editUserService({ user_id: 'u1', firstname: 'A' });
    await deactivateTenantUserService('u1');
    await activateTenantUserService('u1');
    await removeUserService('u1');
    expect(client.workspace.create).toHaveBeenCalled();
    expect(client.baseService.getAll).toHaveBeenCalled();
    expect(client.tableService.createRow).toHaveBeenCalledWith({ model_id: 'm1' });
  });
});
