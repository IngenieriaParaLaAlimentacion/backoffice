import { describe, expect, it, vi } from "vitest";
import useSWR from "swr";
import { render, screen, waitFor } from "@testing-library/react";
import { clearSwrCache, SWR_CONFIG } from "@/lib/swr";

const KEY = "clear-swr-cache-test";

function Reader({ fetcher }: { fetcher: () => Promise<string> }) {
  const { data } = useSWR(KEY, fetcher, SWR_CONFIG);
  return <div data-testid="data">{data ?? "none"}</div>;
}

const shown = () => screen.getByTestId("data").textContent;

describe("clearSwrCache", () => {
  // The app runs on SWR's default cache, which is where a signed-out user's
  // data would linger and where a stale "already fetched" marker would keep the
  // next session from asking again.
  it("makes the next screen fetch again instead of trusting the old cache", async () => {
    const fetcher = vi.fn().mockResolvedValue("first user's data");

    const first = render(<Reader fetcher={fetcher} />);
    await waitFor(() => expect(shown()).toBe("first user's data"));
    first.unmount();

    await clearSwrCache();

    fetcher.mockResolvedValue("second user's data");
    render(<Reader fetcher={fetcher} />);

    await waitFor(() => expect(shown()).toBe("second user's data"));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
