"use client";

import { Menu, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BrandLockup from "@/components/BrandLockup";
import SideBarItem from "./SideBarItem";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/context/SessionContext";
import { PROFILE_NAV_ITEM, visibleNavItems } from "@/constants/navigation";

const DRAWER_OPEN_WIDTH = 220;
const DRAWER_CLOSED_WIDTH = 60;
const DRAWER_MIN_WIDTH = 180;
const DRAWER_MAX_WIDTH = 300;

/**
 * Logout sits on the dark-earth surface, where raw `--destructive` (ladrillo
 * `#A9432E`) is effectively unreadable. `--sidebar-destructive` is the
 * lightened brick the design uses there. Shared with `MobileNav`, whose drawer
 * is the same surface.
 */
export const LOGOUT_BUTTON_CLASS =
  "mx-2 mb-3 bg-transparent text-sidebar-destructive border-sidebar-destructive/60 hover:bg-sidebar-destructive/15 hover:text-sidebar-destructive";

export default function SideBar() {
  const { logout } = useAuth();
  const { role } = useSession();
  const navItems = visibleNavItems(role);
  const { replace } = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openWidth, setOpenWidth] = useState(DRAWER_OPEN_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, width: DRAWER_OPEN_WIDTH });
  const drawerWidth = isSidebarOpen ? openWidth : DRAWER_CLOSED_WIDTH;

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nextWidth =
        dragStart.current.width + (e.clientX - dragStart.current.x);
      setOpenWidth(
        Math.min(DRAWER_MAX_WIDTH, Math.max(DRAWER_MIN_WIDTH, nextWidth)),
      );
    };
    const handleMouseUp = () => setIsResizing(false);

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    dragStart.current = { x: e.clientX, width: openWidth };
    setIsResizing(true);
  };

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
      className={`relative hidden md:flex md:flex-col h-dvh bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden shrink-0 ${
        isResizing ? "" : "transition-[width] duration-200 ease-in-out"
      }`}
      style={{ width: drawerWidth }}
    >
      <div className="h-16 flex items-center gap-2 px-2">
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          aria-label={isSidebarOpen ? "Contraer menú" : "Expandir menú"}
          aria-expanded={isSidebarOpen}
          className="p-2 rounded-md text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <Menu size={20} />
        </button>
        {isSidebarOpen && (
          <BrandLockup surface="dark" markOnly className="ml-auto" />
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex flex-col flex-1 gap-1 px-2 py-2">
        {navItems.map(({ icon: Icon, ...item }) => (
          <SideBarItem
            {...item}
            key={item.href}
            icon={<Icon size={20} />}
            isSidebarOpen={isSidebarOpen}
          />
        ))}
      </nav>

      <div className="px-2 pb-2">
        <SideBarItem
          {...PROFILE_NAV_ITEM}
          icon={<User size={20} />}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      {isSidebarOpen && (
        <Button
          variant="outline"
          className={LOGOUT_BUTTON_CLASS}
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </Button>
      )}

      {isSidebarOpen && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-sidebar-primary/40 active:bg-sidebar-primary/60"
        />
      )}
    </aside>
  );
}
