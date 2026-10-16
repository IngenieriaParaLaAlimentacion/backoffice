# ADR-0004: Forward the user's IP address to the backend with `proxy.ts`

- **Status**: Accepted
- **Date**: 2026-10-08
- **Deciders**: Backoffice team
- **Related**: [ADR-0002](./0002-client-side-permission-model.md) (client-side permissions), backend ADR-0019 (rate limiting on authentication endpoints), backend issue #174

## Context

The browser never calls the backend. Every call goes to the backoffice's own origin
(`/api/v1/...`) and the Next.js server forwards it through the `rewrites` in
`next.config.ts` (see `docs/architecture.md` § API base URL / rewrites). The backend therefore
sees the address of the Next.js server, not the user's.

The backend limits login and other authentication attempts per IP address (backend
ADR-0019). With every backoffice call arriving from one address, all users share one counter,
and one person guessing passwords could lock all of them out.

The backend counts a request against a user address reported by the backoffice only when the
request carries a secret the two services share. So each forwarded call has to carry two
headers, and the second depends on data from the request itself: the address the edge proxy in
front of the backoffice saw. The `rewrites` configuration is static and cannot copy a value
from one request header into another, and the backoffice has no server-side code of its own. The
auth token is kept in the browser and the server never sees it, and permissions are decided on
the client (ADR-0002), so nothing runs on the server for each request.

## Decision

A `proxy.ts` at the project root (Next.js 16's replacement for `middleware.ts`, running on the
Node.js runtime), matched only on `/api/:path*`. For each call it:

1. Removes `x-internal-token` and `x-client-ip` if the browser sent them.
2. Sets `x-client-ip` to the address in the header named by `CLIENT_IP_HEADER` (default
   `x-real-ip`), which the edge proxy writes and overwrites if the client sent one.
3. Sets `x-internal-token` to `INTERNAL_SERVICE_TOKEN`.

The rewrite then forwards the call to the backend with those two headers.

- **Header names** `x-internal-token` and `x-client-ip` are constants: they are the contract
  with the backend, and moving to another host does not change them. Only the header the edge
  proxy writes and the secret are configuration.
- **Both variables are server-only** (no `NEXT_PUBLIC_` prefix) and are read at runtime, so the
  secret never reaches the browser or the bundle, and changing them needs a restart, not a
  rebuild.
- **One header, no `X-Forwarded-For` fallback.** The first entry of `X-Forwarded-For` can be
  written by the client, and the backend believes the address whenever the secret is present, so
  a fallback would let a user choose the counter they are counted against.
- **Missing configuration is harmless.** Without `INTERNAL_SERVICE_TOKEN` neither header is
  sent, and the call goes through without them. If the address header is missing, only the token
  is sent; the backend logs a warning and counts the call against the server's address.
- **It does nothing else.** It reads no token, makes no network call and decides nothing about
  permissions. ADR-0002 rules out server-side guards because the server never sees the token;
  this proxy is not a guard, it only copies an address, so that decision stands.
- **Under MSW** (`NEXT_PUBLIC_ENABLE_MSW=true`) the browser intercepts the call before it reaches
  Next.js, so the proxy does not take part.

## Consequences

_Positives_

- Each backoffice user is counted against their own address.
- The rewrite is not modified. If the proxy fails or is misconfigured, calls still go through
  and the backend counts them against the server's address.

_Negatives_

- The backoffice gains its first server-side code. Next.js recommends `proxy` as a last resort, so it
  has to stay minimal.
- One more secret, held by two services. Rotating it means changing it in both; in between, the
  backoffice's calls are counted against the server's address and nothing is rejected.
- The address depends on the edge proxy in front of the backoffice writing it into the
  configured header and overwriting any value the client sent. It was checked on Railway. On
  another host, send a forged value and confirm the backend ignores it.
- The `matcher` has to be a constant: Next.js analyses it at build time.

## Alternatives considered

**A route handler replacing the rewrite** (`app/api/[...path]/route.ts`) — rejected. It gives
full control and would let the backend URL change without a rebuild, but it means rewriting what
the rewrite already does: methods, request bodies, headers that must not be copied, errors, and
streaming the CSV exports. A mistake there would break every API call, where a mistake in the
proxy only costs the address.

**The browser calling the backend directly** — rejected. The backend would have to accept
cross-origin calls from the browser, and it would change how the backoffice reaches the API.

**Relying on the private network to carry the address** — rejected. It would depend on how the
platform routes traffic, and the backend's trust in the address rests on the secret, not on the
network.
