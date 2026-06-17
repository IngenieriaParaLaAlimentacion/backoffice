import { z } from "zod";

export const createEstablishmentSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres")
    .trim(),
  formatted_address: z
    .string()
    .min(1, "La dirección es requerida")
    .max(100, "Máximo 100 caracteres")
    .trim(),
  city: z
    .string()
    .min(1, "La ciudad es requerida")
    .max(100, "Máximo 100 caracteres")
    .trim(),
  province: z
    .string()
    .min(1, "La provincia es requerida")
    .max(100, "Máximo 100 caracteres")
    .trim(),
});

export type CreateEstablishmentInput = z.infer<typeof createEstablishmentSchema>;
