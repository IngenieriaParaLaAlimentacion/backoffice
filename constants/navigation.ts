import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  LucideIcon,
  Ruler,
  Users,
} from "lucide-react";
import type { Route } from "next";
import { can, Permission } from "@/lib/permissions";
import { UserRole } from "@/types/user";

export type NavItem = {
  label: string;
  href: Route;
  /** The icon component, not an element — keeps this file plain `.ts`. */
  icon: LucideIcon;
  /** When set, the item only shows for roles holding this permission. */
  permission?: Permission;
};

/**
 * The dashboard's primary navigation, shared by the sidebar, the mobile
 * drawer and the home screen's "Accesos disponibles" grid — so gating an item
 * here removes it from all three at once.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Solicitudes",
    href: "/dashboard/requests",
    icon: ClipboardList,
    permission: "requests.view",
  },
  {
    label: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
    permission: "users.view",
  },
  {
    label: "Establecimientos",
    href: "/dashboard/establishments",
    icon: Building2,
  },
  { label: "Sujetos", href: "/dashboard/subjects", icon: Users },
  {
    label: "Mediciones",
    href: "/dashboard/anthropometric-measurements",
    icon: Ruler,
  },
  { label: "Encuestas", href: "/dashboard/surveys", icon: ListChecks },
];

export const PROFILE_NAV_ITEM = {
  label: "Perfil",
  href: "/dashboard/profile",
} as const;

/** The nav items `role` is allowed to see, in declaration order. */
export function visibleNavItems(role: UserRole | null): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => !item.permission || can(role, item.permission),
  );
}
