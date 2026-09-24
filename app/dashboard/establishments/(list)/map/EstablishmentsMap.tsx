"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { ESTABLISHMENTS_MAP_PAGE } from "@/constants/establishments";
import MapLegend from "./MapLegend";
import type { EstablishmentsMapProps } from "./types";

// Leaflet reads `window` when imported, so it can't be evaluated during
// prerender: it is fetched only in the browser, after the page has mounted.
const LeafletEstablishmentsMap = dynamic(
  () => import("./leaflet/LeafletEstablishmentsMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    ),
  },
);

/**
 * Starts fetching Leaflet's code without rendering anything. The map view calls
 * it as soon as it opens, so the code downloads while the pins are still being
 * requested instead of only after they arrive.
 */
export function preloadEstablishmentsMap() {
  void import("./leaflet/LeafletEstablishmentsMap");
}

/**
 * The establishments map. Fills its parent, which has to give it a height.
 * `isolate` keeps Leaflet's own z-indexes (up to 1000) inside this box instead
 * of letting them climb over the app's dialogs and menus.
 */
export default function EstablishmentsMap({
  pins,
  onPinClick,
}: EstablishmentsMapProps) {
  return (
    <div
      role="region"
      aria-label={ESTABLISHMENTS_MAP_PAGE.mapAria}
      className="relative isolate h-full min-h-96 overflow-hidden rounded-lg border border-border"
    >
      <LeafletEstablishmentsMap pins={pins} onPinClick={onPinClick} />
      <MapLegend pins={pins} />
    </div>
  );
}
