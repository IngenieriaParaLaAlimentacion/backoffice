import { z } from "zod";

export const signinSchema = z.strictObject({
  email: z
    .email("Email inválido")
    .nonempty("El email es requerido")
    .trim()
    .toLowerCase(),
  password: z.string().nonempty("La contraseña es requerida"),
});

export type SigninInput = z.infer<typeof signinSchema>;
