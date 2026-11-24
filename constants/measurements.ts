import { NOT_AVAILABLE } from "@/constants/common";
import type {
  AssessmentIndicator,
  MeasurementSortOrder,
} from "@/types/measurement";

export const MEASUREMENT_SORT_LABELS: Record<MeasurementSortOrder, string> = {
  date_desc: "Fecha (más reciente)",
  date_asc: "Fecha (más antigua)",
  weight_desc: "Peso (mayor)",
  weight_asc: "Peso (menor)",
  height_desc: "Talla (mayor)",
  height_asc: "Talla (menor)",
};

/** Age bounds accepted by the measurements listing (backend: `ge=0, le=150`). */
export const MIN_AGE = 0;
export const MAX_AGE = 150;

export const MEASUREMENTS_PAGE = {
  title: "Mediciones antropométricas",
  subtitle: "Peso, talla y fecha de relevamiento de los sujetos",
  refresh: "Actualizar",
  sortLabel: "Ordenar por",
  noMeasurements: "No hay mediciones",
  listLabel: "Mediciones",
  noObservation: NOT_AVAILABLE,
  minAgeGreaterThanMaxError: "La edad mínima no puede ser mayor que la máxima.",
  invalidAgeError: `La edad debe ser un número entero entre ${MIN_AGE} y ${MAX_AGE}.`,
  measuredFromAfterToError:
    "La fecha desde no puede ser posterior a la fecha hasta.",
  loadError: "Error al cargar mediciones",
  evolutionError: "Error al cargar la evolución del sujeto",
  filters: {
    city: "Ciudad",
    province: "Provincia",
    measuredDate: "Fecha de relevamiento",
    from: "Desde",
    to: "Hasta",
    age: "Edad",
    min: "Mín.",
    max: "Máx.",
  },
  columns: {
    weight: "Peso (kg)",
    height: "Talla (cm)",
    bmi: "IMC registrado",
    date: "Fecha",
    subject: "Sujeto",
    establishment: "Comedor",
    responsible: "Responsable",
    alerts: "Evaluación",
    observation: "Observación",
  },
  evolutionDefaultTitle: "Evolución",
  detail: {
    dni: "Documento de identidad",
    sex: "Sexo",
    sexMale: "Masculino",
    sexFemale: "Femenino",
    birthDate: "Fecha de nacimiento",
    age: "Edad",
    measurementsCount: "Mediciones",
    chartTitle: "Evolución de peso y talla",
    selectedMeasurement: "Medición seleccionada",
    assessmentsTitle: "Evaluación por medición",
    observationsTitle: "Observaciones del relevamiento",
  },
} as const;

export const ASSESSMENT_INDICATOR_LABELS: Record<AssessmentIndicator, string> =
  {
    length_for_age: "Longitud para la edad",
    weight_for_age: "Peso para la edad",
    bmi_for_age: "IMC para la edad",
    height_for_age: "Talla para la edad",
    adult_bmi: "IMC adulto",
  };

const CLASSIFICATION_LABELS = new Map([
  ["normal", "Normal"],
  ["severely_wasted", "Emaciación severa"],
  ["wasted", "Emaciación"],
  ["overweight", "Sobrepeso"],
  ["obese", "Obesidad"],
  ["obesity", "Obesidad"],
  ["severe_underweight", "Bajo peso severo"],
  ["underweight", "Bajo peso"],
  ["low_weight", "Bajo peso"],
  ["severely_low_weight", "Bajo peso severo"],
  ["short_stature", "Talla baja"],
  ["severe_short_stature", "Talla baja severa"],
  ["stunted", "Talla baja"],
  ["severely_stunted", "Talla baja severa"],
  ["low_height", "Talla baja"],
  ["low_length", "Longitud baja"],
  ["high_weight", "Peso alto"],
  ["high_height", "Talla alta"],
  ["high_length", "Longitud alta"],
  ["tall_stature", "Talla alta"],
  ["risk_of_overweight", "Riesgo de sobrepeso"],
]);

export function isKnownAssessmentClassification(code: string) {
  return CLASSIFICATION_LABELS.has(code);
}

export function assessmentClassificationLabel(code: string) {
  return CLASSIFICATION_LABELS.get(code) ?? "Clasificación no disponible";
}

export const ASSESSMENT_COPY = {
  indicatorFilter: "Indicador",
  classificationFilter: "Clasificación",
  allIndicators: "Todos los indicadores",
  allClassifications: "Todas las clasificaciones",
  empty: "Sin resultados de evaluación",
  status: {
    insufficient_data: "Sin datos suficientes",
    not_applicable: "No aplica",
  },
  severity: {
    critical: "Alerta crítica",
    high: "Alerta alta",
    medium: "Alerta media",
  },
  score: (value: string) => `Z ${value}`,
};
