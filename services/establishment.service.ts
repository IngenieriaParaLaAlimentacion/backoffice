import { AuthDispatcher, DownloadDispatcher } from "@/context/AuthContext";
import {
  ESTABLISHMENT_CHARACTERIZATION_ENDPOINT,
  ESTABLISHMENT_DASHBOARD_ENDPOINT,
  ESTABLISHMENT_ENDPOINT,
  ESTABLISHMENT_FIELD_WORKERS_ENDPOINT,
  ESTABLISHMENT_FOOD_MOVEMENT_DETAIL_ENDPOINT,
  ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT,
  ESTABLISHMENT_STOCK_ENDPOINT,
  ESTABLISHMENT_STOCK_EXPORT_ENDPOINT,
  ESTABLISHMENT_SUBJECTS_ENDPOINT,
  ESTABLISHMENT_SUBJECTS_EXPORT_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
  ESTABLISHMENTS_EXPORT_ENDPOINT,
  ESTABLISHMENTS_MAP_ENDPOINT,
} from "@/constants/api";
import {
  EstablishmentMapResponse,
  EstablishmentResponse,
  EstablishmentSortOrder,
  EstablishmentCharacterization,
  EstablishmentCharacterizationResponse,
  EstablishmentDashboardResponse,
  UpdateEstablishmentRequest,
  EstablishmentSubjectSortOrder,
  FoodMovementDetail,
  FoodMovementDirection,
  FoodStockSortOrder,
  PaginatedEstablishmentFieldWorkersResponse,
  PaginatedEstablishmentsResponse,
  PaginatedEstablishmentSubjectsResponse,
  PaginatedFoodMovementsResponse,
  PaginatedFoodStockResponse,
  RelationStatus,
} from "@/types/establishment";
import { toApiError } from "@/lib/apiError";

export type EstablishmentFilters = {
  search?: string;
  city?: string;
  province?: string;
  sort_order?: EstablishmentSortOrder;
};

type ListEstablishmentsParams = EstablishmentFilters & {
  page?: number;
  page_size?: number;
};

/** The listing and its CSV export must ask for the same rows: one builder. */
const establishmentFilterQuery = (filters?: EstablishmentFilters) => {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.city) query.set("city", filters.city);
  if (filters?.province) query.set("province", filters.province);
  if (filters?.sort_order) query.set("sort_order", filters.sort_order);
  return query;
};

export type CreateEstablishmentData = {
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  city: string;
  province: string;
  /** Optional profile, stored with the establishment in the same call. */
  characterization?: EstablishmentCharacterization;
};

export type EstablishmentSubjectFilters = {
  search?: string;
  sort_order?: EstablishmentSubjectSortOrder;
};

type ListEstablishmentSubjectsParams = EstablishmentSubjectFilters & {
  page?: number;
  page_size?: number;
};

const establishmentSubjectFilterQuery = (
  filters?: EstablishmentSubjectFilters,
) => {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.sort_order) query.set("sort_order", filters.sort_order);
  return query;
};

type ListEstablishmentFieldWorkersParams = {
  page?: number;
  page_size?: number;
  search?: string;
  relation_status?: RelationStatus[];
};

export type EstablishmentStockFilters = {
  category_id?: string;
  only_available?: boolean;
  sort_order?: FoodStockSortOrder;
};

type ListEstablishmentStockParams = EstablishmentStockFilters & {
  page?: number;
  page_size?: number;
};

/** The listing and its CSV export must ask for the same rows: one builder. */
const establishmentStockFilterQuery = (filters?: EstablishmentStockFilters) => {
  const query = new URLSearchParams();
  if (filters?.category_id) query.set("category_id", filters.category_id);
  if (filters?.only_available) query.set("only_available", "true");
  if (filters?.sort_order) query.set("sort_order", filters.sort_order);
  return query;
};

export const listEstablishmentsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListEstablishmentsParams,
) => {
  const query = establishmentFilterQuery(params);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const path = query.size
    ? `${ESTABLISHMENTS_ENDPOINT}?${query.toString()}`
    : ESTABLISHMENTS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedEstablishmentsResponse>(
    path,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedEstablishmentsResponse;
};

/**
 * Every establishment's location and severity in one unpaginated call, for the
 * map. Takes no filters: the listing's search/city/province don't apply to it.
 * Admin, analyst and superadmin only — anyone else gets a 403.
 */
export const getEstablishmentsMapAction = async (
  dispatcher: AuthDispatcher,
) => {
  const res = await dispatcher<undefined, EstablishmentMapResponse>(
    ESTABLISHMENTS_MAP_ENDPOINT,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as EstablishmentMapResponse;
};

/** Downloads every establishment matching the filters as a CSV file. */
export const exportEstablishmentsAction = async (
  download: DownloadDispatcher,
  filters?: EstablishmentFilters,
) => {
  const query = establishmentFilterQuery(filters);

  const path = query.size
    ? `${ESTABLISHMENTS_EXPORT_ENDPOINT}?${query.toString()}`
    : ESTABLISHMENTS_EXPORT_ENDPOINT;

  return download(path);
};

export const createEstablishmentAction = async (
  dispatcher: AuthDispatcher,
  data: CreateEstablishmentData,
) => {
  const res = await dispatcher<CreateEstablishmentData, EstablishmentResponse>(
    ESTABLISHMENTS_ENDPOINT,
    { method: "POST", body: data },
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as EstablishmentResponse;
};

/**
 * Throws ApiError so callers can tell 404 ("comedor no existe") apart from the
 * empty state (`has_data: false`) and from 403 (field_worker token).
 */
export const getEstablishmentDashboardAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
) => {
  const res = await dispatcher<undefined, EstablishmentDashboardResponse>(
    ESTABLISHMENT_DASHBOARD_ENDPOINT(establishmentId),
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as EstablishmentDashboardResponse;
};

/** Admin-only; 409 (`establishment-already-exists`) when the new address is
 * another establishment's. */
export const updateEstablishmentAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  body: UpdateEstablishmentRequest,
) => {
  const res = await dispatcher<
    UpdateEstablishmentRequest,
    EstablishmentResponse
  >(ESTABLISHMENT_ENDPOINT(establishmentId), { method: "PATCH", body });

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as EstablishmentResponse;
};

/** Replaces the whole profile: an empty field clears what was stored. */
export const updateEstablishmentCharacterizationAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  body: EstablishmentCharacterization,
) => {
  const res = await dispatcher<
    EstablishmentCharacterization,
    EstablishmentCharacterizationResponse
  >(ESTABLISHMENT_CHARACTERIZATION_ENDPOINT(establishmentId), {
    method: "PUT",
    body,
  });

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as EstablishmentCharacterizationResponse;
};

export const listEstablishmentSubjectsAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  params?: ListEstablishmentSubjectsParams,
) => {
  const query = establishmentSubjectFilterQuery(params);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const endpoint = ESTABLISHMENT_SUBJECTS_ENDPOINT(establishmentId);
  const path = query.size ? `${endpoint}?${query.toString()}` : endpoint;

  const res = await dispatcher<
    undefined,
    PaginatedEstablishmentSubjectsResponse
  >(path);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedEstablishmentSubjectsResponse;
};

