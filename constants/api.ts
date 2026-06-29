export const API_BASE_URL = "";

// --- Auth Endpoints ---

export const ADMIN_LOGIN_ENDPOINT = "/api/v1/auth/login";
export const ACCEPT_INVITE_ENDPOINT = "/api/v1/auth/password-recovery/confirm";
export const REFRESH_ENDPOINT = "/api/v1/auth/refresh";
export const RESET_PASSWORD_ENDPOINT = "/api/v1/auth/password-recovery/confirm";
export const FORGOT_PASSWORD_ENDPOINT =
  "/api/v1/auth/password-recovery/request";
export const LOGOUT_ENDPOINT = "/api/v1/auth/logout";
export const REGISTER_FIELD_WORKER_ENDPOINT =
  "/api/v1/auth/register/field-worker";

// --- Admin Endpoints ---

export const LIST_USERS_ENDPOINT = "/api/v1/admin/users";
export const APPROVE_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/field-worker/${userId}/establishments/approve`;
export const REJECT_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/field-worker/${userId}/establishments/reject`;
export const REJECT_FIELD_WORKER_ENDPOINT = (userId: string) =>
  `/api/v1/admin/field-worker/${userId}/reject`;
export const ADMIN_SUBJECT_DETAIL_ENDPOINT = (subjectId: string) =>
  `/api/v1/admin/subjects/${subjectId}`;
export const INVITE_ADMIN_ENDPOINT = "/api/v1/admin/invite-admin";
export const INVITE_ANALYST_ENDPOINT = "/api/v1/admin/invite-analyst";
export const RESEND_INVITE_ENDPOINT = (userId: string) =>
  `/api/v1/admin/users/${userId}/resend-invite`;

// --- Establishments Endpoints ---

export const ESTABLISHMENTS_ENDPOINT = "/api/v1/establishments";

// --- Subjects Endpoints ---

export const SUBJECTS_ENDPOINT = "/api/v1/subjects";
export const SUBJECT_ENDPOINT = (subjectId: string) =>
  `/api/v1/subjects/${subjectId}`;

// --- Measurements Endpoints ---

export const MEASUREMENTS_ENDPOINT = "/api/v1/measurements";
export const SUBJECT_EVOLUTION_ENDPOINT = (subjectId: string) =>
  `/api/v1/subjects/${subjectId}/measurements/evolution`;

// --- Users Endpoints ---

export const ME_ENDPOINT = "/api/v1/users/me";
