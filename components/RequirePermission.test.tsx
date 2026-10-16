import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import RequirePermission from "@/components/RequirePermission";
import { renderWithProviders } from "@/test-utils";
import { FORBIDDEN_SCREEN } from "@/constants/permissions";

const CHILD = "contenido protegido";

const guarded = (
  <RequirePermission permission="requests.view">
    <p>{CHILD}</p>
  </RequirePermission>
);

describe("RequirePermission", () => {
  beforeEach(() => localStorage.clear());

  it("renders the children for a role holding the permission", async () => {
    await renderWithProviders(guarded, { role: "admin" });

    expect(screen.getByText(CHILD)).toBeInTheDocument();
    expect(screen.queryByText(FORBIDDEN_SCREEN.title)).not.toBeInTheDocument();
  });

  // Hiding the nav item isn't enough — typing the URL has to fail too.
  it("shows the 403 screen for a role without the permission", async () => {
    await renderWithProviders(guarded, { role: "analyst" });

    expect(screen.queryByText(CHILD)).not.toBeInTheDocument();
    expect(screen.getByText(FORBIDDEN_SCREEN.title)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: FORBIDDEN_SCREEN.backToHome }),
    ).toHaveAttribute("href", "/dashboard");
  });

  describe("with a list of permissions", () => {
    const guardedByList = (
      <RequirePermission
        permission={["requests.view", "establishments.requests.view"]}
      >
        <p>{CHILD}</p>
      </RequirePermission>
    );

    it("renders the children for a role holding any of them", async () => {
      await renderWithProviders(guardedByList, { role: "admin" });

      expect(screen.getByText(CHILD)).toBeInTheDocument();
    });

    it("shows the 403 screen for a role holding none of them", async () => {
      await renderWithProviders(guardedByList, { role: "analyst" });

      expect(screen.queryByText(CHILD)).not.toBeInTheDocument();
      expect(screen.getByText(FORBIDDEN_SCREEN.title)).toBeInTheDocument();
    });
  });
});
