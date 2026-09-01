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

## Theme

The palette is **"Raíz"**, the same one the mobile app ships (its `Palette.kt` /
`KomoStyles.kt` are the upstream source). It has three layers and you should only ever
touch the first two:

1. **`app/globals.css`** — the literal colors. Every hex in the design lives in the
   `:root` block and nowhere else, with its Spanish spec name in a comment. `@theme
inline` above it maps each one to a Tailwind utility.
2. **`constants/theme.ts`** — the _tone_ layer: `Tone` (`critical`/`danger`/`warning`/
   `success`/`neutral`) and the pill/banner/row class maps it resolves to, plus the
   shared dialog scrim and the mono `DATA_CLASS`. A feature decides _which tone_ a
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
