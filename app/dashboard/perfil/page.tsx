"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMeAction } from "@/services/user.service";
import { ProfileResponse, ROLE_LABELS } from "@/types/user";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, SquarePen } from "lucide-react";

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function PerfilPage() {
  const { makeAuthorizedRequest } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMeAction(makeAuthorizedRequest);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el perfil");
    } finally {
      setIsLoading(false);
    }
  }, [makeAuthorizedRequest]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-4 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
            <p className="text-muted-foreground text-sm">Mi información personal</p>
          </div>
          <Link
            href="/dashboard/perfil/editar"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "self-start",
            })}
          >
            <SquarePen size={14} />
            Editar perfil
          </Link>
        </div>

        <Separator />

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={28} />
          </div>
        ) : profile ? (
          <div className="flex flex-col gap-4 max-w-md">
            <ProfileField label="Nombre" value={profile.name} />
            <ProfileField label="Apellido" value={profile.last_name} />
            <ProfileField label="Email" value={profile.email} />
            <ProfileField
              label="Rol"
              value={ROLE_LABELS[profile.role] ?? profile.role}
            />
            <ProfileField label="Estado de la cuenta" value="Activo" />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
