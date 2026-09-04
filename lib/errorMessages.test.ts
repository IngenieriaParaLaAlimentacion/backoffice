import { describe, expect, it } from "vitest";
import { ApiError, ERROR_TYPES, toApiError } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { GENERIC_ERROR_MESSAGE } from "@/constants/errors";

describe("toApiError", () => {
  it("keeps status, type and extension members from the problem+json body", () => {
    const error = toApiError(
      {
        type: ERROR_TYPES.INVITE_ALREADY_PENDING,
        title: "Invitation already pending",
        status: 409,
        detail: "This address has already been invited.",
        instance: "/api/v1/admin/invite-admin",
        user_id: "abc-123",
      },
      409,
    );

    expect(error.status).toBe(409);
    expect(error.type).toBe(ERROR_TYPES.INVITE_ALREADY_PENDING);
    expect(error.extensions).toEqual({ user_id: "abc-123" });
  });

  it("survives a body that is not a problem+json envelope", () => {
    const error = toApiError(null, 500);

    expect(error.status).toBe(500);
    expect(error.type).toBeUndefined();
    expect(getErrorMessage(error)).toBe(GENERIC_ERROR_MESSAGE);
  });
});

describe("getErrorMessage", () => {
  const apiError = (type: string) => new ApiError("English detail", 401, type);

  it("maps a known type to shared Spanish copy", () => {
    expect(getErrorMessage(apiError(ERROR_TYPES.UNAUTHORIZED))).toBe(
      "Tu sesión expiró. Volvé a iniciar sesión para continuar.",
    );
  });

  it("prefers a screen-specific override over the shared copy", () => {
    const message = getErrorMessage(apiError(ERROR_TYPES.UNAUTHORIZED), {
      overrides: { [ERROR_TYPES.UNAUTHORIZED]: "Copia de la pantalla" },
    });

    expect(message).toBe("Copia de la pantalla");
  });

  it("falls back rather than leaking the backend's English detail", () => {
    const message = getErrorMessage(apiError("/errors/some-future-slug"), {
      fallback: "No se pudo completar la acción.",
    });

    expect(message).toBe("No se pudo completar la acción.");
  });

  it("falls back for a plain Error, which carries no type at all", () => {
    expect(getErrorMessage(new Error("Network request failed"))).toBe(
      GENERIC_ERROR_MESSAGE,
    );
  });
});
