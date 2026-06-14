import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

export default function EditarPerfilPage() {
  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Editar perfil</h1>
          <p className="text-muted-foreground text-sm">
            Edición de perfil — próximamente
          </p>
        </div>

        <Separator />

        <Link
          href="/dashboard/perfil"
          className={`${buttonVariants({ variant: "outline", size: "sm" })} self-start`}
        >
          <ArrowLeft size={14} />
          Volver
        </Link>
      </Card>
    </div>
  );
}
