# Conventions

Referenced from `CLAUDE.md` — read that first for the project overview and commands.

## Adding a new API-backed screen

A "screen" here means any dashboard view whose content comes from the backend (a list,
a detail panel, a create/edit form) — not a purely static page. Every existing example
(establishments, surveys, subjects) follows this order:

1. Add the response/request shapes to `types/<domain>.ts` (snake_case, matching the
   backend contract).
2. If there's a form, add a zod schema to `schemas/<domain>.schema.ts` — Spanish
   validation messages live in the schema, and `z.infer<typeof schema>` becomes the
   form's input type.
3. Add the endpoint path (or builder function, for parameterized routes) to
   `constants/api.ts`.
4. Add the service function(s) to `services/<domain>.service.ts`. Each takes
   `dispatcher: AuthDispatcher` as its first argument and throws `Error`/`ApiError` on
   `!res.ok` (see `docs/architecture.md` for which error type to use).
5. Add a hook in `hooks/use<Domain>.ts` that calls the service through
   `useAuth().makeAuthorizedRequest`, exposing `isLoading`/`error`/data (and any
   status-derived flags like `notFound`/`forbidden`) to the component.
6. Add the screen's UI copy as an `as const` object in `constants/<domain>.ts`.
7. Build the route under `app/dashboard/...`, co-locating any route-only components
   next to `page.tsx`.
8. If the screen should work under MSW (dev preview and tests both depend on it), add a
   handler in `mocks/handlers/<domain>.ts` and a fixture in `mocks/fixtures/<domain>.ts`,
   then register the handler in `mocks/handlers.ts`.

## Next.js conventions

- **Client Components by default, deliberately.** Auth state lives in `localStorage`
  (`lib/tokenStorage.ts`) and every authenticated read goes through
  `useAuth().makeAuthorizedRequest` on the client, so almost every route
  (`app/dashboard/**` and most of `app/(auth)/**`) is `"use client"` with data fetched
  from a hook, not a Server Component with server-side data fetching. This is
  intentional, not an oversight — don't "modernize" a page to an async Server Component
  that fetches with a bare `fetch`, it would bypass the auth-header/refresh-and-retry
  logic in `lib/http.ts`. The handful of files without `"use client"`
  (`app/layout.tsx`, `app/(auth)/layout.tsx`, presentational leaves like
  `components/ui/*`, `components/AlertBadge.tsx`, `components/Pagination.tsx`) are
  genuinely static and should stay that way rather than gain a `"use client"` they don't
  need.
- **Route params are async.** Dynamic segments type `params` as `Promise<{ id: string
}>` and unwrap with React's `use()` in Client Components (see
  `app/dashboard/establishments/[id]/page.tsx`) — `await` it instead only in an actual
  Server Component.
- **Co-location over centralization.** A component used by exactly one route lives next
  to its `page.tsx` in that route segment (e.g. `EstablishmentHeader.tsx` beside
  `app/dashboard/establishments/[id]/page.tsx`); only genuinely cross-route components
  go in top-level `components/`. Apply the same test before adding a new shared
  component.
- **Routing APIs**: `next/navigation` (`useRouter`, `useParams`, etc.), never the Pages
  Router's `next/router`.
- **Fonts** load via `next/font/google` (`app/layout.tsx`), not a `<link>` tag or CSS
  `@import` — keep new fonts on that path for the same reason (no layout shift, no
  render-blocking request).
- **Images** go through `next/image`, not a bare `<img>`. Icons and the brand mark are
  inline SVG components instead (`components/BrandMark.tsx`, `lucide-react`) — they
  recolor from tokens and cost no request.
- **Env vars**: only `NEXT_PUBLIC_*` names are exposed to the client (`API_BASE_URL`,
  `ENABLE_MSW`, the Google Maps key); anything server-only (e.g. `PORT` for
  docker-compose) stays unprefixed. Don't prefix a secret with `NEXT_PUBLIC_` to "make it
  work" client-side.
