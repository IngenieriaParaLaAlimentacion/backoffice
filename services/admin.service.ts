import { AuthDispatcher } from "@/context/AuthContext";
import {
  APPROVE_ESTABLISHMENTS_ENDPOINT,
  LIST_USERS_ENDPOINT,
  REJECT_ESTABLISHMENTS_ENDPOINT,
} from "@/constants/api";
import {
  EstablishmentAccessRequest,
  PaginatedUsersResponse,
} from "@/types/admin";
import { ErrorResponse } from "@/lib/types";

type ListUsersParams = {
  page?: number;
  page_size?: number;
  status?: string;
  role?: string;
  search?: string;
};

export const listUsersAction = async (
  dispatcher: AuthDispatcher,
  params?: ListUsersParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.status) query.set("status", params.status);
  if (params?.role) query.set("role", params.role);
  if (params?.search) query.set("search", params.search);

  const path = query.size
    ? `${LIST_USERS_ENDPOINT}?${query.toString()}`
    : LIST_USERS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedUsersResponse>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedUsersResponse;
};

export const approveEstablishmentsAction = async (
  userId: string,
  establishmentIds: string[],
  dispatcher: AuthDispatcher,
) => {
  const body: EstablishmentAccessRequest = {
    establishment_ids: establishmentIds,
  };

  const res = await dispatcher<EstablishmentAccessRequest, undefined>(
    APPROVE_ESTABLISHMENTS_ENDPOINT(userId),
    { method: "PATCH", body },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);
};

export const rejectEstablishmentsAction = async (
  userId: string,
  establishmentIds: string[],
  dispatcher: AuthDispatcher,
) => {
  const body: EstablishmentAccessRequest = {
    establishment_ids: establishmentIds,
  };

  const res = await dispatcher<EstablishmentAccessRequest, undefined>(
    REJECT_ESTABLISHMENTS_ENDPOINT(userId),
    { method: "PATCH", body },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);
};
