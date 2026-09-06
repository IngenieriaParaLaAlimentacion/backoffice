import { ERROR_TYPES } from "@/lib/apiError";

export const SIGN_IN_FORM = {
  submitError: "No pudimos iniciar sesión. Volvé a intentar en unos minutos.",
  // `invalid-credentials` covers unknown email, wrong password and a missing
  // password row alike — the backend collapses them on purpose so the endpoint
  // can't be used to discover which addresses are registered, so this copy
  // stays equally vague.
  errors: {
    [ERROR_TYPES.INVALID_CREDENTIALS]:
      "El email o la contraseña son incorrectos. Revisalos e intentá de nuevo.",
    [ERROR_TYPES.ACCOUNT_PENDING_VALIDATION]:
      "Tu cuenta todavía no fue aprobada. Un administrador tiene que validarla antes de que puedas ingresar.",
    [ERROR_TYPES.ROLE_NOT_ALLOWED]:
      "Este panel es para administradores y analistas. Si sos relevador, ingresá desde la aplicación móvil.",
  },
} as const;

/** Both flows post to the same confirm endpoint, so they share these messages. */
export const RECOVERY_LINK_ERRORS = {
  [ERROR_TYPES.RECOVERY_TOKEN_USED]:
    "Este enlace ya fue utilizado, o se generó uno más nuevo. Pedí un enlace nuevo para continuar.",
  [ERROR_TYPES.RECOVERY_TOKEN_EXPIRED]:
    "Este enlace venció. Pedí uno nuevo para continuar.",
  [ERROR_TYPES.INVALID_RECOVERY_TOKEN]:
    "Este enlace no es válido. Revisá que lo hayas copiado completo o pedí uno nuevo.",
} as const;

export const ACCEPT_INVITE_FORM = {
  submitError:
    "No pudimos crear tu contraseña. Volvé a intentar en unos minutos.",
  errors: RECOVERY_LINK_ERRORS,
} as const;

export const RESET_PASSWORD_FORM = {
  submitError:
    "No pudimos cambiar tu contraseña. Volvé a intentar en unos minutos.",
  // The link carries the token: reaching the form without one means it was
  // truncated or hand-typed, so there is nothing to submit.
  missingToken: "Token inválido o inexistente.",
  errors: RECOVERY_LINK_ERRORS,
} as const;

export const FORGOT_PASSWORD_FORM = {
  submitError:
    "No pudimos enviar el correo de recuperación. Volvé a intentar en unos minutos.",
} as const;

export const VERIFY_EMAIL_ERRORS = {
  [ERROR_TYPES.VERIFICATION_TOKEN_USED]:
    "Este enlace de verificación ya fue utilizado, o se generó uno más nuevo. Pedí uno nuevo para continuar.",
  [ERROR_TYPES.VERIFICATION_TOKEN_EXPIRED]:
    "Este enlace de verificación venció. Pedí uno nuevo para continuar.",
  [ERROR_TYPES.INVALID_VERIFICATION_TOKEN]:
    "Este enlace de verificación no es válido. Revisá que lo hayas copiado completo o pedí uno nuevo.",
} as const;
