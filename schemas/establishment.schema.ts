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

export type CreateEstablishmentInput = z.infer<
  typeof createEstablishmentSchema
>;

/** Same rules as creating one. The address isn't a form field: it is either
 * kept as is or replaced by a place picked in the autocomplete. */
export const editEstablishmentSchema = createEstablishmentSchema.omit({
  formatted_address: true,
});
export type EditEstablishmentInput = z.infer<typeof editEstablishmentSchema>;

// city/province are optional here, unlike createEstablishmentSchema above —
// the requester may not know them. Kept as plain (optional) strings, not
// transformed to undefined here: an empty "" is a valid form value while the
// user is typing, the "" -> undefined conversion for the API payload belongs
// in the service call, not in validation.
export const createEstablishmentRequestSchema = z.object({
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
  city: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
  province: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
});

export type CreateEstablishmentRequestInput = z.infer<
  typeof createEstablishmentRequestSchema
>;
