/**
 * Configuration of the establishments map. The choices behind it (Leaflet, IGN
 * tiles) are in `docs/adr/0003-establishments-map-libraries.md`.
 */

type TileLayerConfig = {
  /** A Leaflet URL template; `{-y}` is the TMS row order IGN publishes in. */
  url: string;
  attribution: string;
  maxZoom: number;
};

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const MAP_TILE_LAYERS = {
  /** Argentina's official base map, grey variant. No key; CORS is open. */
  ign: {
    url: "https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/mapabase_gris@EPSG%3A3857@png/{z}/{x}/{-y}.png",
    attribution:
      '&copy; <a href="https://www.ign.gob.ar">Instituto Geográfico Nacional de la República Argentina</a>',
    maxZoom: 18,
  },
  /** Fallback if IGN is unavailable: best-effort, no SLA, and a busier map. */
  osm: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: OSM_ATTRIBUTION,
    maxZoom: 19,
  },
} as const satisfies Record<string, TileLayerConfig>;

/** Switching provider is changing this one line. */
export const MAP_TILE_LAYER: TileLayerConfig = MAP_TILE_LAYERS.ign;

/** Where the map opens when there is nothing to fit to: the whole country. */
export const MAP_DEFAULT_CENTER: [number, number] = [-38.4, -63.6];
export const MAP_DEFAULT_ZOOM = 4;
export const MAP_MIN_ZOOM = 4;

/**
 * Panning stops here: Argentina with a margin, so the map can't wander off to
 * the rest of the world.
 */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-58, -76],
  [-19, -50],
];

/** Margin, in px, kept around the pins when the map fits itself to them. */
export const MAP_FIT_PADDING = 40;

/** Zoom ceiling of the automatic fit, so a lone pin isn't shown from the street. */
export const MAP_FIT_MAX_ZOOM = 12;

/**
 * Cluster discs grow with the count they hold. `sizeClass` is a literal so
 * Tailwind sees it; `px` must match it, since Leaflet needs the icon's size.
 */
export const MAP_CLUSTER_SIZES = [
  { upTo: 9, sizeClass: "size-8", px: 32, textClass: "text-xs" },
  { upTo: 99, sizeClass: "size-10", px: 40, textClass: "text-sm" },
  { upTo: Infinity, sizeClass: "size-12", px: 48, textClass: "text-sm" },
] as const;

/** Pins closer than this many px fold into a cluster. */
export const MAP_CLUSTER_RADIUS = 50;

/** Leaflet needs a pin's size in px; must match `size-7` in `PIN_CLASS`. */
export const MAP_PIN_ICON_SIZE = 28;
