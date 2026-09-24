import { useCallback, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import { getEstablishmentsMapAction } from "@/services/establishment.service";
import { EstablishmentMapResponse } from "@/types/establishment";
import { ApiError } from "@/lib/apiError";
import { buildMapPins } from "@/lib/establishmentPins";
import { SWR_CONFIG } from "@/lib/swr";
import { ESTABLISHMENTS_MAP_ENDPOINT } from "@/constants/api";
import { ESTABLISHMENTS_MAP_PAGE } from "@/constants/establishments";
import { getErrorMessage } from "@/lib/errorMessages";

/**
 * Makes the next look at the map fetch again. Call it after something that
 * adds an establishment, so it doesn't wait out the cache to show up.
 */
export const invalidateEstablishmentsMap = () =>
  mutate(ESTABLISHMENTS_MAP_ENDPOINT);

/**
 * Loads the map's pins when the component using it mounts. The map is one view
 * of the Establecimientos screen and its component is only mounted while that
 * view is active, so someone reading the list never pays for this call.
 *
 * The response is cached (`lib/swr.ts`): going back to the map within the
 * cache window shows the pins at once, without a request. The cache key is the
 * endpoint alone, so a refreshed token doesn't trigger a new fetch.
 *
 * `withoutLocation` counts the establishments that can't be drawn (no location
 * loaded yet) so the screen can say so rather than leave them out silently.
 */
export function useEstablishmentsMap() {
  const { makeAuthorizedRequest } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<
    EstablishmentMapResponse,
    unknown
  >(
    ESTABLISHMENTS_MAP_ENDPOINT,
    () => getEstablishmentsMapAction(makeAuthorizedRequest),
    // The screen offers its own "Reintentar"; retrying a 403 by itself is noise.
    { ...SWR_CONFIG, shouldRetryOnError: false },
  );

  const { pins, withoutLocation } = useMemo(
    () => buildMapPins(data?.establishments ?? []),
    [data],
  );

  // Not `mutate` itself: as an `onClick` it would receive the click event as data.
  const refetch = useCallback(() => {
    void mutate();
  }, [mutate]);

  // A failed refresh keeps the pins already on screen instead of replacing them
  // with an error.
  const failure = data ? undefined : error;

  return {
    pins,
    withoutLocation,
    isLoading,
    error: failure
      ? getErrorMessage(failure, {
          fallback: ESTABLISHMENTS_MAP_PAGE.loadError,
        })
      : null,
    forbidden:
      failure instanceof ApiError && failure.status === StatusCodes.FORBIDDEN,
    refetch,
  };
}
