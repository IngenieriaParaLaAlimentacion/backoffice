import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import InviteAdminPage from "./admin/page";
import InviteAnalystPage from "./analyst/page";

describe("Invite Pages", () => {
  it("renders admin invite form when token is present", async () => {
    const searchParams = Promise.resolve({ token: "admin-token-123" });
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <InviteAdminPage searchParams={searchParams} />
        </Suspense>,
      );
    });

    expect(
      screen.getByRole("heading", {
        name: "Te invitaron a ser administrador",
      }),
    ).toBeInTheDocument();
  });

  it("renders invalid link state for admin page when token is missing", async () => {
    const searchParams = Promise.resolve({});
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <InviteAdminPage searchParams={searchParams} />
        </Suspense>,
      );
    });

    expect(
      screen.getByRole("heading", { name: "Enlace inválido" }),
    ).toBeInTheDocument();
  });

  it("renders analyst invite form when token is present", async () => {
    const searchParams = Promise.resolve({ token: "analyst-token-123" });
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <InviteAnalystPage searchParams={searchParams} />
        </Suspense>,
      );
    });

    expect(
      screen.getByRole("heading", {
        name: "Te invitaron a ser analista",
      }),
    ).toBeInTheDocument();
  });

  it("renders invalid link state for analyst page when token is missing", async () => {
    const searchParams = Promise.resolve({});
    await act(async () => {
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <InviteAnalystPage searchParams={searchParams} />
        </Suspense>,
      );
    });

    expect(
      screen.getByRole("heading", { name: "Enlace inválido" }),
    ).toBeInTheDocument();
  });
});
