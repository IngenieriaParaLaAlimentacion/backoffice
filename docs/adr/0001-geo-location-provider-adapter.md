# ADR-0001: Address autocomplete via a pluggable GeoLocationProvider adapter

- **Status**: Accepted
- **Date**: 2026-08-21
- **Deciders**: Backoffice team
- **Related**: [GitHub issue #13](https://github.com/IngenieriaParaLaAlimentacion/backoffice/issues/13)

## Context

The establishment-creation form (and the establishment-request approval panel) captured
the address as a free-text field. `latitude`, `longitude` and `place_id` were never real —
they were fabricated by `withPlaceholderGeoData` (`crypto.randomUUID()` for `place_id`,
`0, 0` for coordinates) purely so the payload matched the backend's shape. Ticket #13
asked for a real geocoding-backed address search, where the user picks a suggestion and
the coordinates/identifier come from that pick, not from typed text.

Two decisions were needed, and they interact:

1. **How the form talks to a geocoding provider** — the form should not know which
   vendor resolves an address into coordinates.
2. **Which provider resolves it** — Google Places was the default assumption at the
   start of this work, but it requires a Google Cloud billing account and an API key
   (backed by a $200/month credit, not a free tier) even for low-volume use, which is
   friction this project didn't want to carry from day one.

Because (2) was genuinely open and likely to change (start free, move to Google later if
budget allows, or if Georef's coverage proves insufficient), (1) had to be resolved first
and resolved so that changing (2) later touches nothing outside `lib/geo/`.

## Decision

### Pattern: Adapter, behind a single `mount()` contract

`lib/geo/types.ts` defines the only thing the rest of the app knows about geocoding:

```ts
interface GeoLocationProvider {
  mount(
    container: HTMLElement,
    callbacks: {
      onSelect: (place: PlaceDetails) => void;
      onInputChange: () => void;
      onError: (error: Error) => void;
    },
  ): () => void; // cleanup
}
```

`components/AddressAutocomplete.tsx` is the only consumer. It hands the provider an empty
`<div>` and three callbacks, and never touches a vendor SDK, a fetch call, or a DOM node
the provider builds. `lib/geo/index.ts` exports one `geoLocationProvider` instance;
swapping vendors is changing that one export.

`mount()` was chosen over a `autocomplete(query) → suggestions[]` / `getDetails(id) →
place` shape (the more common REST-adapter shape) because the two providers we actually
have don't behave the same way at the UI level:

- **Google's** `PlaceAutocompleteElement` is a widget that owns its own `<input>` and
  dropdown — there is nothing to "fetch," only an event to listen to.
- **Georef's** API is a plain JSON endpoint with no UI — the provider has to build its
  own `<input>` and dropdown by hand.

A fetch-style interface would fit Georef but force Google's widget to be picked apart
(reach into its shadow DOM, discard its built-in accessibility/keyboard handling and
session-token management) just to squeeze it into a shape it doesn't have. `mount()` lets
each provider render whatever UI it needs inside the container it's given; the contract
is "however you do it, tell me when something is selected, when the text changed since
then, and when you failed" — not "give me data, I'll build the UI."

### Provider: [Argentina's Georef API](https://datosgobar.github.io/georef-ar-api/open-api/) (`datos.gob.ar`)

`lib/geo/georef-provider.ts` implements `GeoLocationProvider` against
[`apis.datos.gob.ar/georef/api/direcciones`](https://datosgobar.github.io/georef-ar-api/addresses/),
the Argentine government's official address-normalization API, and is the active
provider in `lib/geo/index.ts` today. It:

- needs no API key and has open CORS (`Access-Control-Allow-Origin: *`, verified against
  the live endpoint) — no backend proxy required;
- is Argentina-only, which matches this project's actual scope instead of being a
  limitation to work around;
- returns coordinates directly in the address-search response, so a selection resolves
  in one round trip;
- has no published hard rate limit or paid tier, unlike Google, and — unlike the
  OpenStreetMap-based alternatives below — is not a shared community demo instance,
  since it's the Argentine government's own production service for this exact purpose.

`lib/geo/google-places-provider.ts` implements the same `GeoLocationProvider` interface
against Google's
[`PlaceAutocompleteElement`](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new)
widget, loaded via
[`@googlemaps/js-api-loader`](https://github.com/googlemaps/js-api-loader). It is
written and type-checked but not wired up (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is
documented in `.env.example` but unset). It exists so that switching to Google later —
if Georef's coverage turns out to be insufficient somewhere, or the project gets a Maps
budget — is changing one line in `lib/geo/index.ts`, not rebuilding the integration.

Because Georef has no single stable place identifier (a street is split into
cartographic segments, each with its own `calle.id`), `place_id` is synthesized as
`provincia.id:departamento.id:calle.id:altura.valor` in `georef-provider.ts`. The
backend stores it as an opaque string either way, so this is invisible outside this
module.

## Consequences

**Positive**

- The form, the schema, and the backend payload are identical regardless of which
  provider is active — `AddressAutocomplete` and everything above it only ever see
  `PlaceDetails { id, formattedAddress, lat, lng }`.
- Zero cost, zero Google Cloud setup, for a university project where that setup is pure
  friction until it's actually needed.
- `mount()` accommodates both a vendor widget and a hand-built UI without forcing either
  provider to fake the other's shape.

**Negative**

- Georef's own documentation describes `ubicacion` as an _approximation_ of the address
  location, and precision depends on how complete each province's cartographic data is —
  a very new or rural address may resolve less precisely than it would with Google.
- Splitting a street into cartographic segments means a single search can return
  visually identical rows (same displayed address, different internal `calle.id`); this
  is deduplicated client-side by displayed text in `georef-provider.ts`
  (`dedupeByAddress`), not fixed at the source.
- `mount()` is a slightly larger contract than a plain fetch function — implementing a
  new provider means building (or wrapping) UI, not just mapping JSON.

## Alternatives considered

**Google Places as the only/default provider.** Rejected as the _starting_ default:
requires a Google Cloud project with billing enabled before the first request, for a
low-traffic university project. Kept as a ready-to-enable second provider instead of
being discarded, since it has broader/more precise coverage than Georef and may be worth
the setup cost later.

**Nominatim / Photon (OpenStreetMap-based, free, no key).** Rejected as the primary
provider: both are public community demo instances, not production services aimed at
this kind of consumer. Nominatim's
[usage policy](https://operations.osmfoundation.org/policies/nominatim/) caps general use
at 1 request/second and asks heavier users to self-host; Photon's public instance carries
the same "fine for light use, self-host if you need a production SLA" guidance. Georef
covers the same "free, no key" ground without that ceiling, because it's the Argentine
government's own service for this exact use case, not a shared demo.
