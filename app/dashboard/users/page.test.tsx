import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import UsersPageRoute from "./page";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { makeListUsersHandler } from "@/mocks/handlers/admin";
import { DEFAULT_PENDING_USERS_RESPONSE } from "@/mocks/fixtures/admin";
import { USERS_PAGE } from "@/constants/users";

// The page previews 3 users per role section.
const PREVIEW = DEFAULT_PENDING_USERS_RESPONSE.items.slice(0, 3);

describe("UsersPage", () => {
  beforeEach(() => localStorage.clear());

  it("says the preview is cut and links to the full list when a role has more users", async () => {
    server.use(
      makeListUsersHandler({
        data: { items: PREVIEW, total: 7, total_pages: 3 },
      }),
    );
    await renderWithProviders(<UsersPageRoute />, { role: "admin" });

    // One cut notice and one "Ver todos" per role section (3 sections).
    expect(await screen.findAllByText(USERS_PAGE.showing(3, 7))).toHaveLength(
      3,
    );
    const links = screen.getAllByRole("link", { name: USERS_PAGE.viewAll });
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/dashboard/users/admin",
      "/dashboard/users/field_worker",
      "/dashboard/users/analyst",
    ]);
  });

  it("shows no cut notice when the preview already lists every user", async () => {
    server.use(
      makeListUsersHandler({
        data: { items: PREVIEW, total: 3, total_pages: 1 },
      }),
    );
    await renderWithProviders(<UsersPageRoute />, { role: "admin" });

    await screen.findAllByText(/López/);
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: USERS_PAGE.viewAll }),
    ).not.toBeInTheDocument();
  });
});
