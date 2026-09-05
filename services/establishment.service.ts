import { AuthDispatcher, DownloadDispatcher } from "@/context/AuthContext";
import {
  ESTABLISHMENT_DASHBOARD_ENDPOINT,
  ESTABLISHMENT_FIELD_WORKERS_ENDPOINT,
  ESTABLISHMENT_SUBJECTS_ENDPOINT,
  ESTABLISHMENT_SUBJECTS_EXPORT_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
  ESTABLISHMENTS_EXPORT_ENDPOINT,
} from "@/constants/api";
import { EstablishmentResponse, EstablishmentSortOrder } from "@/types/admin";
import {
  EstablishmentDashboardResponse,
  EstablishmentSubjectSortOrder,
  PaginatedEstablishmentFieldWorkersResponse,
  PaginatedEstablishmentsResponse,
  PaginatedEstablishmentSubjectsResponse,
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
