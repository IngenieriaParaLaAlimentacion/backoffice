"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { SigninInput, signinSchema } from "@/schemas/signin.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import AppTextField from "@/components/AppTextField";

export default function SignInForm() {
  const {
    formState: { isSubmitting, isValid, errors },
    control,
    handleSubmit,
    setError,
    clearErrors,
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
    mode: "all",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleLogin(credentials: SigninInput) {
    try {
      await login(credentials);
      router.replace("/dashboard");
    } catch (err) {
      setError("form", { message: (err as Error).message });
    }
  }

  return (
    <form onSubmit={handleSubmit(handleLogin)}>
      <div className="flex flex-col gap-3">
        <AppTextField
          name="email"
          control={control}
          placeholder="Ingresá tu email"
          label="Email"
          required
          onChange={() => clearErrors("form")}
        />
        <AppTextField
          control={control}
          name="password"
          required
          placeholder="Ingresá tu contraseña"
          label="Contraseña"
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
          {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </div>
    </form>
  );
}
