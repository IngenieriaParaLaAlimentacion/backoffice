"use client";

import { Alert, Button, Stack } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordAction } from "@/services/auth.service";
import {
  ForgotPasswordInput,
  forgotPasswordSchema,
} from "@/schemas/forgotPassword.schema";
import AppTextField from "@/components/AppTextField";

export default function ForgotPasswordForm() {
  const {
    formState: { isSubmitting, isValid, errors },
    getValues,
    control,
    handleSubmit,
    setError,
    clearErrors,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "all",
    defaultValues: { email: "" },
  });
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleForgotPassword({ email }: ForgotPasswordInput) {
    try {
      await forgotPasswordAction(email);
      setIsSuccess(true);
    } catch (err) {
      setError("form", { message: (err as Error).message });
    }
  }

  if (isSuccess) {
    return (
      <Alert severity="success">
        We have sent a reset link to {getValues("email")}. Please check your
        inbox to proceed with the change.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleForgotPassword)}>
      <Stack spacing={2}>
        <AppTextField
          name={"email"}
          control={control}
          placeholder="Enter your email"
          onChange={() => clearErrors("form")}
          label="Email"
          required
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
          Send Link
        </Button>
      </Stack>
    </form>
  );
}
