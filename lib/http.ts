import { StatusCodes } from "http-status-codes";
import {
  ApiHeaders,
  ApiMethod,
  ApiResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "@/lib/types";
import { API_BASE_URL, REFRESH_ENDPOINT } from "@/constants/api";
import { AuthTokens } from "@/types/auth";
import { ApiError } from "@/lib/apiError";
import { parseContentDispositionFilename } from "@/lib/download";

export type ApiRequestOptions<TRequest = object> = {
  method?: ApiMethod;
  headers?: ApiHeaders;
  body?: TRequest;
  auth?: {
    tokens: AuthTokens;
    onRefresh?: (tokens: RefreshTokenResponse) => void;
    deviceId?: string;
  };
};

async function parseResponse<TResponse>(response: Response) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = {
      type: "about:blank",
      title: "Unknown error",
      status: response.status,
      detail: response.statusText,
      instance: response.url,
    };
  }
  return {
    ...response,
    ok: response.ok,
    status: response.status,
    headers: response.headers,
    statusText: response.statusText,
    data,
  } as ApiResponse<TResponse>;
}

async function makeRequest<TRequest>(
  path: string,
  options?: ApiRequestOptions<TRequest>,
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;
  return fetch(url, {
    method: options?.method,
    headers: {
      ...options?.headers,
      ...(options?.body && { "Content-Type": "application/json" }),
      ...(options?.auth && {
        Authorization: `Bearer ${options.auth.tokens.accessToken}`,
      }),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}

export async function refreshAccessToken(
  refreshToken: string,
  deviceId: string,
) {
  const payload: RefreshTokenRequest = {
    refresh_token: refreshToken,
    device_id: deviceId,
  };

  const url = `${API_BASE_URL}${REFRESH_ENDPOINT}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return;

  return (await response.json()) as RefreshTokenResponse;
}

/**
 * Sends the request and, on a 401 with credentials at hand, refreshes the
 * tokens and replays it once. Shared by the JSON and the file-download paths.
 */
async function requestWithRefresh<TRequest>(
  path: string,
  options?: ApiRequestOptions<TRequest>,
) {
  const response = await makeRequest(path, options);

  if (response.status !== StatusCodes.UNAUTHORIZED || !options?.auth)
    return response;

  const {
    tokens: { refreshToken },
    onRefresh,
    deviceId,
  } = options.auth;

  const tokens = await refreshAccessToken(refreshToken, deviceId!);

  if (!tokens) return response;

  onRefresh?.(tokens);

  return makeRequest<TRequest>(path, {
    ...options,
    auth: {
      ...options.auth,
      tokens: {
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        accessToken: tokens.access_token,
      },
    },
  });
}

export async function apiRequest<TRequest = object, TResponse = undefined>(
  path: string,
  options?: ApiRequestOptions<TRequest>,
): Promise<ApiResponse<TResponse>> {
  return parseResponse(await requestWithRefresh(path, options));
}

/** A file straight from the server, named by it whenever it says so. */
export type DownloadedFile = {
  blob: Blob;
  filename: string | null;
  /**
   * Data rows the server says it sent, off `X-Export-Row-Count`. Null when it
   * declares none, as the xlsx export does — nothing to check against.
   */
  rowCount: number | null;
};

/** The declared row count, or null when the header is missing or malformed. */
function parseRowCount(header: string | null) {
  if (!header) return null;
  const value = Number(header);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

/**
 * Downloads a file (CSV, xlsx) instead of parsing JSON. `apiRequest` can't do
 * this: it always consumes the body as JSON. Failures still carry a
 * `application/problem+json` body, so they surface as `ApiError`.
 */
export async function downloadRequest<TRequest = undefined>(
  path: string,
  options?: ApiRequestOptions<TRequest>,
): Promise<DownloadedFile> {
  const response = await requestWithRefresh(path, options);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      body?.detail || response.statusText,
      response.status,
      body?.type,
    );
  }

  // Read the headers before the body: a cut stream rejects `blob()`.
  const filename = parseContentDispositionFilename(
    response.headers.get("content-disposition"),
  );
  const rowCount = parseRowCount(response.headers.get("x-export-row-count"));

  return { blob: await response.blob(), filename, rowCount };
}
