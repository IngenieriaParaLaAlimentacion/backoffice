import { AuthDispatcher } from "@/context/AuthContext";
import {
  APPROVE_ESTABLISHMENTS_ENDPOINT,
  INVITE_ADMIN_ENDPOINT,
  INVITE_ANALYST_ENDPOINT,
  LIST_USERS_ENDPOINT,
  REJECT_ESTABLISHMENTS_ENDPOINT,
  RESEND_INVITE_ENDPOINT,
} from "@/constants/api";
import {
  EstablishmentAccessRequest,
  InviteAdminResponse,
  PaginatedUsersResponse,
} from "@/types/admin";
import { ForgotPasswordRequest } from "@/types/auth";
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

export const inviteAdminAction = async (
  dispatcher: AuthDispatcher,
  email: string,
): Promise<string> => {
  const body: ForgotPasswordRequest = { email };

  const res = await dispatcher<ForgotPasswordRequest, InviteAdminResponse>(
    INVITE_ADMIN_ENDPOINT,
    { method: "POST", body },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return (res.data as InviteAdminResponse).user_id;
};

export const inviteAnalystAction = async (
  dispatcher: AuthDispatcher,
  email: string,
): Promise<string> => {
  const body: ForgotPasswordRequest = { email };

  const res = await dispatcher<ForgotPasswordRequest, InviteAdminResponse>(
    INVITE_ANALYST_ENDPOINT,
    { method: "POST", body },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return (res.data as InviteAdminResponse).user_id;
};

export const resendInviteAction = async (
  dispatcher: AuthDispatcher,
  userId: string,
) => {
  const res = await dispatcher<undefined, undefined>(
    RESEND_INVITE_ENDPOINT(userId),
    { method: "PATCH" },
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
