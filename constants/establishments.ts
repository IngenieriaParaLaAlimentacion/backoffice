import {
  EstablishmentRequestSortOrder,
  EstablishmentSortOrder,
  EstablishmentSubjectSortOrder,
  FoodMovementDirection,
  FoodMovementSource,
  FoodStockSortOrder,
  FoodStockUnit,
  RelationStatus,
  UserStatus,
} from "@/types/establishment";
import { Tone } from "@/constants/theme";

export const PAGE_SIZE = 20;
export const FILTER_DEBOUNCE_MS = 300;

export const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const SUBJECT_SORT_OPTIONS: {
  value: EstablishmentSubjectSortOrder;
  label: string;
}[] = [
  { value: "measured_at_desc", label: "Relevamiento (más reciente)" },
  { value: "measured_at_asc", label: "Relevamiento (más antiguo)" },
  { value: "name_asc", label: "Apellido A → Z" },
  { value: "name_desc", label: "Apellido Z → A" },
  { value: "bmi_desc", label: "IMC (mayor)" },
  { value: "bmi_asc", label: "IMC (menor)" },
  { value: "age_desc", label: "Edad (mayor)" },
  { value: "age_asc", label: "Edad (menor)" },
];

export const RELATION_STATUS_OPTIONS: {
  value: RelationStatus;
  label: string;
}[] = [
  { value: "approved", label: "Aprobados" },
  { value: "pending", label: "Pendientes" },
  { value: "rejected", label: "Rechazados" },
  { value: "revoked", label: "Revocados" },
];

export const RELATION_STATUS_LABELS: Record<RelationStatus, string> = {
  approved: "Aprobado",
  pending: "Pendiente",
  rejected: "Rechazado",
  revoked: "Revocado",
};

/** Which tone each enrollment status reads as; the colors are in `constants/theme.ts`. */
export const RELATION_STATUS_TONE: Record<RelationStatus, Tone> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  revoked: "neutral",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  pending_validation: "Pendiente de validación",
};

export const ESTABLISHMENT_DASHBOARD_PAGE = {
  back: "Volver",
  loadError: "Error al cargar el comedor",
  notFoundTitle: "Comedor no encontrado",
  notFoundBody: "El comedor que buscás no existe o fue eliminado del sistema.",
  forbiddenTitle: "No tenés permisos",
  forbiddenBody: "Esta vista está disponible para administradores y analistas.",
  backToPanel: "Volver al panel de comedores",

  metricsTitle: "Métricas",
  noData: "Sin datos disponibles",
  noDataHint:
    "Este comedor todavía no tiene mediciones registradas. Las métricas aparecen cuando se carga el primer relevamiento.",
  metrics: {
    subjects: "Sujetos que asisten",
    height: "Talla promedio",
    weight: "Peso promedio",
    bmi: "IMC promedio",
    age: "Edad promedio",
  },
  measurementsSummary: (count: number) =>
    `${count} ${count === 1 ? "medición registrada" : "mediciones registradas"}`,
  lastMeasuredAt: "Último relevamiento",

  alertTitle: "Estado de alerta",
  noAlerts: "Sin alertas",
  atRisk: (atRisk: number, total: number) =>
    `${atRisk} de ${total} ${total === 1 ? "sujeto" : "sujetos"} en riesgo`,
  allNormal: (total: number) =>
    `Los ${total} sujetos evaluados están en estado normal.`,
  severityTitles: {
    critical: "Estado crítico",
    high: "Estado de alerta alta",
    medium: "Estado de alerta media",
  },

  subjectsTitle: "Sujetos",
  subjectsSubtitle: (total: number) =>
    `${total} ${total === 1 ? "sujeto asiste" : "sujetos asisten"} a este comedor`,
  noSubjects: "No hay sujetos con mediciones en este comedor",
  subjectsError: "Error al cargar los sujetos",
  subjectsSearchPlaceholder: "Nombre, apellido o documento",
  subjectScopeLabel: "Último relevamiento en este comedor",
  subjectColumns: {
    name: "Nombre",
    dni: "Documento",
    age: "Edad",
    measuredAt: "Último relevamiento",
    weight: "Peso",
    height: "Talla",
    bmi: "IMC",
    measurements: "Mediciones",
    status: "Estado",
  },

  fieldWorkersTitle: "Relevadores",
  fieldWorkersSubtitle: "Relevadores inscriptos en este comedor",
  noFieldWorkers: "No hay relevadores inscriptos",
  fieldWorkersError: "Error al cargar los relevadores",
  fieldWorkersSearchPlaceholder: "Nombre, apellido o email",
  fieldWorkerColumns: {
    name: "Nombre",
    email: "Email",
    userStatus: "Estado de cuenta",
    relationStatus: "Inscripción",
    measurements: "Mediciones",
    lastMeasuredAt: "Último relevamiento",
  },
  actionsMenuLabel: "Más acciones",
  removeAccess: "Quitar acceso",
  removeAccessConfirmDialog:
    "¿Quitar el acceso de este relevador a este comedor? Podrá volver a solicitarlo más adelante.",
  removeAccessError: "No se pudo quitar el acceso",
  removeAccessConflict:
    "El acceso de este relevador ya no está aprobado; se actualizó la lista.",

  search: "Buscar",
  sortBy: "Ordenar por",
  relationStatus: "Inscripción",
} as const;

