import {
  AdminUserDetail,
  EstablishmentApprovalResponse,
  PaginatedEstablishmentRequestsResponse,
  PaginatedUsersResponse,
  PendingEstablishmentAccessResponse,
} from "@/types/admin";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";

export const DEFAULT_PENDING_USERS_RESPONSE: PaginatedUsersResponse = {
  items: [
    {
      id: "a1b2c3d4-0000-0000-0000-000000000001",
      email: "juan.lopez@example.com",
      name: "Juan",
      last_name: "López",
      role: "field_worker",
      status: "pending_validation",
      is_email_verified: true,
      establishments: [MOCK_ESTABLISHMENTS[0], MOCK_ESTABLISHMENTS[1]],
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000002",
      email: "ana.garcia@example.com",
      name: "Ana",
      last_name: "García",
      role: "field_worker",
      status: "pending_validation",
      is_email_verified: true,
      establishments: [MOCK_ESTABLISHMENTS[2]],
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000003",
      email: "carlos.martinez@example.com",
      name: "Carlos",
      last_name: "Martínez",
      role: "field_worker",
      status: "pending_validation",
      is_email_verified: false,
      establishments: [MOCK_ESTABLISHMENTS[3]],
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000004",
      email: "lucia.fernandez@example.com",
      name: "Lucía",
      last_name: "Fernández",
      role: "field_worker",
      status: "pending_validation",
      is_email_verified: true,
      establishments: [],
    },
  ],
  total: 4,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

/**
 * Active field workers awaiting establishment access. Each item's
 * `establishments` holds only that worker's pending ones, like the backend.
 */
export const DEFAULT_PENDING_ESTABLISHMENT_ACCESS_RESPONSE: PendingEstablishmentAccessResponse =
  {
    items: [
      {
        id: "a1b2c3d4-0000-0000-0000-000000000011",
        email: "marta.suarez@example.com",
        name: "Marta",
        last_name: "Suárez",
        role: "field_worker",
        status: "active",
        is_email_verified: true,
        establishments: [MOCK_ESTABLISHMENTS[0], MOCK_ESTABLISHMENTS[2]],
      },
      {
        id: "a1b2c3d4-0000-0000-0000-000000000012",
        email: "pedro.ramirez@example.com",
        name: "Pedro",
        last_name: "Ramírez",
        role: "field_worker",
        status: "active",
        is_email_verified: true,
        establishments: [MOCK_ESTABLISHMENTS[1]],
      },
    ],
    total: 2,
    page: 1,
    page_size: 20,
    total_pages: 1,
    total_pending_establishments: 3,
  };

export const DEFAULT_ESTABLISHMENT_REQUESTS_RESPONSE: PaginatedEstablishmentRequestsResponse =
  {
    items: [
      {
        id: "b2c3d4e5-0000-0000-0000-000000000001",
        user_id: "a1b2c3d4-0000-0000-0000-000000000001",
        name: "Comedor Esperanza",
        formatted_address: "Av. Siempre Viva 742",
        city: "Córdoba",
        province: "Córdoba",
        status: "pending",
        created_at: "2026-06-01T10:00:00Z",
        requester_name: "Juan",
        requester_last_name: "López",
        requester_email: "juan.lopez@example.com",
        reviewed_by: null,
        updated_at: "2026-06-01T10:00:00Z",
      },
      {
        id: "b2c3d4e5-0000-0000-0000-000000000002",
        user_id: "a1b2c3d4-0000-0000-0000-000000000002",
        name: "Merendero Sol Naciente",
        formatted_address: "Ruta 9 Km 45",
        city: null,
        province: null,
        status: "pending",
        created_at: "2026-06-02T10:00:00Z",
        requester_name: "Ana",
        requester_last_name: "García",
        requester_email: "ana.garcia@example.com",
        reviewed_by: null,
        updated_at: "2026-06-02T10:00:00Z",
      },
    ],
    total: 2,
    page: 1,
    page_size: 20,
    total_pages: 1,
  };

export const DEFAULT_ESTABLISHMENT_APPROVAL_RESPONSE: EstablishmentApprovalResponse =
  {
    id: "c3d4e5f6-0000-0000-0000-000000000001",
    name: "Comedor Esperanza",
    formatted_address: "Av. Siempre Viva 742",
    latitude: 0,
    longitude: 0,
    place_id: "mock-place-id-0001",
    city: "Córdoba",
    province: "Córdoba",
    reused: false,
  };

export const DEFAULT_USER_DETAIL: AdminUserDetail = {
  id: "a1b2c3d4-0000-0000-0000-000000000010",
  email: "laura.diaz@example.com",
  name: "Laura",
  last_name: "Díaz",
  role: "analyst",
  status: "active",
  establishments: [],
};
