import { Sex } from "@/types/subject";

export type AlertSeverity = "critical" | "high" | "medium";

export type AlertType =
  | "severely_wasted"
  | "wasted"
  | "overweight"
  | "obese"
  | "severe_underweight"
  | "underweight";

// `underweight` / `severe_underweight` only occur for subjects over 19 (adult BMI
// cutoffs); `wasted` / `severely_wasted` only for under-19s (WHO BMI-for-age z-score).
export type NutritionalStatus =
  | "normal"
  | "overweight"
  | "obese"
  | "wasted"
  | "severely_wasted"
  | "underweight"
  | "severe_underweight";

export type MeasurementAlert = {
  alert_type: AlertType;
  severity: AlertSeverity;
  detail: string;
};

/** A subject's most recent measurement, in whatever scope the endpoint defines. */
export type LatestMeasurement = {
  id: string;
  measured_at: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  establishment: MeasurementEstablishment;
  alerts: MeasurementAlert[];
};

export type MeasurementSubject = {
  id: string;
  dni: number;
  sex: Sex;
  name: string;
  last_name: string;
  birth_date: string;
};

export type MeasurementEstablishment = {
  id: string;
  name: string;
  city: string;
  province: string;
};

export type MeasurementResponsible = {
  id: string;
  name: string;
  last_name: string;
};

export type MeasurementListItem = {
  id: string;
  measured_at: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  subject: MeasurementSubject;
  establishment: MeasurementEstablishment;
  responsible: MeasurementResponsible;
  alerts: MeasurementAlert[];
};

export type PaginatedMeasurementsResponse = {
  items: MeasurementListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type MeasurementSortOrder =
  | "date_desc"
  | "date_asc"
  | "weight_desc"
  | "weight_asc"
  | "height_desc"
  | "height_asc";

export type EvolutionPoint = {
  measured_at: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  alerts: MeasurementAlert[];
};

export type SubjectEvolutionResponse = {
  subject: MeasurementSubject;
  points: EvolutionPoint[];
};
