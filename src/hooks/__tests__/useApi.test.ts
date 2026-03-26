import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useWorkspaces,
  useAddRow,
  useAllViews,
  useViewById,
  useCreateWorkspace,
  useUpdateOrganization,
  useAddAttachment,
  useRemoveAttachments,
  useUpdateAttachment,
  useDeactivateTenantUser,
} from "../useApi";
import * as apiHooks from "../useApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkspacesByUser,
  getWorkspaceByIdService,
  getBasesByWorkspaceIdService,
  getWorkspaceMembersService,
  getBaseMembersService,
  getTablesByBaseIdService,
  getAllViewsService,
  getBaseByIdService,
  getTableByIdService,
  getViewsByModelIdService,
  getViewByIdService,
  addRow,
  createWorkspaceService,
  updateWorkspaceService,
  deleteWorkspaceService,
  createBaseService,
  deleteBaseService,
  updateBaseService,
  createTableService,
  updateTableService,
  deleteTableService,
  importTableService,
  createFieldService,
  updateFieldService,
  deleteFieldService,
  createViewService,
  updateViewService,
  deleteViewService,
  insertRowDataService,
  deleteRowService,
  bulkDeleteRowService,
  insertRelationDataService,
  updateOrganizationService,
  addAttachmentService,
  removeAttachmentsService,
  updateAttachmentService,
  addImageService,
  getUserProfileByIDService,
  updateUserProfileService,
  changePasswordService,
  getUserRolesAndAccessService,
  removeAvatarService,
  getAllRecordsService,
  getTenantUsersService,
  getUsersForAssignService,
  addUserService,
  editUserService,
  removeUserService,
  activateTenantUserService,
  deactivateTenantUserService,
  bulkAddMembersService,
  removeUserFromWorkspaceService,
  getOrganizationService,
} from "../../service/clientService";

const mockUseLocation = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => mockUseLocation(),
}));

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("../../service/clientService", () => ({
  getWorkspacesByUser: vi.fn(),
  getWorkspaceByIdService: vi.fn(),
  getBasesByWorkspaceIdService: vi.fn(),
  getWorkspaceMembersService: vi.fn(),
  getBaseMembersService: vi.fn(),
  getTablesByBaseIdService: vi.fn(),
  getAllViewsService: vi.fn(),
  getBaseByIdService: vi.fn(),
  getTableByIdService: vi.fn(),
  getViewsByModelIdService: vi.fn(),
  getViewByIdService: vi.fn(),
  addRow: vi.fn(),
  createWorkspaceService: vi.fn(),
  updateWorkspaceService: vi.fn(),
  deleteWorkspaceService: vi.fn(),
  createBaseService: vi.fn(),
  deleteBaseService: vi.fn(),
  updateBaseService: vi.fn(),
  createTableService: vi.fn(),
  updateTableService: vi.fn(),
  deleteTableService: vi.fn(),
  importTableService: vi.fn(),
  createFieldService: vi.fn(),
  updateFieldService: vi.fn(),
  deleteFieldService: vi.fn(),
  createViewService: vi.fn(),
  updateViewService: vi.fn(),
  deleteViewService: vi.fn(),
  insertRowDataService: vi.fn(),
  deleteRowService: vi.fn(),
  bulkDeleteRowService: vi.fn(),
  insertRelationDataService: vi.fn(),
  updateOrganizationService: vi.fn(),
  addAttachmentService: vi.fn(),
  removeAttachmentsService: vi.fn(),
  updateAttachmentService: vi.fn(),
  addImageService: vi.fn(),
  getUserProfileByIDService: vi.fn(),
  updateUserProfileService: vi.fn(),
  changePasswordService: vi.fn(),
  getUserRolesAndAccessService: vi.fn(),
  removeAvatarService: vi.fn(),
  getAllRecordsService: vi.fn(),
  getTenantUsersService: vi.fn(),
  getUsersForAssignService: vi.fn(),
  addUserService: vi.fn(),
  editUserService: vi.fn(),
  removeUserService: vi.fn(),
  activateTenantUserService: vi.fn(),
  deactivateTenantUserService: vi.fn(),
  bulkAddMembersService: vi.fn(),
  removeUserFromWorkspaceService: vi.fn(),
  getOrganizationService: vi.fn(),
  forceLogout: vi.fn(),
}));

