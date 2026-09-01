import { UserRole } from "@/types/user";

/**
 * A named capability the UI can gate on. Only screens/actions that *some*
 * role loses need an entry here — anything absent from this union is
 * available to every authenticated user (home, usuarios, establecimientos,
 * sujetos, mediciones, encuestas), which keeps the list short and explicit.
 *
 * These are **UX guards only**: they hide what a role can't act on so the
 * screen doesn't offer dead buttons. The backend is the real authorization
 * boundary and still answers 403 to anything it shouldn't allow.
 */
export type Permission =
  /** The "Solicitudes" screen and its two tabs (user + establishment access). */
  | "requests.view"
  /** Creating an establishment outright (button + `/establishments/create`). */
  | "establishments.create"
  /** The "Solicitudes" tab inside Establecimientos (approve/reject new ones). */
  | "establishments.requests.view"
  /** Inviting admins/analysts from the Usuarios screen. */
  | "users.invite"
  /** Revoking a field worker's access to an establishment. */
  | "users.revokeAccess"
  /** Deleting a survey. */
  | "surveys.delete";

const ALL_PERMISSIONS = [
  "requests.view",
  "establishments.create",
  "establishments.requests.view",
  "users.invite",
  "users.revokeAccess",
  "surveys.delete",
] as const satisfies readonly Permission[];

/**
 * An analyst sees every screen except the ones that grant access or
 * permissions, and can do everything on the ones it does see except grant
 * access, create establishments outright or delete surveys.
 *
 * `field_worker` has no backoffice permissions yet — its access is scoped to
 * its own issue.
 */
const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  superadmin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  analyst: [],
  field_worker: [],
};

/** `null` (role not resolved yet, or unknown) grants nothing. */
export function can(role: UserRole | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
