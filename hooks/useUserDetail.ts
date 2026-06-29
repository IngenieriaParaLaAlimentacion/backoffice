import { useAuth } from "@/context/AuthContext";
import { getUserAction } from "@/services/admin.service";
import { AdminUserDetail } from "@/types/admin";
import { useEffect, useState } from "react";

export function useUserDetail(userId: string | null) {
  const { makeAuthorizedRequest } = useAuth();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setError(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    getUserAction(makeAuthorizedRequest, userId)
      .then((data) => {
        if (active) setUser(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Error al cargar el perfil",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, makeAuthorizedRequest]);

  return { user, isLoading, error };
}
