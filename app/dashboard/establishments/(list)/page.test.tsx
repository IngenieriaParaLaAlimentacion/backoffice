import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import EstablishmentsPage from "./page";
import {
  ESTABLISHMENT_PROFILE,
  ESTABLISHMENTS_LIST_PAGE,
  establishmentProfileHref,
} from "@/constants/establishments";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { renderWithProviders } from "@/test-utils";

// Only usePathname/useSearchParams are read on mount; router.replace only
// fires from user interaction or the (absent, here) `proposed` query flag.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/establishments",
  useSearchParams: () => new URLSearchParams(),
}));

describe("EstablishmentsPage create/propose action", () => {
  it("offers Nuevo establecimiento to an admin, not Proponer establecimiento", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "admin" });

    expect(
      await screen.findByRole("link", {
        name: ESTABLISHMENTS_LIST_PAGE.createButton,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: ESTABLISHMENTS_LIST_PAGE.proposeButton,
      }),
    ).not.toBeInTheDocument();
  });

  it("offers Proponer establecimiento to an analyst instead of Nuevo establecimiento", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "analyst" });

    expect(
      await screen.findByRole("link", {
        name: ESTABLISHMENTS_LIST_PAGE.proposeButton,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: ESTABLISHMENTS_LIST_PAGE.createButton,
      }),
    ).not.toBeInTheDocument();
  });
});

describe("EstablishmentsPage pending-profile badge", () => {
  const pending = MOCK_ESTABLISHMENTS.filter(
    (e) => e.characterization_status === "pending",
  );
  const badgeName = new RegExp(ESTABLISHMENT_PROFILE.pendingBadge);

  it("links straight to the profile editor in both the table and the mobile cards for an admin", async () => {
    const { container } = await renderWithProviders(<EstablishmentsPage />, {
      role: "admin",
    });

    const badges = await screen.findAllByRole("link", { name: badgeName });
    // One per pending establishment in the desktop table, one in its card.
    expect(badges).toHaveLength(pending.length * 2);
    for (const est of pending) {
      const href = establishmentProfileHref(est.id, true);
      expect(
        badges.filter((b) => b.getAttribute("href") === href),
      ).toHaveLength(2);
    }
    expect(container.querySelector("a a")).toBeNull();
  });

  it("shows a plain label, not a link, to someone who can't edit the profile", async () => {
    await renderWithProviders(<EstablishmentsPage />, { role: "analyst" });

    expect(
      await screen.findAllByText(ESTABLISHMENT_PROFILE.pendingBadge),
    ).toHaveLength(pending.length * 2);
    expect(
      screen.queryByRole("link", { name: badgeName }),
    ).not.toBeInTheDocument();
  });
});
