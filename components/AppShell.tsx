"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 md:hidden">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="rounded-md p-2 text-primary transition-colors hover:bg-accent"
          >
            <Menu size={20} />
          </button>
          <Image
            src="/logo.png"
            alt="Logo"
            width={28}
            height={28}
            priority
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="truncate text-sm font-semibold">
            Ingeniería Para La Alimentación
          </span>
        </header>

        <main className="flex flex-col flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <MobileNav open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen} />
    </div>
  );
}
