"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResetPasswordInput,
  resetPasswordSchema,
} from "@/schemas/resetPassword.schema";
import AppTextField from "@/components/AppTextField";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

type ResetPasswordFormProps = {
  token?: string;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
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
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword } = useAuth();

  async function handleResetPassword({ password }: ResetPasswordInput) {
    if (!token) {
      setError("form", { message: "Token inválido o inexistente." });
      return;
    }

    try {
      await resetPassword(password, token);
      setIsSuccess(true);
      setTimeout(() => router.replace("/signin"), 3000);
    } catch (err) {
      setError("form", { message: (err as Error).message });
    }
  }

  if (isSuccess) {
    return (
      <Alert>
        <AlertDescription>
          ¡Tu contraseña fue restablecida correctamente! Redirigiendo...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleResetPassword)}>
      <div className="flex flex-col gap-3">
        <AppTextField
          name="password"
          control={control}
          label="Contraseña"
          required
          placeholder="Ingresá tu nueva contraseña"
          type="password"
          onChange={() => clearErrors("form")}
        />
        <AppTextField
          name="confirmPassword"
          control={control}
          label="Confirmar contraseña"
          required
          placeholder="Volvé a ingresar tu contraseña"
          type="password"
          onChange={() => clearErrors("form")}
        />
        {errors.form && (
          <Alert variant="destructive">
            <AlertDescription>{errors.form.message}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Guardando..." : "Confirmar contraseña"}
        </Button>
      </div>
    </form>
  );
}
