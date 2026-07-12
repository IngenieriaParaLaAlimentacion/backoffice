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
  role: string;
  establishments?: ProfileEstablishment[] | null;
};

export const ROLE_LABELS: Record<string, string> = {
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
