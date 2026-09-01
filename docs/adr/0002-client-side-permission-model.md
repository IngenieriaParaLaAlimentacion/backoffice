# 2. Client-side permission model

Date: 2026-08-31

## Status

Accepted.

## Context

The backoffice serves four roles (`superadmin`, `admin`, `analyst`, `field_worker`) that
see different screens and actions. Before this decision the only authorization primitive
was `hooks/useIsAdmin` — a hook that called `GET /users/me` and returned a bare boolean.
It had three problems worth recording, because each one shaped the replacement:

- **No sharing.** Every consumer mounted its own fetch. The home screen made two
  `/users/me` requests (`useIsAdmin` plus a `getMeAction` whose result was discarded).
- **No loading state.** It returned `false` until the fetch resolved, so admin-only UI
  flashed in after render.
- **A boolean, not a capability.** The analyst rules aren't "not admin": an analyst keeps
  most actions on the screens it can see and loses a specific few. `isAdmin` couldn't
  express that without spreading role literals through components.

The obvious alternative — a Next.js `middleware.ts` or Server Component guard — is
**closed to us**. Auth is a localStorage token by deliberate choice (see
`docs/conventions.md` § Client Components by default): the server never sees it, so a
server-side guard has nothing to read. Changing that means moving to cookie auth, a
far larger change than role-based views.

## Decision

Authorization lives entirely on the client, as three layers:

- `lib/permissions.ts` — a pure `can(role, permission)` over a role→permission table.
  Components ask for a **named capability**, never a role.
- `context/SessionContext.tsx` — resolves the profile once per session and binds `can`
  to it.
- `components/RequirePermission.tsx` — route-level 403 for URLs typed by hand.

Only capabilities that some role loses are enumerated; everything else is open to any
authenticated user.

## Consequences

- One `/users/me` per session instead of one per role-checking component.
- The dashboard shell blocks on the role resolving, trading a short delay before first
  paint for the removal of every role-dependent flash. It also means a failed
  `/users/me` must be surfaced (retry screen) rather than treated as "no permissions".
- **The backend remains the authorization boundary.** Everything here is UX: it stops
  screens from offering buttons that would 403. Anyone can edit localStorage or call the
  API directly, so no rule may exist _only_ here — each one needs its backend
  counterpart.
- Adding a role means one entry in `UserRole`, `ROLE_LABELS` and `ROLE_PERMISSIONS`; the
  `Record<UserRole, …>` types make the compiler point at all three.
- Field workers hold no backoffice permissions yet; their access is scoped to its own
  issue and will be an edit to the table, not a new mechanism.
