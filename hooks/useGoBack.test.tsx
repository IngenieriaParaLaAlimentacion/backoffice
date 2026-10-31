import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, renderHook, waitFor } from "@testing-library/react";
import NavigationHistory from "@/components/NavigationHistory";
import { useGoBack } from "./useGoBack";

const replace = vi.fn((href: string) =>
  window.history.replaceState(window.history.state, "", href),
);
const back = vi.fn(() => window.history.back());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, back }) }));

describe("useGoBack", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/initial");
  });

  afterEach(() => {
    replace.mockClear();
    back.mockClear();
  });

  it("returns to the previous app entry and preserves its filters", async () => {
    window.history.replaceState(null, "", "/list?city=Rosario");
    render(<NavigationHistory />);
    window.history.pushState({}, "", "/detail");
    const { result } = renderHook(() => useGoBack("/fallback"));

    result.current();

    await waitFor(() => expect(window.location.pathname).toBe("/list"));
    expect(window.location.search).toBe("?city=Rosario");
    expect(back).toHaveBeenCalledOnce();
    expect(replace).not.toHaveBeenCalled();
  });

  it("replaces a deep link so the next Volver cannot reopen it", () => {
    render(<NavigationHistory />);
    const length = window.history.length;
    const { result, rerender } = renderHook(
      ({ fallback }) => useGoBack(fallback),
      { initialProps: { fallback: "/reports" } },
    );

    result.current();
    expect(window.location.pathname).toBe("/reports");
    rerender({ fallback: "/establishments" });
    result.current();

    expect(window.location.pathname).toBe("/establishments");
    expect(window.history.length).toBe(length);
    expect(back).not.toHaveBeenCalled();
  });

  it("uses the fallback at the first entry even with forward history", async () => {
    render(<NavigationHistory />);
    window.history.pushState({}, "", "/detail");
    const { result } = renderHook(() => useGoBack("/fallback"));
    result.current();
    await waitFor(() => expect(window.location.pathname).toBe("/initial"));
    expect(window.history.length).toBeGreaterThan(1);

    result.current();

    expect(window.location.pathname).toBe("/fallback");
    expect(back).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith("/fallback");
  });

  it("does not go back to entries from before the app started tracking", () => {
    window.history.pushState({}, "", "/deep-link");
    render(<NavigationHistory />);
    const { result } = renderHook(() => useGoBack("/fallback"));

    result.current();

    expect(window.location.pathname).toBe("/fallback");
    expect(back).not.toHaveBeenCalled();
  });
});
