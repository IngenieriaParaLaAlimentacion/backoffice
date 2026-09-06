import {
  ResponseType,
  SurveyResponseSortOrder,
  SurveyResponseTarget,
} from "@/types/survey";
import { Tone } from "@/constants/theme";

export const RESPONSE_TARGET_LABELS: Record<SurveyResponseTarget, string> = {
  subject: "Sujeto",
  establishment: "Establecimiento",
  anonymous: "Anónima",
};

/** Shown under each option so the choice is made informed, not by name alone (CA1). */
export const RESPONSE_TARGET_DESCRIPTIONS: Record<
  SurveyResponseTarget,
  string
> = {
  subject: "Cada respuesta corresponde a una persona registrada en el sistema",
  establishment: "Cada respuesta corresponde a un establecimiento",
  anonymous:
    "Las respuestas no se asocian a ninguna persona ni establecimiento",
};

export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  text: "Texto libre",
  single_choice: "Selección única",
  multiple_choice: "Selección múltiple",
  numeric: "Numérica",
  date: "Fecha",
};

export const MAX_QUESTIONS = 30;

// Mirrored from the backend's `app/domain/survey.py`: it rejects a choice
// question outside these bounds with a 400 that names no field, so the form
// has to check them first.
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 20;

export const SURVEY_OPTION_COUNT_MESSAGE = `Agregá entre ${MIN_OPTIONS} y ${MAX_OPTIONS} opciones`;

export const SURVEY_FORM = {
  createTitle: "Nueva encuesta",
  editTitle: "Editar encuesta",
  back: "Encuestas",
  nameLabel: "Nombre",
  namePlaceholder: "Nombre de la encuesta",
  descriptionLabel: "Descripción",
  descriptionPlaceholder: "Descripción (opcional)",
  targetLabel: "Destino de las respuestas",
  questionsLabel: "Preguntas",
  addQuestion: "Agregar pregunta",
  addOption: "Agregar opción",
  questionPlaceholder: "Texto de la pregunta",
  optionPlaceholder: "Texto de la opción",
  responseTypeLabel: "Tipo de respuesta",
  requiredLabel: "Obligatoria",
  save: "Guardar",
  saving: "Guardando...",
  cancel: "Cancelar",
  lockedNotice:
    "Esta encuesta ya tiene respuestas registradas: no se pueden modificar las preguntas ni el destino.",
  nameConflict: "Ya existe una encuesta con ese nombre",
  // The backend's structural 400 names no field, and the zod schema mirrors
  // those same rules — reaching this means the form and the API disagree.
  invalidStructure:
    "Revisá las preguntas: alguna no cumple con el formato esperado.",
  saveError: "No se pudo guardar la encuesta.",
  loadError: "Error al cargar la encuesta",
  fiesTemplateError: "Error al cargar la plantilla FIES",
  // Race condition: someone answered the survey while the form was open, so the
  // API rejects a change the disabled-field rule assumed could not be sent.
  lockedConflict:
    "La encuesta recibió respuestas mientras la editabas; ya no se puede cambiar su destino. Recargá la página para ver el estado actual.",
  activate: "Activar",
  activateTitle: "Habilita la encuesta para que puedan responderla",
  activateConfirm: "¿Activar esta encuesta? Quedará disponible para responder.",
  deactivate: "Desactivar",
  deactivateTitle: "Deja de aceptar nuevas respuestas para esta encuesta",
  deactivateConfirm:
    "¿Desactivar esta encuesta? Dejará de estar disponible para responder.",
  delete: "Eliminar",
  deleteConfirm: "¿Eliminar esta encuesta? Esta acción no se puede deshacer.",
} as const;

export const SURVEYS_PAGE = {
  title: "Encuestas",
  subtitle: "Relevamientos FIES y personalizados",
  createSurvey: "Crear encuesta",
  searchPlaceholder: "Buscar por nombre",
  noSurveys: "No hay encuestas",
  statusActive: "Activa",
  statusInactive: "Inactiva",
  targetFilterLabel: "Destino",
  allTargets: "Todos",
  columns: {
    name: "Nombre",
    target: "Destino",
    status: "Estado",
    questions: "Preguntas",
    created: "Creada",
  },
  pagination: (page: number, total: number) => `Página ${page} de ${total}`,
  actions: "Acciones",
  actionsMenuLabel: "Más acciones",
  edit: "Editar",
  editDisabledReason: "No se puede editar: ya tiene respuestas registradas.",
  duplicate: "Duplicar",
  loadError: "Error al cargar encuestas",
  duplicateError: "No se pudo duplicar la encuesta",
  statusError: "No se pudo cambiar el estado de la encuesta",
  deleteError: "No se pudo eliminar la encuesta",
} as const;

export const RESPONSE_SORT_LABELS: Partial<
  Record<SurveyResponseSortOrder, string>
> = {
  event_at_desc: "Más recientes primero",
  event_at_asc: "Más antiguas primero",
};

export const RESPONSES_PAGE = {
  title: "Respuestas",
  subtitle: "Resultados de la encuesta",
  back: "Encuestas",
  viewResponses: "Ver respuestas",
  noResponses: "No hay respuestas para esta encuesta",
  // "Completado por" everywhere: it is who uploaded the response, never who the
  // response is about — that distinction is the point of the entity column.
  respondent: "Completado por",
  establishment: "Establecimiento",
  subject: "Sujeto",
  targetPrefix: "Destino:",
  responseNumber: "N.º de respuesta",
  date: "Fecha de relevamiento",
  score: "Score FIES",
  export: "Exportar",
  exporting: "Exportando...",
  exportError: "No se pudo exportar",
  filters: {
    dateFrom: "Fecha desde",
    dateTo: "Fecha hasta",
    city: "Ciudad",
    province: "Provincia",
    sort: "Ordenar por",
    responseNumber: "N.º exacto",
    responseNumberFrom: "N.º desde",
    responseNumberTo: "N.º hasta",
  },
  columns: {
    entity: "Entidad",
    respondent: "Completado por",
    responseNumber: "N.º",
    city: "Ciudad",
    province: "Provincia",
    date: "Fecha",
    score: "Score FIES",
  },
  detailFields: {
    dni: "DNI",
    sex: "Sexo",
    birthDate: "Fecha de nacimiento",
    city: "Ciudad",
    province: "Provincia",
  },
  pagination: (page: number, total: number) => `Página ${page} de ${total}`,
  loadError: "Error al cargar las respuestas",
  errors: {
    invertedNumberRange:
      "El número desde no puede ser mayor que el número hasta.",
  },
  detailLoadError: "Error al cargar el detalle de la respuesta",
  detailTitle: "Detalle de respuesta",
  questionAnswers: "Respuestas",
} as const;

export const DASHBOARD_INDICATORS = {
  title: "Panel de indicadores",
  loadError: "Error al cargar los indicadores",
  responseCount: "Respuestas totales",
  establishmentsCount: "Comedores participantes",
  lastEvent: "Último relevamiento",
  noData: "Sin datos disponibles",
  noDate: "—",
  pendingUserRegistrations: "Registros pendientes",
  pendingEstablishmentAccess: "Accesos pendientes",
  pendingEstablishmentCreations: "Establecimientos faltantes",
  notAvailable: "—",
} as const;

/** A survey is either running or it is not — two tones, one place. */
export const SURVEY_STATUS_TONE: Record<"active" | "inactive", Tone> = {
  active: "success",
  inactive: "neutral",
};
