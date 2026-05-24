import { z } from "zod";

export const forgotPasswordSchema = z.strictObject({
  email: z
    .email("Invalid email address")
    .nonempty("Email is required")
    .trim()
    .toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
