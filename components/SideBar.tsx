"use client";

import { Menu, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import SideBarItem from "./SideBarItem";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const DRAWER_OPEN_WIDTH = 220;
const DRAWER_CLOSED_WIDTH = 60;

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={20} />,
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
      className="flex flex-col h-screen bg-card border-r border-border overflow-hidden shrink-0 transition-[width] duration-200 ease-in-out"
      style={{ width: drawerWidth }}
    >
      <div className="h-16 flex items-center gap-2 px-2">
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-2 rounded-md text-primary hover:bg-accent transition-colors"
        >
          <Menu size={20} />
        </button>
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

      {isSidebarOpen && (
        <Button
          variant="outline"
          className="mx-2 mb-3 text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Logout
        </Button>
      )}
    </aside>
  );
}
