export const ROLE_SECTIONS = [
  { role: "admin", label: "Administradores" },
  { role: "field_worker", label: "Relevadores" },
  { role: "analyst", label: "Analistas" },
] as const;

export const USERS_PAGE = {
  title: "Usuarios",
  subtitle: "Usuarios aceptados",
  viewAll: "Ver Todos",
  noUsers: "No hay usuarios",
  columns: {
    name: "Nombre",
    email: "Email",
    establishments: "Establecimientos",
  },
  pagination: (page: number, total: number) => `Página ${page} de ${total}`,
} as const;

export const PENDING_REQUESTS_PAGE = {
  title: "Solicitudes",
  subtitle: "Usuarios técnicos pendientes de validación",
  loadError: "Error al cargar solicitudes",
  applyError: "Error al aplicar los cambios",
  noRequests: "No hay solicitudes pendientes",
  columns: {
    name: "Nombre",
    email: "Email",
    establishments: "Establecimientos",
    actions: "Acciones",
  },
  review: "Revisar",
  establishmentsCount: (count: number) =>
    `${count} establecimiento${count === 1 ? "" : "s"}`,
  defaultDialogTitle: "Solicitud",
  establishmentsIntro:
    "Aceptá o rechazá los establecimientos que quieras resolver ahora; los que dejes sin decidir quedan pendientes.",
  noEstablishmentsRequested: "No solicitó acceso a ningún establecimiento.",
  accept: "Aceptar",
  reject: "Rechazar",
  pendingSummary: (count: number) =>
    `${count} establecimiento${count === 1 ? "" : "s"} quedará${
      count === 1 ? "" : "n"
    } pendiente${count === 1 ? "" : "s"}.`,
  acceptRequest: "Aceptar solicitud",
} as const;

export const PROFILE_PAGE = {
  title: "Perfil",
  subtitle: "Mi información personal",
  editProfile: "Editar perfil",
  loadError: "Error al cargar el perfil",
  fields: {
    name: "Nombre",
    lastName: "Apellido",
    email: "Email",
    role: "Rol",
    accountStatus: "Estado de la cuenta",
  },
  active: "Activo",
} as const;

export const PROFILE_EDIT_PAGE = {
  title: "Editar perfil",
  subtitle: "Actualizá tu información personal",
  back: "Volver",
  loadError: "Error al cargar el perfil",
  saveError: "Error al guardar los cambios",
  fields: {
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    lastName: "Apellido",
    lastNamePlaceholder: "Tu apellido",
    email: "Email",
    role: "Rol",
  },
  save: "Guardar cambios",
} as const;

export const INVITE_USER_DIALOG = {
  description: "Se enviará un correo con el enlace de invitación.",
  errorPrefix: "Hubo un problema al enviar la invitación a",
  errorSuffix: ". Podés reintentar.",
  successPrefix: "Invitación enviada a",
  successSuffix: ".",
  resend: "Reenviar invitación",
  resending: "Reenviando...",
  send: "Enviar invitación",
  sending: "Enviando...",
  emailLabel: "Email",
  emailPlaceholder: "admin@ejemplo.com",
} as const;

export const USER_DETAIL_PANEL = {
  title: "Perfil",
  description: "Información del usuario",
  fields: {
    name: "Nombre",
    email: "Email",
    role: "Rol",
    status: "Estado",
    contactPhone: "Teléfono de contacto",
    locality: "Localidad",
    description: "Descripción",
    establishments: "Establecimientos",
  },
} as const;