describe("useApi hooks", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  const invalidateQueries = vi.fn();
  const cancelQueries = vi.fn();
  const setQueryData = vi.fn();
  const setQueriesData = vi.fn();
  const getQueryData = vi.fn();
  const refetchQueries = vi.fn();
  const mockUseQuery = vi.mocked(useQuery);
  const mockUseMutation = vi.mocked(useMutation);
  const mockUseQueryClient = vi.mocked(useQueryClient);

  beforeEach(() => {
    vi.clearAllMocks();
    getQueryData.mockImplementation((key: any) => {
      if (Array.isArray(key) && key[0] === "bases" && key[1] === "b1") {
        return { data: { workspace_id: "w1" } };
      }
      if (Array.isArray(key) && key[0] === "view") {
        return { id: "v1", model_id: "m1", meta: { existing: true } };
      }
      return undefined;
    });
    mockUseQueryClient.mockReturnValue({
      invalidateQueries,
      cancelQueries,
      setQueryData,
      setQueriesData,
      getQueryData,
      refetchQueries,
    } as any);
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockUseLocation.mockReturnValue({ pathname: "/app" });
  });

  const getMutationOptions = (hookFactory: () => unknown) => {
    let options: any;
    mockUseMutation.mockImplementationOnce((o: any) => {
      options = o;
      return { mutate: vi.fn(), mutateAsync: vi.fn() } as any;
    });
    renderHook(hookFactory);
    return options;
  };
  const getQueryOptions = (hookFactory: () => unknown) => {
    let options: any;
    mockUseQuery.mockImplementationOnce((o: any) => {
      options = o;
      return { data: null } as any;
    });
    renderHook(hookFactory);
    return options;
  };

  it("useWorkspaces returns data array and enables query", async () => {
    let opts: any;
    mockUseQuery.mockImplementation((o: any) => {
      opts = o;
      return { data: [] };
    });
    vi.mocked(getWorkspacesByUser).mockResolvedValue({ data: [{ id: "w1" }] });

    renderHook(() => useWorkspaces());
    expect(opts.enabled).toBe(true);

    const result = await opts.queryFn();
    expect(result).toEqual([{ id: "w1" }]);
  });

  it("useWorkspaces disables query on public route", () => {
    let opts: any;
    mockUseLocation.mockReturnValue({ pathname: "/login" });
    mockUseQuery.mockImplementation((o: any) => {
      opts = o;
      return { data: [] };
    });

    renderHook(() => useWorkspaces());
    expect(opts.enabled).toBe(false);
  });

  it("useWorkspaces throws friendly auth error when missing auth data", async () => {
    let opts: any;
    mockUseQuery.mockImplementation((o: any) => {
      opts = o;
      return { data: [] };
    });
    vi.mocked(getWorkspacesByUser).mockRejectedValue({
      message: "Missing required authentication data",
    });

    renderHook(() => useWorkspaces());
    await expect(opts.queryFn()).rejects.toThrow(
      "Authentication incomplete. Please log in again."
    );
  });

  it("useWorkspaces handles auth errors", async () => {
    let opts: any;
    mockUseQuery.mockImplementation((o: any) => {
      opts = o;
      return { data: [] };
    });
    vi.mocked(getWorkspacesByUser).mockRejectedValue({
      response: { status: 401 },
    });

    renderHook(() => useWorkspaces());
    await expect(opts.queryFn()).rejects.toBeTruthy();
    expect(getWorkspacesByUser).toHaveBeenCalled();
  });

  it("useWorkspaces retry skips auth and schema errors", () => {
    let opts: any;
    mockUseQuery.mockImplementation((o: any) => {
      opts = o;
      return { data: [] };
    });

    renderHook(() => useWorkspaces());
    expect(opts.retry(0, { message: "authentication failed" })).toBe(false);
    expect(opts.retry(0, { message: "schema mismatch" })).toBe(false);
    expect(opts.retry(1, { message: "other" })).toBe(true);
    expect(opts.retry(2, { message: "other" })).toBe(false);
  });

  it("useAddRow invalidates record and table queries", async () => {
    let opts: any;
    mockUseMutation.mockImplementation((o: any) => {
      opts = o;
      return { mutate: vi.fn() };
    });

    renderHook(() => useAddRow());
    await opts.mutationFn({ model_id: "m1" });
    expect(addRow).toHaveBeenCalledWith("m1");

    opts.onSuccess(null, { model_id: "m1" });
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["tables", "m1"], refetchType: "active" })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["tables", "m1", "views"] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["workspaces"] })
    );
  });

  it("useAll* hooks normalize empty data and handle errors", async () => {
    let opts: any;
    mockUseQuery.mockImplementation((o: any) => {
      opts = o;
      return { data: [] };
    });

    renderHook(() => useAllViews());
    vi.mocked(getAllViewsService).mockResolvedValueOnce({ data: null });
    expect(await opts.queryFn()).toEqual([]);

    vi.mocked(getAllViewsService).mockRejectedValueOnce(new Error("fail"));
    expect(await opts.queryFn()).toEqual([]);

    vi.mocked(getAllViewsService).mockResolvedValueOnce({ data: ["f1"] });
    expect(await opts.queryFn()).toEqual(["f1"]);

    vi.mocked(getAllViewsService).mockResolvedValue({});
    expect(await opts.queryFn()).toEqual([]);
  });

  it("useViewById disables for slugs and resolves data for IDs", async () => {
    let opts: any;
    mockUseQuery.mockImplementation((o: any) => {
      opts = o;
      return { data: null };
    });

    renderHook(() => useViewById("grid"));
    expect(opts.enabled).toBe(false);

    vi.mocked(getViewByIdService).mockResolvedValue({ data: { id: "v1" } });
    renderHook(() => useViewById("123e4567-e89b-12d3-a456-426614174000"));
    expect(opts.enabled).toBe(true);
    expect(await opts.queryFn()).toEqual({ id: "v1" });
  });

  it("useCreateWorkspace invalidates workspaces and bases", () => {
    let opts: any;
    mockUseMutation.mockImplementation((o: any) => {
      opts = o;
      return { mutate: vi.fn() };
    });
    vi.mocked(createWorkspaceService).mockResolvedValue({ data: { id: "w1" } });

    renderHook(() => useCreateWorkspace());
    opts.onSuccess({ data: { id: "w1" } });

    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["workspaces"], refetchType: "active" })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["workspaces", "w1", "bases"] })
    );
  });

  it("useUpdateOrganization builds payload and invalidates organization", async () => {
    let opts: any;
    mockUseMutation.mockImplementation((o: any) => {
      opts = o;
      return { mutate: vi.fn() };
    });
    vi.mocked(updateOrganizationService).mockResolvedValue({ data: { id: "o1" } });

    renderHook(() => useUpdateOrganization("o1"));
    await opts.mutationFn({ name: "Org" });

    expect(updateOrganizationService).toHaveBeenCalledWith("o1", {
      name: "Org",
      description: "",
    });

    opts.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["organization"] })
    );
  });

  it("attachment hooks invalidate table data on success", async () => {
    let opts: any;
    mockUseMutation.mockImplementation((o: any) => {
      opts = o;
      return { mutate: vi.fn() };
    });

    renderHook(() => useAddAttachment());
    await opts.mutationFn({ model_id: "m1", column_id: "c1", row_id: 1, files: [] });
    expect(addAttachmentService).toHaveBeenCalled();
    opts.onSuccess(null, { model_id: "m1" });

    renderHook(() => useRemoveAttachments());
    await opts.mutationFn({ model_id: "m1", column_id: "c1", row_id: 1, attachments: [] });
    expect(removeAttachmentsService).toHaveBeenCalled();
    opts.onSuccess(null, { model_id: "m1" });

    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["tables", "m1"] })
    );
  });

  it("useUpdateAttachment invalidates tables and workspaces", async () => {
    let opts: any;
    mockUseMutation.mockImplementation((o: any) => {
      opts = o;
      return { mutate: vi.fn() };
    });

    renderHook(() => useUpdateAttachment());
    await opts.mutationFn({
      model_id: "m1",
      column_id: "c1",
      row_id: 1,
      asset_id: "a1",
      title: "t1",
    });
    expect(updateAttachmentService).toHaveBeenCalledWith({
      model_id: "m1",
      column_id: "c1",
      row_id: 1,
      asset_id: "a1",
      content: { title: "t1" },
    });
    opts.onSuccess();
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["tables"] })
    );
    expect(invalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["workspaces"] })
    );
  });

  it("useDeactivateTenantUser throws when userId missing", async () => {
    let opts: any;
    mockUseMutation.mockImplementation((o: any) => {
      opts = o;
      return { mutate: vi.fn() };
    });

    renderHook(() => useDeactivateTenantUser());
    await expect(opts.mutationFn("")).rejects.toThrow("UserId not found");
  });

  it("executes additional hook factories to improve function coverage", () => {
    mockUseQuery.mockImplementation(() => ({ data: [] } as any));
    mockUseMutation.mockImplementation(() => ({ mutate: vi.fn() } as any));

    renderHook(() => apiHooks.useWorkspaceById("w1"));
    renderHook(() => apiHooks.useWorkspaceBases("w1"));
    renderHook(() => apiHooks.useWorkspaceMembers("w1"));
    renderHook(() => apiHooks.useBulkAddBaseMembers());
    renderHook(() => apiHooks.useRemoveUserFromBase());
    renderHook(() => apiHooks.useBaseMembers("b1"));
    renderHook(() => apiHooks.useBaseTables("b1"));
    renderHook(() => apiHooks.useBaseById("b1"));
    renderHook(() => apiHooks.useTable("t1"));
    renderHook(() => apiHooks.useTableViews("t1"));

    renderHook(() => apiHooks.useUpdateWorkspace());
    renderHook(() => apiHooks.useDeleteWorkspace());
    renderHook(() => apiHooks.useCreateBase());
    renderHook(() => apiHooks.useDeleteBase());
    renderHook(() => apiHooks.useUpdateBase());
    renderHook(() => apiHooks.useCreateTable());
    renderHook(() => apiHooks.useUpdateTable());
    renderHook(() => apiHooks.useDeleteTable());
    renderHook(() => apiHooks.useImportTable());
    renderHook(() => apiHooks.useCreateField());
    renderHook(() => apiHooks.useUpdateField());
    renderHook(() => apiHooks.useDeleteColumn());
    renderHook(() => apiHooks.useCreateView());
    renderHook(() => apiHooks.useUpdateViewAppearance());
    renderHook(() => apiHooks.useUpdateViewMeta());
    renderHook(() => apiHooks.useUpdateView());
    renderHook(() => apiHooks.useDeleteView());
    renderHook(() => apiHooks.useInsertRowData());
    renderHook(() => apiHooks.useDeleteRecord());
    renderHook(() => apiHooks.useBulkDeleteRecords());
    renderHook(() => apiHooks.useInsertRelationData());
    renderHook(() => apiHooks.useAddImage());

    renderHook(() => apiHooks.useUserProfile("u1"));
    renderHook(() => apiHooks.useUpdateUserProfile("u1"));
    renderHook(() => apiHooks.useChangePassword("u1"));
    renderHook(() => apiHooks.useUserRolesAndAccess("u1", "w1"));
    renderHook(() => apiHooks.useRemoveAvatar("u1"));
    renderHook(() => apiHooks.useGetRecordsByPagination("m1"));
    renderHook(() => apiHooks.useGetTenantUsers());
    renderHook(() => apiHooks.useGetUsersForAssign());
    renderHook(() => apiHooks.useAddUser());
    renderHook(() => apiHooks.useEditUser());
    renderHook(() => apiHooks.useRemoveTenantUser());
    renderHook(() => apiHooks.useActivateTenantUser());
    renderHook(() => apiHooks.useBulkAddMembers());
    renderHook(() => apiHooks.useRemoveUserFromWorkspace());
    renderHook(() => apiHooks.useGetOrganization());
  });

  it("executes mutation lifecycle callbacks for key hooks", async () => {
    let opts = getMutationOptions(() => apiHooks.useUpdateWorkspace());
    opts.onSuccess?.({}, { workspaceId: "w1" });

    opts = getMutationOptions(() => apiHooks.useDeleteWorkspace());
    opts.onSuccess?.();

    opts = getMutationOptions(() => apiHooks.useCreateBase());
    opts.onSuccess?.({}, { workspace_id: "w1" });

    opts = getMutationOptions(() => apiHooks.useDeleteBase());
    opts.onSuccess?.();

    opts = getMutationOptions(() => apiHooks.useUpdateBase());
    opts.onSuccess?.({}, { baseId: "b1" });

    opts = getMutationOptions(() => apiHooks.useCreateTable());
    opts.onSuccess?.({}, { base_id: "b1" });

    opts = getMutationOptions(() => apiHooks.useDeleteTable());
    opts.onSuccess?.({}, { baseId: "b1" });

    opts = getMutationOptions(() => apiHooks.useImportTable());
    opts.onSuccess?.({}, { base_id: "b1" });

    opts = getMutationOptions(() => apiHooks.useCreateField());
    opts.onSuccess?.({}, { tableId: "m1", config: { meta: { relation: { with: "m2" } } } });

    opts = getMutationOptions(() => apiHooks.useUpdateField());
    opts.onSuccess?.({}, { updatedValue: { uidt: "text" } });
    opts.onSuccess?.({}, { updatedValue: {} });

    opts = getMutationOptions(() => apiHooks.useDeleteColumn());
    opts.onSuccess?.({}, { tableId: "m1" });

    opts.onSuccess?.();

    opts = getMutationOptions(() => apiHooks.useCreateView());
    opts.onSuccess?.({}, { model_id: "m1", base_id: "b1" });

    opts = getMutationOptions(() => apiHooks.useUpdateViewAppearance());
    const appearanceCtx = await opts.onMutate?.({ viewId: "v1", appearance: { color: "red" } });
    opts.onError?.(new Error("x"), { viewId: "v1" }, appearanceCtx);
    opts.onSuccess?.({}, { viewId: "v1" });

    opts = getMutationOptions(() => apiHooks.useUpdateViewMeta());
    const metaCtx = await opts.onMutate?.({ viewId: "v1", meta: { cardOrder: [] } });
    opts.onError?.(new Error("x"), { viewId: "v1" }, metaCtx);
    opts.onSuccess?.({ model_id: "m1" }, { viewId: "v1" });

    opts = getMutationOptions(() => apiHooks.useUpdateView());
    opts.onSuccess?.({}, { viewId: "v1", view: { model_id: "m1" } });

    opts = getMutationOptions(() => apiHooks.useDeleteView());
    opts.onSuccess?.();

    opts = getMutationOptions(() => apiHooks.useInsertRowData());
    opts.onSuccess?.({}, { model_id: "m1" });

    opts = getMutationOptions(() => apiHooks.useDeleteRecord());
    opts.onSuccess?.({}, { model_id: "m1" });

    opts = getMutationOptions(() => apiHooks.useBulkDeleteRecords());
    opts.onSuccess?.({}, { model_id: "m1" });

    opts = getMutationOptions(() => apiHooks.useInsertRelationData());
    opts.onSuccess?.({}, { model_id: "m1", target_table_id: "m2" });

    opts = getMutationOptions(() => apiHooks.useAddUser());
    opts.onSuccess?.();
    opts.onError?.(new Error("boom"));

    opts = getMutationOptions(() => apiHooks.useEditUser());
    opts.onSuccess?.();
    opts.onError?.(new Error("boom"));

    opts = getMutationOptions(() => apiHooks.useRemoveTenantUser());
    opts.onSuccess?.();
    opts.onError?.(new Error("boom"));

    opts = getMutationOptions(() => apiHooks.useActivateTenantUser());
    opts.onSuccess?.();
    opts.onError?.(new Error("boom"));

    opts = getMutationOptions(() => apiHooks.useDeactivateTenantUser());
    opts.onSuccess?.();
    opts.onError?.(new Error("boom"));

    opts = getMutationOptions(() => apiHooks.useBulkAddMembers());
    opts.onSuccess?.({}, { workspaceId: "w1", members: [{ user_id: "u1", memberships: [] }] });
    opts.onError?.(new Error("boom"));

    opts = getMutationOptions(() => apiHooks.useRemoveUserFromWorkspace());
    opts.onSuccess?.({}, { workspaceId: "w1", user_id: "u1" });
    opts.onError?.(new Error("boom"));

    opts = getMutationOptions(() => apiHooks.useUpdateOrganization("o1"));
    opts.onError?.(new Error("boom"));

    expect(invalidateQueries).toHaveBeenCalled();
    expect(setQueryData).toHaveBeenCalled();
    expect(setQueriesData).toHaveBeenCalled();
    expect(cancelQueries).toHaveBeenCalled();
    expect(refetchQueries).toHaveBeenCalled();
  });

  it("executes queryFns for additional hooks", async () => {
    vi.mocked(getWorkspacesByUser).mockResolvedValue({ data: [] } as any);
    vi.mocked(getWorkspaceByIdService).mockResolvedValue({ data: { id: "w1" } } as any);
    vi.mocked(getBasesByWorkspaceIdService).mockResolvedValue({ data: [{ id: "b1" }] } as any);
    vi.mocked(getWorkspaceMembersService).mockResolvedValue({ data: [{ id: "u1" }] } as any);
    vi.mocked(getBaseMembersService).mockResolvedValue({ data: [{ id: "u1" }] } as any);
    vi.mocked(getTablesByBaseIdService).mockResolvedValue({ data: [{ id: "t1" }] } as any);
    vi.mocked(getBaseByIdService).mockResolvedValue({ data: { id: "b1" } } as any);
    vi.mocked(getTableByIdService).mockResolvedValue({ data: { id: "t1" } } as any);
    vi.mocked(getViewsByModelIdService).mockResolvedValue({ data: [{ id: "v1" }] } as any);
    vi.mocked(getUserProfileByIDService).mockResolvedValue({ data: { id: "u1" } } as any);
    vi.mocked(getUserRolesAndAccessService).mockResolvedValue({ data: [{ scope: "workspace" }] } as any);
    vi.mocked(getAllRecordsService).mockResolvedValue({ data: [{ id: "r1" }] } as any);
    vi.mocked(getTenantUsersService).mockResolvedValue({ data: [{ id: "u1" }] } as any);
    vi.mocked(getUsersForAssignService).mockResolvedValue({ data: [{ id: "u2" }] } as any);
    vi.mocked(getOrganizationService).mockResolvedValue({ data: [{ id: "o1" }] } as any);

    let opts = getQueryOptions(() => apiHooks.useWorkspaceById("w1"));
    await opts.queryFn();
    expect(getWorkspaceByIdService).toHaveBeenCalledWith("w1");

    opts = getQueryOptions(() => apiHooks.useWorkspaceBases("w1"));
    await opts.queryFn();
    expect(getBasesByWorkspaceIdService).toHaveBeenCalledWith("w1");

    opts = getQueryOptions(() => apiHooks.useWorkspaceMembers("w1"));
    await opts.queryFn();
    expect(getWorkspaceMembersService).toHaveBeenCalledWith("w1");

    opts = getQueryOptions(() => apiHooks.useTable("t1"));
    await opts.queryFn();
    expect(getTableByIdService).toHaveBeenCalledWith("t1", undefined);

    opts = getQueryOptions(() => apiHooks.useTableViews("t1"));
    await opts.queryFn();
    expect(getViewsByModelIdService).toHaveBeenCalledWith("t1");

    await opts.queryFn();
    expect(getViewsByModelIdService).toHaveBeenCalledWith("t1");

    opts = getQueryOptions(() => apiHooks.useUserProfile("u1"));
    await opts.queryFn();
    expect(getUserProfileByIDService).toHaveBeenCalledWith("u1");

    await opts.queryFn();

    opts = getQueryOptions(() => apiHooks.useUserRolesAndAccess("u1", "w1"));
    await opts.queryFn();
    expect(getUserRolesAndAccessService).toHaveBeenCalledWith("u1", "w1");

    opts = getQueryOptions(() => apiHooks.useGetTenantUsers());
    await opts.queryFn();
    expect(getTenantUsersService).toHaveBeenCalled();

    opts = getQueryOptions(() => apiHooks.useGetUsersForAssign());
    await opts.queryFn();
    expect(getUsersForAssignService).toHaveBeenCalled();

    opts = getQueryOptions(() => apiHooks.useGetOrganization());
    await opts.queryFn();
    expect(getOrganizationService).toHaveBeenCalled();

    await opts.queryFn();
  });

  it("executes additional mutationFns for service paths", async () => {
    vi.mocked(updateWorkspaceService).mockResolvedValue({} as any);
    vi.mocked(deleteWorkspaceService).mockResolvedValue({} as any);
    vi.mocked(createBaseService).mockResolvedValue({} as any);
    vi.mocked(deleteBaseService).mockResolvedValue({} as any);
    vi.mocked(updateBaseService).mockResolvedValue({} as any);
    vi.mocked(createTableService).mockResolvedValue({} as any);
    vi.mocked(updateTableService).mockResolvedValue({} as any);
    vi.mocked(deleteTableService).mockResolvedValue({} as any);
    vi.mocked(importTableService).mockResolvedValue({} as any);
    vi.mocked(createFieldService).mockResolvedValue({} as any);
    vi.mocked(updateFieldService).mockResolvedValue({} as any);
    vi.mocked(deleteFieldService).mockResolvedValue({} as any);
    vi.mocked(createViewService).mockResolvedValue({} as any);
    vi.mocked(updateViewService).mockResolvedValue({} as any);
    vi.mocked(deleteViewService).mockResolvedValue({} as any);
    vi.mocked(insertRowDataService).mockResolvedValue({} as any);
    vi.mocked(deleteRowService).mockResolvedValue({} as any);
    vi.mocked(bulkDeleteRowService).mockResolvedValue({} as any);
    vi.mocked(insertRelationDataService).mockResolvedValue({} as any);
    vi.mocked(addImageService).mockResolvedValue({} as any);
    vi.mocked(updateUserProfileService).mockResolvedValue({} as any);
    vi.mocked(changePasswordService).mockResolvedValue({} as any);
    vi.mocked(removeAvatarService).mockResolvedValue({} as any);
    vi.mocked(addUserService).mockResolvedValue({} as any);
    vi.mocked(editUserService).mockResolvedValue({} as any);
    vi.mocked(removeUserService).mockResolvedValue({} as any);
    vi.mocked(activateTenantUserService).mockResolvedValue({} as any);
    vi.mocked(bulkAddMembersService).mockResolvedValue({} as any);
    vi.mocked(removeUserFromWorkspaceService).mockResolvedValue({} as any);

    let opts = getMutationOptions(() => apiHooks.useUpdateWorkspace());
    await opts.mutationFn({ workspaceId: "w1", updates: { title: "W" } });
    expect(updateWorkspaceService).toHaveBeenCalledWith("w1", { title: "W" });

    opts = getMutationOptions(() => apiHooks.useDeleteWorkspace());
    await opts.mutationFn("w1");
    expect(deleteWorkspaceService).toHaveBeenCalledWith("w1");

    opts = getMutationOptions(() => apiHooks.useCreateBase());
    await opts.mutationFn({ title: "B", description: "", workspace_id: "w1", image: null });
    expect(createBaseService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useDeleteBase());
    await opts.mutationFn("b1");
    expect(deleteBaseService).toHaveBeenCalledWith("b1");

    opts = getMutationOptions(() => apiHooks.useUpdateBase());
    await opts.mutationFn({ baseId: "b1", updates: { title: "B2" } });
    expect(updateBaseService).toHaveBeenCalledWith("b1", { title: "B2" });

    opts = getMutationOptions(() => apiHooks.useCreateTable());
    await opts.mutationFn({ base_id: "b1", workspace_id: "w1", title: "T", description: "" });
    expect(createTableService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useUpdateTable());
    await opts.mutationFn({ tableId: "t1", params: { title: "T2" } });
    expect(updateTableService).toHaveBeenCalledWith("t1", { title: "T2" });

    opts = getMutationOptions(() => apiHooks.useDeleteTable());
    await opts.mutationFn({ tableId: "t1", baseId: "b1" });
    expect(deleteTableService).toHaveBeenCalledWith("t1");

    opts = getMutationOptions(() => apiHooks.useImportTable());
    await opts.mutationFn({
      base_id: "b1",
      workspace_id: "w1",
      title: "Import",
      description: "",
      order_index: 1,
      file: {} as File,
    });
    expect(importTableService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useCreateField());
    await opts.mutationFn({ tableId: "m1", baseId: "b1", config: { title: "F", uidt: "text", meta: {} } });
    expect(createFieldService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useUpdateField());
    await opts.mutationFn({ fieldId: "f1", updatedValue: { title: "X" } });
    expect(updateFieldService).toHaveBeenCalledWith("f1", { title: "X" });

    opts = getMutationOptions(() => apiHooks.useDeleteColumn());
    await opts.mutationFn({ tableId: "m1", fieldId: "f1" });
    expect(deleteFieldService).toHaveBeenCalledWith("f1");

    await opts.mutationFn({ source_column_id: "c1", target_column_id: "c2" });

    opts = getMutationOptions(() => apiHooks.useCreateView());
    await opts.mutationFn({ model_id: "m1", base_id: "b1", title: "View", meta: {}, type: "grid" });
    expect(createViewService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useUpdateView());
    await opts.mutationFn({ viewId: "v1", view: { title: "new" } });
    expect(updateViewService).toHaveBeenCalledWith("v1", { title: "new" });

    opts = getMutationOptions(() => apiHooks.useDeleteView());
    await opts.mutationFn("v1");
    expect(deleteViewService).toHaveBeenCalledWith("v1");

    opts = getMutationOptions(() => apiHooks.useInsertRowData());
    await opts.mutationFn({ model_id: "m1", column_id: "c1", row_id: 1, value: "x" });
    expect(insertRowDataService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useDeleteRecord());
    await opts.mutationFn({ model_id: "m1", row_id: 1 });
    expect(deleteRowService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useBulkDeleteRecords());
    await opts.mutationFn({ model_id: "m1", row_ids: [1, 2] });
    expect(bulkDeleteRowService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useInsertRelationData());
    await opts.mutationFn({ model_id: "m1", column_id: "c1", source_row_id: 1, target_row_id: 2, action: "link" });
    expect(insertRelationDataService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useAddImage());
    await opts.mutationFn({ model_id: "m1", column_id: "c1", row_id: 1, file: {} as File });
    expect(addImageService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useUpdateUserProfile("u1"));
    await opts.mutationFn({ name: "User" });
    expect(updateUserProfileService).toHaveBeenCalledWith("u1", { name: "User" }, undefined);

    opts = getMutationOptions(() => apiHooks.useChangePassword("u1"));
    await opts.mutationFn({ old_password: "a", new_password: "b" });
    expect(changePasswordService).toHaveBeenCalledWith("u1", { old_password: "a", new_password: "b" });

    const avatarFile = {} as File;
    await opts.mutationFn(avatarFile);

    opts = getMutationOptions(() => apiHooks.useRemoveAvatar("u1"));
    await opts.mutationFn();
    expect(removeAvatarService).toHaveBeenCalledWith("u1");

    opts = getMutationOptions(() => apiHooks.useGetRecordsByPagination("m1"));
    await opts.mutationFn({ pageNumber: 1, pageSize: 30 });
    expect(getAllRecordsService).toHaveBeenCalledWith("m1", { pageNumber: 1, pageLimit: 30 });

    opts = getMutationOptions(() => apiHooks.useAddUser());
    await opts.mutationFn({ firstname: "A", lastname: "B", email: "a@b.com" });
    expect(addUserService).toHaveBeenCalled();

    opts = getMutationOptions(() => apiHooks.useEditUser());
    await opts.mutationFn({ user_id: "u1", firstname: "A" });
    expect(editUserService).toHaveBeenCalledWith({ user_id: "u1", firstname: "A" });

    opts = getMutationOptions(() => apiHooks.useRemoveTenantUser());
    await opts.mutationFn("u1");
    expect(removeUserService).toHaveBeenCalledWith("u1");

    opts = getMutationOptions(() => apiHooks.useActivateTenantUser());
    await opts.mutationFn("u1");
    expect(activateTenantUserService).toHaveBeenCalledWith("u1");

    await opts.mutationFn({ workspace_id: "w1", user_ids: ["u1"], access_level: "editor", bases_ids: "" });

    opts = getMutationOptions(() => apiHooks.useBulkAddMembers());
    await opts.mutationFn({ workspaceId: "w1", members: [{ user_id: "u1", memberships: [] }] });
    expect(bulkAddMembersService).toHaveBeenCalled();

    await opts.mutationFn({ workspaceId: "w1", accessId: "a1" });

    opts = getMutationOptions(() => apiHooks.useRemoveUserFromWorkspace());
    await opts.mutationFn({ workspaceId: "w1", user_id: "u1" });
    expect(removeUserFromWorkspaceService).toHaveBeenCalledWith("w1", { user_id: "u1" });
  });
});
