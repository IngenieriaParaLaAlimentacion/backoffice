import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import SignInForm from "./SignInForm";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { server } from "@/mocks/server";
import { makeLoginHandler } from "@/mocks/handlers/auth";
import { BLOCKED_ACCOUNT_MESSAGE } from "@/constants/auth";
import { ERROR_TYPES } from "@/lib/apiError";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

const PATH = "/api/v1/test-resource";

const blockedProblem = {
  type: ERROR_TYPES.USER_BLOCKED,
  status: 403,
  title: "Forbidden",
  detail: "x",
  instance: PATH,
};

/** Stands in for a screen whose request found the account blocked. */
function CutSession() {
  const { makeAuthorizedRequest } = useAuth();
  return <button onClick={() => makeAuthorizedRequest(PATH)}>cut</button>;
}

const renderForm = () =>
  render(
    <AuthProvider>
      <SignInForm />
      <CutSession />
    </AuthProvider>,
  );

describe("SignInForm and a blocked account", () => {
  it("shows the notice after the session was cut, until the user types", async () => {
    server.use(
      http.get(PATH, () => HttpResponse.json(blockedProblem, { status: 403 })),
    );
    renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "cut" }));
    expect(await screen.findByText(BLOCKED_ACCOUNT_MESSAGE)).toBeVisible();

    await user.type(screen.getByLabelText(/^Email/), "a");
    expect(screen.queryByText(BLOCKED_ACCOUNT_MESSAGE)).not.toBeInTheDocument();
  });

  it("shows the same message when a blocked account signs in", async () => {
    server.use(
      makeLoginHandler({
        status: 403,
        error: { type: ERROR_TYPES.USER_BLOCKED, detail: "x" },
      }),
    );
    renderForm();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/^Email/), "ana@example.com");
    await user.type(screen.getByLabelText(/^Contraseña/), "Password123!");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText(BLOCKED_ACCOUNT_MESSAGE)).toBeVisible();
  });
});
