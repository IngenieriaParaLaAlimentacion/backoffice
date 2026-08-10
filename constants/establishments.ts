import {
  EstablishmentSubjectSortOrder,
  RelationStatus,
  UserStatus,
} from "@/types/establishment";

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
];

export const RELATION_STATUS_LABELS: Record<RelationStatus, string> = {
  approved: "Aprobado",
  pending: "Pendiente",
  rejected: "Rechazado",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  pending_validation: "Pendiente de validación",
};

export const ESTABLISHMENT_DASHBOARD_PAGE = {
  back: "Volver",
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
  fieldWorkersSearchPlaceholder: "Nombre, apellido o email",
  fieldWorkerColumns: {
    name: "Nombre",
    email: "Email",
    userStatus: "Estado de cuenta",
    relationStatus: "Inscripción",
    measurements: "Mediciones",
    lastMeasuredAt: "Último relevamiento",
  },

  search: "Buscar",
  sortBy: "Ordenar por",
  relationStatus: "Inscripción",
} as const;
