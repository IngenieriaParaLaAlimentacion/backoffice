import { NOT_AVAILABLE } from "@/constants/common";
import { MeasurementSortOrder } from "@/types/measurement";

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
    bmi: "IMC",
    date: "Fecha",
    subject: "Sujeto",
    establishment: "Comedor",
    responsible: "Responsable",
    alerts: "Alertas",
    observation: "Observación",
  },
  evolutionDefaultTitle: "Evolución",
  detail: {
    dni: "Documento de identidad",
    sex: "Sexo",
    sexMale: "Masculino",
    sexFemale: "Femenino",
    birthDate: "Fecha de nacimiento",
    measurementsCount: "Mediciones",
    chartTitle: "Evolución de peso y talla",
    observationsTitle: "Observaciones del relevamiento",
  },
} as const;
