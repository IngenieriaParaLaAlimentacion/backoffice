"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import BrandLockup from "@/components/BrandLockup";
import SideBar from "@/components/SideBar";
import MobileNav from "@/components/MobileNav";
import React from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      <SideBar />

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground md:hidden">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-2 text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Menu size={20} />
          </button>
          <BrandLockup surface="dark" />
        </header>

        <main className="flex flex-col flex-1 overflow-y-auto">{children}</main>
      </div>

      <MobileNav open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen} />
    </div>
  );
}
