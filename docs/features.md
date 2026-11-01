# Features

Design notes for specific features of the backoffice: how the pieces fit and what is easy to break. The general architecture (layering, auth, errors, theme, dates, testing) is in [`architecture.md`](architecture.md), and the reasons behind the main decisions are in [`adr/`](adr/).

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

## Nutrition report (`nutrition-report/`)

The monthly nutrition report of a comedor (#80): which nutrients fall short in what
reached it, how the energy splits between macronutrients and food groups, and what to
add. The backend calculates it and the AI writes the text around it; the backoffice
reads, generates and downloads it.

- **Two screens.** `(ficha)/nutrition-report/page.tsx` is a tab of the ficha that lists
  the saved reports (`NutritionReportPanel`) and opens `GenerateNutritionReportDialog`
  from "Generar nuevo reporte". One report is read at `nutrition-report/[month]/page.tsx`
  (`NutritionReportDetail`), outside `(ficha)` like the stock movements history: it is
  long, and the ficha's header would only push it down. Both are gated with
  `nutritionReports.view`; the tab is also hidden in `(ficha)/layout.tsx` by
  `can(...)`. Each screen's components sit next to its `page.tsx`; the pieces both
  share (banner, load error, notice dialog and its frame) live in
  `components/nutritionReport/`.
- **`GET` reads, `PUT` generates — and every `PUT` counts toward the per-user AI usage
  limit**, even when it answers with the report that was already saved or does not call
  the AI at all (the backend's limiter runs before it knows). So nothing calls it on its own:
  `useNutritionReport` reads with `GET`, and `generate()` only runs from a button. The
  dialog looks the chosen month up first, so an existing report is opened for free
  instead of generated again. The same `PUT` rewrites only the text of a report whose
  AI text had failed ("Regenerar texto"). A `GET` 404 is the normal "not generated yet"
  state (`report === null`), not an error.
  The one other case the backend recalculates is a month saved **without data**: a month
  is reportable from the first day of the next one, which can be before its last
  intakes are loaded, so asking again fills the report in if they have arrived (and
  writes nothing if not). The report screen offers it as "Volver a calcular", only for
  such a month, and says so when it came back empty again.
- **Months** are `YYYY-MM` strings, and only closed ones can be asked for: the month
  before the current one in the Argentine calendar is the newest (`lib/reportMonth.ts`).
  Show one with `formatReportMonth` (`lib/format.ts`), never inline.
- **Caching.** SWR with array keys (`hooks/nutritionReportKeys.ts`), so one comedor's
  list pages can be invalidated without touching its reports. Generating writes the
  returned report into the cache and refreshes the list, which is why the screen it
  navigates to has it already. `keepPreviousData` is off for a single report: another
  month's figures must never stay on screen while this one loads.
- **Errors** go through `getNutritionReportErrorMessage` (`lib/nutritionReportErrors.ts`),
  keyed by `type`: the two 409s (no AI text for the PDF; no food converts to grams) are
  told apart by it, not by status. A 429 (AI quota or attempts limit) says how long to
  wait when the backend reports `retry_after`; it comes in the body, and `toApiError`
  takes the `Retry-After` header as a fallback.
- **Never render the report's `warnings`.** They are English prose from the backend.
  The notice about foods left out is built from `foods_without_conversion` instead.
- **What the screen shows of the analysis**: the mean adequacy and the month's total
  energy, the nutrients, macros and GAPA groups, "Otros nutrientes" (`limits`: fiber,
  sodium and the like, as information with no reference), the suggested foods and the
  foods left out — the same as the backend's PDF. `reference_profile` arrives as a code
  (`nino_7_9`), not a name: `nutritionReportReferenceProfile` turns it into who the
  reference is for, and says nothing for a code it doesn't know. Ask the backend to send
  the name when a second profile exists, instead of growing that map. The capped
  adequacy (`adequacy_capped_percent`) only feeds the mean and is not typed.
- **The scope note** ("evalúa lo que llega al comedor, no la dieta completa") is fixed
  text sent by the backend, shown last on the screen as a quote. It is not part of the
  AI's text, so it is there even when the AI text is unavailable.
- **The PDF** (`useNutritionReportPdf`) never generates a report or spends quota; the
  backend refuses it with a 409 while the AI text is missing, and the button is disabled
  with the reason beforehand.
- **Mocks.** `mocks/fixtures/nutritionReport.ts` keeps the saved reports per comedor
  (reset after every test in `vitest.setup.ts`), and
  `makeGenerateNutritionReportFailureHandler` stands in for the 429, 504 and 409 cases.

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
