import { AuthDispatcher } from "@/context/AuthContext";
import {
  APPROVE_ESTABLISHMENTS_ENDPOINT,
  APPROVE_FIELD_WORKER_ENDPOINT,
  CHANGE_USER_ROLE_ENDPOINT,
  GET_USER_ENDPOINT,
  INVITE_ADMIN_ENDPOINT,
  INVITE_ANALYST_ENDPOINT,
  LIST_USERS_ENDPOINT,
  PENDING_ESTABLISHMENT_ACCESS_ENDPOINT,
  REJECT_ESTABLISHMENTS_ENDPOINT,
  REJECT_FIELD_WORKER_ENDPOINT,
  RESEND_INVITE_ENDPOINT,
  REVOKE_ESTABLISHMENTS_ENDPOINT,
} from "@/constants/api";
import {
  AdminUserDetail,
  ChangeUserRoleRequest,
  EstablishmentAccessRequest,
  InviteAdminResponse,
  PaginatedUsersResponse,
  PendingEstablishmentAccessResponse,
  UserAccessRequest,
} from "@/types/admin";
import { ForgotPasswordRequest } from "@/types/auth";
import { toApiError } from "@/lib/apiError";
import { UserRole } from "@/types/user";

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

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedUsersResponse;
};

type ListPendingEstablishmentAccessParams = {
  page?: number;
  page_size?: number;
  search?: string;
  establishment_id?: string;
};

export const listPendingEstablishmentAccessAction = async (
  dispatcher: AuthDispatcher,
  params?: ListPendingEstablishmentAccessParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.establishment_id)
    query.set("establishment_id", params.establishment_id);

  const path = query.size
    ? `${PENDING_ESTABLISHMENT_ACCESS_ENDPOINT}?${query.toString()}`
    : PENDING_ESTABLISHMENT_ACCESS_ENDPOINT;

  const res = await dispatcher<undefined, PendingEstablishmentAccessResponse>(
    path,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PendingEstablishmentAccessResponse;
};

export const getUserAction = async (
  dispatcher: AuthDispatcher,
  userId: string,
): Promise<AdminUserDetail> => {
  const res = await dispatcher<undefined, AdminUserDetail>(
    GET_USER_ENDPOINT(userId),
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as AdminUserDetail;
};

/**
 * Changes only the user's role. The backend revokes their sessions and emails
 * them; asking for the role they already hold is a no-op `200`.
 */
export const changeUserRoleAction = async (
  dispatcher: AuthDispatcher,
  userId: string,
  role: UserRole,
): Promise<AdminUserDetail> => {
  const body: ChangeUserRoleRequest = { role };

  const res = await dispatcher<ChangeUserRoleRequest, AdminUserDetail>(
    CHANGE_USER_ROLE_ENDPOINT(userId),
    { method: "PATCH", body },
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as AdminUserDetail;
};

/**
 * Activates the field worker's account and approves the given establishments.
 * `establishmentIds` may be empty: the account is activated and every
 * establishment request stays pending.
 */
export const approveFieldWorkerAction = async (
  userId: string,
  establishmentIds: string[],
  dispatcher: AuthDispatcher,
) => {
  const body: UserAccessRequest = {
    establishment_ids: establishmentIds,
  };

  const res = await dispatcher<UserAccessRequest, undefined>(
    APPROVE_FIELD_WORKER_ENDPOINT(userId),
    { method: "PATCH", body },
  );

  if (!res.ok) throw toApiError(res.data, res.status);
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

  if (!res.ok) throw toApiError(res.data, res.status);
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

  if (!res.ok) throw toApiError(res.data, res.status);

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

  if (!res.ok) throw toApiError(res.data, res.status);

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

  if (!res.ok) throw toApiError(res.data, res.status);
};

/**
 * Rejects every establishment requested by the field worker and leaves the
 * account inactive. Takes no body: the backend resolves all of them at once.
 */
export const rejectFieldWorkerAction = async (
  userId: string,
  dispatcher: AuthDispatcher,
) => {
  const res = await dispatcher<undefined, undefined>(
    REJECT_FIELD_WORKER_ENDPOINT(userId),
    { method: "PATCH" },
  );

  if (!res.ok) throw toApiError(res.data, res.status);
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

  if (!res.ok) throw toApiError(res.data, res.status);
};

/**
 * Revokes the field worker's access to establishments that are currently
 * `approved`. Atomic over the batch: if any of `establishmentIds` isn't
 * `approved`, the backend rejects the whole request with 409 and revokes
 * none of them — callers should surface that instead of retrying blindly.
 */
export const revokeEstablishmentsAction = async (
  userId: string,
  establishmentIds: string[],
  dispatcher: AuthDispatcher,
) => {
  const body: EstablishmentAccessRequest = {
    establishment_ids: establishmentIds,
  };

  const res = await dispatcher<EstablishmentAccessRequest, undefined>(
    REVOKE_ESTABLISHMENTS_ENDPOINT(userId),
    { method: "PATCH", body },
  );

  if (!res.ok) throw toApiError(res.data, res.status);
};
