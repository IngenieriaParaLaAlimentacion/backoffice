import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import RequestsLayout from "./layout";
import { renderWithProviders } from "@/test-utils";
import { REQUEST_TABS } from "@/constants/users";
import { FORBIDDEN_SCREEN } from "@/constants/permissions";
import {
  DEFAULT_ESTABLISHMENT_REQUESTS_RESPONSE,
  DEFAULT_PENDING_ESTABLISHMENT_ACCESS_RESPONSE,
  DEFAULT_PENDING_USERS_RESPONSE,
} from "@/mocks/fixtures/admin";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/requests",
}));

const CHILD = "contenido de la pestaña";

const renderLayout = (role: "admin" | "analyst") =>
  renderWithProviders(
    <RequestsLayout>
      <p>{CHILD}</p>
    </RequestsLayout>,
    { role },
  );

describe("RequestsLayout", () => {
  beforeEach(() => localStorage.clear());

  it("shows the three request types as tabs, each with its own link", async () => {
    await renderLayout("admin");

    const hrefOf = (label: string) =>
      screen
        .getByRole("link", { name: new RegExp(`^${label}`) })
        .getAttribute("href");

    expect(hrefOf(REQUEST_TABS.users)).toBe("/dashboard/requests");
    expect(hrefOf(REQUEST_TABS.establishments)).toBe(
      "/dashboard/requests/establishments",
    );
    expect(hrefOf(REQUEST_TABS.establishmentCreations)).toBe(
      "/dashboard/requests/establishment-creations",
    );
    expect(screen.getByText(CHILD)).toBeInTheDocument();
  });

  it("badges each tab with its own pending count", async () => {
    await renderLayout("admin");

    const badgeOf = async (label: string) =>
      (await screen.findByRole("link", { name: new RegExp(`^${label}`) }))
        .textContent;

    await vi.waitFor(async () => {
      expect(await badgeOf(REQUEST_TABS.users)).toBe(
        `${REQUEST_TABS.users}${DEFAULT_PENDING_USERS_RESPONSE.total}`,
      );
      expect(await badgeOf(REQUEST_TABS.establishments)).toBe(
        `${REQUEST_TABS.establishments}${DEFAULT_PENDING_ESTABLISHMENT_ACCESS_RESPONSE.total_pending_establishments}`,
      );
      expect(await badgeOf(REQUEST_TABS.establishmentCreations)).toBe(
        `${REQUEST_TABS.establishmentCreations}${DEFAULT_ESTABLISHMENT_REQUESTS_RESPONSE.total}`,
      );
    });
  });

  it("shows the 403 screen and no tabs to a role without any request permission", async () => {
    await renderLayout("analyst");

    expect(screen.getByText(FORBIDDEN_SCREEN.title)).toBeInTheDocument();
    expect(screen.queryByText(CHILD)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Altas/ }),
    ).not.toBeInTheDocument();
  });
});
