import { z } from "zod";
import {
  confirmPasswordSchema,
  passwordSchema,
  passwordsMatch,
} from "@/schemas/password.schema";

export const resetPasswordSchema = z
  .strictObject({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
