import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import { getEstablishmentsMapAction } from "@/services/establishment.service";
import { EstablishmentMapItem } from "@/types/establishment";
import { ApiError } from "@/lib/apiError";
import { buildMapPins } from "@/lib/establishmentPins";
import { ESTABLISHMENTS_MAP_PAGE } from "@/constants/establishments";
import { getErrorMessage } from "@/lib/errorMessages";

/**
 * Loads the map's pins, but only while `enabled`: the map is one view of the
 * Establecimientos screen, and someone reading the list shouldn't pay for a
 * call they never look at. Turning it on again re-fetches, so the pins are as
 * fresh as the last time the view was opened.
 *
 * `withoutLocation` counts the establishments that can't be drawn (no location
 * loaded yet) so the screen can say so rather than leave them out silently.
 */
export function useEstablishmentsMap(enabled: boolean) {
  const { makeAuthorizedRequest } = useAuth();
  const [items, setItems] = useState<EstablishmentMapItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  // A response that lands after the view was switched off (or a newer load
  // began) must not overwrite what is on screen.
  const latestRequest = useRef(0);

  const fetchMap = useCallback(async () => {
    const request = ++latestRequest.current;
    setIsLoading(true);
    setError(null);
    setStatus(null);
    try {
      const data = await getEstablishmentsMapAction(makeAuthorizedRequest);
      if (request !== latestRequest.current) return;
      setItems(data.establishments);
    } catch (err) {
      if (request !== latestRequest.current) return;
      if (err instanceof ApiError) setStatus(err.status);
      setError(
        getErrorMessage(err, { fallback: ESTABLISHMENTS_MAP_PAGE.loadError }),
      );
    } finally {
      if (request === latestRequest.current) setIsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    if (!enabled) {
      latestRequest.current++;
      return;
    }
    fetchMap();
  }, [enabled, fetchMap]);

  const { pins, withoutLocation } = useMemo(
    () => buildMapPins(items ?? []),
    [items],
  );

  return {
    pins,
    withoutLocation,
    isLoading,
    error,
    forbidden: status === StatusCodes.FORBIDDEN,
    refetch: fetchMap,
  };
}