- **No `loading.tsx`/`error.tsx` route files.** Because screens are Client Components,
  loading/error states are modeled explicitly in each hook's return value (`isLoading`,
  `error`, `notFound`, `forbidden` — see `useEstablishmentDashboard`) and handled in the
  component body, not via the App Router's special files. Follow that hook-state pattern
  for new screens rather than introducing `loading.tsx`/`error.tsx`, which would only
  fire for the (currently unused) server-render path.
- **Metadata**: static `export const metadata: Metadata` at the root layout
  (`app/layout.tsx`); add per-route metadata the same declarative way rather than
  mutating `document.title` imperatively.

## Avoid duplication / magic values

- **No inline endpoint paths.** Every backend path is a named export (or builder
  function for parameterized ones) in `constants/api.ts` — services import from there,
  they never inline a `/api/v1/...` string. Add new endpoints the same way, grouped
  under the existing `// --- X Endpoints ---` comment blocks.
- **No inline user-facing strings.** Spanish copy for a screen lives in a single `as
const` object in `constants/<domain>.ts` (e.g. `ESTABLISHMENT_DASHBOARD_PAGE`,
  `CREATE_ESTABLISHMENT_PAGE` in `constants/establishments.ts`), imported into the
  component (often `as COPY`) rather than written directly in JSX. This also gives
  parameterized copy (`atRisk: (n, total) => ...`) one place to live instead of template
  literals scattered across a component. When two screens share the exact same fields
  (e.g. the create-establishment form and the request-review panel both use
  name/address/city/province), factor that into one shared constant
  (`ESTABLISHMENT_FORM_FIELDS`) instead of duplicating the labels/placeholders in both
  files.
- **No magic numbers/classnames.** Repeated numeric/config values (`PAGE_SIZE`,
  `FILTER_DEBOUNCE_MS`) and repeated Tailwind class strings (`SELECT_CLASS`) are named
  constants, not literals re-typed at each call site.
- **Storage keys** are named constants (`constants/tokenStorage.ts`), never a bare
  string literal passed to `localStorage`.
- **Colors** come from the theme, never from a component. Literal hexes live only in
  `app/globals.css`; a status's colors come from `constants/theme.ts` (`TONE_PILL_CLASS`,
  `TONE_BANNER_CLASS`, `TONE_ROW_CLASS`, `OVERLAY_CLASS`). `constants/theme.ts` is the
  one deliberate exception to the co-location rule above: a tone map is a design decision shared
  by every screen, so it lives once. What stays per-domain is the _status → tone_
  mapping and its Spanish label (`RELATION_STATUS_TONE` beside `RELATION_STATUS_LABELS`
  in `constants/establishments.ts`) — see `docs/architecture.md` § Theme.
- **Brand strings** (the product name "Raíz", the organization name) come from
  `constants/brand.ts`, not retyped per screen.
- **Sort/filter option lists** pair a `{ value, label }[]` array (for
  `<select>`/multi-select options) with a `Record<Value, string>` label map (for
  rendering a value elsewhere, e.g. `RELATION_STATUS_OPTIONS` +
  `RELATION_STATUS_LABELS`) rather than deriving one from the other ad hoc or
  duplicating the label text in two places.
- **Don't redefine a shape.** If a type already exists in `types/*.ts` or can be derived
  via `z.infer<typeof someSchema>` from `schemas/*.schema.ts`, import/derive it — don't
  hand-write a parallel interface.
- **Classnames**: use `cn()` (`lib/utils.ts`, clsx + tailwind-merge) to combine
  conditional/merged Tailwind classes instead of manual template-literal concatenation.
- Before adding a new constant/type/util, grep for an existing one in `constants/`,
  `types/`, and `lib/` first — the per-domain file layout (one `constants/<domain>.ts`,
  one `types/<domain>.ts` per feature area) makes this a quick check.
