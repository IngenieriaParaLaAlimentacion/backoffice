import { AuthDispatcher } from "@/context/AuthContext";
import {
  APPROVE_ESTABLISHMENT_REQUEST_ENDPOINT,
  LIST_ESTABLISHMENT_REQUESTS_ENDPOINT,
  REJECT_ESTABLISHMENT_REQUEST_ENDPOINT,
} from "@/constants/api";
import {
  EstablishmentApprovalResponse,
  EstablishmentRequestStatus,
  PaginatedEstablishmentRequestsResponse,
} from "@/types/admin";
import { CreateEstablishmentInput } from "@/schemas/establishment.schema";
import { withPlaceholderGeoData } from "@/lib/establishmentGeoPlaceholder";
import { ErrorResponse } from "@/lib/types";

const PENDING_STATUS: EstablishmentRequestStatus = "pending";

type ListEstablishmentRequestsParams = {
  page?: number;
  page_size?: number;
};

export const listEstablishmentRequestsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListEstablishmentRequestsParams,
) => {
  const query = new URLSearchParams();
  query.set("status", PENDING_STATUS);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const res = await dispatcher<
    undefined,
    PaginatedEstablishmentRequestsResponse
  >(`${LIST_ESTABLISHMENT_REQUESTS_ENDPOINT}?${query.toString()}`);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedEstablishmentRequestsResponse;
};

export const approveEstablishmentRequestAction = async (
  dispatcher: AuthDispatcher,
  requestId: string,
  data: CreateEstablishmentInput,
) => {
  const body = withPlaceholderGeoData(data);

  const res = await dispatcher<typeof body, EstablishmentApprovalResponse>(
    APPROVE_ESTABLISHMENT_REQUEST_ENDPOINT(requestId),
    { method: "PATCH", body },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as EstablishmentApprovalResponse;
};

export const rejectEstablishmentRequestAction = async (
  dispatcher: AuthDispatcher,
  requestId: string,
) => {
  const res = await dispatcher<Record<string, never>, undefined>(
    REJECT_ESTABLISHMENT_REQUEST_ENDPOINT(requestId),
    { method: "PATCH", body: {} },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);
};
