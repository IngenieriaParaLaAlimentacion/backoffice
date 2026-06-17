import { EstablishmentResponse } from "@/types/admin";

type PaginatedEstablishmentsResponse = {
  items: EstablishmentResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

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

export const DEFAULT_ESTABLISHMENTS_RESPONSE: PaginatedEstablishmentsResponse = {
  items: MOCK_ESTABLISHMENTS,
  total: 4,
  page: 1,
  page_size: 20,
  total_pages: 1,
};
