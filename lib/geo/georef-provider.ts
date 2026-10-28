import { GEOREF_SEARCH_PLACEHOLDER } from "../../constants/georef";
import {
  GeoLocationProvider,
  GeoLocationProviderCallbacks,
  PlaceDetails,
} from "./types";

const SEARCH_ENDPOINT = "https://apis.datos.gob.ar/georef/api/direcciones";
const MIN_QUERY_LENGTH = 5;
const DEBOUNCE_MS = 300;
// Georef can list the same street under more than one cartographic segment
// id, which renders as visually identical duplicate rows. Ask for more raw
// results than we display so there's still a full page left after
// collapsing those by their displayed text (see dedupeByAddress below).
const RAW_RESULTS = 10;
const DISPLAY_RESULTS = 5;
const BLUR_CLOSE_DELAY_MS = 100;

type GeorefAddress = {
  nomenclatura: string;
  calle: { id: string | null };
  altura: { valor: number | null };
  departamento: { id: string };
  provincia: { id: string; nombre: string };
  localidad_censal: { nombre: string | null } | null;
  ubicacion: { lat: number; lon: number };
};

type GeorefResponse = {
  direcciones: GeorefAddress[];
};

function toPlaceDetails(address: GeorefAddress): PlaceDetails {
  const id = [
    address.provincia.id,
    address.departamento.id,
    address.calle.id ?? "s-calle",
    address.altura.valor ?? "s-altura",
  ].join(":");
  return {
    id,
    formattedAddress: address.nomenclatura,
    lat: address.ubicacion.lat,
    lng: address.ubicacion.lon,
    city: address.localidad_censal?.nombre ?? undefined,
    province: address.provincia.nombre,
  };
}

// Georef can return the same street under different calle.id segments
// (a street split into cartographic blocks), which produces entries with
// distinct ids but identical displayed text. Collapse those so the dropdown
// never shows the same address twice; keep the first of each group since
// Georef already orders results by relevance.
function dedupeByAddress(places: PlaceDetails[]): PlaceDetails[] {
  const seen = new Set<string>();
  const unique: PlaceDetails[] = [];
  for (const place of places) {
    const key = place.formattedAddress.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(place);
  }
  return unique;
}

const INPUT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";
const LIST_CLASS =
  "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-input bg-popover text-sm text-popover-foreground shadow-md";
const ITEM_CLASS = "cursor-pointer px-3 py-2 hover:bg-accent";
const ITEM_ACTIVE_CLASS = "cursor-pointer bg-accent px-3 py-2";
const EMPTY_ITEM_CLASS = "px-3 py-2 text-muted-foreground";

export class GeorefProvider implements GeoLocationProvider {
  mount(
    container: HTMLElement,
    { onSelect, onInputChange, onError }: GeoLocationProviderCallbacks,
  ): () => void {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = GEOREF_SEARCH_PLACEHOLDER;
    input.autocomplete = "off";
    input.className = INPUT_CLASS;

    const list = document.createElement("ul");
    list.className = LIST_CLASS;
    list.style.display = "none";

    wrapper.appendChild(input);
    wrapper.appendChild(list);
    container.appendChild(wrapper);

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let activeController: AbortController | null = null;
    let results: PlaceDetails[] = [];
    let cancelled = false;

    const closeList = () => {
      list.style.display = "none";
      list.innerHTML = "";
      results = [];
    };

    const renderResults = () => {
      list.innerHTML = "";
      if (results.length === 0) {
        const empty = document.createElement("li");
        empty.className = EMPTY_ITEM_CLASS;
        empty.textContent = "No se encontraron direcciones";
        list.appendChild(empty);
      } else {
        for (const place of results) {
          const item = document.createElement("li");
          item.className = ITEM_CLASS;
          item.textContent = place.formattedAddress;
          item.addEventListener("mouseenter", () => {
            item.className = ITEM_ACTIVE_CLASS;
          });
          item.addEventListener("mouseleave", () => {
            item.className = ITEM_CLASS;
          });
          item.addEventListener("mousedown", (event) => {
            event.preventDefault();
            selectPlace(place);
          });
          list.appendChild(item);
        }
      }
      list.style.display = "block";
    };

    const selectPlace = (place: PlaceDetails) => {
      input.value = place.formattedAddress;
      closeList();
      onSelect(place);
    };

    const search = async (query: string) => {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      try {
        const url = `${SEARCH_ENDPOINT}?direccion=${encodeURIComponent(query)}&max=${RAW_RESULTS}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Georef respondió ${res.status}`);
        const data = (await res.json()) as GeorefResponse;
        if (cancelled || controller.signal.aborted) return;
        results = dedupeByAddress(data.direcciones.map(toPlaceDetails)).slice(
          0,
          DISPLAY_RESULTS,
        );
        renderResults();
      } catch {
        if (controller.signal.aborted) return;
        onError(new Error("No se pudo buscar la dirección"));
        closeList();
      }
    };

    const handleInput = () => {
      onInputChange();
      const query = input.value.trim();
      window.clearTimeout(debounceTimer);
      if (query.length < MIN_QUERY_LENGTH) {
        closeList();
        return;
      }
      debounceTimer = setTimeout(() => search(query), DEBOUNCE_MS);
    };

    const handleBlur = () => {
      window.setTimeout(closeList, BLUR_CLOSE_DELAY_MS);
    };

    input.addEventListener("input", handleInput);
    input.addEventListener("blur", handleBlur);

    return () => {
      cancelled = true;
      activeController?.abort();
      window.clearTimeout(debounceTimer);
      input.removeEventListener("input", handleInput);
      input.removeEventListener("blur", handleBlur);
      wrapper.remove();
    };
  }
}
