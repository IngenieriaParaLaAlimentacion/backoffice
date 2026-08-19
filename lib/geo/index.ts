import { GooglePlacesProvider } from "./google-places-provider";
import { GeoLocationProvider } from "./types";

export const geoLocationProvider: GeoLocationProvider =
  new GooglePlacesProvider();

export type { GeoLocationProvider, PlaceDetails } from "./types";
