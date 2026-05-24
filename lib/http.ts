import {
  ApiHeaders,
  ApiMethod,
  ApiResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "@/lib/types";
import { API_BASE_URL, REFRESH_ENDPOINT } from "@/constants/api";
import { AuthTokens } from "@/types/auth";

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

export async function apiRequest<TRequest = object, TResponse = undefined>(
  path: string,
  options?: ApiRequestOptions<TRequest>,
): Promise<ApiResponse<TResponse>> {
  let response = await makeRequest(path, options);

  if (response.status === 401 && options?.auth) {
    const {
      tokens: { refreshToken },
      onRefresh,
      deviceId,
    } = options.auth;

    const tokens = await refreshAccessToken(refreshToken, deviceId!);

    if (!tokens) return parseResponse(response);

    onRefresh?.(tokens);

    response = await makeRequest<TRequest>(path, {
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

  return parseResponse(response);
}
