import { http, HttpResponse, PathParams } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import { PaginatedUsersResponse } from "@/types/admin";
import { LIST_USERS_ENDPOINT } from "@/constants/api";
import { DEFAULT_PENDING_USERS_RESPONSE } from "@/mocks/fixtures/admin";

export function makeListUsersHandler(
  options?: HandlerOptions<PaginatedUsersResponse>,
) {
  return baseHandler(LIST_USERS_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_PENDING_USERS_RESPONSE, ...options?.data },
  });
}

export function makeApproveEstablishmentsHandler() {
  return http.patch<PathParams>(
    "/api/v1/admin/managers/:user_id/establishments/approve",
    () => new HttpResponse(null, { status: 204 }),
  );
}

export function makeRejectEstablishmentsHandler() {
  return http.patch<PathParams>(
    "/api/v1/admin/managers/:user_id/establishments/reject",
    () => new HttpResponse(null, { status: 204 }),
  );
}
