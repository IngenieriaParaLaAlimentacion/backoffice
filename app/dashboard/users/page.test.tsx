import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import UsersPageRoute from "./page";
import RoleInviteButton from "./RoleInviteButton";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { makeListUsersHandler } from "@/mocks/handlers/admin";
import { DEFAULT_PENDING_USERS_RESPONSE } from "@/mocks/fixtures/admin";
import { INVITE_LABELS, USERS_PAGE } from "@/constants/users";

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

describe("UsersPage invite buttons", () => {
  beforeEach(() => localStorage.clear());

  it("offers Invitar administrador and Invitar analista beside their sections to someone who can invite", async () => {
    await renderWithProviders(<UsersPageRoute />, { role: "admin" });

    expect(
      await screen.findByRole("button", { name: INVITE_LABELS.admin }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: INVITE_LABELS.analyst }),
    ).toBeInTheDocument();
    // Field workers register themselves: nobody is invited to that role.
    expect(screen.getAllByRole("button", { name: /^Invitar/ })).toHaveLength(2);
  });

  it("shows no invite buttons to a role without users.invite", async () => {
    // An analyst can't open this screen at all; stub the permission instead
    // of the role so only the invite gate is exercised.
    await renderWithProviders(<RoleInviteButton role="admin" />, {
      role: "analyst",
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
