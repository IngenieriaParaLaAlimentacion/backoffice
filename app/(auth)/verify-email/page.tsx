import { use } from "react";
import VerifyEmailView from "@/app/(auth)/verify-email/VerifyEmailView";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = use(searchParams);

  if (!token) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Enlace inválido</h1>
        <p className="text-sm text-muted-foreground">
          El enlace de verificación no es válido o ha expirado.
        </p>
      </div>
    );
  }

  return <VerifyEmailView token={token} />;
}
