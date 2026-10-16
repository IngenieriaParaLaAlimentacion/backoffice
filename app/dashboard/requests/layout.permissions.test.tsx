import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Permission } from "@/lib/permissions";
import { REQUEST_TABS } from "@/constants/users";
import RequestsLayout from "./layout";

// Today no role holds one request permission without the other, so the
// per-tab gating can only be exercised by stubbing the session.
const held = vi.hoisted(() => ({ permissions: new Set<string>() }));

const services = vi.hoisted(() => ({
  listUsersAction: vi.fn(),
  listPendingEstablishmentAccessAction: vi.fn(),
  listEstablishmentRequestsAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/requests",
}));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ makeAuthorizedRequest: vi.fn() }),
}));
vi.mock("@/context/SessionContext", () => ({
  useSession: () => ({
    isLoading: false,
    can: (permission: Permission) => held.permissions.has(permission),
  }),
}));
vi.mock("@/services/admin.service", () => ({
  listUsersAction: services.listUsersAction,
  listPendingEstablishmentAccessAction:
    services.listPendingEstablishmentAccessAction,
}));
vi.mock("@/services/establishmentRequest.service", () => ({
  listEstablishmentRequestsAction: services.listEstablishmentRequestsAction,
}));

const renderLayout = () =>
  render(
    <RequestsLayout>
      <p>contenido</p>
    </RequestsLayout>,
  );

describe("RequestsLayout per-tab permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    held.permissions = new Set();
    services.listUsersAction.mockResolvedValue({ total: 1 });
    services.listPendingEstablishmentAccessAction.mockResolvedValue({
      total_pending_establishments: 1,
    });
    services.listEstablishmentRequestsAction.mockResolvedValue({ total: 5 });
  });

  it("shows only Altas de establecimientos to a role holding just establishments.requests.view", async () => {
    held.permissions = new Set(["establishments.requests.view"]);
    renderLayout();

    expect(
      await screen.findByRole("link", {
        name: new RegExp(REQUEST_TABS.establishmentCreations),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: new RegExp(REQUEST_TABS.users) }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: new RegExp(REQUEST_TABS.establishments),
      }),
    ).not.toBeInTheDocument();

    // No point counting what the role can't see.
    await waitFor(() =>
      expect(services.listEstablishmentRequestsAction).toHaveBeenCalled(),
    );
    expect(services.listUsersAction).not.toHaveBeenCalled();
    expect(
      services.listPendingEstablishmentAccessAction,
    ).not.toHaveBeenCalled();
  });

  it("shows only the two registration tabs to a role holding just requests.view", async () => {
    held.permissions = new Set(["requests.view"]);
    renderLayout();

    expect(
      await screen.findByRole("link", { name: new RegExp(REQUEST_TABS.users) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: new RegExp(REQUEST_TABS.establishments),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: new RegExp(REQUEST_TABS.establishmentCreations),
      }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(services.listUsersAction).toHaveBeenCalled());
    expect(services.listEstablishmentRequestsAction).not.toHaveBeenCalled();
  });
});
