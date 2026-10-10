import {
  CreatedFoodMovement,
  EstablishmentMapItem,
  EstablishmentMapResponse,
  EstablishmentResponse,
  EstablishmentDashboardResponse,
  PaginatedEstablishmentFieldWorkersResponse,
  PaginatedEstablishmentsResponse,
  PaginatedEstablishmentSubjectsResponse,
  FoodMovementDetail,
  FoodMovementListItem,
  PaginatedFoodMovementsResponse,
  PaginatedFoodStockResponse,
} from "@/types/establishment";
import { MOCK_FOOD_CATEGORIES } from "@/mocks/fixtures/foodCatalog";

export const MOCK_ESTABLISHMENTS: EstablishmentResponse[] = [
  {
    id: "e1000000-0000-0000-0000-000000000001",
    name: "Comedor Central Norte",
    formatted_address: "Av. Corrientes 1234, CABA",
    latitude: -34.6037,
    longitude: -58.3816,
    place_id: "ChIJW3nVgx-3vJURyNO4FWJALhA",
    city: "Buenos Aires",
    province: "CABA",
  },
  {
    id: "e1000000-0000-0000-0000-000000000002",
    name: "Comedor Central Sur",
    formatted_address: "Av. Rivadavia 5678, CABA",
    latitude: -34.6158,
    longitude: -58.4333,
    place_id: "ChIJW3nVgx-3vJURyNO4FWJALhB",
    city: "Buenos Aires",
    province: "CABA",
  },
  {
    id: "e1000000-0000-0000-0000-000000000003",
    name: "Merendero La Esperanza",
    formatted_address: "Calle Falsa 123, Rosario",
    latitude: -32.9468,
    longitude: -60.6393,
    place_id: "ChIJW3nVgx-3vJURyNO4FWJALhC",
    city: "Rosario",
    province: "Santa Fe",
  },
  {
    id: "e1000000-0000-0000-0000-000000000004",
    name: "Comedor Barrio Nuevo",
    formatted_address: "San Martín 456, Córdoba",
    latitude: -31.4135,
    longitude: -64.1811,
    place_id: "ChIJW3nVgx-3vJURyNO4FWJALhD",
    city: "Córdoba",
    province: "Córdoba",
  },
];

export const DEFAULT_ESTABLISHMENTS_RESPONSE: PaginatedEstablishmentsResponse =
  {
    items: MOCK_ESTABLISHMENTS,
    total: 4,
    page: 1,
    page_size: 20,
    total_pages: 1,
  };

// --- Establishments map ---

const [NORTE, SUR, ROSARIO, CORDOBA] = MOCK_ESTABLISHMENTS;

const mapItem = (
  establishment: Pick<
    EstablishmentResponse,
    "id" | "name" | "latitude" | "longitude"
  >,
  status: Pick<
    EstablishmentMapItem,
    "has_data" | "severity" | "dominant_status"
  >,
): EstablishmentMapItem => ({
  id: establishment.id,
  name: establishment.name,
  latitude: establishment.latitude,
  longitude: establishment.longitude,
  ...status,
});

const extraEstablishmentId = (n: number) =>
  `e1000000-0000-0000-0000-${String(n).padStart(12, "0")}`;

/**
 * The first four reuse `MOCK_ESTABLISHMENTS`, so clicking their pin lands on a
 * ficha the mock backend answers (`WITH_DATA_ID` critical, `WITHOUT_DATA_ID`
 * empty). The rest exist to exercise the map's edge cases and have no ficha
 * behind them: every severity, "healthy" vs "no data" (both `severity: null`),
 * several pins in one spot to cluster, two on the exact same coordinates to
 * spiderfy, and one still at the (0, 0) backfill that can't be drawn.
 */
