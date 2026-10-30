import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGoBack } from "./useGoBack";

const push = vi.fn();
const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back }) }));

describe("useGoBack", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    push.mockClear();
    back.mockClear();
  });

  it("steps back in the history instead of pushing the fallback on top", () => {
    vi.spyOn(window.history, "length", "get").mockReturnValue(3);
    const { result } = renderHook(() => useGoBack("/fallback"));

    result.current();

    expect(back).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the fallback when there is no history to go back to", () => {
    vi.spyOn(window.history, "length", "get").mockReturnValue(1);
    const { result } = renderHook(() => useGoBack("/fallback"));

    result.current();

    expect(push).toHaveBeenCalledWith("/fallback");
    expect(back).not.toHaveBeenCalled();
  });
});
