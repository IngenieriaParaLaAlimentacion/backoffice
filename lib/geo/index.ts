import { GeorefProvider } from "./georef-provider";
import { GeoLocationProvider } from "./types";

// Swap this line to switch providers — everything else (the form, the
// AddressAutocomplete component) depends only on GeoLocationProvider.
// GooglePlacesProvider (./google-places-provider) implements the same
// interface and is ready to drop in once a paid API key is available.
export const geoLocationProvider: GeoLocationProvider = new GeorefProvider();

export type { GeoLocationProvider, PlaceDetails } from "./types";