export const MOCK_ESTABLISHMENT_MAP_ITEMS: EstablishmentMapItem[] = [
  mapItem(NORTE, {
    has_data: true,
    severity: "critical",
    dominant_status: "severely_wasted",
  }),
  mapItem(SUR, { has_data: false, severity: null, dominant_status: null }),
  mapItem(ROSARIO, {
    has_data: true,
    severity: null,
    dominant_status: "normal",
  }),
  mapItem(CORDOBA, {
    has_data: true,
    severity: "medium",
    dominant_status: "overweight",
  }),
  // Greater Buenos Aires: close enough to fold into a cluster when zoomed out.
  {
    id: extraEstablishmentId(5),
    name: "Comedor Villa Lugano",
    latitude: -34.6811,
    longitude: -58.4711,
    has_data: true,
    severity: "high",
    dominant_status: "wasted",
  },
  {
    id: extraEstablishmentId(6),
    name: "Merendero San Telmo",
    latitude: -34.6212,
    longitude: -58.3731,
    has_data: true,
    severity: null,
    dominant_status: "normal",
  },
  {
    id: extraEstablishmentId(7),
    name: "Comedor La Matanza",
    latitude: -34.7702,
    longitude: -58.6267,
    has_data: false,
    severity: null,
    dominant_status: null,
  },
  // Same coordinates on purpose: only spiderfying tells them apart.
  {
    id: extraEstablishmentId(8),
    name: "Comedor Barrio Cano A",
    latitude: -32.8908,
    longitude: -68.8272,
    has_data: true,
    severity: "high",
    dominant_status: "underweight",
  },
  {
    id: extraEstablishmentId(9),
    name: "Comedor Barrio Cano B",
    latitude: -32.8908,
    longitude: -68.8272,
    has_data: true,
    severity: "critical",
    dominant_status: "severely_wasted",
  },
  // Loaded before geocoding existed: backfilled with (0, 0).
  {
    id: extraEstablishmentId(10),
    name: "Comedor sin ubicación",
    latitude: 0,
    longitude: 0,
    has_data: true,
    severity: null,
    dominant_status: "normal",
  },
];

export const DEFAULT_ESTABLISHMENTS_MAP_RESPONSE: EstablishmentMapResponse = {
  establishments: MOCK_ESTABLISHMENT_MAP_ITEMS,
};

// --- Establishment dashboard ---

/** Comedor with data: worst severity is `critical` while most subjects are normal. */
export const DEFAULT_ESTABLISHMENT_DASHBOARD: EstablishmentDashboardResponse = {
  establishment: MOCK_ESTABLISHMENTS[0],
  has_data: true,
  metrics: {
    subject_count: 42,
    measurement_count: 137,
    last_measured_at: "2026-07-20T10:00:00Z",
    avg_height_cm: 118.4,
    avg_weight_kg: 23.1,
    avg_bmi: 16.5,
    avg_age_months: 87,
  },
  alert_status: {
    severity: "critical",
    dominant_status: "normal",
    total_evaluated: 42,
    at_risk_count: 11,
    at_risk_percentage: 26.19,
    distribution: [
      { status: "normal", severity: null, count: 31, percentage: 73.81 },
      { status: "wasted", severity: "high", count: 6, percentage: 14.29 },
      { status: "overweight", severity: "medium", count: 3, percentage: 7.14 },
      {
        status: "severely_wasted",
        severity: "critical",
        count: 2,
        percentage: 4.76,
      },
    ],
  },
};

/** Empty state: every average is `null`, not 0 — see CA6. */
export const EMPTY_ESTABLISHMENT_DASHBOARD: EstablishmentDashboardResponse = {
  establishment: MOCK_ESTABLISHMENTS[1],
  has_data: false,
  metrics: {
    subject_count: 0,
    measurement_count: 0,
    last_measured_at: null,
    avg_height_cm: null,
    avg_weight_kg: null,
    avg_bmi: null,
    avg_age_months: null,
  },
  alert_status: {
    severity: null,
    dominant_status: null,
    total_evaluated: 0,
    at_risk_count: 0,
    at_risk_percentage: null,
    distribution: [],
  },
};

