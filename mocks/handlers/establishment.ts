import { http, HttpResponse } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import {
  CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
  ESTABLISHMENT_CHARACTERIZATION_ENDPOINT,
  ESTABLISHMENT_DASHBOARD_ENDPOINT,
  ESTABLISHMENT_FIELD_WORKERS_ENDPOINT,
  ESTABLISHMENT_FOOD_MOVEMENT_DETAIL_ENDPOINT,
  ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT,
  ESTABLISHMENT_STOCK_ENDPOINT,
  ESTABLISHMENT_STOCK_EXPORT_ENDPOINT,
  ESTABLISHMENT_SUBJECTS_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
  ESTABLISHMENTS_MAP_ENDPOINT,
} from "@/constants/api";
import {
  DEFAULT_ESTABLISHMENT_DASHBOARD,
  DEFAULT_ESTABLISHMENT_FIELD_WORKERS_RESPONSE,
  DEFAULT_ESTABLISHMENT_SUBJECTS_RESPONSE,
  DEFAULT_ESTABLISHMENTS_MAP_RESPONSE,
  DEFAULT_ESTABLISHMENTS_RESPONSE,
  EMPTY_ESTABLISHMENT_DASHBOARD,
  MOCK_FOOD_MOVEMENT_DETAILS,
  EMPTY_ESTABLISHMENT_SUBJECTS_RESPONSE,
  MOCK_ESTABLISHMENTS,
  currentStock,
  currentMovements,
  characterizationStatusOf,
  currentCharacterization,
  storeCharacterization,
} from "@/mocks/fixtures/establishment";
import { OTHER_TEXT_MAX_LENGTH } from "@/schemas/establishmentCharacterization.schema";
import {
  EstablishmentCharacterization,
  EstablishmentDashboardResponse,
} from "@/types/establishment";
import { availableMillis } from "@/lib/foodMovementQuantity";

type PaginatedEstablishmentsResponse = typeof DEFAULT_ESTABLISHMENTS_RESPONSE;

/** Without options it answers each establishment's live profile status, so a
 * profile saved under MSW drops its "Perfil pendiente" badge from the list. */
export function makeListEstablishmentsHandler(
  options?: HandlerOptions<PaginatedEstablishmentsResponse>,
) {
  if (!options)
    return http.get(ESTABLISHMENTS_ENDPOINT, () =>
      HttpResponse.json({
        ...DEFAULT_ESTABLISHMENTS_RESPONSE,
        items: DEFAULT_ESTABLISHMENTS_RESPONSE.items.map((item) => ({
          ...item,
          characterization_status: characterizationStatusOf(item.id),
        })),
      }),
    );
  return baseHandler(ESTABLISHMENTS_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_ESTABLISHMENTS_RESPONSE, ...options?.data },
  });
}

export function makeEstablishmentsMapHandler(
  options?: HandlerOptions<typeof DEFAULT_ESTABLISHMENTS_MAP_RESPONSE>,
) {
  return baseHandler(ESTABLISHMENTS_MAP_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_ESTABLISHMENTS_MAP_RESPONSE, ...options?.data },
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
/** Only the movements listing answers for this one: it exists to overflow a page. */
const PAGED_ID = MOCK_ESTABLISHMENTS[2].id;
/** The comedor the caller has no approved access to: its movements answer 403. */
const FORBIDDEN_ID = MOCK_ESTABLISHMENTS[3].id;

function forbidden(instance: string) {
  return HttpResponse.json(
    {
      type: "/errors/role-not-allowed",
      title: "Forbidden",
      status: 403,
      detail: "No tenés acceso a este comedor.",
      instance,
    },
    { status: 403, headers: { "Content-Type": "application/problem+json" } },
  );
}

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
        return HttpResponse.json(
          withCharacterization(DEFAULT_ESTABLISHMENT_DASHBOARD),
        );
      if (params.id === WITHOUT_DATA_ID)
        return HttpResponse.json(
          withCharacterization(EMPTY_ESTABLISHMENT_DASHBOARD),
        );
      return notFound(new URL(request.url).pathname);
    },
  );
}

function withCharacterization(
  dashboard: EstablishmentDashboardResponse,
): EstablishmentDashboardResponse {
  const id = dashboard.establishment.id;
  return {
    ...dashboard,
    establishment: {
      ...dashboard.establishment,
      characterization_status: characterizationStatusOf(id),
    },
    characterization: currentCharacterization(id),
  };
}

const OTHER_FIELDS = [
  ["space_types", "space_types_other"],
  ["care_tasks", "care_tasks_other"],
  ["premises", "premises_other"],
  ["bathroom", "bathroom_other"],
  ["affiliations", "affiliations_other"],
  ["service_types", "service_types_other"],
  ["kitchen_equipment", "kitchen_equipment_other"],
  ["cultural_identities", "cultural_identities_other"],
] as const;

/** The two 422s backend#196 defines: "Otro" text without "Otro" chosen, and
 * a text over the length bound. Option values themselves are trusted. */
function invalidOtherField(body: EstablishmentCharacterization) {
  return OTHER_FIELDS.find(([choice, other]) => {
    const text = body[other];
    if (text === null) return false;
    const value = body[choice];
    const chosen = Array.isArray(value)
      ? (value as string[]).includes("other")
      : value === "other";
    return !chosen || text.length > OTHER_TEXT_MAX_LENGTH;
  });
}

