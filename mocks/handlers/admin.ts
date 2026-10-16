import { http, HttpResponse, PathParams } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import {
  AdminUserDetail,
  ChangeUserRoleRequest,
  EstablishmentApprovalResponse,
  PaginatedEstablishmentRequestsResponse,
  PaginatedUsersResponse,
  PendingEstablishmentAccessResponse,
} from "@/types/admin";
import {
  LIST_ESTABLISHMENT_REQUESTS_ENDPOINT,
  LIST_USERS_ENDPOINT,
  APPROVE_FIELD_WORKER_ENDPOINT,
  CHANGE_USER_ROLE_ENDPOINT,
  GET_USER_ENDPOINT,
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
  DEFAULT_USER_DETAIL,
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

export function makeGetUserHandler(options?: HandlerOptions<AdminUserDetail>) {
  return baseHandler(GET_USER_ENDPOINT(":user_id"), {
    ...options,
    method: "get",
    data: { ...DEFAULT_USER_DETAIL, ...options?.data },
  });
}

/**
 * Answers with the user carrying the requested role, as the backend does.
 * Pass a non-200 `status` for an error response instead.
 */
export function makeChangeUserRoleHandler(
  options?: HandlerOptions<AdminUserDetail>,
) {
  if (options?.status && options.status !== 200) {
    return baseHandler(CHANGE_USER_ROLE_ENDPOINT(":user_id"), {
      ...options,
      method: "patch",
    });
  }
  return http.patch<PathParams>(
    CHANGE_USER_ROLE_ENDPOINT(":user_id"),
    async ({ request, params }) => {
      await options?.onRequest?.(request.clone());
      const { role } = (await request.json()) as ChangeUserRoleRequest;
      return HttpResponse.json<AdminUserDetail>({
        ...DEFAULT_USER_DETAIL,
        ...options?.data,
        id: String(params.user_id),
        role,
      });
    },
    { once: options?.once },
  );
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
