import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/mocks/server";
import { makeMeHandler } from "@/mocks/handlers/user";
import { useSession } from "@/context/SessionContext";
import { renderWithProviders } from "@/test-utils";
import { SESSION } from "@/constants/permissions";

function RoleProbe({ label }: { label: string }) {
  const { role, can } = useSession();
  return (
    <div>
      {label}:{role ?? "none"}:{can("requests.view") ? "yes" : "no"}
    </div>
  );
}

describe("SessionProvider", () => {
  beforeEach(() => localStorage.clear());

  it("resolves the role and derives permissions from it", async () => {
    await renderWithProviders(<RoleProbe label="a" />, { role: "analyst" });

    expect(screen.getByText("a:analyst:no")).toBeInTheDocument();
  });

  it("grants an admin the admin-only permissions", async () => {
    await renderWithProviders(<RoleProbe label="a" />, { role: "admin" });

    expect(screen.getByText("a:admin:yes")).toBeInTheDocument();
  });

  // The point of the provider: `useIsAdmin` used to fire one `/users/me` per
  // consumer, so a screen with three role checks made three requests.
  it("fetches /users/me once no matter how many consumers read it", async () => {
    let requestCount = 0;
    server.use(
      makeMeHandler({
        data: { role: "admin" },
        onRequest: () => {
          requestCount += 1;
        },
      }),
    );

    await renderWithProviders(
      <>
        <RoleProbe label="a" />
        <RoleProbe label="b" />
        <RoleProbe label="c" />
      </>,
    );

    expect(screen.getByText("c:admin:yes")).toBeInTheDocument();
    expect(requestCount).toBe(1);
  });

  it("surfaces an error instead of silently reporting no permissions", async () => {
    server.use(makeMeHandler({ status: 500, error: { detail: "boom" } }));

    await renderWithProviders(<RoleProbe label="a" />);

    expect(screen.getByText("a:none:no")).toBeInTheDocument();
  });

  it("refetches on demand after a failure", async () => {
    // The success role is stated rather than inherited from the handler
    // default, which flips to whatever role is being QA'd manually.
    server.use(
      makeMeHandler({ status: 500, error: { detail: "boom" }, once: true }),
      makeMeHandler({ data: { role: "admin" } }),
    );

    function ErrorProbe() {
      const { error, refetch, role } = useSession();
      if (error) {
        return (
          <button onClick={refetch} type="button">
            {SESSION.retry}
          </button>
        );
      }
      return <div>role:{role ?? "none"}</div>;
    }

    await renderWithProviders(<ErrorProbe />);
    await userEvent.click(screen.getByRole("button", { name: SESSION.retry }));

    expect(await screen.findByText("role:admin")).toBeInTheDocument();
  });
});