export const DEFAULT_ESTABLISHMENT_SUBJECTS_RESPONSE: PaginatedEstablishmentSubjectsResponse =
  {
    items: [
      {
        id: "51000000-0000-0000-0000-000000000001",
        dni: 45123456,
        name: "Ana",
        last_name: "Gómez",
        sex: "female",
        birth_date: "2018-03-11",
        age_months: 100,
        measurement_count: 4,
        nutritional_status: "wasted",
        latest_measurement: {
          id: "m1000000-0000-0000-0000-000000000001",
          measured_at: "2026-07-20T10:00:00Z",
          weight_kg: 21.0,
          height_cm: 118.0,
          bmi: 15.08,
          alerts: [
            {
              alert_type: "wasted",
              severity: "high",
              detail:
                "BMI-for-age z-score -2.31 < -2 SD: moderate acute malnutrition (emaciación).",
            },
          ],
        },
      },
      {
        id: "51000000-0000-0000-0000-000000000002",
        dni: 46987654,
        name: "Luis",
        last_name: "Fernández",
        sex: "male",
        birth_date: "2017-09-02",
        age_months: 106,
        measurement_count: 1,
        nutritional_status: "normal",
        latest_measurement: {
          id: "m1000000-0000-0000-0000-000000000002",
          measured_at: "2026-07-18T09:30:00Z",
          weight_kg: 27.4,
          height_cm: 126.5,
          bmi: 17.12,
          alerts: [],
        },
      },
      {
        id: "51000000-0000-0000-0000-000000000003",
        dni: 47222111,
        name: "Camila",
        last_name: "Ruiz",
        sex: "female",
        birth_date: "2019-01-25",
        age_months: 89,
        measurement_count: 3,
        nutritional_status: "severely_wasted",
        latest_measurement: {
          id: "m1000000-0000-0000-0000-000000000003",
          measured_at: "2026-07-15T14:05:00Z",
          weight_kg: 16.2,
          height_cm: 112.0,
          bmi: 12.92,
          alerts: [
            {
              alert_type: "severely_wasted",
              severity: "critical",
              detail:
                "BMI-for-age z-score -3.41 < -3 SD: severe acute malnutrition (emaciación grave).",
            },
          ],
        },
      },
    ],
    total: 3,
    page: 1,
    page_size: 20,
    total_pages: 1,
  };

export const EMPTY_ESTABLISHMENT_SUBJECTS_RESPONSE: PaginatedEstablishmentSubjectsResponse =
  { items: [], total: 0, page: 1, page_size: 20, total_pages: 0 };

// --- Establishment stock ---

export const DEFAULT_ESTABLISHMENT_STOCK_RESPONSE: PaginatedFoodStockResponse =
  {
    items: [
      {
        food: { id: "d1000000-0000-0000-0000-000000000001", name: "Arroz" },
        category: MOCK_FOOD_CATEGORIES[0],
        unit: "kilogramos",
        quantity: "25.500",
        updated_at: "2026-09-10T14:00:00Z",
      },
      {
        food: {
          id: "d1000000-0000-0000-0000-000000000002",
          name: "Leche en polvo",
        },
        category: MOCK_FOOD_CATEGORIES[2],
        unit: "kilogramos",
        quantity: "8.000",
        updated_at: "2026-09-12T09:30:00Z",
      },
      {
        food: { id: "d1000000-0000-0000-0000-000000000003", name: "Aceite" },
        category: MOCK_FOOD_CATEGORIES[4],
        unit: "litros",
        quantity: "12.000",
        updated_at: "2026-09-08T11:15:00Z",
      },
    ],
    total: 3,
    page: 1,
    page_size: 20,
    total_pages: 1,
  };

// --- Food movements ---

const MOVEMENT_IDS = {
  intake: "a1000000-0000-0000-0000-000000000001",
  outflow: "a1000000-0000-0000-0000-000000000002",
  intakeNoComments: "a1000000-0000-0000-0000-000000000003",
};

export const RESPONSIBLE = {
  id: "f1000000-0000-0000-0000-000000000001",
  name: "Juan",
  last_name: "Gomez",
};

