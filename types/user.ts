/**
 * The roles the backend assigns. `superadmin` and `admin` differ in backend
 * capabilities but not in what the backoffice shows, so `lib/permissions.ts`
 * grants them the same set.
 */
export type UserRole = "superadmin" | "admin" | "analyst" | "field_worker";

export type EstablishmentRelationStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "revoked"
  | "withdrawn";

export type ProfileEstablishment = {
  id: string;
  name: string;
  address?: string;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  city?: string;
  province?: string;
  characterization_status?: string;
  status: string;
};

export type EstablishmentWithStatus = ProfileEstablishment;

export type ProfileResponse = {
  id: string;
  email: string;
  name: string;
  last_name: string;
  role: UserRole;
  locality?: string | null;
  contact_phone?: string | null;
  description?: string | null;
  establishments?: ProfileEstablishment[] | null;
};

export type UpdateProfilePayload = {
  name: string;
  last_name: string;
  locality?: string | null;
  contact_phone?: string | null;
  description?: string | null;
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
