import { ErrorResponse } from "@/lib/types";

/**
 * Error that preserves the RFC 7807 members the backend sends.
 *
 * `type` is the backend's contract; `title` and `detail` are explicitly not —
 * they are English prose that may be reworded at any time. Never render
 * `message` to the user: map `type` to Spanish copy via `getErrorMessage`
 * (`lib/errorMessages.ts`).
 */
export class ApiError extends Error {
  status: number;
  type?: string;
  /** Extension members, e.g. `user_id` on `admin/invite-already-pending`. */
  extensions: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    type?: string,
    extensions: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.type = type;
    this.extensions = extensions;
  }
}

const CANONICAL_MEMBERS = ["type", "title", "status", "detail", "instance"];

export function toApiError(data: unknown, status: number): ApiError {
  const body = (data ?? {}) as Partial<ErrorResponse> & Record<string, unknown>;
  // Everything outside the five canonical members is an RFC 7807 extension.
  const extensions = Object.fromEntries(
    Object.entries(body).filter(([key]) => !CANONICAL_MEMBERS.includes(key)),
  );
  return new ApiError(body.detail ?? "", status, body.type, extensions);
}

/**
 * The `type` slugs this app branches on, mirroring the backend's generated
 * catalog (`docs/errors.json` in the backend repo). That catalog is
 * additive-only, so a slug here stays valid; new ones can be added.
 */
export const ERROR_TYPES = {
  INVALID_CREDENTIALS: "/errors/invalid-credentials",
  ACCOUNT_PENDING_VALIDATION: "/errors/account-pending-validation",
  ROLE_NOT_ALLOWED: "/errors/role-not-allowed",
  MISSING_TOKEN: "/errors/auth/missing-token",
  UNAUTHORIZED: "/errors/unauthorized",
  INVALID_REFRESH_TOKEN: "/errors/auth/invalid-refresh-token",

  // The same confirm endpoint backs the recovery and the invitation flow.
  INVALID_RECOVERY_TOKEN: "/errors/auth/invalid-recovery-token",
  RECOVERY_TOKEN_USED: "/errors/auth/recovery-token-used",
  RECOVERY_TOKEN_EXPIRED: "/errors/auth/recovery-token-expired",
  INVALID_VERIFICATION_TOKEN: "/errors/auth/invalid-verification-token",
  VERIFICATION_TOKEN_USED: "/errors/auth/verification-token-used",
  VERIFICATION_TOKEN_EXPIRED: "/errors/auth/verification-token-expired",

  INVITE_ALREADY_PENDING: "/errors/admin/invite-already-pending",
  USER_ALREADY_EXISTS: "/errors/user-already-exists",
  USER_IS_NOT_PENDING: "/errors/user-is-not-pending",
  USER_IS_NOT_ACTIVE: "/errors/user-is-not-active",
  USER_NOT_FOUND: "/errors/user-not-found",
  EMAIL_DELIVERY_FAILED: "/errors/email-delivery-failed",

  SURVEY_LOCKED: "/errors/survey-locked",
  INVALID_SURVEY_STRUCTURE: "/errors/invalid-survey-structure",

  INVALID_AGE_RANGE: "/errors/invalid-age-range",
  INVALID_DATE_RANGE: "/errors/invalid-date-range",

  /** Also answered for a movement that belongs to another comedor — the
   *  backend hides that distinction on purpose, so this is never a 403. */
  FOOD_MOVEMENT_NOT_FOUND: "/errors/food-movement-not-found",
  INSUFFICIENT_STOCK: "/errors/insufficient-stock",
  /** The address (its `place_id`) already belongs to another establishment. */
  ESTABLISHMENT_ALREADY_EXISTS: "/errors/establishment-already-exists",
  CONCURRENT_UPDATE: "/errors/concurrent-update",

  VALIDATION_FAILED: "/errors/validation-failed",
  INTERNAL_ERROR: "/errors/internal-error",
} as const;
