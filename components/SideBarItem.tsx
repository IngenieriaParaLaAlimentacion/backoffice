"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";

type SideBarItemProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  isSidebarOpen: boolean;
};

export default function SideBarItem({
  href,
  icon,
  label,
  isSidebarOpen,
}: SideBarItemProps) {
  const pathname = usePathname();
  const isSelected = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span
        className="overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200 ease-in-out"
        style={{
          opacity: isSidebarOpen ? 1 : 0,
          maxWidth: isSidebarOpen ? 160 : 0,
        }}
      >
        {label}
      </span>
    </Link>
  );
}
