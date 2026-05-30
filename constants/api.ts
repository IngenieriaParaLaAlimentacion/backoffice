export const API_BASE_URL = "";

// --- Auth Endpoints ---

export const ADMIN_LOGIN_ENDPOINT = "/api/v1/auth/login";
export const REFRESH_ENDPOINT = "/api/v1/auth/refresh";
export const RESET_PASSWORD_ENDPOINT = "/api/v1/auth/password-recovery/confirm";
export const FORGOT_PASSWORD_ENDPOINT = "/api/v1/auth/password-recovery/request";
export const LOGOUT_ENDPOINT = "/api/v1/auth/logout";

// --- Admin Endpoints ---

export const LIST_USERS_ENDPOINT = "/api/v1/admin/users";
export const APPROVE_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/managers/${userId}/establishments/approve`;
export const REJECT_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/managers/${userId}/establishments/reject`;
