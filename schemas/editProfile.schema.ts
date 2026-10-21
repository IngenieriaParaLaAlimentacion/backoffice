import { z } from "zod";

export const editProfileSchema = z.object({
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
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
