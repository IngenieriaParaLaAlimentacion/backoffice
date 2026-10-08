import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import { RefreshTokenResponse } from "@/lib/types";
import {
  ADMIN_LOGIN_ENDPOINT,
  FORGOT_PASSWORD_ENDPOINT,
  LOGOUT_ENDPOINT,
  REFRESH_ENDPOINT,
  RESET_PASSWORD_ENDPOINT,
  VERIFY_EMAIL_ENDPOINT,
} from "@/constants/api";
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
