export const API_BASE_URL = "";

// --- Auth Endpoints ---

export const ADMIN_LOGIN_ENDPOINT = "/api/v1/auth/login";
export const ACCEPT_INVITE_ENDPOINT = "/api/v1/auth/password-recovery/confirm";
export const REFRESH_ENDPOINT = "/api/v1/auth/refresh";
export const RESET_PASSWORD_ENDPOINT = "/api/v1/auth/password-recovery/confirm";
export const FORGOT_PASSWORD_ENDPOINT =
  "/api/v1/auth/password-recovery/request";
export const LOGOUT_ENDPOINT = "/api/v1/auth/logout";
export const VERIFY_EMAIL_ENDPOINT = "/api/v1/auth/verify-email/confirm";
export const REGISTER_FIELD_WORKER_ENDPOINT =
  "/api/v1/auth/register/field-worker";

// --- Admin Endpoints ---

export const LIST_USERS_ENDPOINT = "/api/v1/admin/users";
export const APPROVE_FIELD_WORKER_ENDPOINT = (userId: string) =>
  `/api/v1/admin/field-worker/${userId}/approve`;
export const APPROVE_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/field-worker/${userId}/establishments/approve`;
export const REJECT_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/field-worker/${userId}/establishments/reject`;
export const REVOKE_ESTABLISHMENTS_ENDPOINT = (userId: string) =>
  `/api/v1/admin/field-worker/${userId}/establishments/revoke`;
export const PENDING_ESTABLISHMENT_ACCESS_ENDPOINT =
  "/api/v1/admin/field-worker/establishments/pending";
export const REJECT_FIELD_WORKER_ENDPOINT = (userId: string) =>
  `/api/v1/admin/field-worker/${userId}/reject`;
export const ADMIN_SUBJECT_DETAIL_ENDPOINT = (subjectId: string) =>
  `/api/v1/admin/subjects/${subjectId}`;
export const INVITE_ADMIN_ENDPOINT = "/api/v1/admin/invite-admin";
export const INVITE_ANALYST_ENDPOINT = "/api/v1/admin/invite-analyst";
export const RESEND_INVITE_ENDPOINT = (userId: string) =>
  `/api/v1/admin/users/${userId}/resend-invite`;
export const GET_USER_ENDPOINT = (userId: string) =>
  `/api/v1/admin/users/${userId}`;
export const CHANGE_USER_ROLE_ENDPOINT = (userId: string) =>
  `/api/v1/admin/users/${userId}/role`;
export const LIST_ESTABLISHMENT_REQUESTS_ENDPOINT =
  "/api/v1/admin/establishment-requests";
export const APPROVE_ESTABLISHMENT_REQUEST_ENDPOINT = (requestId: string) =>
  `/api/v1/admin/establishment-requests/${requestId}/approve`;
export const REJECT_ESTABLISHMENT_REQUEST_ENDPOINT = (requestId: string) =>
  `/api/v1/admin/establishment-requests/${requestId}/reject`;

// --- Establishments Endpoints ---

export const ESTABLISHMENTS_ENDPOINT = "/api/v1/establishments";
export const ESTABLISHMENTS_EXPORT_ENDPOINT = "/api/v1/establishments/export";
export const ESTABLISHMENTS_MAP_ENDPOINT = "/api/v1/establishments/map";
export const ESTABLISHMENT_DASHBOARD_ENDPOINT = (establishmentId: string) =>
  `/api/v1/establishments/${establishmentId}/dashboard`;
export const ESTABLISHMENT_SUBJECTS_ENDPOINT = (establishmentId: string) =>
  `/api/v1/establishments/${establishmentId}/subjects`;
export const ESTABLISHMENT_SUBJECTS_EXPORT_ENDPOINT = (
  establishmentId: string,
) => `/api/v1/establishments/${establishmentId}/subjects/export`;
export const ESTABLISHMENT_FIELD_WORKERS_ENDPOINT = (establishmentId: string) =>
  `/api/v1/establishments/${establishmentId}/field-workers`;
