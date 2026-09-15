import { EstablishmentResponse } from "@/types/admin";
import {
  EstablishmentDashboardResponse,
  PaginatedEstablishmentFieldWorkersResponse,
  PaginatedEstablishmentsResponse,
  PaginatedEstablishmentSubjectsResponse,
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

/** `only_available` is always sent as `true` by the frontend, so a comedor
 * whose stock is fully zeroed out looks identical to one with none loaded. */
export const EMPTY_ESTABLISHMENT_STOCK_RESPONSE: PaginatedFoodStockResponse = {
  items: [],
  total: 0,
  page: 1,
  page_size: 20,
  total_pages: 0,
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
