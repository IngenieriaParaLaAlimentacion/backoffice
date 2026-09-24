# ADR-0003: Establishments map via Leaflet, with Argentina's IGN base map

- **Status**: Accepted
- **Date**: 2026-09-24
- **Deciders**: Backoffice team
- **Related**: [ADR-0001](./0001-geo-location-provider-adapter.md), user story "Visualización georreferenciada de indicadores nutricionales" (Dashboard epic)

## Context

The "Establecimientos" screen gets a "Lista"/"Mapa" toggle. In map mode, every
establishment is a pin coloured by its nutritional severity, with hover tooltip, click-through
to the ficha, and visual clustering of overlapping pins. The backend already serves the data
in one unpaginated call (`GET /establishments/map`), so the open questions were all
front-end:

1. **Which map library** renders the map and the pins.
2. **Which base map** (the tiles under the pins) it shows.

Constraints that shaped both:

- Scale is hundreds of establishments, not tens of thousands.
- Only Argentina matters; the map is never used elsewhere.
- Pin colours must come from the "Raíz" theme tokens (`docs/architecture.md` § Theme), and
  pins should be reachable by keyboard.
- No billing account or API key to provision — the same friction ADR-0001 refused for
  address search.
- The repo is on React 19 and tests run in jsdom.

## Decision

### Library: Leaflet + `react-leaflet` + `leaflet.markercluster`

- **Leaflet** renders pins as ordinary DOM elements (`divIcon`), so a pin is styled with the
  same Tailwind/token classes as the rest of the app, is focusable, carries an `aria-label`, and
  can be exercised in jsdom.
- **`react-leaflet` v5** provides the React bindings. v5 requires React 19 as a peer
  dependency (v4 requires React 18), which matches this repo.
- **`leaflet.markercluster`** provides clustering. It is used directly from a small component
  of our own rather than through a third-party React wrapper package, to avoid depending on
  a wrapper's release cadence for React/react-leaflet compatibility. It also spiderfies pins
  that share identical coordinates. Its default cluster colours (green/yellow/orange) are
  off-palette and would read as severity, so the cluster icon is overridden with a neutral one.

All three are imported only from `app/dashboard/establishments/(list)/map/leaflet/`,
enforced by an ESLint `no-restricted-imports` rule. The rest of the app sees a
`pins → onPinClick` component contract, so replacing the library means rewriting that one
folder — not an abstraction over map primitives, which would leak (a DOM marker and a WebGL
layer are not the same thing).

Leaflet touches `window` on import, so the map is loaded with `next/dynamic` and
`ssr: false`.

### Base map: IGN "Argenmap Gris" tiles, with OpenStreetMap as fallback

The tiles come from the Instituto Geográfico Nacional's TMS service:

```
https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/mapabase_gris@EPSG%3A3857@png/{z}/{x}/{-y}.png
```

Checked against the live service on 2026-09-24:

- No API key; responds `200` with `access-control-allow-origin: *`, so the browser calls it
  directly with no proxy.
- Neutral grey with official Spanish place names and departmental boundaries — a background
  that lets coloured pins carry the meaning. The standard Argenmap variant fills areas in pink
  and cream, which fights the brick and mustard pins, so it is not used.
- Official, free service; attribution "Instituto Geográfico Nacional de la República
  Argentina". The licence refers to Decisión Administrativa 797/2022.

The tile URL and attribution live in a single constant (`constants/map.ts`), so changing
provider is a one-line change. **OpenStreetMap's standard tiles** are the fallback if IGN
becomes unavailable or its terms change: no key, but best-effort with no SLA, and a colourful
map that competes with the pins.

Tiles are raster images with fixed colours, so the base map cannot be repainted with the
palette. It is warmed towards the paper background with a CSS filter applied only to Leaflet's
tile pane (pins are in a separate pane and unaffected); everything drawn by us — pins,
cluster, tooltip, legend, controls — uses the theme tokens directly.

## Consequences

**Positive**

- No key, account or billing; nothing new to provision or rotate.
- Pins are real DOM: theme tokens apply, keyboard focus and `aria-label` work, and the pure
  parts (icon builders, status mapping) are unit-testable without WebGL.
- The base map is the official Argentine one, consistent with using Georef in ADR-0001, with
  official names and boundaries.

**Negative**

- IGN's grey variant answers with `cache-control: no-cache, no-store`, so the browser
  re-requests tiles on every pan and zoom (the standard variant caches for 15 days). Fine for
  a handful of internal users; worth revisiting if load grows.
- IGN documents no rate limit and no SLA.
- Leaflet DOM markers degrade with many thousands of pins. Far above the expected scale, but
  it is a ceiling.
- Raster tiles cannot be recoloured exactly to the palette — the tint is an approximation.
- Leaflet needs a client-only load, its own CSS import, and `divIcon` (the default marker
  images break under bundlers).

## Alternatives considered

**MapLibre GL JS (+ `react-map-gl`).** Vector rendering on WebGL; smooth, native clustering,
scales to tens of thousands of points, and the natural choice for choropleths or heatmaps.
Rejected for now: pins are canvas layers, so no keyboard focus, and colours must be passed as
style expressions rather than token classes; jsdom has no WebGL, so tests would mock the map
wholesale; and it needs a vector-tile style provider. The scale it is built for is not this
project's. Because the library is confined to one folder, moving to it later — for example if
a per-zone report needs choropleths — is a contained rewrite.

**Google Maps.** Best base map and data quality, and `@googlemaps/js-api-loader` is already a
dependency. Rejected for the same reason ADR-0001 rejected it as a starting default: it
requires a Google Cloud project with billing, a referrer-restricted API key and a Map ID, and
cannot be tested without a network.

**Mapbox GL / OpenLayers.** Mapbox requires a token and has a proprietary licence; OpenLayers
is capable but far more verbose than three requirements justify.

**CARTO Positron tiles.** An excellent grey base map, but its raster endpoint now requires an
API key (requests without one are watermarked), and it is a world map with no advantage for an
Argentina-only view over IGN's grey variant.