export function makeUpdateEstablishmentCharacterizationHandler() {
  return http.put<{ id: string }>(
    ESTABLISHMENT_CHARACTERIZATION_ENDPOINT(":id"),
    async ({ params, request }) => {
      const path = new URL(request.url).pathname;
      if (params.id !== WITH_DATA_ID && params.id !== WITHOUT_DATA_ID)
        return notFound(path);

      const body = (await request.json()) as EstablishmentCharacterization;
      const invalid = invalidOtherField(body);
      if (invalid)
        return HttpResponse.json(
          {
            type: "/errors/validation-failed",
            title: "Validation failed",
            status: 422,
            detail: "Validation failed",
            instance: path,
            field: invalid[1],
          },
          {
            status: 422,
            headers: { "Content-Type": "application/problem+json" },
          },
        );

      storeCharacterization(params.id, body);
      return HttpResponse.json({
        characterization_status: characterizationStatusOf(params.id),
        characterization: currentCharacterization(params.id),
      });
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

      const categoryId = url.searchParams.get("category_id");
      const onlyAvailable = url.searchParams.get("only_available") === "true";
      const page = Number(url.searchParams.get("page") ?? 1);
      const pageSize = Number(url.searchParams.get("page_size") ?? 20);
      const sortOrder = url.searchParams.get("sort_order") ?? "name_asc";
      const items = currentStock(params.id)
        .filter(
          (item) =>
            !onlyAvailable || availableMillis(item.quantity) > BigInt("0"),
        )
        .filter((item) => !categoryId || item.category.id === categoryId)
        .sort((a, b) => {
          if (sortOrder === "name_desc")
            return b.food.name.localeCompare(a.food.name);
          if (sortOrder === "quantity_asc" || sortOrder === "quantity_desc") {
            const delta =
              availableMillis(a.quantity) - availableMillis(b.quantity);
            const order = delta < BigInt(0) ? -1 : delta > BigInt(0) ? 1 : 0;
            return sortOrder === "quantity_asc" ? order : -order;
          }
          if (sortOrder === "updated_at_desc")
            return b.updated_at.localeCompare(a.updated_at);
          return a.food.name.localeCompare(b.food.name);
        });

      return HttpResponse.json({
        items: items.slice((page - 1) * pageSize, page * pageSize),
        total: items.length,
        page,
        page_size: pageSize,
        total_pages: Math.max(1, Math.ceil(items.length / pageSize)),
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

/**
 * Filters for real (direction + the occurred_at range) so a test exercises the
 * date conversion end to end, not just the select. Sorted newest event first,
 * like the backend does.
 */
export function makeEstablishmentFoodMovementsHandler() {
  return http.get<{ id: string }>(
    ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT(":id"),
    ({ params, request }) => {
      const url = new URL(request.url);
      // 403 and 404 are different situations and render differently: no
      // approved access to an existing comedor vs. no such comedor.
      if (params.id === FORBIDDEN_ID) return forbidden(url.pathname);
      if (
        params.id !== WITH_DATA_ID &&
        params.id !== WITHOUT_DATA_ID &&
        params.id !== PAGED_ID
      )
        return notFound(url.pathname);
      const direction = url.searchParams.get("direction");
      const occurredFrom = url.searchParams.get("occurred_from");
      const occurredTo = url.searchParams.get("occurred_to");
      const foodId = url.searchParams.get("food_id");
      const page = Number(url.searchParams.get("page") ?? 1);
      const pageSize = Number(url.searchParams.get("page_size") ?? 20);

      // "Movements carrying this food on at least one line" — the rows have no
      // lines, so the answer comes from the detail fixture, the same way the
      // backend joins onto the lines table.
      const carriesFood = (movementId: string) =>
        !foodId ||
        (MOCK_FOOD_MOVEMENT_DETAILS[movementId]?.items ?? []).some(
          (line) => line.food.id === foodId,
        );

      const source = currentMovements(params.id);

      const matches = source
        .filter((item) => !direction || item.direction === direction)
        .filter((item) => !occurredFrom || item.occurred_at >= occurredFrom)
        .filter((item) => !occurredTo || item.occurred_at <= occurredTo)
        .filter((item) => carriesFood(item.id))
        .sort(
          (a, b) =>
            b.occurred_at.localeCompare(a.occurred_at) ||
            b.id.localeCompare(a.id),
        );

      // Slices for real: a handler that returned everything and a fixed
      // `total_pages: 1` would hide the paginator from every test and from
      // the dev preview, i.e. from everyone who could notice it broke.
      const start = (page - 1) * pageSize;

      return HttpResponse.json({
        items: matches.slice(start, start + pageSize),
        total: matches.length,
        page,
        page_size: pageSize,
        total_pages: Math.max(1, Math.ceil(matches.length / pageSize)),
      });
    },
  );
}

/** An unknown movement id answers 404 — the same answer a movement of another
 *  comedor gets, which is the point: the ids of other comedores stay hidden. */
export function makeEstablishmentFoodMovementDetailHandler() {
  return http.get<{ id: string; movementId: string }>(
    ESTABLISHMENT_FOOD_MOVEMENT_DETAIL_ENDPOINT(":id", ":movementId"),
    ({ params, request }) => {
      const url = new URL(request.url);
      if (
        params.id !== WITH_DATA_ID &&
        params.id !== WITHOUT_DATA_ID &&
        params.id !== PAGED_ID
      )
        return notFound(url.pathname);

      const detail = MOCK_FOOD_MOVEMENT_DETAILS[params.movementId];
      if (!detail)
        return HttpResponse.json(
          {
            type: "/errors/food-movement-not-found",
            title: "Food movement not found",
            status: 404,
            detail: "El movimiento solicitado no existe.",
            instance: url.pathname,
          },
          {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          },
        );

      return HttpResponse.json(detail);
    },
  );
}
