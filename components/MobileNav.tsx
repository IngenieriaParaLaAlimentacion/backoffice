"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LogOut, User, X } from "lucide-react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import BrandLockup from "@/components/BrandLockup";
import { OVERLAY_CLASS } from "@/constants/theme";
import { cn } from "@/lib/utils";
import SideBarItem from "./SideBarItem";
import { LOGOUT_BUTTON_CLASS } from "./SideBar";
import { useSession } from "@/context/SessionContext";
import { PROFILE_NAV_ITEM, visibleNavItems } from "@/constants/navigation";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { logout } = useAuth();
  const { role } = useSession();
  const navItems = visibleNavItems(role);
  const { replace } = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // The drawer is only meant for <md viewports (it's md:hidden). If the
  // viewport crosses into md+ while it's open (e.g. rotating a tablet),
  // close it so it doesn't sit open-but-invisible, blocking body scroll.
  useEffect(() => {
    if (!open) return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) onOpenChange(false);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [open, onOpenChange]);

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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn("fixed inset-0 z-40 md:hidden", OVERLAY_CLASS)}
        />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex h-full w-full max-w-[260px] flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-xl md:hidden">
          <div className="flex h-14 items-center gap-2 px-3">
            {/* The drawer still needs an accessible name; the brand lockup is
                the visible header, so the title is screen-reader only. */}
            <Dialog.Title className="sr-only">Menú</Dialog.Title>
            <BrandLockup surface="dark" markOnly />
            <Dialog.Close
              render={<button type="button" />}
              className="ml-auto rounded-md p-2 text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <Separator className="bg-sidebar-border" />

          <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
            {navItems.map(({ icon: Icon, ...item }) => (
              <SideBarItem
                {...item}
                key={item.href}
                icon={<Icon size={20} />}
                isSidebarOpen
              />
            ))}
          </nav>

          <div className="px-2 pb-2">
            <SideBarItem
              {...PROFILE_NAV_ITEM}
              icon={<User size={20} />}
              isSidebarOpen
            />
          </div>

          <Button
            variant="outline"
            className={LOGOUT_BUTTON_CLASS}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Cerrar Sesión
          </Button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
