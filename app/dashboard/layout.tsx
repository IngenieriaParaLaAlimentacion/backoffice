"use client";

import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) router.replace("/signin");
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