export const ESTABLISHMENT_TABS = {
  establishments: "Establecimientos",
  requests: "Solicitudes",
} as const;

// Tabs inside a single establishment's ficha (app/dashboard/establishments/[id]/),
// not to be confused with ESTABLISHMENT_TABS above (the establishments-wide nav).
export const ESTABLISHMENT_DETAIL_TABS = {
  subjects: "Sujetos",
  fieldWorkers: "Relevadores",
  stock: "Stock",
} as const;

// Shared by the create-establishment form, the request review form and the
// propose-establishment form — address/city/province are identical in all
// three contexts, only the "name" placeholder differs (see
// CREATE_ESTABLISHMENT_PAGE / ESTABLISHMENT_REQUEST_REVIEW_PANEL /
// PROPOSE_ESTABLISHMENT_PAGE).
export const ESTABLISHMENT_FORM_FIELDS = {
  name: { label: "Nombre" },
  address: { label: "Dirección", placeholder: "Ej: Av. Corrientes 1234, CABA" },
  city: { label: "Ciudad", placeholder: "Ej: Buenos Aires" },
  province: { label: "Provincia", placeholder: "Ej: CABA" },
} as const;

export const ESTABLISHMENT_SORT_OPTIONS: {
  value: EstablishmentSortOrder;
  label: string;
}[] = [
  { value: "newest", label: "Más recientes primero" },
  { value: "oldest", label: "Más antiguos primero" },
  { value: "name_asc", label: "Nombre A → Z" },
  { value: "name_desc", label: "Nombre Z → A" },
  { value: "city_asc", label: "Ciudad A → Z" },
  { value: "city_desc", label: "Ciudad Z → A" },
  { value: "province_asc", label: "Provincia A → Z" },
  { value: "province_desc", label: "Provincia Z → A" },
];

export const ESTABLISHMENTS_LIST_PAGE = {
  title: "Establecimientos",
  subtitle: "Establecimientos registrados en el sistema",
  createButton: "Nuevo establecimiento",
  proposeButton: "Proponer establecimiento",
  searchLabel: "Buscar",
  searchPlaceholder: "Nombre o dirección",
  sortLabel: "Ordenar por",
  filters: {
    city: "Ciudad",
    province: "Provincia",
  },
  noEstablishments: "No hay establecimientos",
  loadError: "Error al cargar establecimientos",
  proposeSuccess: "Propuesta enviada — un administrador la revisará.",
  closeAria: "Cerrar",
  columns: {
    name: "Nombre",
    address: "Dirección",
    city: "Ciudad",
    province: "Provincia",
  },
} as const;

export const STOCK_SORT_OPTIONS: {
  value: FoodStockSortOrder;
  label: string;
}[] = [
  { value: "name_asc", label: "Nombre A → Z" },
  { value: "name_desc", label: "Nombre Z → A" },
  { value: "quantity_desc", label: "Cantidad (mayor a menor)" },
  { value: "quantity_asc", label: "Cantidad (menor a mayor)" },
  { value: "updated_at_desc", label: "Última actualización" },
];

export const STOCK_UNIT_LABELS: Record<FoodStockUnit, string> = {
  unidades: "Unidades",
  kilogramos: "Kilogramos",
  litros: "Litros",
};

export const ESTABLISHMENT_STOCK_PAGE = {
  subtitle: (total: number) =>
    `${total} ${total === 1 ? "alimento" : "alimentos"} en stock`,
  viewHistory: "Historial de Movimientos",
  categoryLabel: "Categoría",
  allCategories: "Todas las categorías",
  sortLabel: "Ordenar por",
  noStock: "No hay alimentos con stock disponible en este establecimiento",
  noResults: "Ningún alimento coincide con los filtros aplicados",
  loadError: "Error al cargar el stock",
  columns: {
    food: "Alimento",
    category: "Categoría",
    unit: "Unidad",
    quantity: "Cantidad",
    updatedAt: "Última actualización",
  },
} as const;

export const MOVEMENT_DIRECTION_LABELS: Record<FoodMovementDirection, string> =
  {
    in: "Entrada",
    out: "Salida",
  };

/** Only intakes carry a source; outflows are always loaded by hand. */
export const MOVEMENT_SOURCE_LABELS: Record<FoodMovementSource, string> = {
  manual: "Carga manual",
  photo: "Foto",
};

/** `""` means "no filter" — the API param is simply omitted. */
export const MOVEMENT_DIRECTION_OPTIONS: {
  value: "" | FoodMovementDirection;
  label: string;
}[] = [
  { value: "", label: "Entradas y salidas" },
  { value: "in", label: "Solo entradas" },
  { value: "out", label: "Solo salidas" },
];

