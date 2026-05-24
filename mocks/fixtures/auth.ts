import { AuthTokensResponse } from "@/types/auth";
import { RefreshTokenResponse } from "@/lib/types";

export const DEFAULT_AUTH_RESPONSE: AuthTokensResponse = {
  access_token: "access_token",
  refresh_token: "refresh_token",
  token_type: "bearer",
  user: {
    id: "user-1",
    email: "admin@example.com",
    name: "Admin",
    last_name: "User",
    rol: "admin",
  },
};

export const DEFAULT_REFRESH_RESPONSE: RefreshTokenResponse = {
  access_token: "new-access-token",
  refresh_token: "new-refresh-token",
  token_type: "bearer",
};
