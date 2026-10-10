/**
 * Headers the backoffice sets on every call it forwards to the backend, so the
 * backend can count attempts per user. The reasoning is in
 * `docs/adr/0004-forward-user-ip-to-backend.md`.
 */

/** Carries the secret the backoffice shares with the backend. */
export const SERVICE_TOKEN_HEADER = "x-internal-token";

/** Carries the address of the user who made the call. */
export const FORWARDED_USER_IP_HEADER = "x-client-ip";

/** Where the edge proxy writes the caller's address, unless `CLIENT_IP_HEADER` names another. */
export const DEFAULT_EDGE_IP_HEADER = "x-real-ip";
