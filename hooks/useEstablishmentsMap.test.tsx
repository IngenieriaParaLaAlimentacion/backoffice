import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { useEstablishmentsMap } from "@/hooks/useEstablishmentsMap";
import { ESTABLISHMENTS_MAP_PAGE } from "@/constants/establishments";
import { server } from "@/mocks/server";
import { makeEstablishmentsMapHandler } from "@/mocks/handlers/establishment";
import { MOCK_ESTABLISHMENT_MAP_ITEMS } from "@/mocks/fixtures/establishment";

function Probe() {
  const { pins, withoutLocation, isLoading, error, forbidden } =
    useEstablishmentsMap();

  return (
    <dl>
      <dt>loading</dt>
      <dd data-testid="loading">{String(isLoading)}</dd>
      <dt>pins</dt>
      <dd data-testid="pins">{pins.length}</dd>
      <dt>without location</dt>
      <dd data-testid="without-location">{withoutLocation}</dd>
      <dt>statuses</dt>
      <dd data-testid="statuses">{pins.map((p) => p.status).join(",")}</dd>
      <dt>error</dt>
      <dd data-testid="error">{error ?? ""}</dd>
      <dt>forbidden</dt>
      <dd data-testid="forbidden">{String(forbidden)}</dd>
    </dl>
  );
}

const text = (testId: string) => screen.getByTestId(testId).textContent;

describe("useEstablishmentsMap", () => {
  it("loads the pins in one call", async () => {
    const onRequest = vi.fn();
    server.use(makeEstablishmentsMapHandler({ onRequest }));

    await renderWithProviders(<Probe />);

    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(text("error")).toBe("");
  });

  it("turns each establishment into a pin and counts the ones it can't draw", async () => {
    await renderWithProviders(<Probe />);

    await waitFor(() => expect(text("loading")).toBe("false"));

    // Every establishment but the one still at the (0, 0) backfill.
    expect(text("pins")).toBe(String(MOCK_ESTABLISHMENT_MAP_ITEMS.length - 1));
    expect(text("without-location")).toBe("1");
  });

  it("keeps an establishment without data apart from a healthy one", async () => {
    await renderWithProviders(<Probe />);

    await waitFor(() => expect(text("loading")).toBe("false"));

    // Both send `severity: null`; only has_data tells them apart.
    const statuses = text("statuses")!.split(",");
    expect(statuses).toContain("no_data");
    expect(statuses).toContain("normal");
  });

  it("reports a 403 as forbidden, with a message", async () => {
    server.use(
      makeEstablishmentsMapHandler({
        status: 403,
        error: {
          type: "/errors/role-not-allowed",
          title: "Forbidden",
          detail: "Not allowed.",
        },
      }),
    );

    await renderWithProviders(<Probe />);

    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("forbidden")).toBe("true");
    expect(text("error")).not.toBe("");
    expect(text("pins")).toBe("0");
  });

  it("falls back to the screen's own message on an unrecognised failure", async () => {
    server.use(
      makeEstablishmentsMapHandler({
        status: 500,
        error: { detail: "Boom." },
      }),
    );

    await renderWithProviders(<Probe />);

    await waitFor(() => expect(text("loading")).toBe("false"));
    expect(text("error")).toBe(ESTABLISHMENTS_MAP_PAGE.loadError);
    expect(text("forbidden")).toBe("false");
  });
});
