"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
      <Alert>
        <AlertDescription>
          We have sent a reset link to {getValues("email")}. Please check your
          inbox to proceed with the change.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleForgotPassword)}>
      <div className="flex flex-col gap-3">
        <AppTextField
          name="email"
          control={control}
          placeholder="Enter your email"
          onChange={() => clearErrors("form")}
          label="Email"
          required
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
          {isSubmitting ? "Sending..." : "Send Link"}
        </Button>
      </div>
    </form>
  );
}