export const ESTABLISHMENT_STOCK_ENDPOINT = (establishmentId: string) =>
  `/api/v1/establishments/${establishmentId}/stock`;
export const ESTABLISHMENT_STOCK_EXPORT_ENDPOINT = (establishmentId: string) =>
  `/api/v1/establishments/${establishmentId}/stock/export`;
export const ESTABLISHMENT_FOOD_MOVEMENTS_ENDPOINT = (
  establishmentId: string,
) => `/api/v1/establishments/${establishmentId}/food-movements`;
export const ESTABLISHMENT_FOOD_MOVEMENT_DETAIL_ENDPOINT = (
  establishmentId: string,
  movementId: string,
) => `/api/v1/establishments/${establishmentId}/food-movements/${movementId}`;
export const ESTABLISHMENT_CHARACTERIZATION_ENDPOINT = (
  establishmentId: string,
) => `/api/v1/establishments/${establishmentId}/characterization`;
export const CREATE_ESTABLISHMENT_REQUEST_ENDPOINT =
  "/api/v1/establishments/requests";

// --- Food Catalog Endpoints ---

export const FOOD_CATEGORIES_ENDPOINT = "/api/v1/food-catalog/categories";
export const FOODS_ENDPOINT = "/api/v1/food-catalog/foods";
export const FOOD_INTAKES_ENDPOINT = "/api/v1/food-intakes";
export const FOOD_OUTFLOWS_ENDPOINT = "/api/v1/food-outflows";

// --- Subjects Endpoints ---

export const SUBJECTS_ENDPOINT = "/api/v1/subjects";
export const SUBJECTS_EXPORT_ENDPOINT = "/api/v1/subjects/export";
export const SUBJECT_ENDPOINT = (subjectId: string) =>
  `/api/v1/subjects/${subjectId}`;

// --- Measurements Endpoints ---

export const MEASUREMENTS_ENDPOINT = "/api/v1/measurements";
export const MEASUREMENTS_EXPORT_ENDPOINT = "/api/v1/measurements/export";
export const SUBJECT_EVOLUTION_ENDPOINT = (subjectId: string) =>
  `/api/v1/subjects/${subjectId}/measurements/evolution`;

// --- Surveys Endpoints ---

export const SURVEYS_ENDPOINT = "/api/v1/surveys";
export const SURVEYS_EXPORT_ENDPOINT = "/api/v1/surveys/export";
export const SURVEY_ENDPOINT = (surveyId: string) =>
  `/api/v1/surveys/${surveyId}`;
export const FIES_TEMPLATE_ENDPOINT = "/api/v1/surveys/templates/fies";
export const DUPLICATE_SURVEY_ENDPOINT = (surveyId: string) =>
  `/api/v1/surveys/${surveyId}/duplicate`;
export const SURVEY_STATUS_ENDPOINT = (surveyId: string) =>
  `/api/v1/surveys/${surveyId}/status`;

// --- Survey Responses Endpoints ---

export const SURVEY_RESPONSES_ENDPOINT = (surveyId: string) =>
  `/api/v1/surveys/${surveyId}/responses`;
export const SURVEY_RESPONSE_DETAIL_ENDPOINT = (
  surveyId: string,
  responseId: string,
) => `/api/v1/surveys/${surveyId}/responses/${responseId}`;
export const SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT = (
  surveyId: string,
  responseId: string,
) => `/api/v1/surveys/${surveyId}/responses/${responseId}/detail`;
export const SURVEY_RESPONSES_EXPORT_ENDPOINT = (surveyId: string) =>
  `/api/v1/surveys/${surveyId}/responses/export`;

// --- Dashboard Endpoints ---

export const DASHBOARD_INDICATORS_ENDPOINT =
  "/api/v1/analytics/survey-response-summary";

// --- Users Endpoints ---

export const ME_ENDPOINT = "/api/v1/users/me";
