import { http, HttpResponse } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import { RefreshTokenResponse } from "@/lib/types";
import {
  ACCEPT_INVITE_ENDPOINT,
  ADMIN_LOGIN_ENDPOINT,
  FORGOT_PASSWORD_ENDPOINT,
  LOGOUT_ENDPOINT,
  REFRESH_ENDPOINT,
  RESET_PASSWORD_ENDPOINT,
  VERIFY_EMAIL_ENDPOINT,
} from "@/constants/api";
import { ERROR_TYPES } from "@/lib/apiError";
import { AuthTokensResponse } from "@/types/auth";
import {
  DEFAULT_AUTH_RESPONSE,
  DEFAULT_REFRESH_RESPONSE,
} from "@/mocks/fixtures/auth";

export function makeLoginHandler(options?: HandlerOptions<AuthTokensResponse>) {
  return baseHandler(ADMIN_LOGIN_ENDPOINT, {
    ...options,
    method: "post",
    data: { ...DEFAULT_AUTH_RESPONSE, ...options?.data },
  });
}

export function makeRefreshHandler(
  options?: HandlerOptions<RefreshTokenResponse>,
) {
  return baseHandler(REFRESH_ENDPOINT, {
    ...options,
    method: "post",
    data: { ...DEFAULT_REFRESH_RESPONSE, ...options?.data },
  });
}

export function makeForgotPasswordHandler(options?: HandlerOptions<undefined>) {
  return baseHandler(FORGOT_PASSWORD_ENDPOINT, {
    ...options,
    method: "post",
  });
}

export function makeResetPasswordHandler(options?: HandlerOptions<undefined>) {
  return baseHandler(RESET_PASSWORD_ENDPOINT, {
    ...options,
    method: "post",
  });
}

/** Answers 204 with no body, like the backend; pass `status` + `error` to fail. */
export function makeVerifyEmailHandler(options?: HandlerOptions<undefined>) {
  return baseHandler(VERIFY_EMAIL_ENDPOINT, {
    ...options,
    status: options?.status ?? 204,
    method: "post",
  });
}

export function makeLogoutHandler(options?: HandlerOptions<undefined>) {
  return baseHandler(LOGOUT_ENDPOINT, {
    ...options,
    method: "post",
  });
}

/**
 * Handles POST /api/v1/auth/invite/accept.
 * Answers 204 on valid token, 400 on invalid or expired token.
 */
export function makeAcceptInviteHandler(options?: HandlerOptions<undefined>) {
  return http.post(
    ACCEPT_INVITE_ENDPOINT,
    async ({ request }) => {
      await options?.onRequest?.(request);

      if (options?.status) {
        if (options.status === 204) {
          return new HttpResponse(null, { status: 204 });
        }
        return HttpResponse.json(
          {
            type: options.error?.type || ERROR_TYPES.INVALID_RECOVERY_TOKEN,
            status: options.status,
            title: options.error?.title || "Error",
            detail: options.error?.detail || "An error occurred",
            instance: ACCEPT_INVITE_ENDPOINT,
          },
          {
            status: options.status,
            headers: { "Content-Type": "application/problem+json" },
          },
        );
      }

      try {
        const body = (await request.clone().json()) as { token?: string };
        if (
          !body.token ||
          body.token === "invalid-token" ||
          body.token === "expired-token"
        ) {
          return HttpResponse.json(
            {
              type: ERROR_TYPES.INVALID_RECOVERY_TOKEN,
              status: 400,
              title: "Invalid Recovery Token",
              detail: "The recovery token is invalid or expired",
              instance: ACCEPT_INVITE_ENDPOINT,
            },
            {
              status: 400,
              headers: { "Content-Type": "application/problem+json" },
            },
          );
        }
      } catch {
        // Fall through to 204
      }

      return new HttpResponse(null, { status: 204 });
    },
    { once: options?.once },
  );
}
