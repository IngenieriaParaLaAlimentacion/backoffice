import { SigninInput } from "@/schemas/signin.schema";
import {
  AuthTokensResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  ResetPasswordRequest,
} from "@/types/auth";
import { apiRequest } from "@/lib/http";
import { ErrorResponse } from "@/lib/types";
import { clearTokens, saveTokens } from "@/lib/tokenStorage";
import {
  ADMIN_LOGIN_ENDPOINT,
  FORGOT_PASSWORD_ENDPOINT,
  LOGOUT_ENDPOINT,
  RESET_PASSWORD_ENDPOINT,
} from "@/constants/api";
import { AuthDispatcher } from "@/context/AuthContext";

export const loginAction = async (
  credentials: SigninInput,
  deviceId: string,
) => {
  credentials.email = credentials.email.trim().toLowerCase();
  const payload: LoginRequest = {
    ...credentials,
    device_id: deviceId,
  };
  const response = await apiRequest<LoginRequest, AuthTokensResponse>(
    ADMIN_LOGIN_ENDPOINT,
    {
      method: "POST",
      body: payload,
    },
  );

  if (!response.ok) throw new Error((response.data as ErrorResponse).detail);

  const data = response.data as AuthTokensResponse;

  saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
  });

  return data;
};

export const forgotPasswordAction = async (email: string) => {
  const body: ForgotPasswordRequest = { email };

  const res = await apiRequest(FORGOT_PASSWORD_ENDPOINT, {
    method: "POST",
    body,
  });

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);
};

export const resetPasswordAction = async (
  newPassword: string,
  token: string,
) => {
  const payload: ResetPasswordRequest = {
    new_password: newPassword,
    token: token,
  };

  const res = await apiRequest(RESET_PASSWORD_ENDPOINT, {
    method: "POST",
    body: payload,
  });

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  clearTokens();
};

export const logoutAction = async (
  refreshToken: string,
  deviceId: string,
  dispatcher: AuthDispatcher,
) => {
  const body: LogoutRequest = {
    refresh_token: refreshToken,
    device_id: deviceId,
  };

  const res = await dispatcher<LogoutRequest, null>(LOGOUT_ENDPOINT, {
    method: "POST",
    body,
  });

  clearTokens();

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);
};
