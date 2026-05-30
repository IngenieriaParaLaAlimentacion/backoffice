import { PaginatedUsersResponse } from "@/types/admin";

export const DEFAULT_PENDING_USERS_RESPONSE: PaginatedUsersResponse = {
  items: [
    {
      id: "a1b2c3d4-0000-0000-0000-000000000001",
      email: "juan.lopez@example.com",
      name: "Juan",
      last_name: "López",
      role: "establishment_manager",
      status: "pending_validation",
      establishments: [
        {
          id: "e1000000-0000-0000-0000-000000000001",
          name: "Comedor Central Norte",
          address: "Av. Corrientes 1234, CABA",
        },
        {
          id: "e1000000-0000-0000-0000-000000000002",
          name: "Comedor Central Sur",
          address: "Av. Rivadavia 5678, CABA",
        },
      ],
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000002",
      email: "ana.garcia@example.com",
      name: "Ana",
      last_name: "García",
      role: "establishment_manager",
      status: "pending_validation",
      establishments: [
        {
          id: "e1000000-0000-0000-0000-000000000003",
          name: "Merendero La Esperanza",
          address: "Calle Falsa 123, Rosario",
        },
      ],
    },
    {
      id: "a1b2c3d4-0000-0000-0000-000000000003",
      email: "carlos.martinez@example.com",
      name: "Carlos",
      last_name: "Martínez",
      role: "establishment_manager",
      status: "pending_validation",
      establishments: [
        {
          id: "e1000000-0000-0000-0000-000000000004",
          name: "Comedor Barrio Nuevo",
          address: "San Martín 456, Córdoba",
        },
      ],
    },
  ],
  total: 3,
  page: 1,
  page_size: 20,
  total_pages: 1,
};
