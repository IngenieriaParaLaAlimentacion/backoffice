"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { createEstablishmentAction } from "@/services/establishment.service";
import {
  createEstablishmentSchema,
  CreateEstablishmentInput,
} from "@/schemas/establishment.schema";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AppTextField from "@/components/AppTextField";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function CrearEstablecimientoPage() {
  const router = useRouter();
  const { makeAuthorizedRequest } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CreateEstablishmentInput>({
    resolver: zodResolver(createEstablishmentSchema),
    defaultValues: {
      name: "",
      formatted_address: "",
      city: "",
      province: "",
    },
  });

  const onSubmit = async (data: CreateEstablishmentInput) => {
    setApiError(null);
    try {
      await createEstablishmentAction(makeAuthorizedRequest, {
        ...data,
        place_id: crypto.randomUUID(),
        latitude: 0,
        longitude: 0,
      });
      router.push("/dashboard/establecimientos");
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Error al crear el establecimiento",
      );
    }
  };

  return (
    <div className="flex flex-1 p-4">
      <Card className="flex-1 p-8 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Nuevo establecimiento
            </h1>
            <p className="text-muted-foreground text-sm">
              Completá los datos del establecimiento
            </p>
          </div>
          <Link
            href="/dashboard/establecimientos"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft size={14} />
            Volver
          </Link>
        </div>

        <Separator />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 max-w-md"
        >
          <AppTextField
            control={control}
            name="name"
            label="Nombre"
            placeholder="Ej: Comedor Central Norte"
            required
          />
          <AppTextField
            control={control}
            name="formatted_address"
            label="Dirección"
            placeholder="Ej: Av. Corrientes 1234, CABA"
            required
          />
          <AppTextField
            control={control}
            name="city"
            label="Ciudad"
            placeholder="Ej: Buenos Aires"
            required
          />
          <AppTextField
            control={control}
            name="province"
            label="Provincia"
            placeholder="Ej: CABA"
            required
          />
          {apiError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 text-sm">
              {apiError}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting && <Loader2 className="animate-spin" size={14} />}
            Crear establecimiento
          </Button>
        </form>
      </Card>
    </div>
  );
}
