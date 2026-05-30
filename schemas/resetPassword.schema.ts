import { z } from "zod";

export const resetPasswordSchema = z
  .strictObject({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .regex(/[0-9]/, "La contraseña debe contener al menos un número")
      .regex(
        /[^a-zA-Z0-9]/,
        "La contraseña debe contener al menos un carácter especial",
      ),
    confirmPassword: z.string().nonempty("La confirmación de contraseña es requerida"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
