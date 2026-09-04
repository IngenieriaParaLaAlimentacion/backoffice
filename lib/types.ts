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

/**
 * `detail` is always a string; it used to be an array of objects on 422s,
 * which rendered here as "[object Object]". Only `type` is contractual —
 * `title` and `detail` are English prose the backend may reword at any time.
 */
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
