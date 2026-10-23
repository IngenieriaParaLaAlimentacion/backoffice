import { UserRole } from "@/types/user";
import { ERROR_TYPES } from "@/lib/apiError";

/**
 * The role listings the Usuarios screen renders, in display order. Plural
 * labels because they title a section; the singular ones are `ROLE_LABELS`.
 * `superadmin` is deliberately absent — it isn't a section of its own.
 */
export const ROLE_SECTIONS: readonly { role: UserRole; label: string }[] = [
  { role: "admin", label: "Administradores" },
  { role: "field_worker", label: "Relevadores" },
  { role: "analyst", label: "Analistas" },
];

/** How many establishments a user's row lists before collapsing into "+N más". */
export const MAX_LISTED_ESTABLISHMENTS = 2;

export const USERS_PAGE = {
  title: "Usuarios",
  subtitle: "Usuarios aceptados",
  viewAll: "Ver todos",
  /** Shown when a section previews fewer users than the role has. */
  showing: (shown: number, total: number) => `Mostrando ${shown} de ${total}`,
  noUsers: "No hay usuarios",
  loadError: "Error al cargar usuarios",
  columns: {
    name: "Nombre",
    email: "Email",
    establishments: "Establecimientos",
  },
  moreEstablishments: (count: number) => `+${count} más`,
  pagination: (page: number, total: number) => `Página ${page} de ${total}`,
} as const;

/** The invite buttons beside the admin and analyst section titles. */
export const INVITE_LABELS = {
  admin: "Invitar administrador",
  analyst: "Invitar analista",
} as const;

export const REQUEST_TABS = {
  users: "Registros de usuarios",
  establishments: "Accesos a establecimientos",
  establishmentCreations: "Altas de establecimientos",
} as const;

export const PENDING_REQUESTS_PAGE = {
  title: "Solicitudes de usuario",
  subtitle: "Relevadores pendientes de validación",
  loadError: "Error al cargar solicitudes",
  applyError: "Error al aplicar los cambios",
  partialApplyError:
    "La cuenta se activó, pero no se pudieron rechazar algunos establecimientos. Reintentá o resolvelos desde la pestaña Accesos a establecimientos.",
  rejectError: "Error al rechazar la solicitud",
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
  emailNotVerified: "Email sin verificar",
  establishmentsIntro:
    "Aceptá o rechazá los establecimientos que quieras resolver ahora; los que dejes sin decidir quedan pendientes y se resuelven en la pestaña Accesos a establecimientos.",
  noEstablishmentsRequested: "No solicitó acceso a ningún establecimiento.",
  accept: "Aceptar",
  reject: "Rechazar",
  pendingSummary: (count: number) =>
    `${count} establecimiento${count === 1 ? "" : "s"} quedará${
      count === 1 ? "" : "n"
    } pendiente${count === 1 ? "" : "s"}.`,
  acceptRequest: "Aceptar solicitud",
  acceptConfirm: "Confirmar aceptación",
  acceptConfirmationMessage:
    "Se activará la cuenta del relevador con las decisiones tomadas.",
  rejectRequest: "Rechazar solicitud",
  rejectConfirm: "Confirmar rechazo",
  rejectConfirmationMessage:
    "La cuenta quedará inactiva y se rechazarán todos los establecimientos que solicitó.",
  cancel: "Cancelar",
} as const;

export const ESTABLISHMENT_ACCESS_REQUESTS_PAGE = {
  title: "Solicitudes de establecimiento",
  subtitle: "Relevadores activos con accesos pendientes de revisión",
  searchLabel: "Buscar",
  searchPlaceholder: "Nombre, apellido o email",
  loadError: "Error al cargar los accesos pendientes",
  applyError: "Error al aplicar los cambios",
  noRequests: "No hay accesos pendientes",
  columns: {
    name: "Nombre",
    email: "Email",
    pendingEstablishments: "Establecimientos pendientes",
    actions: "Acciones",
  },
  reviewButton: "Revisar",
  establishmentsIntro:
    "Aceptá o rechazá los accesos que quieras resolver ahora; los que dejes sin decidir siguen pendientes.",
  pendingEstablishmentsCount: (count: number) =>
    `${count} establecimiento${count === 1 ? "" : "s"} pendiente${
      count === 1 ? "" : "s"
    }`,
  apply: "Aplicar cambios",
  applyConfirm: "Confirmar cambios",
  applyConfirmationMessage:
    "Se aplicarán las decisiones tomadas; los establecimientos sin decidir quedan pendientes.",
  cancel: "Cancelar",
  successMessage: "Accesos actualizados.",
  closeAria: "Cerrar mensaje",
} as const;

