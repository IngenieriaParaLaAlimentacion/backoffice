"use client";

import { useEffect } from "react";
import { Loader2, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEstablishmentsMap } from "@/hooks/useEstablishmentsMap";
import { ESTABLISHMENTS_MAP_PAGE } from "@/constants/establishments";
import { TONE_BANNER_CLASS } from "@/constants/theme";
import EstablishmentsMap, {
  preloadEstablishmentsMap,
} from "./EstablishmentsMap";

/**
 * The "Mapa" half of the Establecimientos screen: loads the pins and covers
 * every state around the map itself. Mounted only while the map is the active
 * view, so the list never pays for a request it doesn't show.
 */
export default function EstablishmentsMapView({
  onPinClick,
  onSeeList,
}: {
  onPinClick: (id: string) => void;
  onSeeList: () => void;
}) {
  const { pins, withoutLocation, isLoading, error, forbidden, refetch } =
    useEstablishmentsMap(true);

  // In parallel with the pins request, not after it.
  useEffect(preloadEstablishmentsMap, []);

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );

  if (forbidden)
    return (
      <div
        role="alert"
        className={`rounded-lg border px-4 py-3 text-sm ${TONE_BANNER_CLASS.danger}`}
      >
        {ESTABLISHMENTS_MAP_PAGE.forbidden}
      </div>
    );

  if (error)
    return (
      <div
        role="alert"
        className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm ${TONE_BANNER_CLASS.danger}`}
      >
        <span className="flex-1">{error}</span>
        <Button size="sm" variant="outline" onClick={refetch}>
          {ESTABLISHMENTS_MAP_PAGE.retry}
        </Button>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      {/* Missing from the map, but never silently: the count is on screen. */}
      {withoutLocation > 0 && (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm ${TONE_BANNER_CLASS.warning}`}
        >
          <MapPinOff size={18} className="shrink-0" />
          <span className="flex-1">
            {ESTABLISHMENTS_MAP_PAGE.withoutLocation(withoutLocation)}
          </span>
          <Button size="sm" variant="outline" onClick={onSeeList}>
            {ESTABLISHMENTS_MAP_PAGE.seeInList}
          </Button>
        </div>
      )}

      {pins.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          {ESTABLISHMENTS_MAP_PAGE.noEstablishments}
        </div>
      ) : (
        <div className="h-[70vh] min-h-96">
          <EstablishmentsMap pins={pins} onPinClick={onPinClick} />
        </div>
      )}
    </div>
  );
}
