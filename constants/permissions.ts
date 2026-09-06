/** Copy for the role/permission layer: the 403 screen and session loading. */
export const FORBIDDEN_SCREEN = {
  title: "No tenés permisos",
  body: "Esta sección solo está disponible para administradores.",
  backToHome: "Volver al inicio",
} as const;

export const SESSION = {
  loadError: "No se pudo cargar tu sesión",
  loadErrorBody:
    "No pudimos verificar tus permisos. Revisá tu conexión y volvé a intentar.",
  retry: "Reintentar",
} as const;
