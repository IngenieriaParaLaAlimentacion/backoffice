# Architecture

Referenced from `CLAUDE.md` — read that first for the project overview and commands.

## Layering

`app/` (routes/pages, mostly thin) → `hooks/` (data-fetching + local state for a screen)
→ `services/*.service.ts` (one function per API call, takes an `AuthDispatcher` as first
arg) → `constants/api.ts` (endpoint path constants/builders) → `lib/http.ts`
(`apiRequest`, transport). `schemas/*.schema.ts` (zod) define form validation and are the
source of truth for form input types (`z.infer<...>`). `types/*.ts` hold API response
shapes (snake_case, matching the backend contract).

Hooks load with `useState` + `useEffect` by default. The one exception so far is
`useEstablishmentsMap`, which uses SWR to cache its response — see "Caching" under
Establishments map. Don't convert other hooks to SWR piecemeal; it's a convention to
agree on for the whole app.

## Auth (`context/AuthContext.tsx`)

`AuthProvider` wraps the app (in `app/layout.tsx`) and holds tokens + device ID in
state, persisted via `lib/tokenStorage.ts` (localStorage) and `lib/deviceIdStorage.ts`.
On mount it silently refreshes the stored access token before rendering children.
Screens call authenticated endpoints through `useAuth().makeAuthorizedRequest` (typed as
`AuthDispatcher`), never `apiRequest` directly — this bakes in the current tokens and an
`onRefresh` callback so a 401 mid-request transparently refreshes and retries once (see
`apiRequest` in `lib/http.ts`). `app/dashboard/layout.tsx` is the auth gate: it redirects
to `/signin` once `isInitializing` is false and `isAuthenticated` is false.

## Authorization (roles & permissions)

Authentication says _whether_ you're in; this layer says _what you see_. Four roles
exist (`types/user.ts` `UserRole`): `superadmin`, `admin`, `analyst`, `field_worker`.

Three pieces, in dependency order:

1. **`lib/permissions.ts`** — a pure `can(role, permission)` over a
   `Record<UserRole, Permission[]>` table. `Permission` is a named capability
   (`"requests.view"`, `"surveys.delete"`, …), never a role check at the call site.
   Only capabilities _some_ role loses get an entry: anything absent from the union is
   available to every authenticated user, which keeps the table short and makes "who
   can do this?" answerable by reading one file.
2. **`context/SessionContext.tsx`** — `SessionProvider` resolves `GET /users/me` **once**
   per session and exposes `{ profile, role, isLoading, error, refetch, can }`. It is
   deliberately separate from `AuthContext`, which owns tokens and knows nothing about
   who the user is. Its effect is keyed on `isAuthenticated`, not on
   `makeAuthorizedRequest` — that reference changes on every silent token refresh and
   would re-fetch the profile each time, so the dispatcher is read from a ref.
3. **`components/RequirePermission.tsx`** — wraps a route's content and renders a 403
   screen (`components/FullScreenMessage.tsx` + `constants/permissions.ts`) when the
   role lacks the permission, so typing a hidden URL by hand doesn't reach the screen.

`app/dashboard/layout.tsx` mounts `SessionProvider` inside the auth gate and holds the
shell back while `isLoading` — every role check starts out denying, so rendering first
would flash admin-only nav items and cards at analysts on each load. If `/users/me`
fails it shows a retry screen rather than degrading to "no permissions", which would
read as a broken app.

Navigation is declarative in `constants/navigation.ts`: each `NavItem` may carry a
`permission`, and `visibleNavItems(role)` feeds the sidebar, the mobile drawer and the
home screen's "Accesos disponibles" grid — so gating an item removes it from all three.

**This is a UX guard, not a security boundary.** It hides what a role can't act on so
screens don't offer dead buttons; the backend still answers 403 and remains the real
authorization boundary. See `docs/adr/0002-client-side-permission-model.md`.

## Service functions & error handling

