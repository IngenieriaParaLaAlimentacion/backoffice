/**
 * The roles the backend assigns. `superadmin` and `admin` differ in backend
 * capabilities but not in what the backoffice shows, so `lib/permissions.ts`
 * grants them the same set.
 */
export type UserRole = "superadmin" | "admin" | "analyst" | "field_worker";

export type ProfileEstablishment = {
  id: string;
  name: string;
  address: string;
  status: string;
};

export type ProfileResponse = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  role: UserRole;
  establishments?: ProfileEstablishment[] | null;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Superadministrador",
  admin: "Administrador",
  analyst: "Analista",
  field_worker: "Relevador",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  pending: "Pendiente",
  invited: "Invitado",
  suspended: "Suspendido",
};
