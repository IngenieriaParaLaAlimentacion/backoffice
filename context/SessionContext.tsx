"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getMeAction } from "@/services/user.service";
import { can as canWithRole, Permission } from "@/lib/permissions";
import { ProfileResponse, UserRole } from "@/types/user";
import { SESSION } from "@/constants/permissions";

type SessionContextValues = {
  profile: ProfileResponse | null;
  role: UserRole | null;
  /** True until `GET /users/me` settles — gate role-dependent UI on it. */
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  /** `lib/permissions.can` bound to the logged-in user's role. */
  can: (permission: Permission) => boolean;
};

const SessionContext = createContext<SessionContextValues | undefined>(
  undefined,
);

/**
 * Resolves the logged-in user's profile once per session and derives its
 * permissions from it. Mounted inside the dashboard auth gate, so every
 * consumer shares a single `GET /users/me` instead of firing its own.
 *
 * Deliberately separate from `AuthContext`, which owns tokens and knows
 * nothing about who the user is.
 */
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, makeAuthorizedRequest } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `makeAuthorizedRequest` is a new reference after every silent token
  // refresh; keying the effect on it would refetch the profile each time, so
  // the effect reads the current dispatcher from a ref instead.
  const dispatcherRef = useRef(makeAuthorizedRequest);
  useEffect(() => {
    dispatcherRef.current = makeAuthorizedRequest;
  }, [makeAuthorizedRequest]);

  const [reloadToken, setReloadToken] = useState(0);
  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getMeAction(dispatcherRef.current)
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProfile(null);
        setError(err instanceof Error ? err.message : SESSION.loadError);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reloadToken]);

  const role = profile?.role ?? null;

  const value = useMemo<SessionContextValues>(
    () => ({
      profile,
      role,
      isLoading,
      error,
      refetch,
      can: (permission: Permission) => canWithRole(role, permission),
    }),
    [profile, role, isLoading, error, refetch],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
