import { AuthDispatcher } from "@/context/AuthContext";
import {
  ESTABLISHMENT_DASHBOARD_ENDPOINT,
  ESTABLISHMENT_FIELD_WORKERS_ENDPOINT,
  ESTABLISHMENT_SUBJECTS_ENDPOINT,
  ESTABLISHMENTS_ENDPOINT,
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
import { ErrorResponse } from "@/lib/types";
import { ApiError } from "@/lib/apiError";

type ListEstablishmentsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  city?: string;
  province?: string;
  sort_order?: EstablishmentSortOrder;
};

type CreateEstablishmentData = {
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  city: string;
  province: string;
};

type ListEstablishmentSubjectsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_order?: EstablishmentSubjectSortOrder;
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
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.city) query.set("city", params.city);
  if (params?.province) query.set("province", params.province);
  if (params?.sort_order) query.set("sort_order", params.sort_order);

  const path = query.size
    ? `${ESTABLISHMENTS_ENDPOINT}?${query.toString()}`
    : ESTABLISHMENTS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedEstablishmentsResponse>(
    path,
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedEstablishmentsResponse;
};

export const createEstablishmentAction = async (
  dispatcher: AuthDispatcher,
  data: CreateEstablishmentData,
) => {
  const res = await dispatcher<CreateEstablishmentData, EstablishmentResponse>(
    ESTABLISHMENTS_ENDPOINT,
    { method: "POST", body: data },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

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

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

  return res.data as EstablishmentDashboardResponse;
};

export const listEstablishmentSubjectsAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  params?: ListEstablishmentSubjectsParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.sort_order) query.set("sort_order", params.sort_order);

  const endpoint = ESTABLISHMENT_SUBJECTS_ENDPOINT(establishmentId);
  const path = query.size ? `${endpoint}?${query.toString()}` : endpoint;

  const res = await dispatcher<
    undefined,
    PaginatedEstablishmentSubjectsResponse
  >(path);

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

  return res.data as PaginatedEstablishmentSubjectsResponse;
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

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

  return res.data as PaginatedEstablishmentFieldWorkersResponse;
};
