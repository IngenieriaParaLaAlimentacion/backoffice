import { LatestMeasurement, NutritionalStatus } from "@/types/measurement";

export type Sex = "male" | "female";

export type SubjectSummary = {
  id: string;
  dni: number;
  name: string;
  last_name: string;
  sex: Sex;
  birth_date: string;
  latest_measurement?: LatestMeasurement | null;
};

export type PaginatedSubjectsResponse = {
  items: SubjectSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type SubjectDetail = {
  id: string;
  dni: number;
  name: string;
  last_name: string;
  sex: Sex;
  birth_date: string;
  is_rural: boolean;
  is_indigenous: boolean;
  /**
   * Status of the subject's latest measurement across ALL establishments —
   * a subject can be `wasted` at one comedor and `normal` globally.
   *
   * Both fields are optional so the UI degrades to "no badge" instead of
   * crashing if the backend has not deployed them yet. `null` is the real
   * case of a subject with no measurements at all: that renders "Sin datos",
   * never the green "Normal" pill.
   */
  nutritional_status?: NutritionalStatus | null;
  latest_measurement?: LatestMeasurement | null;
};

export type SubjectSortOrder =
  | "name_asc"
  | "name_desc"
  | "birth_date_asc"
  | "birth_date_desc";
