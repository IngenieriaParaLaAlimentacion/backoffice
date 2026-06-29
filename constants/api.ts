export const API_BASE_URL = "";

// --- Auth Endpoints ---

export const ADMIN_LOGIN_ENDPOINT = "/api/v1/auth/login";
export const ACCEPT_INVITE_ENDPOINT = "/api/v1/auth/invite-admin/confirm";
export const REFRESH_ENDPOINT = "/api/v1/auth/refresh";
export const RESET_PASSWORD_ENDPOINT = "/api/v1/auth/password-recovery/confirm";
export const FORGOT_PASSWORD_ENDPOINT =
  "/api/v1/auth/password-recovery/request";
export const LOGOUT_ENDPOINT = "/api/v1/auth/logout";
export const REGISTER_MANAGER_ENDPOINT =
  "/api/v1/auth/register/establishment-manager";

// --- Admin Endpoints ---

export const LIST_USERS_ENDPOINT = "/api/v1/admin/users";
export const APPROVE_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/managers/${userId}/establishments/approve`;
export const REJECT_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/managers/${userId}/establishments/reject`;
export const REJECT_MANAGER_ENDPOINT = (userId: string) =>
  `/api/v1/admin/managers/${userId}/reject`;
export const ADMIN_SUBJECT_DETAIL_ENDPOINT = (subjectId: string) =>
  `/api/v1/admin/subjects/${subjectId}`;
export const INVITE_ADMIN_ENDPOINT = "/api/v1/admin/invite-admin";

// --- Establishments Endpoints ---

export const ESTABLISHMENTS_ENDPOINT = "/api/v1/establishments";

// --- Subjects Endpoints ---

export const SUBJECTS_ENDPOINT = "/api/v1/subjects";
export const SUBJECT_ENDPOINT = (subjectId: string) =>
  `/api/v1/subjects/${subjectId}`;

// --- Users Endpoints ---

export const ME_ENDPOINT = "/api/v1/users/me";
