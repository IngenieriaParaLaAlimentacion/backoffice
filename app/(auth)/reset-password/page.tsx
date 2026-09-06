import ResetPasswordForm from "@/app/(auth)/reset-password/ResetPasswordForm";
import { use } from "react";

type ResetPasswordProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function ResetPassword({ searchParams }: ResetPasswordProps) {
  const { token } = use(searchParams);
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Restablecer contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Creá una nueva contraseña.
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </>
  );
}
