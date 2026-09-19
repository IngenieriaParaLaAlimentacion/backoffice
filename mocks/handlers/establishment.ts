import { http, HttpResponse } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import {
  CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
  ESTABLISHMENT_DASHBOARD_ENDPOINT,
  ESTABLISHMENT_FIELD_WORKERS_ENDPOINT,
  ESTABLISHMENT_STOCK_ENDPOINT,
  ESTABLISHMENT_STOCK_EXPORT_ENDPOINT,
  ESTABLISHMENT_SUBJECTS_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
} from "@/constants/api";
import {
  DEFAULT_ESTABLISHMENT_DASHBOARD,
  DEFAULT_ESTABLISHMENT_FIELD_WORKERS_RESPONSE,
  DEFAULT_ESTABLISHMENT_STOCK_RESPONSE,
  DEFAULT_ESTABLISHMENT_SUBJECTS_RESPONSE,
  DEFAULT_ESTABLISHMENTS_RESPONSE,
  EMPTY_ESTABLISHMENT_DASHBOARD,
  EMPTY_ESTABLISHMENT_STOCK_RESPONSE,
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

export function makeEstablishmentStockHandler() {
  return http.get<{ id: string }>(
    ESTABLISHMENT_STOCK_ENDPOINT(":id"),
    ({ params, request }) => {
      const url = new URL(request.url);
      if (params.id !== WITH_DATA_ID && params.id !== WITHOUT_DATA_ID)
        return notFound(url.pathname);

      if (params.id === WITHOUT_DATA_ID)
        return HttpResponse.json(EMPTY_ESTABLISHMENT_STOCK_RESPONSE);

      const categoryId = url.searchParams.get("category_id");
      const items = categoryId
        ? DEFAULT_ESTABLISHMENT_STOCK_RESPONSE.items.filter(
            (item) => item.category.id === categoryId,
          )
        : DEFAULT_ESTABLISHMENT_STOCK_RESPONSE.items;

      return HttpResponse.json({
        ...DEFAULT_ESTABLISHMENT_STOCK_RESPONSE,
        items,
        total: items.length,
      });
    },
  );
}

const STOCK_EXPORT_HEADER_LINE =
  "Alimento;Categoría;Unidad;Cantidad;Última actualización";

export function makeExportEstablishmentStockHandler() {
  return http.get<{ id: string }>(
    ESTABLISHMENT_STOCK_EXPORT_ENDPOINT(":id"),
    ({ params, request }) => {
      if (params.id !== WITH_DATA_ID && params.id !== WITHOUT_DATA_ID)
        return notFound(new URL(request.url).pathname);

      const rows =
        params.id === WITH_DATA_ID
          ? [
              "Arroz;Cereales y derivados;kilogramos;25,5;10/09/2026",
              "Leche en polvo;Lácteos;kilogramos;8;12/09/2026",
              "Aceite;Aceites y grasas;litros;12;08/09/2026",
            ]
          : [];

      const body = `﻿${[STOCK_EXPORT_HEADER_LINE, ...rows].join("\r\n")}\r\n`;
      return new HttpResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="stock.csv"',
          "X-Export-Row-Count": String(rows.length),
        },
      });
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

/** city/province are absent from the body whenever the requester left them
 * blank — see the "" -> undefined conversion in createEstablishmentRequestAction. */
export function makeCreateEstablishmentRequestHandler() {
  return http.post(
    CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
    async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const newRequest = {
        id: crypto.randomUUID(),
        user_id: "user-1",
        name: String(body.name ?? ""),
        formatted_address: String(body.formatted_address ?? ""),
        city: (body.city as string | undefined) ?? null,
        province: (body.province as string | undefined) ?? null,
        status: "pending",
        created_at: new Date().toISOString(),
      };
      return HttpResponse.json(newRequest, { status: 201 });
    },
  );
}
