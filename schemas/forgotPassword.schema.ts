import { z } from "zod";

export const forgotPasswordSchema = z.strictObject({
  email: z
    .email("Email inválido")
    .nonempty("El email es requerido")
    .trim()
    .toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
