import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EstablishmentsPage from "./page";
import {
  ESTABLISHMENTS_LIST_PAGE,
  ESTABLISHMENTS_MAP_PAGE,
} from "@/constants/establishments";
import { EXPORT } from "@/constants/exports";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  makeEstablishmentsMapHandler,
  makeListEstablishmentsHandler,
} from "@/mocks/handlers/establishment";
import { MOCK_ESTABLISHMENT_MAP_ITEMS } from "@/mocks/fixtures/establishment";
import type { EstablishmentsMapProps } from "./map/types";

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  usePathname: () => "/dashboard/establishments",
  useSearchParams: () => nav.params,
}));

// Leaflet itself is covered in map/leaflet; here only what the page hands the
// map matters: which pins, and what happens when one is picked.
vi.mock("./map/EstablishmentsMap", () => ({
  default: ({ pins, onPinClick }: EstablishmentsMapProps) => (
    <div data-testid="map">
      {pins.map((pin) => (
        <button key={pin.id} onClick={() => onPinClick(pin.id)}>
          {pin.name}
        </button>
      ))}
    </div>
  ),
}));

const COPY = ESTABLISHMENTS_LIST_PAGE;
const MAP_COPY = ESTABLISHMENTS_MAP_PAGE;

const located = MOCK_ESTABLISHMENT_MAP_ITEMS.filter(
  (item) => !(item.latitude === 0 && item.longitude === 0),
);

const viewButton = (name: string) => screen.getByRole("button", { name });

beforeEach(() => {
  nav.push.mockClear();
  nav.replace.mockClear();
  nav.params = new URLSearchParams();
});

describe("Establecimientos, vista Lista", () => {
  it("does not ask for the map while the table is showing", async () => {
    const onRequest = vi.fn();
    server.use(makeEstablishmentsMapHandler({ onRequest }));

    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });
    await screen.findAllByText("Comedor Central Norte");

    expect(onRequest).not.toHaveBeenCalled();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(COPY.searchPlaceholder),
    ).toBeInTheDocument();
  });

  it("marks Lista as the active view", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });

    expect(viewButton(COPY.viewToggle.list)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(viewButton(COPY.viewToggle.map)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches to the map by writing view=map to the URL", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });

    await userEvent.click(viewButton(COPY.viewToggle.map));

    expect(nav.replace).toHaveBeenCalledWith(
      "/dashboard/establishments?view=map",
      { scroll: false },
    );
  });

  it("keeps the filters in the URL when switching to the map", async () => {
    nav.params = new URLSearchParams("city=Rosario&page=2");
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });

    await userEvent.click(viewButton(COPY.viewToggle.map));

    const url = new URL(nav.replace.mock.calls[0][0], "http://x");
    expect(url.searchParams.get("view")).toBe("map");
    expect(url.searchParams.get("city")).toBe("Rosario");
    expect(url.searchParams.get("page")).toBe("2");
  });
});

describe("Establecimientos, vista Mapa", () => {
  beforeEach(() => {
    nav.params = new URLSearchParams("view=map");
  });

  it("draws every establishment that has a location, from one request", async () => {
    const onRequest = vi.fn();
    server.use(makeEstablishmentsMapHandler({ onRequest }));

    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });
    await screen.findByTestId("map");

    expect(onRequest).toHaveBeenCalledTimes(1);
    for (const item of located)
      expect(screen.getByRole("button", { name: item.name })).toBeVisible();
  });

  it("does not ask for the table while the map is showing", async () => {
    const onRequest = vi.fn();
    server.use(makeListEstablishmentsHandler({ onRequest }));

    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });
    await screen.findByTestId("map");

    expect(onRequest).not.toHaveBeenCalled();
  });

  it("hides the table's own controls", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });
    await screen.findByTestId("map");

    expect(
      screen.queryByPlaceholderText(COPY.searchPlaceholder),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: EXPORT.label }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("marks Mapa as the active view and goes back to Lista by dropping view", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });
    await screen.findByTestId("map");

    expect(viewButton(COPY.viewToggle.map)).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(viewButton(COPY.viewToggle.list));

    expect(nav.replace).toHaveBeenCalledWith("/dashboard/establishments", {
      scroll: false,
    });
  });

  // The same destination as a row of the table.
  it("opens the establishment's ficha when a pin is picked", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });
    await screen.findByTestId("map");

    await userEvent.click(
      screen.getByRole("button", { name: "Comedor Central Norte" }),
    );

    expect(nav.push).toHaveBeenCalledWith(
      "/dashboard/establishments/e1000000-0000-0000-0000-000000000001",
    );
  });

  it("says how many establishments are missing from the map, and offers the list", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });

    expect(
      await screen.findByText(MAP_COPY.withoutLocation(1)),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: MAP_COPY.seeInList }),
    );

    expect(nav.replace).toHaveBeenCalledWith("/dashboard/establishments", {
      scroll: false,
    });
  });

  it("shows an empty message when there is nothing to draw", async () => {
    server.use(makeEstablishmentsMapHandler({ data: { establishments: [] } }));

    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });

    expect(
      await screen.findByText(MAP_COPY.noEstablishments),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("explains a 403 instead of showing an empty map", async () => {
    server.use(
      makeEstablishmentsMapHandler({
        status: 403,
        error: { type: "/errors/role-not-allowed", detail: "Forbidden." },
      }),
    );

    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });

    expect(await screen.findByText(MAP_COPY.forbidden)).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("lets the user retry after a failure", async () => {
    server.use(
      makeEstablishmentsMapHandler({ status: 500, error: { detail: "x" } }),
    );
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });
    await screen.findByText(MAP_COPY.loadError);

    server.use(makeEstablishmentsMapHandler());
    await userEvent.click(screen.getByRole("button", { name: MAP_COPY.retry }));

    await waitFor(() => expect(screen.getByTestId("map")).toBeInTheDocument());
  });

  it("offers the toggle to an analyst too", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "analyst" });

    expect(viewButton(COPY.viewToggle.map)).toBeInTheDocument();
    await screen.findByTestId("map");
  });
});
