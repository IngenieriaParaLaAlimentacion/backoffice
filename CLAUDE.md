# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Next.js (App Router) admin backoffice for "Ingeniería para la Alimentación" — a
university project for managing establishments, field workers, subjects, surveys/FIES
responses, and user access requests. It is a client of the project's REST backend. UI
strings and validation messages are in Spanish; code (identifiers, comments) and
technical documentation are in English.

## Stack

| Layer             | Technology                                       |
| ----------------- | ------------------------------------------------ |
| Framework         | Next.js (App Router), React, TypeScript          |
| UI                | Tailwind CSS 4, shadcn/ui                        |
| Data fetching     | SWR                                              |
| Forms, validation | react-hook-form, zod                             |
| Maps              | Leaflet (react-leaflet)                          |
| Tests             | Vitest, Testing Library, MSW; Playwright for E2E |
| Code quality      | ESLint 9, Prettier, Husky + lint-staged          |
| Runtime           | Node 24 LTS, Docker                              |

Versions live in `package.json`.

## Commands

```bash
npm run dev            # dev server
npm run build          # production build
npm run lint           # eslint . --max-warnings=0
npm run typecheck      # tsc --noEmit, for the app and for the E2E suite
npm run test           # vitest
npm run test:watch     # vitest --watch
npm run test:ci        # vitest run --coverage
npm run e2e            # Playwright against a disposable backend stack (needs Docker)
npm run audit          # npm audit on runtime deps, fails on high or critical
```

Run a single test file: `npx vitest run path/to/file.test.ts`. Tests are co-located
next to their subject (`lib/permissions.test.ts`, `context/SessionContext.test.tsx`);
`test-utils.tsx` exports `renderWithProviders(ui, { role })` for anything that reads the
auth or session context.

Browser E2E tests run against the real backend image, not MSW; see `docs/e2e.md` before
touching them.

Husky runs `lint-staged` on commit (eslint --fix + prettier for JS/TS, prettier for
css/md/json) — don't bypass with `--no-verify`.

## Project structure

`app/` (routes, mostly thin Client Components) → `hooks/` (data-fetching + local state
per screen) → `services/*.service.ts` (one function per API call) → `constants/api.ts`
(endpoint paths) → `lib/http.ts` (transport). `schemas/*.schema.ts` (zod) drive form
validation; `types/*.ts` hold API response shapes; `constants/*.ts` hold per-domain
copy/config; `components/ui/` is shadcn-generated, `components/` is everything else.

**Read `docs/architecture.md` before making non-trivial changes to auth, data fetching,
the geo/address adapter, or the MSW mocking setup, and `docs/features.md` before touching
the establishments map, the establishment ficha tabs, the nutrition report, or the email
verification page** — those pieces have non-obvious reasoning behind their shape and are
easy to "fix" into something that quietly breaks.

## Conventions

- This app is **Client Components by default, deliberately** (auth is a client-side
  localStorage token, not cookies/middleware) — don't convert a page to a Server
  Component fetching with a bare `fetch`, it would bypass the auth/refresh logic in
  `lib/http.ts`. The one piece of server code, `proxy.ts`, only forwards the user's IP to
  the backend; it is not an auth guard and never reads the token.
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
- **Branches and commits**: `develop` is the integration branch and `main` the release
  branch. Work on `feat/`, `fix/`, `refactor/`, `docs/` or `chore/` branches and open PRs
  into `develop`; CI enforces it. Commits follow Conventional Commits. See
  `CONTRIBUTING.md`.

## Documentation

Project documentation lives in `docs/`; the entry points are `README.md` (Spanish:
`README.es.md`) and `CONTRIBUTING.md`. Technical docs are in English; the end-user manual is
in Spanish. Do not keep the same document in both languages (the READMEs are the only
exception).

| Document               | Read it when                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture.md` | Changing auth, data fetching, the geo adapter, forms, theme, dates, MSW mocking, or the testing setup: layering, auth flow, service/error conventions                      |
| `docs/features.md`     | Touching the establishments map, the establishment ficha tabs, the nutrition report, or the email verification page: how each fits together and what is easy to break      |
| `docs/conventions.md`  | Adding code: Next.js conventions and how this repo avoids duplication and magic values                                                                                     |
| `docs/adr/`            | Understanding why a decision was made: the geo-provider adapter, the client-side permission model, the map libraries and base map, forwarding the user's IP to the backend |
| `docs/e2e.md`          | Running or changing the Playwright E2E suite: credentials, Chromium, reset, CI reports                                                                                     |
| `docs/manual-usuario/` | Updating the Spanish end-user manual (HTML, PDF and editable sources); see its `mantenimiento.md`                                                                          |
| `CONTRIBUTING.md`      | Branches, commits, PR rules, CI                                                                                                                                            |

When you add, rename, or remove a document under `docs/`, update this table and the
documentation list in the READMEs.