/**
 * Deliberately NOT in `occurred_at` order in the source, so a test asserting
 * the newest-first order is asserting something. The handler sorts.
 */
export const DEFAULT_ESTABLISHMENT_FOOD_MOVEMENTS_RESPONSE: PaginatedFoodMovementsResponse =
  {
    items: [
      {
        id: MOVEMENT_IDS.outflow,
        direction: "out",
        occurred_at: "2026-09-12T13:00:00Z",
        category: "other",
        responsible: RESPONSIBLE,
        food_count: 1,
      },
      {
        id: MOVEMENT_IDS.intake,
        direction: "in",
        occurred_at: "2026-09-14T10:00:00Z",
        category: null,
        responsible: RESPONSIBLE,
        food_count: 2,
      },
      {
        id: MOVEMENT_IDS.intakeNoComments,
        direction: "in",
        occurred_at: "2026-09-08T09:00:00Z",
        category: null,
        responsible: { ...RESPONSIBLE, name: "Ana", last_name: "Diaz" },
        food_count: 1,
      },
    ],
    total: 3,
    page: 1,
    page_size: 20,
    total_pages: 1,
  };

/**
 * Keyed by movement id — a row's `id` resolves straight to its detail.
 * The outflow carries two lines of the SAME food against `food_count: 1`,
 * which is exactly the case where labelling `food_count` as "items" lies.
 */
/**
 * A third comedor whose only job is to overflow one page: `PAGE_SIZE` is 20,
 * so 25 movements make the paginator appear and give page 2 five rows. Dated
 * across August, all older than the three handcrafted September ones, and
 * none of them carries the foods those use — keeping them out of every other
 * fixture's way.
 */
const PAGED_MOVEMENT_COUNT = 25;

