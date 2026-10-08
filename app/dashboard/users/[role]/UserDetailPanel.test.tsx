import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import UserDetailPanel from "./UserDetailPanel";
import { renderWithProviders, screen, waitFor, within } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  makeChangeUserRoleHandler,
  makeGetUserHandler,
} from "@/mocks/handlers/admin";
import { makeMeHandler } from "@/mocks/handlers/user";
import { DEFAULT_USER_DETAIL } from "@/mocks/fixtures/admin";
import { USER_DETAIL_PANEL } from "@/constants/users";
import { ChangeUserRoleRequest } from "@/types/admin";
import { UserRole } from "@/types/user";
import { ERROR_TYPES } from "@/lib/apiError";

const COPY = USER_DETAIL_PANEL.changeRole;
const VIEWER_ID = "viewer-1";

async function renderPanel({
  viewer,
  target,
  targetId = DEFAULT_USER_DETAIL.id,
  onUserChanged = vi.fn(),
}: {
  viewer: UserRole;
  target: UserRole;
  targetId?: string;
  onUserChanged?: () => void;
}) {
  server.use(
    makeMeHandler({ data: { id: VIEWER_ID, role: viewer } }),
    makeGetUserHandler({ data: { id: targetId, role: target } }),
  );
  await renderWithProviders(
    <UserDetailPanel
      userId={targetId}
      onClose={vi.fn()}
      onUserChanged={onUserChanged}
    />,
  );
  await screen.findByText(DEFAULT_USER_DETAIL.email);
  return { onUserChanged };
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: COPY.button }));
  const dialog = await screen.findByRole("dialog", { name: COPY.title });
  return { user, dialog };
}

const optionLabels = (dialog: HTMLElement) =>
  within(dialog)
    .getAllByRole("radio")
    .map((radio) => radio.closest("label")?.textContent);

describe("UserDetailPanel — change role", () => {
  it("hides the button from an analyst", async () => {
    await renderPanel({ viewer: "analyst", target: "field_worker" });
    expect(
      screen.queryByRole("button", { name: COPY.button }),
    ).not.toBeInTheDocument();
  });

  it("lets an admin move an analyst to relevador or admin", async () => {
    await renderPanel({ viewer: "admin", target: "analyst" });
    const { dialog } = await openDialog();
    expect(optionLabels(dialog)).toEqual(["Relevador", "Administrador"]);
  });

  it("hides the button from an admin on another admin", async () => {
    await renderPanel({ viewer: "admin", target: "admin" });
    expect(
      screen.queryByRole("button", { name: COPY.button }),
    ).not.toBeInTheDocument();
  });

  it("lets a superadmin demote an admin", async () => {
    await renderPanel({ viewer: "superadmin", target: "admin" });
    const { dialog } = await openDialog();
    expect(optionLabels(dialog)).toEqual(["Relevador", "Analista"]);
    expect(within(dialog).getByText(COPY.warning)).toBeInTheDocument();
  });

  it("hides the button on a superadmin's profile", async () => {
    await renderPanel({ viewer: "superadmin", target: "superadmin" });
    expect(
      screen.queryByRole("button", { name: COPY.button }),
    ).not.toBeInTheDocument();
  });

  it("hides the button on the viewer's own profile", async () => {
    await renderPanel({
      viewer: "superadmin",
      target: "superadmin",
      targetId: VIEWER_ID,
    });
    expect(
      screen.queryByRole("button", { name: COPY.button }),
    ).not.toBeInTheDocument();
  });

  it("changes the role, shows it and refreshes the list", async () => {
    const bodies: ChangeUserRoleRequest[] = [];
    // Held open until after the double click, so the second click lands
    // while the first request is still in flight.
    let releaseResponse = () => {};
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      makeChangeUserRoleHandler({
        onRequest: async (request) => {
          bodies.push((await request.json()) as ChangeUserRoleRequest);
          await responseGate;
        },
      }),
    );
    const { onUserChanged } = await renderPanel({
      viewer: "admin",
      target: "analyst",
    });
    const { user, dialog } = await openDialog();

    await user.click(within(dialog).getByLabelText("Administrador"));
    await user.dblClick(
      within(dialog).getByRole("button", { name: COPY.confirm }),
    );
    await waitFor(() => expect(bodies).toHaveLength(1));
    releaseResponse();

    expect(
      await screen.findByText(COPY.success("Administrador")),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: COPY.title }),
      ).not.toBeInTheDocument(),
    );
    expect(bodies).toEqual([{ role: "admin" }]);
    expect(onUserChanged).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });

  it.each([
    [400, ERROR_TYPES.USER_IS_NOT_ACTIVE],
    [403, ERROR_TYPES.ROLE_NOT_ALLOWED],
    [404, ERROR_TYPES.USER_NOT_FOUND],
    [422, ERROR_TYPES.VALIDATION_FAILED],
  ] as const)(
    "shows a %i %s inside the dialog and keeps it open",
    async (status, type) => {
      server.use(
        makeChangeUserRoleHandler({ status, error: { type, detail: "x" } }),
      );
      const { onUserChanged } = await renderPanel({
        viewer: "superadmin",
        target: "field_worker",
      });
      const { user, dialog } = await openDialog();

      await user.click(within(dialog).getByLabelText("Analista"));
      await user.click(
        within(dialog).getByRole("button", { name: COPY.confirm }),
      );

      expect(
        await within(dialog).findByText(COPY.errors[type]),
      ).toBeInTheDocument();
      expect(screen.getByRole("dialog", { name: COPY.title })).toBeVisible();
      expect(onUserChanged).not.toHaveBeenCalled();
    },
  );

  it("falls back to generic copy for an unmapped error", async () => {
    server.use(makeChangeUserRoleHandler({ status: 500 }));
    await renderPanel({ viewer: "admin", target: "field_worker" });
    const { user, dialog } = await openDialog();

    await user.click(within(dialog).getByLabelText("Analista"));
    await user.click(
      within(dialog).getByRole("button", { name: COPY.confirm }),
    );

    expect(
      await within(dialog).findByText(COPY.genericError),
    ).toBeInTheDocument();
  });

  it("hides the button on a user who isn't active", async () => {
    server.use(
      makeMeHandler({ data: { id: VIEWER_ID, role: "superadmin" } }),
      makeGetUserHandler({ data: { role: "analyst", status: "invited" } }),
    );
    await renderWithProviders(
      <UserDetailPanel userId={DEFAULT_USER_DETAIL.id} onClose={vi.fn()} />,
    );
    await screen.findByText(DEFAULT_USER_DETAIL.email);
    expect(
      screen.queryByRole("button", { name: COPY.button }),
    ).not.toBeInTheDocument();
  });
});
