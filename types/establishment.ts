import { EstablishmentResponse } from "@/types/admin";
import {
  AlertSeverity,
  MeasurementAlert,
  NutritionalStatus,
} from "@/types/measurement";
import { Sex } from "@/types/subject";

export type PaginatedEstablishmentsResponse = {
  items: EstablishmentResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

// --- Dashboard ---

/**
 * Averages are `null` (never 0) when the establishment has no measurements.
 * Render "—", not "0 kg": branch on `EstablishmentDashboardResponse.has_data`.
 */
export type EstablishmentMetrics = {
  subject_count: number;
  measurement_count: number;
  last_measured_at: string | null;
  avg_height_cm: number | null;
  avg_weight_kg: number | null;
  avg_bmi: number | null;
  avg_age_months: number | null;
};

export type AlertDistributionItem = {
  status: NutritionalStatus;
  severity: AlertSeverity | null;
  count: number;
  percentage: number;
};

export type EstablishmentAlertStatus = {
  /** Worst severity present among the subjects — not an average, not a threshold. */
  severity: AlertSeverity | null;
  dominant_status: NutritionalStatus | null;
  total_evaluated: number;
  /** Subjects whose status is not `normal`. */
  at_risk_count: number;
  at_risk_percentage: number | null;
  distribution: AlertDistributionItem[];
};

export type EstablishmentDashboardResponse = {
  establishment: EstablishmentResponse;
  has_data: boolean;
  metrics: EstablishmentMetrics;
  alert_status: EstablishmentAlertStatus;
};

// --- Subjects attending the establishment ---

/** The subject's latest reading at this specific establishment — no `establishment`
 * field, unlike the global `LatestMeasurement`, since it's already scoped by context. */
export type EstablishmentLatestMeasurement = {
  id: string;
  measured_at: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  alerts: MeasurementAlert[];
};

/**
 * `id` is the SUBJECT id (what you navigate with), not `latest_measurement.id`.
 * `latest_measurement` is never null: a subject only shows up here because they
 * have at least one measurement at this establishment.
 */
export type EstablishmentSubjectListItem = {
  id: string;
  dni: number;
  name: string;
  last_name: string;
  sex: Sex;
  birth_date: string;
  age_months: number;
  /** Measurements at this establishment only, not the subject's global history. */
  measurement_count: number;
  nutritional_status: NutritionalStatus;
  latest_measurement: EstablishmentLatestMeasurement;
};

export type PaginatedEstablishmentSubjectsResponse = {
  items: EstablishmentSubjectListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type EstablishmentSubjectSortOrder =
  | "measured_at_desc"
  | "measured_at_asc"
  | "name_asc"
  | "name_desc"
  | "bmi_desc"
  | "bmi_asc"
  | "age_desc"
  | "age_asc";

// --- Field workers enrolled in the establishment ---

export type UserStatus = "active" | "inactive" | "pending_validation";

export type RelationStatus = "approved" | "pending" | "rejected";

/**
 * Enrollment-based, not activity-based: an approved user with zero measurements
 * appears with `measurement_count: 0` and `last_measured_at: null`.
 */
export type EstablishmentFieldWorkerListItem = {
  id: string;
  name: string;
  last_name: string;
  email: string;
  /** Account state — independent from `relation_status`. */
  user_status: UserStatus;
  /** Enrollment state at this establishment. */
  relation_status: RelationStatus;
  measurement_count: number;
  last_measured_at: string | null;
};

export type PaginatedEstablishmentFieldWorkersResponse = {
  items: EstablishmentFieldWorkerListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};
