import SignInForm from "@/app/(auth)/signin/SignInForm";
import Link from "next/link";

export default function SignInPage() {
  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold text-center">Iniciar sesión</h1>
      </div>
      <SignInForm />
      <Link
        href="/forgot-password"
        className="text-sm text-accent-foreground hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </>
  );
}
