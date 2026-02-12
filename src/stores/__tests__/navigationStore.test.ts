import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNavigationStore } from "../navigationStore";
import {
  saveLastNavigation,
  getLastNavigation,
} from "../../utils/navigationPersistence";
import {
  updateUserActivity,
  getUserActivity,
  clearUserActivity,
  createLoginSession,
} from "../../service/activityService";

vi.mock("../../utils/navigationPersistence", () => ({
  saveLastNavigation: vi.fn(),
  getLastNavigation: vi.fn(),
}));

vi.mock("../../service/activityService", () => ({
  updateUserActivity: vi.fn(),
  getUserActivity: vi.fn(),
  clearUserActivity: vi.fn(),
  createLoginSession: vi.fn(),
}));

const resetStore = () => {
  useNavigationStore.getState().reset();
};

describe("navigationStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    resetStore();
    vi.mocked(getLastNavigation).mockReturnValue({
      workspaceId: null,
      baseId: null,
      tableId: null,
      viewId: null,
    });
  });

  it("navigates to workspace and saves navigation for current user", () => {
    sessionStorage.setItem("user_id", "u1");
    useNavigationStore.getState().navigateToWorkspace("w1");

    const state = useNavigationStore.getState();
    expect(state.selectedWorkspaceId).toBe("w1");
    expect(state.selectedBaseId).toBeNull();
    expect(state.expandedBases).toEqual([]);
    expect(saveLastNavigation).toHaveBeenCalledWith(
      { workspaceId: "w1", baseId: null, tableId: null, viewId: null },
      "u1"
    );
  });

  it("navigates to base and expands base", () => {
    sessionStorage.setItem("user_id", "u1");
    useNavigationStore.getState().navigateToBase("w1", "b1");

    const state = useNavigationStore.getState();
    expect(state.selectedBaseId).toBe("b1");
    expect(state.expandedBases).toEqual(["b1"]);

    useNavigationStore.getState().navigateToBase("w1", "b1");
    expect(useNavigationStore.getState().expandedBases).toEqual(["b1"]);
  });

  it("navigates to table and expands base and table", () => {
    sessionStorage.setItem("user_id", "u1");
    useNavigationStore.getState().navigateToTable("w1", "b1", "t1");

    const state = useNavigationStore.getState();
    expect(state.selectedTableId).toBe("t1");
    expect(state.expandedBases).toContain("b1");
    expect(state.expandedTables).toContain("t1");
  });

  it("navigateAndPersist saves to session cache when userId provided", () => {
    useNavigationStore.getState().navigateAndPersist("w1", "b1", "t1", "u1");
    expect(saveLastNavigation).toHaveBeenCalledWith(
      { workspaceId: "w1", baseId: "b1", tableId: "t1", viewId: null },
      "u1"
    );
  });

  it("toggles base and table expansion", () => {
    const store = useNavigationStore.getState();
    store.toggleBaseExpansion("b1");
    store.toggleTableExpansion("t1");
    expect(useNavigationStore.getState().expandedBases).toEqual(["b1"]);
    expect(useNavigationStore.getState().expandedTables).toEqual(["t1"]);
    store.toggleBaseExpansion("b1");
    store.toggleTableExpansion("t1");
    expect(useNavigationStore.getState().expandedBases).toEqual([]);
    expect(useNavigationStore.getState().expandedTables).toEqual([]);
  });

  it("loads and saves user navigation safely", () => {
    vi.mocked(getLastNavigation).mockReturnValue({
      workspaceId: "w1",
      baseId: "b1",
      tableId: "t1",
      viewId: "v1",
    });

    useNavigationStore.getState().loadUserNavigation("u1");
    const state = useNavigationStore.getState();
    expect(state.selectedWorkspaceId).toBe("w1");
    expect(state.selectedViewId).toBe("v1");

    useNavigationStore.getState().setWorkspace(null);
    useNavigationStore.getState().saveUserNavigation("u1");
    expect(saveLastNavigation).not.toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: null }),
      "u1"
    );
  });

  it("clears user navigation and resets state", () => {
    useNavigationStore.getState().setWorkspace("w1");
    useNavigationStore.getState().clearUserNavigation("u1");
    expect(saveLastNavigation).toHaveBeenCalledWith(
      { workspaceId: null, baseId: null, tableId: null, viewId: null },
      "u1"
    );
    const state = useNavigationStore.getState();
    expect(state.selectedWorkspaceId).toBeNull();
    expect(state.expandedBases).toEqual([]);
  });

  it("navigates to last location when available", () => {
    const navigate = vi.fn();
    vi.mocked(getLastNavigation).mockReturnValue({
      workspaceId: "w1",
      baseId: "b1",
      tableId: "t1",
      viewId: "v1",
    });

    const result = useNavigationStore
      .getState()
      .navigateToLastLocation("u1", "w1", {}, navigate);
    expect(result).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/workspace/w1/base/b1/table/t1/v1");
  });

  it("navigates to first table view when available", () => {
    const navigate = vi.fn();
    const workspaceData = {
      data: {
        workspaces: [
          {
            id: "w1",
            bases: [
              {
                id: "b1",
                tables: [
                  { id: "t1", views: [{ id: "v1" }] },
                ],
              },
            ],
          },
        ],
      },
    };

    const result = useNavigationStore
      .getState()
      .navigateToFirstTableView(workspaceData, "b1", navigate);
    expect(result).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/workspace/w1/base/b1/table/t1/v1");
  });

  it("navigates to first base when tables are missing", () => {
    const navigate = vi.fn();
    const workspaceData = {
      data: {
        workspaces: [
          { id: "w1", bases: [{ id: "b1", tables: [] }] },
        ],
      },
    };

    const result = useNavigationStore
      .getState()
      .navigateToFirstBase("w1", workspaceData, navigate);
    expect(result).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/workspace/w1");
  });

  it("getNavigationPath builds expected path", () => {
    const store = useNavigationStore.getState();
    expect(store.getNavigationPath()).toBe("/workspace");
    store.navigateToTable("w1", "b1", "t1");
    expect(store.getNavigationPath()).toBe(
      "/workspace/w1/base/b1/table/t1/grid"
    );
    store.navigateToView("w1", "b1", "t1", "v1");
    expect(store.getNavigationPath()).toBe(
      "/workspace/w1/base/b1/table/t1/v1"
    );
  });

  it("updates activity data and preserves sessions on logout", async () => {
    vi.mocked(getUserActivity).mockResolvedValue({
      last_workspace_id: "w1",
      last_base_id: "b1",
      last_table_id: "t1",
      last_view_id: "v1",
      login_sessions: [{ login_at: "old" }],
    });

    await useNavigationStore.getState().updateActivityData("u1", false);
    expect(updateUserActivity).toHaveBeenCalled();
  });

  it("creates a login session on login and updates activity data", async () => {
    vi.mocked(getUserActivity).mockResolvedValue({
      login_sessions: [],
    });
    vi.mocked(createLoginSession).mockReturnValue({
      browser: "b",
      browser_version: "1",
      os: "o",
      device_type: "d",
      login_at: "now",
      timezone: "tz",
      language: "en",
      device_memory: "8",
    });

    await useNavigationStore.getState().updateActivityData("u1", true);
    expect(createLoginSession).toHaveBeenCalled();
    expect(updateUserActivity).toHaveBeenCalled();
  });

  it("loads from activity data and returns true for full path", async () => {
    vi.mocked(getUserActivity).mockResolvedValue({
      last_workspace_id: "w1",
      last_base_id: "b1",
      last_table_id: "t1",
      last_view_id: "v1",
    });

    const result = await useNavigationStore.getState().loadFromActivityData("u1");
    expect(result).toBe(true);
  });

  it("clears activity data without throwing", async () => {
    vi.mocked(clearUserActivity).mockResolvedValue(undefined);
    await useNavigationStore.getState().clearActivityData("u1");
    expect(clearUserActivity).toHaveBeenCalledWith("u1");
  });
});
