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
  /** The "Usuarios" screen. The backend 403s non-admins on the listing
   * endpoints, so the screen has nothing to show without this. */
  | "users.view"
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
  "users.view",
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

/** The roles a role change may assign. `superadmin` is never offered. */
const ASSIGNABLE_ROLES = [
  "field_worker",
  "analyst",
  "admin",
] as const satisfies readonly UserRole[];

/**
 * Which users' roles each actor may change, by the target's current role. An
 * admin can't demote another admin (nor anyone it promoted to admin); nobody
 * touches a superadmin.
 */
const ROLE_CHANGE_TARGETS: Record<UserRole, readonly UserRole[]> = {
  superadmin: ["field_worker", "analyst", "admin"],
  admin: ["field_worker", "analyst"],
  analyst: [],
  field_worker: [],
};

/**
 * The roles `actor` may move a `target`-role user to — empty when it may not
 * change that user's role at all. Lives outside `can()` because it depends on
 * two roles, not just the viewer's. The caller still has to rule out the
 * viewer's own profile. Like `can`, a UX guard: the backend answers 403.
 */
export function assignableRoles(
  actor: UserRole | null,
  target: UserRole | null | undefined,
): UserRole[] {
  if (!actor || !target) return [];
  if (!ROLE_CHANGE_TARGETS[actor]?.includes(target)) return [];
  return ASSIGNABLE_ROLES.filter((role) => role !== target);
}
