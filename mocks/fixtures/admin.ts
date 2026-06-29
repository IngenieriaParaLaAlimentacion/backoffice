import { PaginatedUsersResponse } from "@/types/admin";
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
      establishments: [MOCK_ESTABLISHMENTS[0], MOCK_ESTABLISHMENTS[1]],
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000002",
      email: "ana.garcia@example.com",
      name: "Ana",
      last_name: "García",
      role: "field_worker",
      status: "pending_validation",
      establishments: [MOCK_ESTABLISHMENTS[2]],
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000003",
      email: "carlos.martinez@example.com",
      name: "Carlos",
      last_name: "Martínez",
      role: "field_worker",
      status: "pending_validation",
      establishments: [MOCK_ESTABLISHMENTS[3]],
    },
  ],
  total: 3,
  page: 1,
  page_size: 20,
  total_pages: 1,
};
