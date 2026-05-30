import Link from "next/link";
import ForgotPasswordForm from "@/app/(auth)/forgot-password/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">¿Olvidaste tu contraseña?</h1>
        <p className="text-sm text-muted-foreground">
          Ingresá tu email y te enviaremos un link para restablecer tu contraseña.
        </p>
      </div>
      <ForgotPasswordForm />
      <Link href="/signin" className="text-sm text-center text-primary hover:underline">
        Volver a iniciar sesión
      </Link>
    </>
  );
}
