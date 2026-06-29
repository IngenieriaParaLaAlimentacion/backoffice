import { Sex } from "@/types/subject";

export type AlertSeverity = "critical" | "high" | "medium";

export type AlertType =
  | "severely_wasted"
  | "wasted"
  | "overweight"
  | "obese"
  | "severe_underweight"
  | "underweight";

export type MeasurementAlert = {
  alert_type: AlertType;
  severity: AlertSeverity;
  detail: string;
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
