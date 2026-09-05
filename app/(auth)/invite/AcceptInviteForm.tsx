"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import AppTextField from "@/components/AppTextField";
import {
  resetPasswordSchema,
  ResetPasswordInput,
} from "@/schemas/resetPassword.schema";
import { acceptInviteAction } from "@/services/auth.service";
import { getErrorMessage } from "@/lib/errorMessages";
import { ACCEPT_INVITE_FORM } from "@/constants/auth";

type AcceptInviteFormProps = {
  token: string;
  roleLabel: string;
};

export default function AcceptInviteForm({
  token,
  roleLabel,
}: AcceptInviteFormProps) {
  const [accepted, setAccepted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();

  const {
    formState: { isSubmitting, isValid, errors },
    control,
    handleSubmit,
    setError,
    clearErrors,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "all",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!isSuccess) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [isSuccess]);

  useEffect(() => {
    if (countdown === 0) router.replace("/signin");
  }, [countdown, router]);

  async function handleAcceptInvite({ password }: ResetPasswordInput) {
    try {
      await acceptInviteAction(password, token);
      setIsSuccess(true);
    } catch (err) {
      setError("form" as never, {
        message: getErrorMessage(err, {
          overrides: ACCEPT_INVITE_FORM.errors,
          fallback: ACCEPT_INVITE_FORM.submitError,
        }),
      });
    }
  }

  if (isSuccess) {
    return (
      <Alert>
        <AlertDescription>
          ¡Contraseña creada! Redirigiendo en {countdown}...
        </AlertDescription>
      </Alert>
    );
  }

  if (!accepted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">
            Te invitaron a ser {roleLabel}
          </h1>
          <p className="text-sm text-muted-foreground">
            Aceptá la invitación para crear tu contraseña y acceder al panel.
          </p>
        </div>
        <Button size="lg" className="w-full" onClick={() => setAccepted(true)}>
          Aceptar invitación
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Creá tu contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Elegí una contraseña segura para tu cuenta de {roleLabel}.
        </p>
      </div>
      <form onSubmit={handleSubmit(handleAcceptInvite)}>
        <div className="flex flex-col gap-3">
          <AppTextField
            name="password"
            control={control}
            label="Contraseña"
            required
            placeholder="Ingresá tu nueva contraseña"
            type="password"
            onChange={() => clearErrors("form" as never)}
          />
          <AppTextField
            name="confirmPassword"
            control={control}
            label="Confirmar contraseña"
            required
            placeholder="Volvé a ingresar tu contraseña"
            type="password"
            onChange={() => clearErrors("form" as never)}
          />
          {(errors as Record<string, { message?: string }>).form && (
            <Alert variant="destructive">
              <AlertDescription>
                {(errors as Record<string, { message?: string }>).form?.message}
              </AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Guardando..." : "Crear contraseña"}
          </Button>
        </div>
      </form>
    </>
  );
}
