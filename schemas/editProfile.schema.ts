import { z } from "zod";

/** Blank optional fields reach the API as `null`, so the forms never normalize. */
const optionalText = (field: z.ZodString) =>
  field.nullish().transform((value) => value || null);

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
  locality: optionalText(z.string().trim().max(100, "Máximo 100 caracteres")),
  contact_phone: optionalText(
    z
      .string()
      .trim()
      .max(20, "Máximo 20 caracteres")
      .regex(/^[0-9+\-\s()]*$/, "Formato de teléfono inválido"),
  ),
  description: optionalText(
    z.string().trim().max(500, "Máximo 500 caracteres"),
  ),
});

export type EditProfileInput = z.input<typeof editProfileSchema>;
export type EditProfileOutput = z.output<typeof editProfileSchema>;