`services/*.service.ts` functions take `dispatcher: AuthDispatcher` as their first
argument (not a hook — so they're plain, testable functions) and throw on `!res.ok`.
They all throw the same thing: `toApiError(res.data, res.status)` (`lib/apiError.ts`),
which preserves the backend's RFC 7807 envelope — `status`, the machine-readable `type`,
and any extension members. Callers branch on `status` where one status has one meaning
(`getEstablishmentDashboardAction` / `useEstablishmentDashboard` render a 404 "doesn't
exist" differently from the empty-data state) and on `type` where it doesn't (a 409 on
saving a survey is either a name clash or a locked survey).

**Never render a caught error's `message` to the user.** It holds the backend's `detail`,
which is English, and which the backend documents as prose it may reword at any time —
only `type` is contractual. Screens call `getErrorMessage(err, { overrides, fallback })`
(`lib/errorMessages.ts`), which maps `type` to Spanish copy and degrades an unrecognised
error to `fallback` rather than leaking English. Shared copy lives in `constants/errors.ts`;
screen-specific wording goes in that screen's `constants/<domain>.ts` and is passed as
`overrides`. The `fallback` comes from there too — no user-facing string is written
inline at the call site, so the copy for a screen stays readable in one file. The slugs themselves are mirrored in `ERROR_TYPES` (`lib/apiError.ts`) from
the backend's generated catalog (`docs/errors.json` there), which is additive-only.

One consequence worth knowing: the backend's 422 names no field on purpose (it used to
echo submitted values, including passwords), so a validation failure can only ever
produce a vague message. Any form or filter that can trigger one should validate in the
browser first — see `parseAgeFilter` in the measurements page, and the option-count rule
in `schemas/survey.schema.ts`, both of which mirror a backend bound so the user is told
which field is wrong.

## Mock backend (MSW)

`NEXT_PUBLIC_ENABLE_MSW=true` makes `mocks/MswProvider.tsx` (mounted in
`app/layout.tsx`, above `AuthProvider`) start an MSW worker (`mocks/browser.ts`) before
rendering the app, so the whole app can run against `mocks/handlers/*.ts` +
`mocks/fixtures/*.ts` with no real backend. The same `mocks/handlers.ts` array is reused
by `vitest.setup.ts` (via `mocks/server.ts`, node/MSW server) for tests — keep handlers
backend-shaped (real endpoint paths/response shapes) since both the browser preview and
tests depend on them matching `constants/api.ts` and `types/*.ts`.

## API base URL / rewrites

`constants/api.ts` sets `API_BASE_URL = ""`, so `lib/http.ts` calls hit same-origin
`/api/v1/...` paths. `next.config.ts` rewrites `/api/:path*` to
`NEXT_PUBLIC_API_BASE_URL` (the real backend) — set that env var rather than changing
`API_BASE_URL`.

`proxy.ts` (project root, matched on `/api/:path*`) runs before that rewrite and sets two
headers on each forwarded call: `x-internal-token`, the secret shared with the backend, and
`x-client-ip`, the address of the user who made the call. The backend counts its per-IP limits
against that address; without it every backoffice user would share the address of the Next.js
server. Whatever the browser sends in those two headers is discarded. The names are in
`constants/serviceHeaders.ts`.

