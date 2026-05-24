"use client";

import SideBar from "@/components/SideBar";
import { Box } from "@mui/material";
import React from "react";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <SideBar />

      <Box component="main" sx={{ flex: 1, display: "flex" }}>
        {children}
      </Box>
    </Box>
  );
}
