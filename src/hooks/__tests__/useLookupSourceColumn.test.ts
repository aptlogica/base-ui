import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLookupSourceColumn } from "../useLookupSourceColumn";
import { useQuery } from "@tanstack/react-query";
import { getFieldByIdService } from "../../service/clientService";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("../../service/clientService", () => ({ getFieldByIdService: vi.fn() }));

describe("useLookupSourceColumn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables query when lookupColumnId is missing", () => {
    renderHook(() => useLookupSourceColumn(undefined));
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: ["lookupSourceColumn", undefined],
      })
    );
  });

  it("extracts column and parses meta when present", async () => {
    const mockUseQuery = vi.mocked(useQuery);
    let opts;
    mockUseQuery.mockImplementation((o) => {
      opts = o;
      return { data: null };
    });

    const meta = "{\"foo\":1}";
    vi.mocked(getFieldByIdService).mockResolvedValue({
      data: { column: { id: "col-1", meta } },
    });

    renderHook(() => useLookupSourceColumn("col-1"));
    const result = await opts.queryFn();

    expect(result).toEqual({ id: "col-1", meta: { foo: 1 } });
  });

  it("returns null and logs error on failure", async () => {
    const mockUseQuery = vi.mocked(useQuery);
    let opts;
    mockUseQuery.mockImplementation((o) => {
      opts = o;
      return { data: null };
    });

    const error = new Error("boom");
    vi.mocked(getFieldByIdService).mockRejectedValue(error);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() => useLookupSourceColumn("col-1"));
    const result = await opts.queryFn();

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
