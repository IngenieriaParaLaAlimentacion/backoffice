import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditProfilePage from "./page";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { ME_ENDPOINT } from "@/constants/api";
import { makeMeHandler, makeUpdateMeHandler } from "@/mocks/handlers/user";
import { PROFILE_EDIT_PAGE } from "@/constants/users";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("EditProfilePage", () => {
  beforeEach(() => {
    replace.mockClear();
    server.use(
      makeMeHandler({
        data: {
          id: "user-1",
          email: "analyst@example.com",
          name: "Carlos",
          last_name: "Gómez",
          role: "analyst",
          locality: "Rosario",
          contact_phone: "+54 9 341 555-0000",
          description: "Bio inicial",
          establishments: [],
        },
      }),
      makeUpdateMeHandler(),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads profile into form fields and displays read-only fields", async () => {
    await renderWithProviders(<EditProfilePage />);

    expect(
      screen.getByRole("heading", { name: PROFILE_EDIT_PAGE.title }),
    ).toBeInTheDocument();

    const nameInput = await screen.findByLabelText(/^Nombre/i);
    expect(nameInput).toHaveValue("Carlos");

    expect(screen.getByLabelText(/^Apellido/i)).toHaveValue("Gómez");
    expect(screen.getByLabelText(/^Localidad/i)).toHaveValue("Rosario");
    expect(screen.getByLabelText(/^Teléfono de contacto/i)).toHaveValue(
      "+54 9 341 555-0000",
    );
    expect(screen.getByLabelText(/^Descripción/i)).toHaveValue("Bio inicial");

    expect(screen.getByText("analyst@example.com")).toBeInTheDocument();
    expect(screen.getByText("Analista")).toBeInTheDocument();
  });

  it("updates fields, calls updateMeAction and redirects to profile", async () => {
    const user = userEvent.setup();
    let sentBody: Record<string, unknown> | null = null;

    server.use(
      http.patch(ME_ENDPOINT, async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: "user-1",
          email: "analyst@example.com",
          name: "Carlos Alberto",
          last_name: "Gómez",
          role: "analyst",
          locality: "Santa Fe",
          contact_phone: "+54 9 342 555-1111",
          description: "Nueva descripción",
        });
      }),
    );

    await renderWithProviders(<EditProfilePage />);

    const nameInput = await screen.findByLabelText(/^Nombre/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Carlos Alberto");

    const localityInput = screen.getByLabelText(/^Localidad/i);
    await user.clear(localityInput);
    await user.type(localityInput, "Santa Fe");

    const phoneInput = screen.getByLabelText(/^Teléfono de contacto/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, "+54 9 342 555-1111");

    const descInput = screen.getByLabelText(/^Descripción/i);
    await user.clear(descInput);
    await user.type(descInput, "Nueva descripción");

    const submitBtn = screen.getByRole("button", {
      name: PROFILE_EDIT_PAGE.save,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(sentBody).toEqual({
        name: "Carlos Alberto",
        last_name: "Gómez",
        locality: "Santa Fe",
        contact_phone: "+54 9 342 555-1111",
        description: "Nueva descripción",
      });
      expect(replace).toHaveBeenCalledWith("/dashboard/profile");
    });
  });

  it("sends null for cleared optional fields", async () => {
    const user = userEvent.setup();
    let sentBody: Record<string, unknown> | null = null;

    server.use(
      http.patch(ME_ENDPOINT, async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: "user-1",
          email: "analyst@example.com",
          name: "Carlos",
          last_name: "Gómez",
          role: "analyst",
          locality: null,
          contact_phone: null,
          description: null,
        });
      }),
    );

    await renderWithProviders(<EditProfilePage />);

    const localityInput = await screen.findByLabelText(/^Localidad/i);
    await user.clear(localityInput);

    const phoneInput = screen.getByLabelText(/^Teléfono de contacto/i);
    await user.clear(phoneInput);

    const descInput = screen.getByLabelText(/^Descripción/i);
    await user.clear(descInput);

    const submitBtn = screen.getByRole("button", {
      name: PROFILE_EDIT_PAGE.save,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(sentBody).toEqual({
        name: "Carlos",
        last_name: "Gómez",
        locality: null,
        contact_phone: null,
        description: null,
      });
      expect(replace).toHaveBeenCalledWith("/dashboard/profile");
    });
  });

  it("displays error message when saving fails", async () => {
    const user = userEvent.setup();

    server.use(
      http.patch(ME_ENDPOINT, () => {
        return HttpResponse.json(
          {
            type: "/errors/validation-failed",
            title: "Validation error",
            status: 400,
            detail: "Error de validación en el servidor",
          },
          { status: 400 },
        );
      }),
    );

    await renderWithProviders(<EditProfilePage />);

    const submitBtn = await screen.findByRole("button", {
      name: PROFILE_EDIT_PAGE.save,
    });
    await user.click(submitBtn);

    expect(
      await screen.findByText(
        /Algunos datos no son válidos|Error al guardar los cambios/i,
      ),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
