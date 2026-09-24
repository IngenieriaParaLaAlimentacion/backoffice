import { EstablishmentMapItem } from "@/types/establishment";

/**
 * What a pin says about its establishment. The four severities of the
 * dashboard plus `no_data`, which is *not* a kind of `normal`: it means nothing
 * has been measured yet, and drawing it as healthy would read a missing survey
 * as a good result.
 */
export type PinStatus = "critical" | "high" | "medium" | "normal" | "no_data";

/** Worst first, then the two "not at risk" states: the legend's order. */
export const PIN_STATUSES: readonly PinStatus[] = [
  "critical",
  "high",
  "medium",
  "normal",
  "no_data",
];

/** The library-agnostic shape the map component receives. */
export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: PinStatus;
};

/**
 * `severity` is `null` both for a healthy establishment and for one without
 * measurements, so `has_data` has to be checked first.
 */
export function toPinStatus(
  item: Pick<EstablishmentMapItem, "has_data" | "severity">,
): PinStatus {
  if (!item.has_data) return "no_data";
  return item.severity ?? "normal";
}

/**
 * Establishments created before geocoding existed were backfilled with
 * (0, 0) — the Gulf of Guinea. That is "no location loaded", not a place; a
 * real one is never exactly on the equator and the prime meridian at once.
 */
export function hasLocation(
  item: Pick<EstablishmentMapItem, "latitude" | "longitude">,
): boolean {
  return !(item.latitude === 0 && item.longitude === 0);
}

/**
 * Splits the payload into what can be drawn and what can't. The second count
 * is returned, not dropped, so the screen can say how many establishments are
 * missing from the map instead of omitting them silently.
 */
export function buildMapPins(items: EstablishmentMapItem[]): {
  pins: MapPin[];
  withoutLocation: number;
} {
  const located = items.filter(hasLocation);
  return {
    pins: located.map((item) => ({
      id: item.id,
      name: item.name,
      lat: item.latitude,
      lng: item.longitude,
      status: toPinStatus(item),
    })),
    withoutLocation: items.length - located.length,
  };
}

export function countPinsByStatus(pins: MapPin[]): Record<PinStatus, number> {
  const counts: Record<PinStatus, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    normal: 0,
    no_data: 0,
  };
  for (const pin of pins) counts[pin.status] += 1;
  return counts;
}
