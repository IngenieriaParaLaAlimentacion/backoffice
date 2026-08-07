import { ResponseType, SurveyScope } from "@/types/survey";

export const SCOPE_LABELS: Record<SurveyScope, string> = {
  generic: "Genérica",
  targeted: "Dirigida",
};

export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  text: "Texto libre",
  single_choice: "Selección única",
  multiple_choice: "Selección múltiple",
  numeric: "Numérica",
  date: "Fecha",
};

export const MAX_QUESTIONS = 30;

export const ENCUESTAS_FORM = {
  createTitle: "Nueva encuesta",
  editTitle: "Editar encuesta",
  back: "Encuestas",
  nameLabel: "Nombre",
  namePlaceholder: "Nombre de la encuesta",
  descriptionLabel: "Descripción",
  descriptionPlaceholder: "Descripción (opcional)",
  scopeLabel: "Alcance",
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
    "Esta encuesta ya tiene respuestas registradas; la edición está restringida.",
  nameConflict: "Ya existe una encuesta con ese nombre",
  establishmentsLabel: "Establecimientos",
  establishmentsSearch: "Buscar establecimiento",
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

export const ENCUESTAS_PAGE = {
  title: "Encuestas",
  subtitle: "Relevamientos FIES y personalizados",
  createSurvey: "Crear encuesta",
  searchPlaceholder: "Buscar por nombre",
  noSurveys: "No hay encuestas",
  statusActive: "Activa",
  statusInactive: "Inactiva",
  columns: {
    name: "Nombre",
    scope: "Alcance",
    status: "Estado",
    questions: "Preguntas",
    created: "Creada",
  },
  pagination: (page: number, total: number) => `Página ${page} de ${total}`,
} as const;