export const PAGED_FOOD_MOVEMENTS: FoodMovementListItem[] = Array.from(
  { length: PAGED_MOVEMENT_COUNT },
  (_, index) => ({
    id: `a2000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
    direction: index % 2 === 0 ? "in" : "out",
    category: index % 2 === 0 ? null : "kitchen",
    occurred_at: `2026-08-${String(index + 1).padStart(2, "0")}T12:00:00Z`,
    responsible: RESPONSIBLE,
    food_count: 1,
  }),
);

export const MOCK_FOOD_MOVEMENT_DETAILS: Record<string, FoodMovementDetail> = {
  [MOVEMENT_IDS.intake]: {
    id: MOVEMENT_IDS.intake,
    direction: "in",
    occurred_at: "2026-09-14T10:00:00Z",
    category: null,
    source: "photo",
    comments:
      "Donación del municipio, entregada en dos camionetas por la mañana; falta confirmar el remito del segundo envío",
    responsible: RESPONSIBLE,
    items: [
      {
        food: { id: "d1000000-0000-0000-0000-000000000001", name: "Arroz" },
        unit: "kilogramos",
        quantity: "10.000",
      },
      {
        food: { id: "d1000000-0000-0000-0000-000000000003", name: "Aceite" },
        unit: "litros",
        quantity: "4.500",
      },
    ],
  },
  [MOVEMENT_IDS.outflow]: {
    id: MOVEMENT_IDS.outflow,
    direction: "out",
    occurred_at: "2026-09-12T13:00:00Z",
    category: "other",
    source: "manual",
    comments: "Almuerzo",
    responsible: RESPONSIBLE,
    items: [
      {
        food: { id: "d1000000-0000-0000-0000-000000000001", name: "Arroz" },
        unit: "kilogramos",
        quantity: "2.500",
      },
      {
        food: { id: "d1000000-0000-0000-0000-000000000001", name: "Arroz" },
        unit: "kilogramos",
        quantity: "1.250",
      },
    ],
  },
  [MOVEMENT_IDS.intakeNoComments]: {
    id: MOVEMENT_IDS.intakeNoComments,
    direction: "in",
    occurred_at: "2026-09-08T09:00:00Z",
    category: null,
    source: "manual",
    comments: null,
    responsible: { ...RESPONSIBLE, name: "Ana", last_name: "Diaz" },
    items: [
      {
        food: {
          id: "d1000000-0000-0000-0000-000000000002",
          name: "Leche en polvo",
        },
        unit: "kilogramos",
        quantity: "6.000",
      },
    ],
  },
};

export const DEFAULT_ESTABLISHMENT_FIELD_WORKERS_RESPONSE: PaginatedEstablishmentFieldWorkersResponse =
  {
    items: [
      {
        id: "f1000000-0000-0000-0000-000000000001",
        name: "Juan",
        last_name: "Pérez",
        email: "juan@ejemplo.com",
        user_status: "active",
        relation_status: "approved",
        measurement_count: 58,
        last_measured_at: "2026-07-20T10:00:00Z",
      },
      {
        // Approved but has never measured here — a valid row, not an empty state.
        id: "f1000000-0000-0000-0000-000000000002",
        name: "Marta",
        last_name: "Sosa",
        email: "marta@ejemplo.com",
        user_status: "pending_validation",
        relation_status: "approved",
        measurement_count: 0,
        last_measured_at: null,
      },
    ],
    total: 2,
    page: 1,
    page_size: 20,
    total_pages: 1,
  };

/** Every paged movement resolves to a one-line detail, so the comedor that
 *  exists to test paging is still clickable in the dev preview. */
for (const movement of PAGED_FOOD_MOVEMENTS) {
  MOCK_FOOD_MOVEMENT_DETAILS[movement.id] = {
    ...movement,
    source: "manual",
    comments: null,
    items: [
      {
        food: { id: "d1000000-0000-0000-0000-000000000004", name: "Arvejas" },
        unit: "kilogramos",
        quantity: "3.000",
      },
    ],
  };
}

const baseDetails = structuredClone(MOCK_FOOD_MOVEMENT_DETAILS);
const stockByEstablishment = new Map<
  string,
  PaginatedFoodStockResponse["items"]
>();
const movementsByEstablishment = new Map<string, FoodMovementListItem[]>();
const createdById = new Map<string, CreatedFoodMovement>();

export function resetMovementFixture() {
  stockByEstablishment.clear();
  movementsByEstablishment.clear();
  createdById.clear();
  for (const key of Object.keys(MOCK_FOOD_MOVEMENT_DETAILS))
    delete MOCK_FOOD_MOVEMENT_DETAILS[key];
  Object.assign(MOCK_FOOD_MOVEMENT_DETAILS, structuredClone(baseDetails));
}

export function currentStock(establishmentId: string) {
  if (!stockByEstablishment.has(establishmentId)) {
    stockByEstablishment.set(
      establishmentId,
      structuredClone(
        establishmentId === MOCK_ESTABLISHMENTS[1].id
          ? []
          : DEFAULT_ESTABLISHMENT_STOCK_RESPONSE.items,
      ),
    );
  }
  return stockByEstablishment.get(establishmentId)!;
}

export function setMovementStock(
  establishmentId: string,
  stock: PaginatedFoodStockResponse["items"],
) {
  stockByEstablishment.set(establishmentId, structuredClone(stock));
}

export function currentMovements(establishmentId: string) {
  if (!movementsByEstablishment.has(establishmentId)) {
    const initial =
      establishmentId === MOCK_ESTABLISHMENTS[1].id
        ? []
        : establishmentId === MOCK_ESTABLISHMENTS[2].id
          ? PAGED_FOOD_MOVEMENTS
          : DEFAULT_ESTABLISHMENT_FOOD_MOVEMENTS_RESPONSE.items;
    movementsByEstablishment.set(establishmentId, structuredClone(initial));
  }
  return movementsByEstablishment.get(establishmentId)!;
}

export const createdMovement = (id: string) => createdById.get(id);
export const storeCreatedMovement = (movement: CreatedFoodMovement) => {
  createdById.set(movement.id, movement);
};
