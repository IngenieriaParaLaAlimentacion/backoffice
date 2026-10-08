import { useAuth } from "@/context/AuthContext";
import { getUserAction } from "@/services/admin.service";
import { AdminUserDetail } from "@/types/admin";
import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/errorMessages";
import { USER_DETAIL_PANEL } from "@/constants/users";

export function useUserDetail(userId: string | null) {
  const { makeAuthorizedRequest } = useAuth();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getUserAction(makeAuthorizedRequest, id);
        setUser(data);
      } catch (err) {
        setError(
          getErrorMessage(err, { fallback: USER_DETAIL_PANEL.loadError }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [makeAuthorizedRequest],
  );

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setError(null);
      return;
    }
    void fetchUser(userId);
  }, [userId, fetchUser]);

  /** Re-fetches the open user, e.g. after an action invalidates the panel. */
  const refetch = useCallback(() => {
    if (userId) void fetchUser(userId);
  }, [userId, fetchUser]);

  /** Swaps in a user the API already returned, e.g. after an update. */
  const replace = useCallback((next: AdminUserDetail) => setUser(next), []);

  return { user, isLoading, error, refetch, replace };
}
