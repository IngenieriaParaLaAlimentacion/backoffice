import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getEstablishmentDashboardAction } from "@/services/establishment.service";
import { EstablishmentDashboardResponse } from "@/types/establishment";
import { ApiError } from "@/lib/apiError";

/**
 * Gates the screen: a 404 (the establishment does not exist) and the empty
 * state (`has_data: false`, it exists but has no measurements) are different
 * situations and must render differently.
 */
export function useEstablishmentDashboard(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();
  const [dashboard, setDashboard] =
    useState<EstablishmentDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);
    try {
      const data = await getEstablishmentDashboardAction(
        makeAuthorizedRequest,
        establishmentId,
      );
      setDashboard(data);
    } catch (err) {
      if (err instanceof ApiError) setStatus(err.status);
      setError(
        err instanceof Error ? err.message : "Error al cargar el comedor",
      );
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthorizedRequest, establishmentId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    isLoading,
    error,
    notFound: status === 404,
    forbidden: status === 403,
    refetch: fetchDashboard,
  };
}