export const PROFILE_PAGE = {
  title: "Perfil",
  subtitle: "Mi información personal",
  editProfile: "Editar perfil",
  loadError: "Error al cargar el perfil",
  sections: {
    personal: "Datos personales",
    account: "Cuenta",
  },
  fields: {
    name: "Nombre",
    lastName: "Apellido",
    email: "Email",
    role: "Rol",
    accountStatus: "Estado de la cuenta",
    locality: "Localidad",
    contactPhone: "Teléfono de contacto",
    description: "Descripción",
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
    locality: "Localidad",
    localityPlaceholder: "Tu localidad",
    contactPhone: "Teléfono de contacto",
    contactPhonePlaceholder: "+54 11 1234-5678",
    description: "Descripción",
    descriptionPlaceholder: "Breve descripción personal o profesional",
  },
  save: "Guardar cambios",
  cancel: "Cancelar",
  readOnlyHint:
    "El email y el rol no se pueden editar desde acá. Si necesitás cambiarlos, contactá a un administrador.",
} as const;

export const MY_ESTABLISHMENTS = {
  title: "Mis establecimientos",
  subtitle: "Establecimientos vinculados a tu cuenta",
  empty: "No tenés establecimientos vinculados.",
  loadError: "Error al cargar los establecimientos",
  cancel: "Cancelar",
  proposeLink: "¿No encontrás tu establecimiento? Proponé uno nuevo",
  search: {
    description: "Buscá un establecimiento activo en el catálogo.",
    placeholder: "Buscar por nombre, dirección o localidad...",
    button: "Buscar",
    hint: "Ingresá un nombre o una dirección y presioná Buscar.",
    noResults: "No se encontraron establecimientos activos.",
    error: "Error al buscar establecimientos",
  },
  // One block per way of linking an establishment: analysts request access,
  // admins subscribe. The section picks one from the viewer's permissions.
  request: {
    add: "Solicitar acceso",
    searchTitle: "Solicitar acceso a establecimiento",
    addError: "Error al solicitar acceso",
    remove: "Retirar acceso",
    removeTitle: "Retirar acceso",
    removeDescription: (name: string) =>
      `¿Confirmás que deseás retirar tu solicitud de acceso a ${name}?`,
    confirmRemove: "Confirmar retiro",
    removeError: "Error al retirar el acceso",
  },
  subscribe: {
    add: "Suscribirme",
    searchTitle: "Suscribirse a establecimiento",
    addError: "Error al suscribirse al establecimiento",
    remove: "Desuscribirme",
    removeTitle: "Desuscribirse",
    removeDescription: (name: string) =>
      `¿Confirmás que deseás desuscribirte de ${name}?`,
    confirmRemove: "Confirmar desuscripción",
    removeError: "Error al desuscribirse",
  },
} as const;

export const INVITE_USER_DIALOG = {
  description: "Se enviará un correo con el enlace de invitación.",
  // Rendered after the address, so every message here is a sentence fragment:
  // "<email> ya tiene una cuenta...".
  sendError:
    "no recibió la invitación: hubo un problema al enviarla. Podés reintentar.",
  errors: {
    [ERROR_TYPES.INVITE_ALREADY_PENDING]:
      "ya tiene una invitación pendiente: recibió el enlace pero todavía no creó su contraseña. Podés reenviárselo.",
    [ERROR_TYPES.USER_ALREADY_EXISTS]:
      "ya tiene una cuenta en el sistema, así que no necesita una invitación.",
    [ERROR_TYPES.USER_IS_NOT_PENDING]:
      "ya completó su alta, así que no se le puede reenviar la invitación.",
    [ERROR_TYPES.EMAIL_DELIVERY_FAILED]:
      "no recibió el correo: falló la entrega. Revisá que la dirección sea correcta e intentá de nuevo.",
  },
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
  loadError: "Error al cargar el perfil",
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
  actionsMenuLabel: "Más acciones",
  removeAccess: "Quitar acceso",
  removeAccessConfirmDialog:
    "¿Quitar el acceso de este relevador a este comedor? Podrá volver a solicitarlo más adelante.",
  removeAccessError: "No se pudo quitar el acceso",
  removeAccessConflict:
    "El acceso a este comedor ya no está aprobado; se actualizó la lista.",
  changeRole: {
    button: "Cambiar rol",
    title: "Cambiar rol",
    description: "Elegí el nuevo rol de este usuario.",
    currentRole: "Rol actual",
    newRole: "Nuevo rol",
    confirm: "Cambiar rol",
    confirming: "Cambiando…",
    cancel: "Cancelar",
    success: (role: string) => `Rol cambiado a ${role}.`,
    closeAria: "Cerrar mensaje",
    // Overrides the shared ROLE_NOT_ALLOWED copy, which is about the
    // viewer's own access to a screen, not about the user being edited.
    errors: {
      [ERROR_TYPES.ROLE_NOT_ALLOWED]:
        "No tenés permiso para cambiarle el rol a este usuario.",
      [ERROR_TYPES.USER_NOT_FOUND]: "El usuario ya no existe.",
      [ERROR_TYPES.USER_IS_NOT_ACTIVE]:
        "El usuario no está activo: tiene una invitación pendiente o todavía no fue validado.",
      [ERROR_TYPES.VALIDATION_FAILED]: "El rol elegido no es válido.",
    },
    genericError: "No se pudo cambiar el rol",
  },
} as const;
