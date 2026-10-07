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

const INVALID_VERIFICATION_LINK =
  "Este enlace de verificación no es válido. Revisá que lo hayas abierto completo desde el correo.";

/**
 * Only self-registered field workers receive this link (backoffice roles are
 * invited), and the confirm endpoint answers 204 with no body, so the page
 * never knows who verified. Every string here has to be true for a field
 * worker whose account is still waiting for approval.
 */
export const VERIFY_EMAIL_PAGE = {
  landing: {
    title: "Confirmá tu email",
    description: "Tocá el botón para confirmar tu dirección de correo.",
    submit: "Verificar email",
    submitting: "Verificando...",
  },
  success: {
    title: "¡Email confirmado!",
    description: "Tu dirección de correo quedó confirmada.",
  },
  // `verification-token-used` is what a reload after success gets, so this is
  // worded as a neutral outcome rather than an error.
  used: {
    title: "Este enlace ya fue utilizado",
    description:
      "Si ya confirmaste tu email, no hace falta que hagas nada más.",
  },
  nextSteps:
    "Si te registraste desde la aplicación móvil, volvé a la app para ingresar. Si tu cuenta todavía no fue aprobada, un administrador tiene que validarla antes de que puedas entrar.",
  signInPrompt: "¿Usás el panel de administración?",
  signInLink: "Iniciá sesión",
  failed: {
    title: "No pudimos confirmar tu email",
  },
  missingToken: {
    title: "Enlace inválido",
    description:
      "A este enlace le falta el código de verificación. Abrilo de nuevo desde el correo que te enviamos.",
  },
  // Shown when the request never got an answer about the token (network, 5xx):
  // the token is unspent, so the button stays.
  submitError:
    "No pudimos confirmar tu email. Revisá tu conexión y volvé a intentar.",
  // Final answers about the link itself. No resend exists, so none of these
  // tells the user to ask for a new one.
  linkErrors: {
    [ERROR_TYPES.VERIFICATION_TOKEN_EXPIRED]:
      "Este enlace de verificación venció y ya no se puede usar.",
    [ERROR_TYPES.INVALID_VERIFICATION_TOKEN]: INVALID_VERIFICATION_LINK,
    [ERROR_TYPES.VALIDATION_FAILED]: INVALID_VERIFICATION_LINK,
  },
} as const;
