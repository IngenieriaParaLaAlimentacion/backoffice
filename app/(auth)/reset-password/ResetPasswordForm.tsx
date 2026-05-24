"use client";

import { Alert, Button, Stack } from "@mui/material";
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
      setError("form", { message: "Invalid or missing token." });
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
      <Alert severity="success">
        Your password has been reset successfully! Redirecting to sign in...
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleResetPassword)}>
      <Stack spacing={2}>
        <AppTextField
          name="password"
          control={control}
          label={"Password"}
          required
          placeholder={"Enter your new password"}
          type="password"
          onChange={() => clearErrors("form")}
        />
        <AppTextField
          name="confirmPassword"
          control={control}
          label={"Confirm Password"}
          required
          placeholder={"Enter your new password again"}
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
          Confirm Password
        </Button>
      </Stack>
    </form>
  );
}