/**
 * Downloads the establishment's subjects as a CSV file. The server names the
 * file after the establishment, so the caller's fallback rarely gets used.
 */
export const exportEstablishmentSubjectsAction = async (
  download: DownloadDispatcher,
  establishmentId: string,
  filters?: EstablishmentSubjectFilters,
) => {
  const query = establishmentSubjectFilterQuery(filters);

  const endpoint = ESTABLISHMENT_SUBJECTS_EXPORT_ENDPOINT(establishmentId);
  const path = query.size ? `${endpoint}?${query.toString()}` : endpoint;

  return download(path);
};

export const listEstablishmentFieldWorkersAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  params?: ListEstablishmentFieldWorkersParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  params?.relation_status?.forEach((status) =>
    query.append("relation_status", status),
  );

  const endpoint = ESTABLISHMENT_FIELD_WORKERS_ENDPOINT(establishmentId);
  const path = query.size ? `${endpoint}?${query.toString()}` : endpoint;

  const res = await dispatcher<
    undefined,
    PaginatedEstablishmentFieldWorkersResponse
  >(path);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedEstablishmentFieldWorkersResponse;
};

export const listEstablishmentStockAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  params?: ListEstablishmentStockParams,
) => {
  const query = establishmentStockFilterQuery(params);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const endpoint = ESTABLISHMENT_STOCK_ENDPOINT(establishmentId);
  const path = query.size ? `${endpoint}?${query.toString()}` : endpoint;

  const res = await dispatcher<undefined, PaginatedFoodStockResponse>(path);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedFoodStockResponse;
};

/**
 * Downloads the establishment's stock as a CSV file, matching the filters but
 * not the current page — the server streams every matching row.
 */
export const exportEstablishmentStockAction = async (
  download: DownloadDispatcher,
  establishmentId: string,
  filters?: EstablishmentStockFilters,
) => {
  const query = establishmentStockFilterQuery(filters);

  const endpoint = ESTABLISHMENT_STOCK_EXPORT_ENDPOINT(establishmentId);
  const path = query.size ? `${endpoint}?${query.toString()}` : endpoint;

  return download(path);
};

export type EstablishmentFoodMovementFilters = {
  direction?: FoodMovementDirection;
  /** UTC instants, not calendar days — see `argentineDayStartUtc`. */
  occurred_from?: string;
  occurred_to?: string;
  food_id?: string;
};

type ListEstablishmentFoodMovementsParams = EstablishmentFoodMovementFilters & {
  page?: number;
  page_size?: number;
};

/** One builder, so a future CSV export asks for exactly the rows on screen. */
const establishmentFoodMovementsFilterQuery = (
  filters?: EstablishmentFoodMovementFilters,
) => {
  const query = new URLSearchParams();
  if (filters?.direction) query.set("direction", filters.direction);
  if (filters?.occurred_from) query.set("occurred_from", filters.occurred_from);
  if (filters?.occurred_to) query.set("occurred_to", filters.occurred_to);
  if (filters?.food_id) query.set("food_id", filters.food_id);
  return query;
};

/**
 * Ingresos and egresos in one sequence, newest event first. The rows carry no
 * lines at all — `getEstablishmentFoodMovementAction` is the second call that
 * fetches them, which is what keeps paging cheap.
 */
export const listEstablishmentFoodMovementsAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  params?: ListEstablishmentFoodMovementsParams,
) => {
  const query = establishmentFoodMovementsFilterQuery(params);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const endpoint = ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT(establishmentId);
  const path = query.size ? `${endpoint}?${query.toString()}` : endpoint;

  const res = await dispatcher<undefined, PaginatedFoodMovementsResponse>(path);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedFoodMovementsResponse;
};

/**
 * A movement belonging to another comedor answers 404, not 403 — deliberately,
 * so the ids of other comedores can't be probed. Render it as "no existe",
 * never as "no tenés permiso".
 */
export const getEstablishmentFoodMovementAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  movementId: string,
) => {
  const res = await dispatcher<undefined, FoodMovementDetail>(
    ESTABLISHMENT_FOOD_MOVEMENT_DETAIL_ENDPOINT(establishmentId, movementId),
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as FoodMovementDetail;
};
