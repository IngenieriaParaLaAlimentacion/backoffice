"use client";

import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SessionProvider, useSession } from "@/context/SessionContext";
import FullScreenMessage from "@/components/FullScreenMessage";
import { SESSION } from "@/constants/permissions";

/**
 * Holds the shell back until the role is known. Rendering `AppShell` first
 * would flash admin-only nav items and cards at analysts (and the reverse at
 * admins) on every load, since every role check would start out `false`.
 */
function SessionGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isLoading, error, refetch } = useSession();

  if (isLoading) return null;

  // Falling through with no role would silently render the app as if the user
  // had no permissions, which reads as a broken screen rather than a failure.
  if (error) {
    return (
      <FullScreenMessage
        title={SESSION.loadError}
        body={SESSION.loadErrorBody}
        actionLabel={SESSION.retry}
        onAction={refetch}
      />
    );
  }

  return <AppShell>{children}</AppShell>;
}

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

  return (
    <SessionProvider>
      <SessionGate>{children}</SessionGate>
    </SessionProvider>
  );
}
