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
  professional: "Profesional",
  establishment_manager: "Encargado de establecimiento",
};
