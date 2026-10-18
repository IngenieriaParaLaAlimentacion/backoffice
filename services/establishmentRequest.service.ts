import { AuthDispatcher } from "@/context/AuthContext";
import {
  APPROVE_ESTABLISHMENT_REQUEST_ENDPOINT,
  CREATE_ESTABLISHMENT_REQUEST_ENDPOINT,
  LIST_ESTABLISHMENT_REQUESTS_ENDPOINT,
  REJECT_ESTABLISHMENT_REQUEST_ENDPOINT,
} from "@/constants/api";
import {
  EstablishmentApprovalResponse,
  PaginatedEstablishmentRequestsResponse,
} from "@/types/admin";
import {
  EstablishmentCharacterization,
  EstablishmentRequestCreationResponse,
  EstablishmentRequestSortOrder,
  EstablishmentRequestStatus,
} from "@/types/establishment";
import { CreateEstablishmentData } from "@/services/establishment.service";
import { toApiError } from "@/lib/apiError";

const PENDING_STATUS: EstablishmentRequestStatus = "pending";

export type CreateEstablishmentRequestData = {
  name: string;
  formatted_address: string;
  city?: string;
  province?: string;
  /** Optional proposed profile; the admin sees it read-only when reviewing. */
  characterization?: EstablishmentCharacterization;
};

/**
 * The backend rejects "" for optional fields (min_length=1 still applies when
 * present) — it only accepts a populated string or the key missing entirely.
 * The form always has a string here (possibly ""), so this is where that gets
 * turned into "omit the key", not in the zod schema (which only validates).
 */
export const createEstablishmentRequestAction = async (
  dispatcher: AuthDispatcher,
  data: CreateEstablishmentRequestData,
) => {
  const body: CreateEstablishmentRequestData = {
    name: data.name,
    formatted_address: data.formatted_address,
    city: data.city || undefined,
    province: data.province || undefined,
    characterization: data.characterization,
  };

  const res = await dispatcher<
    CreateEstablishmentRequestData,
    EstablishmentRequestCreationResponse
  >(CREATE_ESTABLISHMENT_REQUEST_ENDPOINT, { method: "POST", body });

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as EstablishmentRequestCreationResponse;
};

type ListEstablishmentRequestsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  city?: string;
  province?: string;
  sort_order?: EstablishmentRequestSortOrder;
};

export const listEstablishmentRequestsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListEstablishmentRequestsParams,
) => {
  const query = new URLSearchParams();
  query.set("status", PENDING_STATUS);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.city) query.set("city", params.city);
  if (params?.province) query.set("province", params.province);
  if (params?.sort_order) query.set("sort_order", params.sort_order);

  const res = await dispatcher<
    undefined,
    PaginatedEstablishmentRequestsResponse
  >(`${LIST_ESTABLISHMENT_REQUESTS_ENDPOINT}?${query.toString()}`);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedEstablishmentRequestsResponse;
};

export const approveEstablishmentRequestAction = async (
  dispatcher: AuthDispatcher,
  requestId: string,
  data: CreateEstablishmentData,
) => {
  const res = await dispatcher<
    CreateEstablishmentData,
    EstablishmentApprovalResponse
  >(APPROVE_ESTABLISHMENT_REQUEST_ENDPOINT(requestId), {
    method: "PATCH",
    body: data,
  });

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as EstablishmentApprovalResponse;
};

type RejectEstablishmentRequestBody = { reason?: string };

export const rejectEstablishmentRequestAction = async (
  dispatcher: AuthDispatcher,
  requestId: string,
  reason?: string,
) => {
  const body: RejectEstablishmentRequestBody = reason ? { reason } : {};

  const res = await dispatcher<RejectEstablishmentRequestBody, undefined>(
    REJECT_ESTABLISHMENT_REQUEST_ENDPOINT(requestId),
    { method: "PATCH", body },
  );

  if (!res.ok) throw toApiError(res.data, res.status);
};
