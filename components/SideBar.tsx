"use client";

import {
  Menu,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  ListChecks,
  Users,
  User,
  Building2,
  Ruler,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import SideBarItem from "./SideBarItem";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const DRAWER_OPEN_WIDTH = 220;
const DRAWER_CLOSED_WIDTH = 60;

export const navItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: "Solicitudes",
    href: "/dashboard/solicitudes",
    icon: <ClipboardList size={20} />,
  },
  {
    label: "Usuarios",
    href: "/dashboard/usuarios",
    icon: <Users size={20} />,
  },
  {
    label: "Establecimientos",
    href: "/dashboard/establecimientos",
    icon: <Building2 size={20} />,
  },
  {
    label: "Sujetos",
    href: "/dashboard/sujetos",
    icon: <Users size={20} />,
  },
  {
    label: "Mediciones",
    href: "/dashboard/mediciones-antropometricas",
    icon: <Ruler size={20} />,
  },
  {
    label: "Encuestas",
    href: "/dashboard/encuestas",
    icon: <ListChecks size={20} />,
  },
];

export default function SideBar() {
  const { logout } = useAuth();
  const { replace } = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const drawerWidth = isSidebarOpen ? DRAWER_OPEN_WIDTH : DRAWER_CLOSED_WIDTH;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    } finally {
      replace("/signin");
    }
  };

  return (
    <aside
      className="hidden md:flex md:flex-col h-dvh bg-card border-r border-border overflow-hidden shrink-0 transition-[width] duration-200 ease-in-out"
      style={{ width: drawerWidth }}
    >
      <div className="h-16 flex items-center gap-2 px-2">
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-2 rounded-md text-primary hover:bg-accent transition-colors"
        >
          <Menu size={20} />
        </button>
        {isSidebarOpen && (
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            priority
            className="ml-auto h-8 w-8 shrink-0 object-contain"
          />
        )}
      </div>

      <Separator />

      <nav className="flex flex-col flex-1 gap-1 px-2 py-2">
        {navItems.map((item) => (
          <SideBarItem
            {...item}
            key={item.href}
            isSidebarOpen={isSidebarOpen}
          />
        ))}
      </nav>

      <div className="px-2 pb-2">
        <SideBarItem
          href="/dashboard/perfil"
          label="Perfil"
          icon={<User size={20} />}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {isSidebarOpen && (
        <Button
          variant="outline"
          className="mx-2 mb-3 text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </Button>
      )}
    </aside>
  );
}