`INTERNAL_SERVICE_TOKEN` and `CLIENT_IP_HEADER` (the header where the edge proxy writes the
caller's address, `x-real-ip` by default) are server-only and read at runtime, so changing them
needs a restart, not a rebuild. Without a token the proxy sets neither header. It only copies an
address: it reads no auth token and makes no permission decision. The reasoning is in
`docs/adr/0004-forward-user-ip-to-backend.md`.

## Geo / address autocomplete (`lib/geo/`)

Address search is behind a `GeoLocationProvider` adapter (`lib/geo/types.ts`) with a
single `mount(container, callbacks) -> cleanup` contract, chosen because the two
providers don't share a request/response shape — Google's `PlaceAutocompleteElement` is
a self-contained widget, while Georef's is a plain JSON endpoint the provider has to
build a UI around. Active provider: `lib/geo/georef-provider.ts` (Argentina's free
`datos.gob.ar` Georef API, no key required). `lib/geo/google-places-provider.ts` is
implemented and type-checked but not wired up — switching providers is a one-line change
in `lib/geo/index.ts` (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` would need to be set). Full
rationale in `docs/adr/0001-geo-location-provider-adapter.md` — read it before touching
this adapter or adding a third provider.

`PlaceDetails` may also carry `city` and `province` when the provider resolves them (Georef
does, from `localidad_censal` and `provincia`; the Google provider doesn't ask for them yet).
The establishment forms prefill their own city/province from them on pick and keep both
editable, so a new address can't silently leave the old locality behind.

This adapter only finds an address. It has nothing to do with the establishments map
below, which draws a map and uses a different library; don't extend `GeoLocationProvider`
to serve it.

## Establishments map (`app/dashboard/establishments/(list)/map/`)

The "Lista"/"Mapa" toggle on the Establecimientos screen. Libraries and base map are
decided in `docs/adr/0003-establishments-map-libraries.md`; this section is how the pieces
fit and what is easy to break.

**Data flow.** `?view=map` lives in the query string next to the list's filters, so going
back from a ficha lands on the same view, and switching views keeps the filters for when
you return to the table. `EstablishmentsMapView` mounts only in map mode and calls
`useEstablishmentsMap` → `getEstablishmentsMapAction` → `GET /establishments/map`: one
unpaginated call, no filters, open to admin/analyst/superadmin. The table's own request is
skipped while the map is showing, and the map's while the table is. The list-only controls
(search, sort, filters, pagination, CSV export) are hidden in map mode: the endpoint
ignores them, and the export follows the table's filters.

**Caching.** The map's response is cached with SWR (`lib/swr.ts`: `SWR_CONFIG`, a 30 s
`dedupingInterval`, no revalidate-on-focus), so going Lista → Mapa → Lista → Mapa doesn't
call the backend again inside that window. Reopening shows the pins at once and refreshes
in the background once the window has passed. Three things to know:

- **The key is the endpoint alone.** The fetcher isn't part of it, so a silent token
  refresh (which gives `makeAuthorizedRequest` a new identity) doesn't refetch.
- **Whatever adds an establishment must call `invalidateEstablishmentsMap()`**
  (`hooks/useEstablishmentsMap.ts`), or its pin waits out the window. Creating one and
  approving a request do; proposing one doesn't need to, since a proposal isn't on the map
  yet. New writers are on you to remember: nothing enforces it.
- **The cache is cleared when a session starts** (`login` in `AuthContext` calls
  `clearSwrCache`), so one user never sees what the previous one had loaded. It clears on
  sign-in and not on sign-out on purpose: clearing without revalidating drops the data but
  keeps SWR's "fetched a moment ago" marker, so a quick sign-out/sign-in would show an
  empty map and never ask again. Revalidating is only safe when no screen with data is
  mounted, which is true on the sign-in page. `lib/swr.test.tsx` pins this. It clears every
  key, so any future SWR hook is covered too.

Data on the map can therefore be up to 30 s old, and a new survey that changes an
establishment's severity shows after the window: only additions are invalidated.

**What a pin says** (`lib/establishmentPins.ts`, pure and unit-tested).

- `severity: null` means _both_ "healthy" and "nothing measured yet", so a pin's status
  is decided by `has_data` first: `toPinStatus`. Reading a null severity as normal would
  paint an unmeasured establishment as a good result.
- Establishments created before geocoding existed were backfilled at `(0, 0)`. They can't be
  drawn, but they are never dropped silently: `buildMapPins` returns their count and the
  screen says how many are missing, with a way back to the list.

**The library boundary.** The rest of the app sees only `EstablishmentsMapProps`
(`map/types.ts`: `pins` in, `onPinClick(id)` out). Only files under `map/leaflet/` may
import `leaflet`, `react-leaflet` or `leaflet.markercluster`; an ESLint
`no-restricted-imports` rule in `eslint.config.mjs` enforces it, so replacing the library is
a rewrite of that folder. Three things about it that are easy to break:

- Leaflet reads `window` on import, so `EstablishmentsMap.tsx` loads it with `next/dynamic`
  and `ssr: false`. The view also calls `preloadEstablishmentsMap()` on mount, so the code
  downloads while the pins are still being requested.
- `leaflet.markercluster` needs a global `L` at import time. `leaflet/exposeLeaflet.ts`
  sets it and must be imported _before_ the plugin (`ClusterLayer.tsx` keeps that order).
- Leaflet writes string content with `innerHTML`. Anything user-supplied (the
  establishment's name) goes in as a DOM node with `textContent`, never a string, or a
  name containing markup would run. A test pins this.

**Styling.** Pins and clusters are Tailwind classes from `constants/theme.ts`
(`PIN_CLASS`, `TONE_PIN_CLASS`, `CLUSTER_PIN_CLASS`); which tone a status gets and its symbol
and Spanish label are in `constants/establishments.ts` (`PIN_STATUS_TONE`, `_SYMBOL`,
`_LABELS`). The severity tones repeat `SEVERITY_TONE` from `AlertBadge.tsx` (a constants file
can't import from `components/`), and a test keeps the two in step. Severity doesn't rest on
color alone: each status has its own symbol, and "no data" is hollow and dashed. The cluster
is deliberately a neutral count, not a severity. `leaflet-overrides.css` styles Leaflet's own
chrome with `var(--…)` only — no literal color. The wrapper is `isolate` so Leaflet's
z-indexes (up to 1000) stay inside the map instead of climbing over dialogs and menus;
overlays we add there (the legend) use `MAP_OVERLAY_CLASS` to sit at the same level.

**Base map.** The tile layers live in `constants/map.ts`; `NEXT_PUBLIC_MAP_TILES` picks one
(`ignColor` by default, `ign` grey, `osm`). Tiles are raster images with fixed colors and
can't be repainted from the palette; only the grey layer gets a warm CSS tint.

**Testing.** The page's tests replace `map/EstablishmentsMap` with a stand-in (Leaflet has
its own tests under `map/leaflet/`). jsdom has no layout, so an unsized map is 0×0 and
draws no markers: the Leaflet tests give elements a `clientWidth`/`clientHeight`. What
clustering folds together at a real zoom, and hover and keyboard behaviour, can only be
seen in a browser.

## Forms

react-hook-form + `@hookform/resolvers/zod`, validated against a `schemas/*.schema.ts`
zod schema whose `z.infer` is the form's input type. Validation messages are user-facing
Spanish strings defined in the schema itself.

## UI components

shadcn (`components.json`, style `base-nova`, base color `neutral`) generates into
`components/ui/`; treat those as generated/vendored — extend by composition in
`components/` rather than hand-editing generated primitives where avoidable. Styling is
Tailwind v4 (`app/globals.css`, no separate tailwind config file — `components.json`
points `tailwind.config` at `""`).

## Theme

The palette is **"Raíz"**, the same one the mobile app ships (its `Palette.kt` /
`KomoStyles.kt` are the upstream source). It has three layers and you should only ever
touch the first two:

1. **`app/globals.css`** — the literal colors. Every hex in the design lives in the
   `:root` block and nowhere else, with its Spanish spec name in a comment. `@theme
inline` above it maps each one to a Tailwind utility.
2. **`constants/theme.ts`** — the _tone_ layer: `Tone` (`critical`/`danger`/`warning`/
   `success`/`neutral`) and the pill/banner/row/map-pin class maps it resolves to, plus
   the shared dialog scrim and the mono `DATA_CLASS`. A feature decides _which tone_ a
   status is (`RELATION_STATUS_TONE`, `SEVERITY_TONE`, …), never which color.
3. **Components** — consume utilities only. A raw hex or a Tailwind palette color
   (`emerald-500`, `amber-600`) in a component is a bug: the palette has no orange, no
   emerald and no amber, so those colors are visibly off-brand and invisible to a
   future re-theme.

Three things worth knowing before changing values:

- **The palette is light-only.** There is no theme provider and nothing adds `.dark`, so
  `dark:` utilities never fire — but `@custom-variant dark (&:is(.dark *))` must stay
  declared, or Tailwind falls back to its `prefers-color-scheme` default and the
  leftover `dark:` classes in `components/ui/` would activate on a dark OS.
- **Contrast constraints are load-bearing, not preferences.** White on mustard is 2.6:1,
  which is why `--primary-foreground` is ink. Mustard as _text_ on paper fails, which is
  why `--warning` points at mostaza oscura `#8A6614` and links use `--accent-foreground`
  (salvia profunda). Ladrillo on tierra oscura is unreadable, which is why the sidebar
  carries its own `--sidebar-destructive`.
- **The sidebar is a dark surface with its own scale.** Anything inside it uses
  `--sidebar-*`; `text-foreground`/`text-primary` there resolve to ink and mustard and
  fail. The active item is tierra media with a mustard left rail
  (`components/SideBarItem.tsx`).

Typography is three families, mirroring mobile's type roles: **Fraunces** for
display/titles (`font-heading`, applied to `h1`–`h4` in the base layer), **Work Sans**
for body and UI (`font-sans`), **IBM Plex Mono** for numbers read as data
(`font-mono` via `DATA_CLASS` — counters, measurements, stamped dates, but not numbers
inside a sentence). The brand mark is `components/BrandMark.tsx` (inline SVG) and the
mark + wordmark lockup is `components/BrandLockup.tsx`.

## Dates & times (`lib/format.ts`)

Two different kinds of value arrive from the API and they must not be formatted the
same way.

**Calendar dates** (`birth_date`) come as `"YYYY-MM-DD"` and mean a day, not a moment.
`formatDate` splits the string. Never route one through `Date` — it parses as UTC
midnight and renders a day earlier anywhere west of Greenwich, which is everywhere in
Argentina.

**Timestamps** (`event_at`, `measured_at`, `created_at`) are UTC instants: the mobile
app sends `Instant...toString()`, the backend stores `DateTime(timezone=True)` and
serialises with a `Z`. `formatTimestampDate` / `formatTimestamp` /
`formatTimestampShortDate` convert them to **Argentine local time**, pinned to
`America/Argentina/Buenos_Aires` rather than the viewer's device zone. The zone is
pinned on purpose: it matches the backend's CSV export byte-for-byte
(`app/services/exporters/csv/formatters.py` formats with the same rule), so the table
and the spreadsheet downloaded from it agree, and it keeps the output stable across
machines in tests. Reading the UTC components back out (`getUTCDate()`) is _not_
formatting — it re-prints the instant three hours ahead, which dates a survey answered
at 22:30 to the following day.

The same conversion applies to range filters. A `<input type="date">` names an
Argentine calendar day, so `argentineDayStartUtc` / `argentineDayEndUtc` widen it to
the UTC instants that day spans before it goes to the API — otherwise a row displayed
as 03/09 falls outside a 03/09 filter. Both derive the offset from the zone at that
date instead of hardcoding `-03:00`, since Argentina has adopted and dropped DST
before.

## Route groups

`app/(auth)/` holds unauthenticated screens (signin, invite, forgot/reset password,
verify-email); `app/dashboard/` is everything behind the auth gate.
`app/dashboard/establishments/[id]/(ficha)/` groups the routes that share the
establishment's header/metrics/tab chrome, so a sibling route can opt out of it — see
"Tabs inside a resource's detail page" below.

## Email verification link (`/verify-email`) and Android App Links

The backend emails `<backoffice origin>/verify-email?token=…` to field workers who
sign up in the mobile app. The same URL has two consumers: this page, and the Android
app through App Links.

- **The page sends nothing on load.** The token is single-use and mail security
  scanners open links, so `VerifyEmailView` posts it only when the person presses the
  button. Don't move the request into an effect.
- **The page can't know the role.** The confirm endpoint answers 204 with no body, so
  the copy (`VERIFY_EMAIL_PAGE` in `constants/auth.ts`) has to stay true for a field
  worker whose account still waits for approval. A reload after success is answered
  `verification-token-used`, which the page shows as a neutral outcome.
- **`public/.well-known/assetlinks.json`** lets both Android packages claim this host.
  Android fetches it when the app is installed and gives no error if it can't: the link
  just keeps opening the browser. It must answer 200 as JSON with no redirect, so
  don't put a redirect, a middleware/proxy match or a `robots.txt` disallow in front of
  `/.well-known/`. The fingerprints are the SHA-256 of the app's signing certificates
  (`./gradlew :composeApp:signingReport` in the mobile repo); a new signing key needs a
  new entry here, deployed before the build that uses it. `app/assetlinks.test.ts`
  checks the file's shape.

## Tabs inside a resource's detail page

`app/dashboard/establishments/[id]/` is the first (and reference) place this repo
splits a resource's detail page into tabs instead of stacking every section on one
page — introduced when Sujetos/Relevadores outgrew a single scroll and Stock was
about to join them, with stock movements (#111) already on deck behind it.

- `[id]/(ficha)/layout.tsx` owns the one fetch that gates the whole ficha
  (`useEstablishmentDashboard`: 404/403/loading), renders the always-visible
  header/metrics/alert banner above the tab bar, and renders `children` below it —
  whichever tab's `page.tsx` matches the current route.
- Each tab is a real route (`(ficha)/page.tsx` = Sujetos,
  `(ficha)/field-workers/page.tsx`, `(ficha)/stock/page.tsx`), not a client-side
  toggle over one always-mounted tree: a
  tab's data only loads once that tab is actually visited, and deep-linking straight
  to one works.
- The dashboard payload the layout already fetched is handed down to whichever tab
  is active via `useEstablishmentDashboardContext()` (exported from `layout.tsx`)
  instead of every tab re-fetching it.
- The tab `<Link>`s pass `replace`, not the default push. Switching tabs must not
  grow browser history, or "Volver" (`router.back()` in `EstablishmentHeader`) would
  step back through Sujetos → Relevadores → Stock one click at a time instead of
  leaving the ficha in one click — back to the establishments list, with its filters
  and scroll position restored (see the comment on `router.back()` there).

Follow this same shape for the next tab this ficha gains: a route under
`(ficha)/` needs no new layout.

**Not every screen hanging off `[id]` is a tab.** The three tab routes live in the
`(ficha)` route group precisely so a screen can opt out of that chrome by sitting
outside it — which is what `[id]/stock/movements/page.tsx` (the movements history,
#111) does. It is the chronological event log, not another view of the current
balance, it is reached from a button inside the Stock tab rather than from the tab
bar, and it renders its own "Volver al stock" affordance and its own 404/403 screens
instead of inheriting the layout's. Route groups don't affect the URL, so `/stock`
and `/stock/movements` still resolve as siblings even though one is inside the group
and the other isn't.

Its food filter is shaped by a backend constraint worth knowing before touching it:
`GET /establishments/{id}/food-movements` takes `food_id` and **no** `category_id`.
So the category select in `FoodFilter.tsx` narrows what the food combobox searches in
the catalog (`GET /food-catalog/foods` does take both) and leaves the listing alone
until a food is actually picked. That is why both controls live in one component
labelled "Buscar alimento" instead of sitting in the filter row next to Dirección and
the dates — a category that looked like a listing filter would be a filter that does
nothing. A test pins the behaviour.

## Email verification link (`/verify-email`) and Android App Links

The backend emails `<backoffice origin>/verify-email?token=…` to field workers who
sign up in the mobile app. The same URL has two consumers: this page, and the Android
app through App Links.

- **The page sends nothing on load.** The token is single-use and mail security
  scanners open links, so `VerifyEmailView` posts it only when the person presses the
  button. Don't move the request into an effect.
- **The page can't know the role.** The confirm endpoint answers 204 with no body, so
  the copy (`VERIFY_EMAIL_PAGE` in `constants/auth.ts`) has to stay true for a field
  worker whose account still waits for approval. A reload after success is answered
  `verification-token-used`, which the page shows as a neutral outcome.
- **`public/.well-known/assetlinks.json`** lets both Android packages claim this host.
  Android fetches it when the app is installed and gives no error if it can't: the link
  just keeps opening the browser. It must answer 200 as JSON with no redirect, so
  don't put a redirect, a middleware/proxy match or a `robots.txt` disallow in front of
  `/.well-known/`. The fingerprints are the SHA-256 of the app's signing certificates
  (`./gradlew :composeApp:signingReport` in the mobile repo); a new signing key needs a
  new entry here, deployed before the build that uses it. `app/assetlinks.test.ts`
  checks the file's shape.

## Testing

Vitest + jsdom + `@testing-library/react` + MSW (`vitest.setup.ts` starts the shared MSW
`server` from `mocks/server.ts` with `onUnhandledRequest: "error"` — new API calls in
tests need a matching handler in `mocks/handlers.ts`/`mocks/handlers/*.ts`, or an inline
handler override). Fixtures for mock data live in `mocks/fixtures/*.ts`. Path alias
`@/*` (see `tsconfig.json` / `vitest.config.ts`) resolves from the repo root in both app
code and tests.

SWR's cache outlives a test, so `vitest.setup.ts` clears it after each one; without that,
a test would be handed the previous test's response.

### CI

`.github/workflows/ci.yml` runs on every pull request (each push to a branch with an open
PR) and once on each merge into `develop` or `main`; a newer push cancels the PR's run in
progress. It has two parallel jobs: `audit` (dependency audit) and `test` (lint, typecheck,
tests via `npm run test:ci`, build, Semgrep, and a Docker build that is not pushed). Keeping
the audit separate means a new advisory shows up as its own red check without hiding whether
the PR's own code passes.

The audit (`npm run audit` = `npm audit --audit-level=high`) fails on **high or critical**
advisories only; moderate and low ones are printed in the log but don't fail the job. It
covers devDependencies too. A new advisory can turn CI red with no code change. Fix it with
`npm audit fix` or a version bump; don't lower the threshold.
