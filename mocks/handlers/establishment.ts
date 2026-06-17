import { http, HttpResponse } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import { ESTABLISHMENTS_ENDPOINT } from "@/constants/api";
import {
  DEFAULT_ESTABLISHMENTS_RESPONSE,
  MOCK_ESTABLISHMENTS,
} from "@/mocks/fixtures/establishment";

type PaginatedEstablishmentsResponse = typeof DEFAULT_ESTABLISHMENTS_RESPONSE;

export function makeListEstablishmentsHandler(
  options?: HandlerOptions<PaginatedEstablishmentsResponse>,
) {
  return baseHandler(ESTABLISHMENTS_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_ESTABLISHMENTS_RESPONSE, ...options?.data },
  });
}

export function makeCreateEstablishmentHandler() {
  return http.post(ESTABLISHMENTS_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newEstablishment = {
      ...MOCK_ESTABLISHMENTS[0],
      id: crypto.randomUUID(),
      name: String(body.name ?? "Nuevo establecimiento"),
      formatted_address: String(body.formatted_address ?? ""),
      place_id: String(body.place_id ?? ""),
      city: String(body.city ?? ""),
      province: String(body.province ?? ""),
      latitude: Number(body.latitude ?? 0),
      longitude: Number(body.longitude ?? 0),
    };
    return HttpResponse.json(newEstablishment, { status: 201 });
  });
}
