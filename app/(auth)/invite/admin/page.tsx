import AcceptInviteForm from "@/app/(auth)/invite/AcceptInviteForm";
import { use } from "react";

type InviteAdminPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function InviteAdminPage({ searchParams }: InviteAdminPageProps) {
  const { token } = use(searchParams);

  if (!token) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Enlace inválido</h1>
        <p className="text-sm text-muted-foreground">
          El enlace de invitación no es válido o ha expirado.
        </p>
      </div>
    );
  }

  return <AcceptInviteForm token={token} />;
}
