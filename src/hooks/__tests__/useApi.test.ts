import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useWorkspaces,
  useAddRow,
  useAllBases,
  useAllTables,
  useAllFields,
  useAllViews,
  useViewById,
  useCreateWorkspace,
  useUpdateOrganization,
  useAddAttachment,
  useRemoveAttachments,
  useUpdateAssetById,
  useDeactivateTenantUser,
} from "../useApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkspacesByUser,
  getAllBasesService,
  getAllTablesService,
  getAllFieldsService,
  getAllViewsService,
  getViewByIdService,
  addRow,
  createWorkspaceService,
  updateOrganizationService,
  addAttachmentService,
  removeAttachmentsService,
  updateAssetByIdService,
  deactivateTenantUserService,
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
  getAllBasesService: vi.fn(),
  getAllTablesService: vi.fn(),
  getAllFieldsService: vi.fn(),
  getAllViewsService: vi.fn(),
  getViewByIdService: vi.fn(),
  addRow: vi.fn(),
  createWorkspaceService: vi.fn(),
  updateOrganizationService: vi.fn(),
  addAttachmentService: vi.fn(),
  removeAttachmentsService: vi.fn(),
  updateAssetByIdService: vi.fn(),
  deactivateTenantUserService: vi.fn(),
  forceLogout: vi.fn(),
}));

describe("useApi hooks", () => {
  const invalidateQueries = vi.fn();
  const mockUseQuery = vi.mocked(useQuery);
  const mockUseMutation = vi.mocked(useMutation);
  const mockUseQueryClient = vi.mocked(useQueryClient);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryClient.mockReturnValue({ invalidateQueries } as any);
    mockUseAuth.mockReturnValue({ user: { id: "u1" } });
    mockUseLocation.mockReturnValue({ pathname: "/app" });
  });

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

    vi.mocked(getAllBasesService).mockResolvedValue({ data: { not: "array" } });
    renderHook(() => useAllBases());
    expect(await opts.queryFn()).toEqual([]);

    vi.mocked(getAllTablesService).mockRejectedValue(new Error("boom"));
    renderHook(() => useAllTables());
    expect(await opts.queryFn()).toEqual([]);

    vi.mocked(getAllFieldsService).mockResolvedValue({ data: ["f1"] });
    renderHook(() => useAllFields());
    expect(await opts.queryFn()).toEqual(["f1"]);

    vi.mocked(getAllViewsService).mockResolvedValue({});
    renderHook(() => useAllViews());
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

  it("useUpdateAssetById invalidates tables and workspaces", async () => {
    let opts: any;
    mockUseMutation.mockImplementation((o: any) => {
      opts = o;
      return { mutate: vi.fn() };
    });

    renderHook(() => useUpdateAssetById());
    await opts.mutationFn({ id: "a1", title: "t1" });
    expect(updateAssetByIdService).toHaveBeenCalledWith("a1", { title: "t1" });
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
});
