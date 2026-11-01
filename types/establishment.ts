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
  /** Computed by the backend, never sent: `pending` while no field of the
   * profile has data, `complete` as soon as one does. */
  characterization_status: CharacterizationStatus;
};

/**
 * `PATCH /establishments/{id}` is partial: only the fields sent change. The
 * address goes as a whole (text, `place_id` and coordinates together) so the
 * pin never drifts from the text; the backend answers 409 when that
 * `place_id` already belongs to another establishment.
 */
export type UpdateEstablishmentRequest = Partial<
  Pick<
    EstablishmentResponse,
    | "name"
    | "formatted_address"
    | "place_id"
    | "latitude"
    | "longitude"
    | "city"
    | "province"
  >
>;

// --- Characterization ("Perfil" in the UI) ---
// Options follow the Mapa Nacional de Espacios Comunitarios de Cuidados form
// the referents shared, plus the food fields backend#196 needs for recipes.

export type CharacterizationStatus = "pending" | "complete";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/**
 * One opening slot: the same hours on every day listed. A list of slots
 * covers "lunes a viernes de 12 a 14 y sábados de 10 a 12". Times are
 * wall-clock `"HH:MM"` in the establishment's own time — not UTC instants,
 * so they never go through `formatTimestamp*`.
 */
export type OpeningHoursSlot = {
  days: Weekday[];
  opens_at: string;
  closes_at: string;
};

export type SpaceType =
  | "community_kitchen"
  | "school_support"
  | "community_health"
  | "childcare"
  | "ive_counseling"
  | "gender_violence_counseling"
  | "addiction_support"
  | "homeless_support"
  | "older_adults_center"
  | "neighborhood_association"
  | "arts_culture"
  | "disability_care"
  | "fines"
  | "environmental"
  | "popular_economy"
  | "sports_club"
  | "other";
export type CareTask =
  | "food_assistance"
  | "school_support"
  | "primary_health"
  | "childcare"
  | "ive_counseling"
  | "gender_violence_support"
  | "addiction_support"
  | "homeless_support"
  | "sports"
  | "older_adults"
  | "cultural"
  | "disability"
  | "fines_tutoring"
  | "environmental"
  | "popular_economy"
  | "other";
export type Premises =
  | "street"
  | "worker_home"
  | "lent_space"
  | "rented_space"
  | "other";
export type Bathroom = "exclusive" | "shared_with_household" | "none" | "other";
export type Utility =
  | "running_water"
  | "motor_pump_well"
  | "electricity"
  | "natural_gas"
  | "gas_cylinder"
  | "sewer"
  | "septic_tank"
  | "internet";
export type Affiliation =
  | "ngo"
  | "social_movement"
  | "legal_status"
  | "independent"
  | "local_government"
  | "church"
  | "other";
export type AttendeeAge =
  | "early_childhood"
  | "children"
  | "adolescents"
  | "adults"
  | "older_adults";
export type Meal = "breakfast" | "lunch" | "snack" | "dinner";
/** What the kitchen can do decides which recipes are possible at all. */
export type KitchenEquipment =
  | "stove"
  | "oven"
  | "fridge"
  | "freezer"
  | "large_pots"
  | "blender"
  | "other";
export type ServiceType = "on_site" | "takeaway" | "grocery_bag" | "other";
export type FoodReceptionFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "irregular";
/** Provisional catalog: backend#196 leaves it to be validated with community
 * referents, and may turn it into an editable table. */
export type CulturalIdentity =
  | "indigenous"
  | "andean"
  | "guarani"
  | "migrant"
  | "criollo"
  | "other";

/**
 * Every field is optional: `null` / `[]` means "not answered", which is not
 * the same as "does not apply". An `*_other` text is only accepted while
 * `"other"` is among the chosen values (422 otherwise), max 100 chars.
 *
 * Localidad is the establishment's own `city`, not repeated here.
 * `contact_phone` is private: fine in the backoffice, never on a public map.
 *
 * Saving replaces the whole profile — an empty field clears what was there.
 */
export type EstablishmentCharacterization = {
  district: string | null;
  neighborhood: string | null;
  cross_streets: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  opening_hours: OpeningHoursSlot[];

  space_types: SpaceType[];
  space_types_other: string | null;
  care_tasks: CareTask[];
  care_tasks_other: string | null;
  premises: Premises | null;
  premises_other: string | null;
  bathroom: Bathroom | null;
  bathroom_other: string | null;
  utilities: Utility[];
  affiliations: Affiliation[];
  affiliations_other: string | null;

  /** People the space receives on a normal working day, in total. */
  daily_attendance: number | null;
  attendee_ages: AttendeeAge[];

  meals: Meal[];
  service_types: ServiceType[];
  service_types_other: string | null;
  food_reception_frequency: FoodReceptionFrequency | null;
  /** People cooking on a normal service — the labour a recipe can count on. */
  cooks_per_service: number | null;
  kitchen_equipment: KitchenEquipment[];
  kitchen_equipment_other: string | null;

  cultural_identities: CulturalIdentity[];
  cultural_identities_other: string | null;
};

export type EstablishmentCharacterizationResponse = {
  characterization_status: CharacterizationStatus;
  characterization: EstablishmentCharacterization;
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
  characterization: EstablishmentCharacterization;
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

export type RelationStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "revoked"
  | "withdrawn";

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
  | "church"
  | "private_donation"
  | "collection_event"
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
