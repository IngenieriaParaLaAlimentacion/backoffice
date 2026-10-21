import { z } from "zod";

export const acceptInviteSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre es requerido")
      .max(100, "Máximo 100 caracteres"),
    last_name: z
      .string()
      .trim()
      .min(1, "El apellido es requerido")
      .max(100, "Máximo 100 caracteres"),
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
    confirmPassword: z
      .string()
      .min(1, "La confirmación de contraseña es requerida"),
    locality: z
      .string()
      .trim()
      .max(100, "Máximo 100 caracteres")
      .optional()
      .nullable()
      .or(z.literal("")),
    contact_phone: z
      .string()
      .trim()
      .max(20, "Máximo 20 caracteres")
      .regex(/^[0-9+\-\s()]+$/, "Formato de teléfono inválido")
      .optional()
      .nullable()
      .or(z.literal("")),
    description: z
      .string()
      .trim()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
