"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMeAction } from "@/services/user.service";
import { ProfileResponse } from "@/types/user";
import { navItems } from "@/components/SideBar";
import { Card } from "@/components/ui/card";

// Quick-access cards mirror the sidebar, minus the dashboard self-link.
const accessItems = navItems.filter((item) => item.href !== "/dashboard");

export default function DashboardPage() {
  const { makeAuthorizedRequest } = useAuth();
  const [, setProfile] = useState<ProfileResponse | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getMeAction(makeAuthorizedRequest);
      setProfile(data);
    } catch {
      // Silently ignore: the greeting falls back to a generic message.
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-8 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              priority
              className="h-28 w-28 object-contain"
            />
            <span className="text-left text-2xl font-bold leading-tight tracking-tight text-primary">
              Ingeniería
              <br />
              Para La
              <br />
              Alimentación
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido!</h1>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Accesos disponibles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accessItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
