import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { GeoLocationProvider, GeoLocationProviderCallbacks } from "./types";

const INCLUDED_REGION_CODES = ["ar"];

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;
let optionsInitialized = false;

function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  if (!placesLibraryPromise) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return Promise.reject(
        new Error("Falta configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
      );
    }
    if (!optionsInitialized) {
      setOptions({ key: apiKey, v: "weekly" });
      optionsInitialized = true;
    }
    placesLibraryPromise = importLibrary("places").catch((error: unknown) => {
      placesLibraryPromise = null;
      throw error;
    });
  }
  return placesLibraryPromise;
}

export class GooglePlacesProvider implements GeoLocationProvider {
  mount(
    container: HTMLElement,
    { onSelect, onError }: GeoLocationProviderCallbacks,
  ): () => void {
    let cancelled = false;
    let element: google.maps.places.PlaceAutocompleteElement | null = null;

    const handleSelect = async (event: Event) => {
      const { placePrediction } = event as unknown as {
        placePrediction: google.maps.places.PlacePrediction;
      };
      try {
        const place = placePrediction.toPlace();
        await place.fetchFields({
          fields: ["id", "formattedAddress", "location"],
        });
        if (!place.location) {
          onError(new Error("No se pudo obtener la ubicación seleccionada"));
          return;
        }
        onSelect({
          id: place.id,
          formattedAddress: place.formattedAddress ?? "",
          lat: place.location.lat(),
          lng: place.location.lng(),
        });
      } catch {
        onError(new Error("No se pudo obtener la ubicación seleccionada"));
      }
    };

    loadPlacesLibrary()
      .then((places) => {
        if (cancelled) return;
        element = new places.PlaceAutocompleteElement({
          includedRegionCodes: INCLUDED_REGION_CODES,
        });
        container.appendChild(element);
        element.addEventListener("gmp-select", handleSelect);
      })
      .catch(() => {
        if (!cancelled) onError(new Error("No se pudo cargar Google Maps"));
      });

    return () => {
      cancelled = true;
      element?.removeEventListener("gmp-select", handleSelect);
      element?.remove();
    };
  }
}
