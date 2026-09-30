import { ERROR_TYPES } from "@/lib/apiError";

/** Shown when an error carries no `type` we recognise. */
export const GENERIC_ERROR_MESSAGE =
  "Ocurrió un error inesperado. Volvé a intentar en unos minutos.";

/**
 * Spanish copy for backend errors that can surface on more than one screen.
 * Screen-specific wording overrides these — see the `overrides` argument of
 * `getErrorMessage` (`lib/errorMessages.ts`).
 *
 * Keyed by the RFC 7807 `type`, never by `detail`: the backend documents
 * `type` as the stable contract and its prose as freely reworded.
 */
export const SHARED_ERROR_MESSAGES: Record<string, string> = {
  [ERROR_TYPES.ROLE_NOT_ALLOWED]:
    "Tu rol no tiene permisos para acceder a esta sección del backoffice.",

  // The auth gate redirects to /signin on its own, so these only show if a
  // request loses the race with it.
  [ERROR_TYPES.MISSING_TOKEN]:
    "Tu sesión expiró. Volvé a iniciar sesión para continuar.",
  [ERROR_TYPES.UNAUTHORIZED]:
    "Tu sesión expiró. Volvé a iniciar sesión para continuar.",
  [ERROR_TYPES.INVALID_REFRESH_TOKEN]:
    "Tu sesión expiró. Volvé a iniciar sesión para continuar.",

  [ERROR_TYPES.INVALID_AGE_RANGE]:
    "El rango de edades no es válido: la edad mínima no puede ser mayor que la máxima.",
  [ERROR_TYPES.INVALID_DATE_RANGE]:
    "El rango de fechas no es válido: la fecha desde no puede ser posterior a la fecha hasta.",

  // The backend's 422 names no field on purpose, so this cannot say which one
  // is wrong. Every filter/form that can produce a 422 should validate in the
  // browser first so the user gets a message that points somewhere.
  [ERROR_TYPES.VALIDATION_FAILED]:
    "Algunos datos no son válidos. Revisá los campos e intentá de nuevo.",
  [ERROR_TYPES.INTERNAL_ERROR]: GENERIC_ERROR_MESSAGE,
  [ERROR_TYPES.CONCURRENT_UPDATE]:
    "Hay otra actualización en curso. Esperá un momento y volvé a intentar.",

  [ERROR_TYPES.EMAIL_DELIVERY_FAILED]:
    "No se pudo enviar el correo. Verificá la dirección e intentá de nuevo.",
};
