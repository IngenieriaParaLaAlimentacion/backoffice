"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import AppTextField from "@/components/AppTextField";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import {
  acceptInviteSchema,
  AcceptInviteInput,
} from "@/schemas/acceptInvite.schema";
import { acceptInviteAction } from "@/services/auth.service";
import { AcceptInviteRequest } from "@/types/auth";
import { getErrorMessage } from "@/lib/errorMessages";
import { ACCEPT_INVITE_FORM } from "@/constants/auth";
import { ERROR_TYPES } from "@/lib/apiError";

type AcceptInviteFormProps = {
  token: string;
  roleLabel: string;
};

export default function AcceptInviteForm({
  token,
  roleLabel,
}: AcceptInviteFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const descriptionId = useId();

  const {
    formState: { isSubmitting, isValid, errors },
    control,
    register,
    handleSubmit,
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    mode: "all",
    defaultValues: {
      name: "",
      last_name: "",
      password: "",
      confirmPassword: "",
      locality: "",
      contact_phone: "",
      description: "",
    },
  });

  const password = useWatch({ control, name: "password" }) ?? "";

  async function handleAcceptInvite(data: AcceptInviteInput) {
    setFormError(null);
    try {
      const payload: AcceptInviteRequest = {
        token,
        new_password: data.password,
        name: data.name.trim(),
        last_name: data.last_name.trim(),
        locality: data.locality?.trim() || undefined,
        contact_phone: data.contact_phone?.trim() || undefined,
        description: data.description?.trim() || undefined,
      };
      await acceptInviteAction(payload);
      setIsSuccess(true);
    } catch (err) {
      const message = getErrorMessage(err, {
        overrides: ACCEPT_INVITE_FORM.errors,
        fallback:
          ACCEPT_INVITE_FORM.errors[ERROR_TYPES.INVALID_RECOVERY_TOKEN] ??
          ACCEPT_INVITE_FORM.submitError,
      });
      setFormError(message);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Enlace inválido</h1>
        <p className="text-sm text-muted-foreground">
          El enlace de invitación no es válido o ha expirado.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">¡Cuenta activada!</h1>
          <p className="text-sm text-muted-foreground">
            Tu contraseña y perfil fueron guardados correctamente. Ya podés
            iniciar sesión en el panel.
          </p>
        </div>
        <Alert className="border-success/30 bg-success-container text-success">
          <AlertDescription>
            ¡Invitación aceptada con éxito! Ya podés iniciar sesión con tu
            cuenta.
          </AlertDescription>
        </Alert>
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">
          Te invitaron a ser {roleLabel}
        </h1>
        <p className="text-sm text-muted-foreground">
          Completá tus datos y creá tu contraseña para activar tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleAcceptInvite)}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppTextField
              name="name"
              control={control}
              label="Nombre"
              required
              placeholder="Ingresá tu nombre"
              onChange={() => setFormError(null)}
            />
            <AppTextField
              name="last_name"
              control={control}
              label="Apellido"
              required
              placeholder="Ingresá tu apellido"
              onChange={() => setFormError(null)}
            />
          </div>

          <AppTextField
            name="password"
            control={control}
            label="Contraseña"
            required
            placeholder="Ingresá tu contraseña"
            type="password"
            onChange={() => setFormError(null)}
          />

          <PasswordRequirements password={password} />

          <AppTextField
            name="confirmPassword"
            control={control}
            label="Confirmar contraseña"
            required
            placeholder="Volvé a ingresar tu contraseña"
            type="password"
            onChange={() => setFormError(null)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AppTextField
              name="locality"
              control={control}
              label="Localidad"
              placeholder="Ej: Rosario"
              onChange={() => setFormError(null)}
            />
            <AppTextField
              name="contact_phone"
              control={control}
              label="Teléfono de contacto"
              placeholder="Ej: +54 9 341 555-1234"
              onChange={() => setFormError(null)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={descriptionId}
              className="text-sm font-medium text-foreground"
            >
              Descripción
            </label>
            <textarea
              id={descriptionId}
              {...register("description")}
              placeholder="Breve descripción personal o profesional (opcional)"
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              onChange={(e) => {
                register("description").onChange(e);
                setFormError(null);
              }}
            />
            {errors.description?.message && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full mt-2"
            size="lg"
          >
            {isSubmitting ? "Guardando..." : "Aceptar invitación"}
          </Button>
        </div>
      </form>
    </div>
  );
}
