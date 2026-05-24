"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
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
    <ListItemButton
      sx={{ borderRadius: 1, boxSizing: "border-box", p: 1, flex: 0 }}
      component={Link}
      href={href}
      selected={isSelected}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText
        primary={label}
        sx={{
          opacity: isSidebarOpen ? 1 : 0,
          maxWidth: isSidebarOpen ? 160 : 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          transition: (theme) =>
            theme.transitions.create(["opacity", "max-width"], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.shorter,
            }),
        }}
      />
    </ListItemButton>
  );
}
