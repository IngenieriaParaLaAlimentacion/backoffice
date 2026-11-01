# Architecture

Referenced from `CLAUDE.md` — read that first for the project overview and commands.

## Layering

`app/` (routes/pages, mostly thin) → `hooks/` (data-fetching + local state for a screen)
→ `services/*.service.ts` (one function per API call, takes an `AuthDispatcher` as first
arg) → `constants/api.ts` (endpoint path constants/builders) → `lib/http.ts`
(`apiRequest`, transport). `schemas/*.schema.ts` (zod) define form validation and are the
source of truth for form input types (`z.infer<...>`). `types/*.ts` hold API response
shapes (snake_case, matching the backend contract).

Hooks load with `useState` + `useEffect` by default. The exceptions so far are
`useEstablishmentsMap`, which uses SWR to cache its response (see "Caching" under
Establishments map in `features.md`), and the nutrition report hooks, which share one
cache between the generate dialog and the report screen (see "Nutrition report" in
`features.md`). Don't convert other hooks to SWR piecemeal; it's a convention to agree
on for the whole app.

## Back navigation

`NavigationHistory` mounts once in the root layout. `lib/navigationHistory.ts`
records each app entry's depth in `history.state`, preserving Next.js state when
wrapping `pushState` and `replaceState`. Replacements keep the depth; browser
back/forward restores the depth saved on the destination entry, including after a
reload. Entries from before tracking began are not treated as app predecessors.
`useGoBack` goes back only when that entry has a recorded predecessor; otherwise
it replaces the current entry with its fallback. Do not use `history.length` for
this decision: it includes forward entries and entries from other sites.

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
inline at the call site, so the copy for a screen stays readable in one file. The slugs
themselves are mirrored in `ERROR_TYPES` (`lib/apiError.ts`) from the backend's generated
catalog (`docs/errors.json` in the backend repo), which is additive-only.

One consequence worth knowing: the backend's 422 names no field on purpose (it used to
echo submitted values, including passwords), so a validation failure can only ever
produce a vague message. Any form or filter that can trigger one should validate in the
browser first — see `parseAgeFilter` in the measurements page, and the option-count rule
in `schemas/survey.schema.ts`, both of which mirror a backend bound so the user is told
which field is wrong.

## File downloads (CSV and XLSX exports)

Exports go through `downloadRequest` (`lib/http.ts`), not `apiRequest`, which always
consumes the body as JSON. It returns a `DownloadedFile`: the `blob`, the `filename` the
server sends in `Content-Disposition`, and the `rowCount` from `X-Export-Row-Count`.
Failures still arrive as an `ApiError`, because they carry a `problem+json` body.

`useCsvExport` (`hooks/useCsvExport.ts`) drives an export button. The backend streams its
CSV exports, so the `200` and its headers leave before it knows the query will finish, and
a failure halfway through just cuts the connection. The hook therefore compares the rows
that arrived with `rowCount` (`assertCsvRowCount` in `lib/download.ts`) and calls `saveBlob`
only when they match, so a truncated file is never saved; a cut stream is reported with
`EXPORT.interrupted`. The XLSX export declares no row count and skips that check.

Don't point an `<a href>` at an export URL: it would keep a partial file without any
warning. The backend side of this contract is in its `docs/csv-exports.md`.

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
(see `features.md`), which draws a map and uses a different library; don't extend `GeoLocationProvider`
to serve it.

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
`KomoStyles.kt`, in the mobile repo, are the upstream source). It has three layers and you should only ever
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
(the backend's `app/services/exporters/csv/formatters.py` formats with the same rule), so the table
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
"Tabs inside a resource's detail page" in `features.md`.

## Testing

Vitest + jsdom + `@testing-library/react` + MSW (`vitest.setup.ts` starts the shared MSW
`server` from `mocks/server.ts` with `onUnhandledRequest: "error"` — new API calls in
tests need a matching handler in `mocks/handlers.ts`/`mocks/handlers/*.ts`, or an inline
handler override). Fixtures for mock data live in `mocks/fixtures/*.ts`. Path alias
`@/*` (see `tsconfig.json` / `vitest.config.ts`) resolves from the repo root in both app
code and tests.

SWR's cache outlives a test, so `vitest.setup.ts` clears it after each one; without that,
a test would be handed the previous test's response.

Browser E2E tests are separate: they run Playwright against the real backend image and are
described in `docs/e2e.md`.

### CI

The list of workflows is in `CONTRIBUTING.md`; this section keeps the reasoning behind
`ci.yml` and `audit.yml`.

`ci.yml` runs on every pull request and once on each merge into `develop` or `main`. A
newer push cancels a PR's run in progress, but never a `main`/`develop` run: each of those
commits must upload coverage, or Codecov has no baseline for the next PR. The workflow
token is read-only (`permissions: contents: read`), jobs have a `timeout-minutes`, and
every action and the Semgrep image are pinned by SHA or digest with the version in a
comment — bump both together.

Coverage scope (`coverage.include`/`exclude`) lives only in `vitest.config.ts`; Vitest 4
reports just the files a test imported unless `include` is set, so an untested file counts
as 0% rather than disappearing. `codecov.yml` holds only the status targets, so the local
`npm run test:ci` number matches Codecov's.

`audit.yml` (`npm run audit` = `npm audit --omit=dev --audit-level=high`) checks runtime
dependencies only — what ships in the image — and fails on **high or critical** advisories.
Since advisories change independently of the code, it doesn't run on unrelated PRs; a new
advisory shows up in the weekly run. Fix it with `npm audit fix` or a version bump; don't
lower the threshold.
