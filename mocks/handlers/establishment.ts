import { http, HttpResponse } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import {
  ESTABLISHMENT_DASHBOARD_ENDPOINT,
  ESTABLISHMENT_FIELD_WORKERS_ENDPOINT,
  ESTABLISHMENT_SUBJECTS_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
} from "@/constants/api";
import {
  DEFAULT_ESTABLISHMENT_DASHBOARD,
  DEFAULT_ESTABLISHMENT_FIELD_WORKERS_RESPONSE,
  DEFAULT_ESTABLISHMENT_SUBJECTS_RESPONSE,
  DEFAULT_ESTABLISHMENTS_RESPONSE,
  EMPTY_ESTABLISHMENT_DASHBOARD,
  EMPTY_ESTABLISHMENT_SUBJECTS_RESPONSE,
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

/**
 * The dashboard has three distinct outcomes that must render differently, so
 * the handler branches on the id instead of forcing a fixture swap:
 *   MOCK_ESTABLISHMENTS[0] -> has_data: true
 *   MOCK_ESTABLISHMENTS[1] -> has_data: false (every average null)
 *   anything else          -> 404
 */
const WITH_DATA_ID = MOCK_ESTABLISHMENTS[0].id;
const WITHOUT_DATA_ID = MOCK_ESTABLISHMENTS[1].id;

function notFound(instance: string) {
  return HttpResponse.json(
    {
      type: "/errors/establishment-not-found",
      title: "Establishment not found",
      status: 404,
      detail: "El comedor solicitado no existe.",
      instance,
    },
    { status: 404, headers: { "Content-Type": "application/problem+json" } },
  );
}

export function makeEstablishmentDashboardHandler() {
  return http.get<{ id: string }>(
    ESTABLISHMENT_DASHBOARD_ENDPOINT(":id"),
    ({ params, request }) => {
      if (params.id === WITH_DATA_ID)
        return HttpResponse.json(DEFAULT_ESTABLISHMENT_DASHBOARD);
      if (params.id === WITHOUT_DATA_ID)
        return HttpResponse.json(EMPTY_ESTABLISHMENT_DASHBOARD);
      return notFound(new URL(request.url).pathname);
    },
  );
}

export function makeEstablishmentSubjectsHandler() {
  return http.get<{ id: string }>(
    ESTABLISHMENT_SUBJECTS_ENDPOINT(":id"),
    ({ params, request }) => {
      if (params.id === WITH_DATA_ID)
        return HttpResponse.json(DEFAULT_ESTABLISHMENT_SUBJECTS_RESPONSE);
      if (params.id === WITHOUT_DATA_ID)
        return HttpResponse.json(EMPTY_ESTABLISHMENT_SUBJECTS_RESPONSE);
      return notFound(new URL(request.url).pathname);
    },
  );
}

export function makeEstablishmentFieldWorkersHandler() {
  return http.get<{ id: string }>(
    ESTABLISHMENT_FIELD_WORKERS_ENDPOINT(":id"),
    ({ params, request }) => {
      const url = new URL(request.url);
      if (params.id !== WITH_DATA_ID && params.id !== WITHOUT_DATA_ID)
        return notFound(url.pathname);

      // Default relation_status is `approved`; the fixture only covers that one.
      const relationStatuses = url.searchParams.getAll("relation_status");
      if (relationStatuses.length && !relationStatuses.includes("approved"))
        return HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          page_size: 20,
          total_pages: 0,
        });

      return HttpResponse.json(DEFAULT_ESTABLISHMENT_FIELD_WORKERS_RESPONSE);
    },
  );
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
