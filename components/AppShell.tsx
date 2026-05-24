"use client";

import SideBar from "@/components/SideBar";
import React from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen">
      <SideBar />
      <main className="flex flex-1">{children}</main>
    </div>
  );
}
