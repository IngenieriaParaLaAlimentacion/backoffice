import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useRenderClock } from "./useRenderClock";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("refreshes on display-data changes and focus, and removes its listener", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-28T02:59:00Z"));
  const remove = vi.spyOn(window, "removeEventListener");
  const { result, rerender, unmount } = renderHook(
    ({ data }) => useRenderClock(data),
    { initialProps: { data: 1 } },
  );
  expect(result.current.toISOString()).toBe("2026-10-28T02:59:00.000Z");
  vi.setSystemTime(new Date("2026-10-28T03:01:00Z"));
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
  expect(result.current.toISOString()).toBe("2026-10-28T03:01:00.000Z");
  vi.setSystemTime(new Date("2026-10-29T03:01:00Z"));
  rerender({ data: 2 });
  expect(result.current.toISOString()).toBe("2026-10-29T03:01:00.000Z");
  unmount();
  expect(remove).toHaveBeenCalledWith("focus", expect.any(Function));
});
