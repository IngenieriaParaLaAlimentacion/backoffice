"use client";

import { SigninInput } from "@/schemas/signin.schema";
import {
  loginAction,
  logoutAction,
  resetPasswordAction,
} from "@/services/auth.service";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  apiRequest,
  ApiRequestOptions,
  downloadRequest,
  DownloadedFile,
  refreshAccessToken,
} from "@/lib/http";
import { AuthTokens } from "@/types/auth";
import { ApiResponse, RefreshTokenResponse } from "@/lib/types";
import { clearTokens, getTokens, saveTokens } from "@/lib/tokenStorage";
import { getOrCreateDeviceId } from "@/lib/deviceIdStorage";

export type AuthDispatcher = <TRequest, TResponse>(
  path: string,
  options?: Omit<ApiRequestOptions<TRequest>, "auth">,
) => Promise<ApiResponse<TResponse>>;

/** Same credentials as `AuthDispatcher`, but the body comes back as a file. */
export type DownloadDispatcher = (
  path: string,
  options?: Omit<ApiRequestOptions<undefined>, "auth">,
) => Promise<DownloadedFile>;

type AuthContextValues = {
  isInitializing: boolean;
  isAuthenticated: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
  login: (data: SigninInput) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (password: string, token: string) => Promise<void>;
  makeAuthorizedRequest: AuthDispatcher;
  makeAuthorizedDownload: DownloadDispatcher;
};

export const AuthContext = createContext<AuthContextValues | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const handleRefresh = useCallback((refreshedTokens: RefreshTokenResponse) => {
    const newTokens: AuthTokens = {
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token,
      tokenType: refreshedTokens.token_type,
    };
    setTokens({ ...newTokens });
    saveTokens({ ...newTokens });
  }, []);

  useEffect(() => {
    (async () => {
      const storedTokens = getTokens();
      const storedDeviceId = getOrCreateDeviceId();

      setTokens(storedTokens);
      setDeviceId(storedDeviceId);

      if (!storedTokens) {
        setIsInitializing(false);
        return;
      }

      const response = await refreshAccessToken(
        storedTokens.refreshToken,
        storedDeviceId,
      );
      if (response) {
        handleRefresh(response);
        setIsAuthenticated(true);
      } else {
        clearTokens();
        setTokens(null);
      }
      setIsInitializing(false);
    })();
  }, [handleRefresh]);

  const makeAuthorizedRequest = useCallback(
    async <TRequest = object, TResponse = undefined>(
      path: string,
      options?: Omit<ApiRequestOptions<TRequest>, "auth">,
    ) => {
      return apiRequest<TRequest, TResponse>(path, {
        ...options,
        ...(tokens &&
          deviceId && {
            auth: { tokens, onRefresh: handleRefresh, deviceId },
          }),
      });
    },
    [deviceId, handleRefresh, tokens],
  );

  const makeAuthorizedDownload = useCallback(
    async (
      path: string,
      options?: Omit<ApiRequestOptions<undefined>, "auth">,
    ) => {
      return downloadRequest<undefined>(path, {
        ...options,
        ...(tokens &&
          deviceId && {
            auth: { tokens, onRefresh: handleRefresh, deviceId },
          }),
      });
    },
    [deviceId, handleRefresh, tokens],
  );

  const clearAuthNotice = useCallback(() => {
    setAuthNotice(null);
  }, []);

  const login = useCallback(
    async (credentials: SigninInput) => {
      if (!deviceId) return;
      setAuthNotice(null);
      const response = await loginAction(credentials, deviceId);
      const tokens = {
        refreshToken: response.refresh_token,
        accessToken: response.access_token,
        tokenType: response.token_type,
      };
      setTokens(tokens);
      setIsAuthenticated(true);
    },
    [deviceId],
  );

  const logout = useCallback(async () => {
    if (!deviceId || !tokens) return;
    setAuthNotice(null);
    try {
      await logoutAction(tokens.refreshToken, deviceId, makeAuthorizedRequest);
    } catch {}
    setTokens(null);
    setIsAuthenticated(false);
  }, [deviceId, makeAuthorizedRequest, tokens]);

  const resetPassword = useCallback(async (password: string, token: string) => {
    await resetPasswordAction(password, token);
    setTokens(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitializing,
        authNotice,
        clearAuthNotice,
        login,
        logout,
        resetPassword,
        makeAuthorizedRequest,
        makeAuthorizedDownload,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
