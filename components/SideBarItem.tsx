"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";

type SideBarItemProps = {
  href: Route;
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
  // "/dashboard" (Inicio) is a prefix of every dashboard route, so it only
  // highlights on an exact match; other items also highlight on sub-routes
  // (e.g. "/dashboard/requests/establishments" under "Solicitudes").
  const isSelected =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isSelected ? "page" : undefined}
      className={cn(
        // The sidebar is a dark-earth surface, so every color here comes from
        // the `--sidebar-*` scale. `text-foreground` / `text-primary` would
        // resolve to ink and mustard on earth, which is unreadable and
        // off-brand respectively.
        "relative flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors",
        // The mustard rail marking the active item. Rendered as a border so it
        // occupies no layout width and stays put while the drawer resizes.
        "border-l-2 border-transparent",
        isSelected
          ? "border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span
        className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-opacity duration-200 ease-in-out"
        style={{ opacity: isSidebarOpen ? 1 : 0 }}
        title={label}
      >
        {label}
      </span>
    </Link>
  );
}
