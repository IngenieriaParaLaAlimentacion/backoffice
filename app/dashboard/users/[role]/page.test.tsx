import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import RoleUsersPageRoute from "./page";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { server } from "@/mocks/server";
import { LIST_USERS_ENDPOINT } from "@/constants/api";
import { DEFAULT_PENDING_USERS_RESPONSE } from "@/mocks/fixtures/admin";
import { USER_STATUS_FILTER_OPTIONS, USERS_PAGE } from "@/constants/users";
import { USER_STATUS_LABELS } from "@/constants/users";

const USER = { ...DEFAULT_PENDING_USERS_RESPONSE.items[0], status: "active" };

/** Answers every listing with `items` and records each `status` it was asked for. */
function serveUsers(items = [USER]) {
  const requested: string[][] = [];
  server.use(
    http.get(LIST_USERS_ENDPOINT, ({ request }) => {
      requested.push(new URL(request.url).searchParams.getAll("status"));
      return HttpResponse.json({
        ...DEFAULT_PENDING_USERS_RESPONSE,
        items,
        total: items.length,
        total_pages: 1,
      });
    }),
  );
  return requested;
}

const renderPage = () =>
  renderWithProviders(
    <RoleUsersPageRoute params={Promise.resolve({ role: "field_worker" })} />,
    { role: "admin" },
  );

describe("RoleUsersPage status filter", () => {
  beforeEach(() => localStorage.clear());

  it("lists active and blocked users until a status is chosen", async () => {
    const requested = serveUsers();
    await renderPage();

    await screen.findAllByText(/López/);
    expect(requested).toEqual([["active", "blocked"]]);
  });

  it.each([
    ["Activos", ["active"]],
    ["Bloqueados", ["blocked"]],
  ])("asks only for %s when chosen", async (label, statuses) => {
    const requested = serveUsers();
    await renderPage();
    await screen.findAllByText(/López/);

    await userEvent.selectOptions(
      screen.getByLabelText(USERS_PAGE.statusFilterLabel),
      screen.getByRole("option", { name: label }),
    );

    await waitFor(() => expect(requested.at(-1)).toEqual(statuses));
  });

  it("offers every view of the listing", async () => {
    serveUsers();
    await renderPage();

    const labels = USER_STATUS_FILTER_OPTIONS.map((option) => option.label);
    for (const label of labels) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });

  it("tells each user's status in its own column", async () => {
    serveUsers([USER, { ...USER, id: "blocked-1", status: "blocked" }]);
    await renderPage();

    await screen.findAllByText(/López/);
    expect(
      screen.getByRole("columnheader", { name: USERS_PAGE.columns.status }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(USER_STATUS_LABELS.active)).toHaveLength(1);
    // The blocked user also carries the pill on its mobile card.
    expect(screen.getAllByText(USER_STATUS_LABELS.blocked)).toHaveLength(2);
  });
});
