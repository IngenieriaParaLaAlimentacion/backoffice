import type { MapPin } from "@/lib/establishmentPins";

/**
 * All the rest of the app knows about the map: pins in, the picked pin's id
 * out. Nothing here mentions a map library — see
 * `docs/adr/0003-establishments-map-libraries.md`.
 */
export type EstablishmentsMapProps = {
  pins: MapPin[];
  onPinClick: (id: string) => void;
};
