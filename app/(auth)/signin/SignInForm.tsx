"use client";

import { Alert, Button, Stack } from "@mui/material";
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
      <Stack spacing={2}>
        <AppTextField
          name={"email"}
          control={control}
          placeholder="Enter your email"
          label="Email"
          required
          onChange={() => clearErrors("form")}
        />
        <AppTextField
          control={control}
          name="password"
          required
          placeholder="Enter your password"
          label="Password"
          type="password"
          onChange={() => clearErrors("form")}
        />
        {errors.form && <Alert severity="error">{errors.form?.message}</Alert>}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting || !isValid}
          loading={isSubmitting}
          disableElevation
          size="large"
        >
          Sign In
        </Button>
      </Stack>
    </form>
  );
}
