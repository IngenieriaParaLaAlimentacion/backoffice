/**
 * Until real geocoding exists, establishments are saved with provisional
 * geo data: a unique place_id and 0,0 coordinates. Centralized so every
 * flow that fabricates this data (manual creation, request approval) stays
 * in sync instead of duplicating the same literals.
 */
export function withPlaceholderGeoData<T extends object>(data: T) {
  return { ...data, place_id: crypto.randomUUID(), latitude: 0, longitude: 0 };
}
