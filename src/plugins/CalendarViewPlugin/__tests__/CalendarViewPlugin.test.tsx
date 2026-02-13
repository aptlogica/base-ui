import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CalendarViewPlugin from "../index";
import { matchesViewType } from "../../../utils/viewType";
import { useCalendarData } from "../hooks/useCalendarData";

vi.mock("../../../utils/viewType", () => ({ matchesViewType: vi.fn() }));
vi.mock("../hooks/useCalendarData", () => ({ useCalendarData: vi.fn() }));
vi.mock("../components/CalendarView", () => ({
  default: (props) => <div data-testid="calendar-view">{props.viewId || "no-view"}</div>,
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
  updateEvent: vi.fn(),
  createEvent: vi.fn(),
  deleteEvent: vi.fn(),
  changeDateField: vi.fn(),
  updateViewConfig: vi.fn(),
};

describe("CalendarViewPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const init = async () => {
    const registerExtension = vi.fn();
    await CalendarViewPlugin.initialize({ registerExtension });
    const extension = registerExtension.mock.calls[0][1];
    return extension;
  };

  it("returns null when table id is missing", async () => {
    vi.mocked(matchesViewType).mockReturnValue(true);
    const extension = await init();
    const result = extension.render({ viewType: "calendar" });
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
    vi.mocked(useCalendarData).mockReturnValue({
      tableData: null,
      isLoading: true,
      error: null,
      ...baseActions,
    });
    const extension = await init();
    const element = extension.render({ table: { id: "t1" }, view: { id: "v1" }, viewType: "calendar" });
    render(element);
    expect(screen.getByTestId("loader")).toBeTruthy();
  });

  it("renders error state and retries", async () => {
    vi.mocked(matchesViewType).mockReturnValue(true);
    const refresh = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useCalendarData).mockReturnValue({
      tableData: null,
      isLoading: false,
      error: "Nope",
      ...baseActions,
      refresh,
    });
    const extension = await init();
    const element = extension.render({ table: { id: "t1" }, view: { id: "v1" }, viewType: "calendar" });
    render(element);
    expect(screen.getByText(/Something went wrong while loading the calendar view/i)).toBeTruthy();
    expect(screen.getByText("Nope")).toBeTruthy();
    fireEvent.click(screen.getByText("Retry"));
    expect(refresh).toHaveBeenCalled();
  });

  it("renders CalendarView when data is ready", async () => {
    vi.mocked(matchesViewType).mockReturnValue(true);
    vi.mocked(useCalendarData).mockReturnValue({
      tableData: { model: {} },
      isLoading: false,
      error: null,
      ...baseActions,
    });
    const extension = await init();
    const element = extension.render({ table: { id: "t1" }, view: { id: "v1" }, viewType: "calendar" });
    render(element);
    expect(screen.getByTestId("calendar-view")).toBeTruthy();
  });
});
