import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AcceptInviteForm from "./AcceptInviteForm";
import { server } from "@/mocks/server";
import { makeAcceptInviteHandler } from "@/mocks/handlers/auth";
import { PASSWORD_REQUIREMENTS } from "@/schemas/password.schema";
import { ERROR_TYPES } from "@/lib/apiError";
import { ACCEPT_INVITE_FORM, PASSWORD_COPY } from "@/constants/auth";

const TOKEN = "valid-invite-token-123";

describe("AcceptInviteForm", () => {
  beforeEach(() => {
    server.use(makeAcceptInviteHandler());
  });

  it("renders all form fields, role label, and password requirements", () => {
    render(<AcceptInviteForm token={TOKEN} roleLabel="administrador" />);

    expect(
      screen.getByRole("heading", { name: "Te invitaron a ser administrador" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/^Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Apellido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Localidad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Teléfono de contacto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Descripción/i)).toBeInTheDocument();

    // The checklist stays hidden until the password gets its first character.
    expect(
      screen.queryByRole("list", {
        name: PASSWORD_COPY.requirementsAria,
      }),
    ).not.toBeInTheDocument();

    const submitBtn = screen.getByRole("button", {
      name: /Aceptar invitación/i,
    });
    expect(submitBtn).toBeDisabled();
  });

  it("opens the password checklist on the first keystroke and closes it when cleared", async () => {
    const user = userEvent.setup();
    render(<AcceptInviteForm token={TOKEN} roleLabel="analista" />);
    const checklist = () =>
      screen.queryByRole("list", {
        name: PASSWORD_COPY.requirementsAria,
      });

    const passwordInput = screen.getByLabelText(/^Contraseña/i);
    await user.type(passwordInput, "a");
    expect(checklist()).toBeInTheDocument();
    for (const req of PASSWORD_REQUIREMENTS) {
      expect(screen.getByText(req.label)).toBeInTheDocument();
    }

    await user.clear(passwordInput);
    expect(checklist()).not.toBeInTheDocument();
  });

  it("enables submit button only when all required fields satisfy constraints", async () => {
    const user = userEvent.setup();
    render(<AcceptInviteForm token={TOKEN} roleLabel="analista" />);

    const submitBtn = screen.getByRole("button", {
      name: /Aceptar invitación/i,
    });
    expect(submitBtn).toBeDisabled();

    await user.type(screen.getByLabelText(/^Nombre/i), "Mariana");
    await user.type(screen.getByLabelText(/^Apellido/i), "López");
    await user.type(screen.getByLabelText(/^Contraseña/i), "SecurePass123!");
    await user.type(
      screen.getByLabelText(/^Confirmar contraseña/i),
      "DifferentPass123!",
    );

    // Mismatched password keeps submit disabled
    expect(submitBtn).toBeDisabled();

    // Fix confirmation
    const confirmInput = screen.getByLabelText(/^Confirmar contraseña/i);
    await user.clear(confirmInput);
    await user.type(confirmInput, "SecurePass123!");

    expect(submitBtn).toBeEnabled();

    // Invalid phone disables submit button
    const phoneInput = screen.getByLabelText(/^Teléfono de contacto/i);
    await user.type(phoneInput, "invalid-letters");
    expect(submitBtn).toBeDisabled();

    // Valid phone re-enables submit button
    await user.clear(phoneInput);
    await user.type(phoneInput, "+54 9 341 555-1234");
    expect(submitBtn).toBeEnabled();
  });

  it("submits full payload conforming to contract and displays 204 success screen with /signin link", async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];

    server.use(
      makeAcceptInviteHandler({
        onRequest: async (req) => {
          bodies.push(await req.clone().json());
        },
      }),
    );

    render(<AcceptInviteForm token={TOKEN} roleLabel="administrador" />);

    await user.type(screen.getByLabelText(/^Nombre/i), "Mariana");
    await user.type(screen.getByLabelText(/^Apellido/i), "López");
    await user.type(screen.getByLabelText(/^Contraseña/i), "SecurePass123!");
    await user.type(
      screen.getByLabelText(/^Confirmar contraseña/i),
      "SecurePass123!",
    );
    await user.type(screen.getByLabelText(/^Localidad/i), "Rosario");
    await user.type(
      screen.getByLabelText(/^Teléfono de contacto/i),
      "+54 9 341 555-1234",
    );
    await user.type(
      screen.getByLabelText(/^Descripción/i),
      "Nutricionista comunitaria",
    );

    const submitBtn = screen.getByRole("button", {
      name: /Aceptar invitación/i,
    });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toEqual({
      token: TOKEN,
      new_password: "SecurePass123!",
      name: "Mariana",
      last_name: "López",
      locality: "Rosario",
      contact_phone: "+54 9 341 555-1234",
      description: "Nutricionista comunitaria",
    });

    // 204 Success state confirmation
    expect(
      await screen.findByRole("heading", { name: "¡Cuenta activada!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/¡Invitación aceptada con éxito!/i),
    ).toBeInTheDocument();

    const loginLink = screen.getByRole("link", { name: "Iniciar sesión" });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/signin");
  });

  it("sends null for empty optional fields", async () => {
    const user = userEvent.setup();
    const bodies: Record<string, unknown>[] = [];

    server.use(
      makeAcceptInviteHandler({
        onRequest: async (req) => {
          bodies.push(await req.clone().json());
        },
      }),
    );

    render(<AcceptInviteForm token={TOKEN} roleLabel="analista" />);

    await user.type(screen.getByLabelText(/^Nombre/i), "Carlos");
    await user.type(screen.getByLabelText(/^Apellido/i), "Gómez");
    await user.type(screen.getByLabelText(/^Contraseña/i), "StrongPass123!");
    await user.type(
      screen.getByLabelText(/^Confirmar contraseña/i),
      "StrongPass123!",
    );

    await user.click(
      screen.getByRole("button", { name: /Aceptar invitación/i }),
    );

    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toEqual({
      token: TOKEN,
      new_password: "StrongPass123!",
      name: "Carlos",
      last_name: "Gómez",
      locality: null,
      contact_phone: null,
      description: null,
    });

    expect(
      await screen.findByRole("heading", { name: "¡Cuenta activada!" }),
    ).toBeInTheDocument();
  });

  it("displays error message on 400 Bad Request with invalid recovery token", async () => {
    const user = userEvent.setup();

    server.use(
      makeAcceptInviteHandler({
        status: 400,
        error: {
          type: ERROR_TYPES.INVALID_RECOVERY_TOKEN,
          detail: "Token not valid for backoffice user",
        },
      }),
    );

    render(<AcceptInviteForm token={TOKEN} roleLabel="administrador" />);

    await user.type(screen.getByLabelText(/^Nombre/i), "Mariana");
    await user.type(screen.getByLabelText(/^Apellido/i), "López");
    await user.type(screen.getByLabelText(/^Contraseña/i), "SecurePass123!");
    await user.type(
      screen.getByLabelText(/^Confirmar contraseña/i),
      "SecurePass123!",
    );

    const submitBtn = screen.getByRole("button", {
      name: /Aceptar invitación/i,
    });
    await user.click(submitBtn);

    const expectedError =
      ACCEPT_INVITE_FORM.errors[ERROR_TYPES.INVALID_RECOVERY_TOKEN];
    expect(await screen.findByText(expectedError)).toBeInTheDocument();

    // Form remains visible so user can retry
    expect(
      screen.getByRole("heading", { name: "Te invitaron a ser administrador" }),
    ).toBeInTheDocument();
    expect(submitBtn).toBeEnabled();
  });

  it("displays error message on 401 token used error", async () => {
    const user = userEvent.setup();

    server.use(
      makeAcceptInviteHandler({
        status: 401,
        error: {
          type: ERROR_TYPES.RECOVERY_TOKEN_USED,
          detail: "Token was already used",
        },
      }),
    );

    render(<AcceptInviteForm token={TOKEN} roleLabel="analista" />);

    await user.type(screen.getByLabelText(/^Nombre/i), "Mariana");
    await user.type(screen.getByLabelText(/^Apellido/i), "López");
    await user.type(screen.getByLabelText(/^Contraseña/i), "SecurePass123!");
    await user.type(
      screen.getByLabelText(/^Confirmar contraseña/i),
      "SecurePass123!",
    );

    await user.click(
      screen.getByRole("button", { name: /Aceptar invitación/i }),
    );

    const expectedError =
      ACCEPT_INVITE_FORM.errors[ERROR_TYPES.RECOVERY_TOKEN_USED];
    expect(await screen.findByText(expectedError)).toBeInTheDocument();
  });

  it("shows the generic error, not the invalid-link one, when the server fails", async () => {
    const user = userEvent.setup();
    server.use(makeAcceptInviteHandler({ status: 500 }));

    render(<AcceptInviteForm token={TOKEN} roleLabel="analista" />);

    await user.type(screen.getByLabelText(/^Nombre/i), "Mariana");
    await user.type(screen.getByLabelText(/^Apellido/i), "López");
    await user.type(screen.getByLabelText(/^Contraseña/i), "SecurePass123!");
    await user.type(
      screen.getByLabelText(/^Confirmar contraseña/i),
      "SecurePass123!",
    );
    await user.click(
      screen.getByRole("button", { name: /Aceptar invitación/i }),
    );

    expect(
      await screen.findByText(ACCEPT_INVITE_FORM.submitError),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        ACCEPT_INVITE_FORM.errors[ERROR_TYPES.INVALID_RECOVERY_TOKEN],
      ),
    ).not.toBeInTheDocument();
  });

  it("clears the error message when user modifies a field after submission failure", async () => {
    const user = userEvent.setup();

    server.use(
      makeAcceptInviteHandler({
        status: 400,
        error: {
          type: ERROR_TYPES.INVALID_RECOVERY_TOKEN,
          detail: "Invalid token",
        },
      }),
    );

    render(<AcceptInviteForm token={TOKEN} roleLabel="administrador" />);

    await user.type(screen.getByLabelText(/^Nombre/i), "Mariana");
    await user.type(screen.getByLabelText(/^Apellido/i), "López");
    await user.type(screen.getByLabelText(/^Contraseña/i), "SecurePass123!");
    await user.type(
      screen.getByLabelText(/^Confirmar contraseña/i),
      "SecurePass123!",
    );

    await user.click(
      screen.getByRole("button", { name: /Aceptar invitación/i }),
    );

    const expectedError =
      ACCEPT_INVITE_FORM.errors[ERROR_TYPES.INVALID_RECOVERY_TOKEN];
    expect(await screen.findByText(expectedError)).toBeInTheDocument();

    // Modifying a field clears the error
    await user.type(screen.getByLabelText(/^Nombre/i), "a");
    expect(screen.queryByText(expectedError)).not.toBeInTheDocument();
  });
});
