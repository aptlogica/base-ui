import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GanttChartViewPlugin from "../index";
import { matchesViewType } from "../../../utils/viewType";
import { useGanttData } from "../hooks/useGanttData";

vi.mock("../../../utils/viewType", () => ({ matchesViewType: vi.fn() }));
vi.mock("../hooks/useGanttData", () => ({ useGanttData: vi.fn() }));
vi.mock("../components/GanttChart", () => ({
  GanttChart: () => <div data-testid="gantt-chart" />,
}));
vi.mock("../../../components/ui/Loader", () => ({
  Loader: () => <div data-testid="loader" />,
}));

const baseActions = {
  refresh: vi.fn().mockResolvedValue(undefined),
  addRow: vi.fn(),
  insertRowData: vi.fn(),
  deleteRecord: vi.fn(),
  updateField: vi.fn(),
  updateView: vi.fn(),
  moveTask: vi.fn(),
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  updateTaskProgress: vi.fn(),
  updateViewConfig: vi.fn(),
};

describe("GanttChartViewPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const init = async () => {
    const registerExtension = vi.fn();
    await GanttChartViewPlugin.initialize({ registerExtension });
    const extension = registerExtension.mock.calls[0][1];
    return extension;
  };

  it("returns null when table id is missing", async () => {
    vi.mocked(matchesViewType).mockReturnValue(true);
    const extension = await init();
    const result = extension.render({ viewType: "gantt" });
    expect(result).toBeNull();
  });

  it("returns null when view type does not match", async () => {
    vi.mocked(matchesViewType).mockReturnValue(false);
    const extension = await init();
    const result = extension.render({ table: { id: "t1" }, viewType: "grid" });
    expect(result).toBeNull();
  });

  it("renders loader while loading", async () => {
    vi.mocked(matchesViewType).mockReturnValue(true);
    vi.mocked(useGanttData).mockReturnValue({
      tableData: null,
      isLoading: true,
      error: null,
      ...baseActions,
    });
    const extension = await init();
    const element = extension.render({ table: { id: "t1" }, view: { id: "v1" }, viewType: "gantt" });
    render(element);
    expect(screen.getByTestId("loader")).toBeTruthy();
  });

  it("renders error state and retries", async () => {
    vi.mocked(matchesViewType).mockReturnValue(true);
    const refresh = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useGanttData).mockReturnValue({
      tableData: null,
      isLoading: false,
      error: "Nope",
      ...baseActions,
      refresh,
    });
    const extension = await init();
    const element = extension.render({ table: { id: "t1" }, view: { id: "v1" }, viewType: "gantt" });
    render(element);
    expect(screen.getByText(/Something went wrong while loading the gantt chart/i)).toBeTruthy();
    expect(screen.getByText("Nope")).toBeTruthy();
    fireEvent.click(screen.getByText("Retry"));
    expect(refresh).toHaveBeenCalled();
  });

  it("renders GanttChart when data is ready", async () => {
    vi.mocked(matchesViewType).mockReturnValue(true);
    vi.mocked(useGanttData).mockReturnValue({
      tableData: { model: {} },
      isLoading: false,
      error: null,
      ...baseActions,
    });
    const extension = await init();
    const element = extension.render({ table: { id: "t1" }, view: { id: "v1" }, viewType: "gantt" });
    render(element);
    expect(screen.getByTestId("gantt-chart")).toBeTruthy();
  });
});
