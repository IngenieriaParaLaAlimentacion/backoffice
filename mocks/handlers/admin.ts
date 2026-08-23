import { http, HttpResponse, PathParams } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import {
  EstablishmentApprovalResponse,
  PaginatedEstablishmentRequestsResponse,
  PaginatedUsersResponse,
  PendingEstablishmentAccessResponse,
} from "@/types/admin";
import {
  LIST_ESTABLISHMENT_REQUESTS_ENDPOINT,
  LIST_USERS_ENDPOINT,
  APPROVE_FIELD_WORKER_ENDPOINT,
  APPROVE_ESTABLISHMENTS_ENDPOINT,
  PENDING_ESTABLISHMENT_ACCESS_ENDPOINT,
  REJECT_ESTABLISHMENTS_ENDPOINT,
  REJECT_FIELD_WORKER_ENDPOINT,
} from "@/constants/api";
import {
  DEFAULT_ESTABLISHMENT_APPROVAL_RESPONSE,
  DEFAULT_ESTABLISHMENT_REQUESTS_RESPONSE,
  DEFAULT_PENDING_ESTABLISHMENT_ACCESS_RESPONSE,
  DEFAULT_PENDING_USERS_RESPONSE,
} from "@/mocks/fixtures/admin";

export function makeListUsersHandler(
  options?: HandlerOptions<PaginatedUsersResponse>,
) {
  return baseHandler(LIST_USERS_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_PENDING_USERS_RESPONSE, ...options?.data },
  });
}

export function makeListPendingEstablishmentAccessHandler(
  options?: HandlerOptions<PendingEstablishmentAccessResponse>,
) {
  return baseHandler(PENDING_ESTABLISHMENT_ACCESS_ENDPOINT, {
    ...options,
    method: "get",
    data: {
      ...DEFAULT_PENDING_ESTABLISHMENT_ACCESS_RESPONSE,
      ...options?.data,
    },
  });
}

export function makeApproveFieldWorkerHandler() {
  return http.patch<PathParams>(
    APPROVE_FIELD_WORKER_ENDPOINT(":user_id"),
    () => new HttpResponse(null, { status: 204 }),
  );
}

export function makeRejectFieldWorkerHandler() {
  return http.patch<PathParams>(
    REJECT_FIELD_WORKER_ENDPOINT(":user_id"),
    () => new HttpResponse(null, { status: 204 }),
  );
}

export function makeApproveEstablishmentsHandler() {
  return http.patch<PathParams>(
    APPROVE_ESTABLISHMENTS_ENDPOINT(":user_id"),
    () => new HttpResponse(null, { status: 204 }),
  );
}

export function makeRejectEstablishmentsHandler() {
  return http.patch<PathParams>(
    REJECT_ESTABLISHMENTS_ENDPOINT(":user_id"),
    () => new HttpResponse(null, { status: 204 }),
  );
}

export function makeListEstablishmentRequestsHandler(
  options?: HandlerOptions<PaginatedEstablishmentRequestsResponse>,
) {
  return baseHandler(LIST_ESTABLISHMENT_REQUESTS_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_ESTABLISHMENT_REQUESTS_RESPONSE, ...options?.data },
  });
}

export function makeApproveEstablishmentRequestHandler(
  options?: HandlerOptions<EstablishmentApprovalResponse>,
) {
  return baseHandler<EstablishmentApprovalResponse, { request_id: string }>(
    "/api/v1/admin/establishment-requests/:request_id/approve",
    {
      ...options,
      method: "patch",
      data: { ...DEFAULT_ESTABLISHMENT_APPROVAL_RESPONSE, ...options?.data },
    },
  );
}

export function makeRejectEstablishmentRequestHandler() {
  return http.patch<PathParams>(
    "/api/v1/admin/establishment-requests/:request_id/reject",
    () => new HttpResponse(null, { status: 204 }),
  );
}
