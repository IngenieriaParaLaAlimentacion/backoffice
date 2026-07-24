"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LogOut, User, X } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SideBarItem from "./SideBarItem";
import { navItems } from "./SideBar";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const { logout } = useAuth();
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
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 z-40 md:hidden" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex h-full w-full max-w-[260px] flex-col overflow-y-auto border-r border-border bg-card p-0 shadow-xl md:hidden">
          <div className="flex h-14 items-center gap-2 px-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={28}
              height={28}
              priority
              className="h-7 w-7 shrink-0 object-contain"
            />
            <Dialog.Title className="text-sm font-semibold">Menú</Dialog.Title>
            <Dialog.Close
              render={<button type="button" />}
              className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <Separator />

          <nav className="flex flex-1 flex-col gap-1 px-2 py-2">
            {navItems.map((item) => (
              <SideBarItem {...item} key={item.href} isSidebarOpen />
            ))}
          </nav>

          <div className="px-2 pb-2">
            <SideBarItem
              href="/dashboard/perfil"
              label="Perfil"
              icon={<User size={20} />}
              isSidebarOpen
            />
          </div>

          <Button
            variant="outline"
            className="mx-2 mb-3 text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
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
