import {
  AlertSeverity,
  MeasurementAlert,
  NutritionalStatus,
} from "@/types/measurement";
import { Sex } from "@/types/subject";
import { FoodCategory } from "@/types/foodCatalog";

export type EstablishmentResponse = {
  id: string;
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  city: string;
  province: string;
};

/**
 * One pin of the establishments map: location plus the rolled-up severity, in a
 * payload light enough to fetch every establishment at once (no pagination).
 *
 * `has_data: false` means "no measurements loaded yet" and comes with a `null`
 * severity, exactly like a healthy establishment does — so `severity` alone
 * cannot tell them apart. Branch on `has_data` first, never on `severity`.
 */
export type EstablishmentMapItem = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  has_data: boolean;
  /** Worst severity among the subjects; `null` when healthy or without data. */
  severity: AlertSeverity | null;
  dominant_status: NutritionalStatus | null;
};

export type EstablishmentMapResponse = {
  establishments: EstablishmentMapItem[];
};

export type EstablishmentSortOrder =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "city_asc"
  | "city_desc"
  | "province_asc"
  | "province_desc";

export type EstablishmentRequestStatus = "pending" | "approved" | "rejected";

export type EstablishmentRequestSortOrder = "newest" | "oldest";

/** What the requester (analyst or field worker) gets back after proposing a
 * missing establishment — contrast with `EstablishmentRequestAdminView` in
 * `types/admin.ts`, the richer shape the admin sees while reviewing it. */
export type EstablishmentRequestCreationResponse = {
  id: string;
  user_id: string;
  name: string;
  formatted_address: string;
  city: string | null;
  province: string | null;
  status: EstablishmentRequestStatus;
  created_at: string;
};

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

export type RelationStatus = "approved" | "pending" | "rejected" | "revoked";

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

// --- Stock ---

export type FoodStockUnit = "unidades" | "kilogramos" | "litros";

/**
 * `quantity` is a Decimal on the wire (a numeric string like "12.500"), never
 * a float — parse it only for display, never for arithmetic.
 */
export type FoodStockItem = {
  food: { id: string; name: string };
  category: FoodCategory;
  unit: FoodStockUnit;
  quantity: string;
  updated_at: string;
};

export type PaginatedFoodStockResponse = {
  items: FoodStockItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type FoodStockSortOrder =
  | "name_asc"
  | "name_desc"
  | "quantity_asc"
  | "quantity_desc"
  | "updated_at_desc";

// --- Food movements (ingresos y egresos) ---

export type FoodMovementDirection = "in" | "out";
export type FoodOutflowCategory =
  | "family_delivery"
  | "kitchen"
  | "discard"
  | "other";

/** How an intake was loaded. Outflows are always `manual`. */
export type FoodMovementSource = "manual" | "photo";
export type FoodIntakeOriginType =
  | "national_government"
  | "provincial_government"
  | "municipal_government"
  | "private_company"
  | "foundation"
  | "social_organization"
  | "church"
  | "other";

type MovementOrigin =
  | {
      direction: "in";
      origin_type: FoodIntakeOriginType;
      is_recurring: boolean;
    }
  | { direction: "out"; origin_type: null; is_recurring: null };

export type FoodMovementResponsible = {
  id: string;
  name: string;
  last_name: string;
};

/**
 * A light row: no lines at all, that is what the detail call is for.
 *
 * `food_count` counts DISTINCT foods, not lines — a movement with two lines of
 * rice reports `food_count: 1` while its detail returns two items. Labelling
 * it "2 items" would be a lie.
 */
type MovementListBase = {
  id: string;
  /** When the movement happened, not when it was loaded: a backdated entry
   *  belongs to its own period, and the date filter reads this column too. */
  occurred_at: string;
  responsible: FoodMovementResponsible;
  food_count: number;
  category: FoodOutflowCategory | null;
};
export type FoodMovementListItem = MovementListBase & MovementOrigin;

export type PaginatedFoodMovementsResponse = {
  items: FoodMovementListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/** `quantity` is a Decimal on the wire ("2.500") — display only, never math. */
export type FoodMovementItem = {
  food: { id: string; name: string };
  unit: FoodStockUnit;
  quantity: string;
};

type MovementDetailBase = {
  id: string;
  occurred_at: string;
  source: FoodMovementSource;
  comments: string | null;
  category: FoodOutflowCategory | null;
  responsible: FoodMovementResponsible;
  items: FoodMovementItem[];
};
export type FoodMovementDetail = MovementDetailBase & MovementOrigin;

type CreateMovementBase = {
  id: string;
  establishment_id: string;
  occurred_at: string;
  comments: string | null;
  source: "manual";
  items: { food_id: string; quantity: string }[];
};
export type CreateFoodIntakeRequest = CreateMovementBase & {
  origin_type: FoodIntakeOriginType;
  is_recurring: boolean;
  category?: never;
};
export type CreateFoodOutflowRequest = CreateMovementBase & {
  category: FoodOutflowCategory;
  origin_type?: never;
  is_recurring?: never;
};
export type CreateFoodMovementRequest =
  | CreateFoodIntakeRequest
  | CreateFoodOutflowRequest;
export type MovementRequest =
  | { direction: "in"; body: CreateFoodIntakeRequest }
  | { direction: "out"; body: CreateFoodOutflowRequest };

export type CreatedFoodMovement = {
  id: string;
  establishment_id: string;
  responsible_id: string;
  occurred_at: string;
  comments: string | null;
  category?: FoodOutflowCategory;
  source: FoodMovementSource;
  created_at: string;
  items: FoodMovementItem[];
  origin_type?: FoodIntakeOriginType;
  is_recurring?: boolean;
};

export type FoodMovementSaveResult = {
  movement: CreatedFoodMovement;
  /** The backend already held this request id and answered with the stored record. */
  replayed: boolean;
};
