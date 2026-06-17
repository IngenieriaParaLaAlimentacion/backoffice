import { z } from "zod";

export const editProfileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").trim(),
  last_name: z.string().min(1, "El apellido es requerido").trim(),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
