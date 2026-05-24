// --- API Types ---

export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type ApiHeaders = Record<string, string>;

export type ApiResponse<TData> = Pick<
  Response,
  "ok" | "status" | "statusText" | "headers" | "text" | "url"
> & {
  data: null | TData | ErrorResponse;
};

// --- Error Response API ---

export type ErrorResponse = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
};

// --- Token-Refresh Types ---

export type RefreshTokenRequest = {
  refresh_token: string;
  device_id: string;
};

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};
