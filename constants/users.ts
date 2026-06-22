export const ROLE_SECTIONS = [
  { role: "admin", label: "Administradores" },
  { role: "establishment_manager", label: "Relevadores" },
  { role: "professional", label: "Profesionales" },
] as const;

export const USERS_PAGE = {
  title: "Usuarios",
  subtitle: "Usuarios aceptados",
  viewAll: "Ver Todos",
  noUsers: "No hay usuarios",
  columns: {
    name: "Nombre",
    email: "Email",
    establishments: "Establecimientos",
  },
  pagination: (page: number, total: number) => `Página ${page} de ${total}`,
} as const;
