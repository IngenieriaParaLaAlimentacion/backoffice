"use client";

import SideBar from "@/components/SideBar";
import React from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar />
      <main className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