export const ESTABLISHMENT_MOVEMENTS_PAGE = {
  title: "Historial de movimientos",
  back: "Volver al stock",
  subtitle: (total: number) =>
    `${total} ${total === 1 ? "movimiento registrado" : "movimientos registrados"}`,
  // `food_count` counts distinct foods, not lines: "3 ítems" would be a lie
  // for a movement whose detail returns four lines of three foods.
  foodCount: (count: number) =>
    `${count} ${count === 1 ? "alimento" : "alimentos"}`,
  directionLabel: "Dirección",
  dateFrom: "Fecha desde",
  dateTo: "Fecha hasta",
  // The category scopes the search; only the chosen food filters the listing,
  // because the endpoint takes `food_id` and no `category_id`. The labels say
  // "Buscar alimento" rather than "Filtros" so that reads as intended.
  foodSearchTitle: "Buscar alimento",
  foodCategoryLabel: "Categoría",
  allCategories: "Todas las categorías",
  foodLabel: "Alimento",
  foodPlaceholder: "Ej: Arroz",
  noFoodResults: "Ningún alimento coincide con la búsqueda",
  moreFoodResults: "Seguí escribiendo para afinar la búsqueda",
  clearFood: "Quitar el filtro de alimento",
  noMovements: "Este comedor todavía no tiene movimientos registrados",
  noResults: "Ningún movimiento coincide con los filtros aplicados",
  loadError: "Error al cargar el historial de movimientos",
  invalidRange: "La fecha desde no puede ser posterior a la fecha hasta",
  notFoundTitle: "Comedor no encontrado",
  notFoundBody: "El comedor que buscás no existe o fue eliminado del sistema.",
  forbiddenTitle: "No tenés permisos",
  forbiddenBody: "No tenés acceso al historial de este comedor.",
  backToPanel: "Volver al panel de comedores",
  columns: {
    date: "Fecha",
    direction: "Dirección",
    responsible: "Responsable",
    foods: "Alimentos",
  },
  detail: {
    title: "Detalle del movimiento",
    responsible: "Responsable",
    date: "Fecha",
    direction: "Dirección",
    source: "Origen",
    comments: "Comentarios",
    linesTitle: "Alimentos",
    food: "Alimento",
    quantity: "Cantidad",
    unit: "Unidad",
    // A movement of another comedor answers 404, never 403.
    notFound: "Ese movimiento no existe",
    loadError: "Error al cargar el detalle del movimiento",
  },
} as const;

export const ESTABLISHMENT_REQUEST_SORT_OPTIONS: {
  value: EstablishmentRequestSortOrder;
  label: string;
}[] = [
  { value: "oldest", label: "Más antiguos primero" },
  { value: "newest", label: "Más recientes primero" },
];

export const ESTABLISHMENT_REQUESTS_PAGE = {
  title: "Establecimientos faltantes",
  subtitle: "Notificaciones de establecimientos pendientes de alta",
  searchLabel: "Buscar",
  searchPlaceholder: "Nombre, dirección o relevador",
  sortLabel: "Ordenar por",
  noRequests: "No hay establecimientos pendientes de alta",
  loadError: "Error al cargar solicitudes",
  closeAria: "Cerrar",
  successReused:
    "Establecimiento dado de alta correctamente. Se reutilizó un establecimiento ya existente con esa ubicación.",
  successCreated: "Establecimiento dado de alta correctamente.",
  staleMessage:
    "Esta solicitud ya fue revisada por otro administrador. Se actualizó la lista.",
  columns: {
    name: "Nombre",
    requester: "Relevador",
    location: "Ciudad / Provincia",
    requestedAt: "Fecha de solicitud",
    actions: "Acciones",
  },
  reviewButton: "Revisar",
} as const;

export const ESTABLISHMENT_REQUEST_REVIEW_PANEL = {
  approveLabel: "Aprobar",
  approveConfirmLabel: "Confirmar alta",
  approveConfirmationMessage:
    "Confirmá el alta para crear el establecimiento con estos datos.",
  rejectLabel: "Rechazar",
  rejectConfirmLabel: "Confirmar rechazo",
  rejectReasonLabel: "Motivo del rechazo",
  optionalTag: "(opcional)",
  rejectReasonPlaceholder: "Ej: Datos incompletos, comedor duplicado...",
  cancelLabel: "Cancelar",
  namePlaceholder: "Ej: Establecimiento Central Norte",
  approveError: "Error al aprobar la solicitud",
  rejectError: "Error al rechazar la solicitud",
} as const;

export const CREATE_ESTABLISHMENT_PAGE = {
  title: "Nuevo establecimiento",
  subtitle: "Completá los datos del establecimiento",
  back: "Volver",
  namePlaceholder: "Ej: Comedor Central Norte",
  submitError: "Error al crear el establecimiento",
  submitButton: "Crear establecimiento",
} as const;

export const PROPOSE_ESTABLISHMENT_PAGE = {
  title: "Proponer establecimiento",
  subtitle:
    "Como analista no tenés los permisos para crear establecimientos directamente. Completá los datos que tengas y un administrador revisará tu propuesta.",
  back: "Volver",
  namePlaceholder: "Ej: Comedor Central Norte",
  submitError: "Error al enviar la propuesta",
  submitButton: "Enviar propuesta",
} as const;
