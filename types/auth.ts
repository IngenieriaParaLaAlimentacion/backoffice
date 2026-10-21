export type LoginRequest = {
  email: string;
  password: string;
  device_id: string;
};

export type AuthTokensResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    last_name: string;
    rol: string;
  };
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

export type ResetPasswordRequest = {
  new_password: string;
  token: string;
};

export type AcceptInviteRequest = {
  token: string;
  new_password: string;
  name: string;
  last_name: string;
  locality?: string | null;
  contact_phone?: string | null;
  description?: string | null;
};

export type VerifyEmailRequest = {
  token: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type LogoutRequest = {
  refresh_token: string;
  device_id: string;
};
