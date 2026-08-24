import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMeAction } from "@/services/user.service";

const ADMIN_ROLES = new Set(["admin", "superadmin"]);

/**
 * Whether the logged-in user is an admin/superadmin, per `GET /users/me`.
 * Purely a client-side UX guard (hide admin-only actions analysts can't
 * use) — the backend is the actual authorization boundary.
 */
export function useIsAdmin() {
  const { makeAuthorizedRequest } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMeAction(makeAuthorizedRequest)
      .then((profile) => {
        if (!cancelled) setIsAdmin(ADMIN_ROLES.has(profile.role));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [makeAuthorizedRequest]);

  return isAdmin;
}
