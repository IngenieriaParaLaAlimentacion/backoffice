import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import EstablishmentsPage from "./page";
import { ESTABLISHMENTS_LIST_PAGE } from "@/constants/establishments";
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
