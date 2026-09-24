# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js (App Router) admin backoffice for "Ingeniería Para La Alimentación" — a
university project for managing establishments, field workers, subjects, surveys/FIES
responses, and user access requests. UI strings and validation messages are in Spanish;
code (identifiers, comments) is in English.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run lint           # eslint . --max-warnings=0
npm run typecheck      # tsc --noEmit
npm run test           # vitest
npm run test:watch     # vitest --watch
npm run test:ci        # vitest run --coverage
```

Run a single test file: `npx vitest run path/to/file.test.ts`. Tests are co-located
next to their subject (`lib/permissions.test.ts`, `context/SessionContext.test.tsx`);
`test-utils.tsx` exports `renderWithProviders(ui, { role })` for anything that reads the
auth or session context.

Husky runs `lint-staged` on commit (eslint --fix + prettier for JS/TS, prettier for
css/md/json) — don't bypass with `--no-verify`.

## Project structure

`app/` (routes, mostly thin Client Components) → `hooks/` (data-fetching + local state
per screen) → `services/*.service.ts` (one function per API call) → `constants/api.ts`
(endpoint paths) → `lib/http.ts` (transport). `schemas/*.schema.ts` (zod) drive form
validation; `types/*.ts` hold API response shapes; `constants/*.ts` hold per-domain
copy/config; `components/ui/` is shadcn-generated, `components/` is everything else.

**Read `docs/architecture.md` before making non-trivial changes to auth, data fetching,
the geo/address adapter, the establishments map, or the MSW mocking setup** — those
pieces have non-obvious reasoning behind their shape and are easy to "fix" into
something that quietly breaks.

## Conventions

- This app is **Client Components by default, deliberately** (auth is a client-side
  localStorage token, not cookies/middleware) — don't convert a page to a Server
  Component fetching with a bare `fetch`, it would bypass the auth/refresh logic in
  `lib/http.ts`.
- **Roles are permissions, not `isAdmin` checks.** Ask `useSession().can("surveys.delete")`
  for a named capability from `lib/permissions.ts`; never branch on a role literal in a
  component, and never fetch `GET /users/me` for a role — `SessionProvider` already has
  it. Gate a whole route with `<RequirePermission>` and a nav item with the `permission`
  field in `constants/navigation.ts`. See `docs/architecture.md` § Authorization — and
  remember it's a UX guard, the backend is the real boundary.
- Centralize, don't repeat: endpoint paths (`constants/api.ts`), user-facing copy
  (`constants/<domain>.ts`), storage keys, and API/schema types each have exactly one
  place to live — see `docs/conventions.md` for the full pattern and where to put new
  ones.
- **Never format a date in a component.** API timestamps are UTC instants and are
  displayed in Argentine local time via `formatTimestamp*` from `lib/format.ts`;
  `formatDate` is for `"YYYY-MM-DD"` calendar dates only. Reading `getUTCDate()` or
  calling `toLocaleDateString` inline reintroduces a 3-hour shift that dates an evening
  survey to the next day. See `docs/architecture.md` § Dates & times.
- **Never write a color in a component.** The "Raíz" palette's literal hexes live in
  `app/globals.css` and its status tones in `constants/theme.ts`; a raw hex or a
  Tailwind palette class (`emerald-500`, `amber-600`) is off-brand by construction —
  the palette has no orange, emerald or amber. See `docs/architecture.md` § Theme,
  which also covers the light-only constraint, the contrast rules that pin
  `--primary-foreground` to ink, and the sidebar's separate `--sidebar-*` scale.
- Full Next.js-specific conventions (async `params`, co-location, routing/font/image
  APIs, env var prefixing, the loading/error-state pattern, metadata) are in
  `docs/conventions.md`.

## Other docs

- `docs/architecture.md` — layering, auth flow, service/error conventions, MSW mocking,
  the geo-provider adapter, the establishments map, forms, UI components, testing setup.
- `docs/conventions.md` — Next.js conventions and how this repo avoids duplication/magic
  values.
- `docs/adr/` — architecture decision records (the geo-provider adapter choice; the
  client-side permission model; the map libraries and base map).
