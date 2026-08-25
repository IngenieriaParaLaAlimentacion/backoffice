# Architecture

Referenced from `CLAUDE.md` — read that first for the project overview and commands.

## Layering

`app/` (routes/pages, mostly thin) → `hooks/` (data-fetching + local state for a screen)
→ `services/*.service.ts` (one function per API call, takes an `AuthDispatcher` as first
arg) → `constants/api.ts` (endpoint path constants/builders) → `lib/http.ts`
(`apiRequest`, transport). `schemas/*.schema.ts` (zod) define form validation and are the
source of truth for form input types (`z.infer<...>`). `types/*.ts` hold API response
shapes (snake_case, matching the backend contract).

## Auth (`context/AuthContext.tsx`)

`AuthProvider` wraps the app (in `app/layout.tsx`) and holds tokens + device ID in
state, persisted via `lib/tokenStorage.ts` (localStorage) and `lib/deviceIdStorage.ts`.
On mount it silently refreshes the stored access token before rendering children.
Screens call authenticated endpoints through `useAuth().makeAuthorizedRequest` (typed as
`AuthDispatcher`), never `apiRequest` directly — this bakes in the current tokens and an
`onRefresh` callback so a 401 mid-request transparently refreshes and retries once (see
`apiRequest` in `lib/http.ts`). `app/dashboard/layout.tsx` is the auth gate: it redirects
to `/signin` once `isInitializing` is false and `isAuthenticated` is false.

## Service functions & error handling

`services/*.service.ts` functions take `dispatcher: AuthDispatcher` as their first
argument (not a hook — so they're plain, testable functions) and throw on `!res.ok`. Two
error styles exist side by side: plain `Error(detail)` for cases callers don't need to
branch on, and `ApiError` (`lib/apiError.ts`, carries `status` and RFC 7807 `type`) where
callers need to distinguish e.g. 404 vs 403 vs a specific 409 — see
`getEstablishmentDashboardAction` / `useEstablishmentDashboard` for the pattern (a 404
"doesn't exist" is rendered differently from the empty-data state).

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

## Route groups

`app/(auth)/` holds unauthenticated screens (signin, invite, forgot/reset password,
verify-email); `app/dashboard/` is everything behind the auth gate.

## Testing

Vitest + jsdom + `@testing-library/react` + MSW (`vitest.setup.ts` starts the shared MSW
`server` from `mocks/server.ts` with `onUnhandledRequest: "error"` — new API calls in
tests need a matching handler in `mocks/handlers.ts`/`mocks/handlers/*.ts`, or an inline
handler override). Fixtures for mock data live in `mocks/fixtures/*.ts`. Path alias
`@/*` (see `tsconfig.json` / `vitest.config.ts`) resolves from the repo root in both app
code and tests.
