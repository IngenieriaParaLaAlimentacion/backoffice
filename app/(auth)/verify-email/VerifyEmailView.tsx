"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/services/auth.service";

type VerifyEmailViewProps = {
  token: string;
};

type VerificationStatus = "verifying" | "success" | "error";

export default function VerifyEmailView({ token }: VerifyEmailViewProps) {
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    verifyEmailAction(token)
      .then(() => setStatus("success"))
      .catch((err: Error) => {
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Verificando tu email
        </h1>
        <p className="text-sm text-muted-foreground">
          Estamos confirmando tu dirección de correo. Aguardá un momento...
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            ¡Email verificado!
          </h1>
          <p className="text-sm text-muted-foreground">
            Tu dirección de correo fue confirmada correctamente. Ya podés
            iniciar sesión.
          </p>
        </div>
        <Button render={<Link href="/signin" />} size="lg" className="w-full">
          Ir a iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          No pudimos verificar tu email
        </h1>
        <p className="text-sm text-muted-foreground">
          El enlace de verificación no es válido o ya expiró.
        </p>
      </div>
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Button
        render={<Link href="/signin" />}
        size="lg"
        variant="outline"
        className="w-full"
      >
        Volver al inicio de sesión
      </Button>
    </div>
  );
}
