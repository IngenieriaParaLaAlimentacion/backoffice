export type PlaceDetails = {
  id: string;
  formattedAddress: string;
  lat: number;
  lng: number;
};

export type GeoLocationProviderCallbacks = {
  onSelect: (place: PlaceDetails) => void;
  /** Fired on every keystroke in the underlying search input, so the
   * consumer can invalidate a previously selected place. Not fired when the
   * input's value is set programmatically (e.g. right after `onSelect`). */
  onInputChange: () => void;
  onError: (error: Error) => void;
};

export interface GeoLocationProvider {
  /**
   * Mounts the provider's native address-search UI inside `container`.
   * Calls `onSelect` once a suggestion is picked and resolved, or `onError`
   * if the provider fails to load or resolve a selection. Returns a cleanup
   * function that unmounts the widget.
   */
  mount(
    container: HTMLElement,
    callbacks: GeoLocationProviderCallbacks,
  ): () => void;
}
