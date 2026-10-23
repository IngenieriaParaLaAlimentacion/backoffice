import { z } from "zod";

/**
 * The one list of password rules: the schemas validate against it and
 * `PasswordRequirements` renders it as a checklist.
 */
export const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: "Al menos 8 caracteres",
    message: "La contraseña debe tener al menos 8 caracteres",
    test: (p: string) => p.length >= 8,
  },
  {
    id: "lowercase",
    label: "Al menos una letra minúscula",
    message: "La contraseña debe contener al menos una minúscula",
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "uppercase",
    label: "Al menos una letra mayúscula",
    message: "La contraseña debe contener al menos una mayúscula",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "number",
    label: "Al menos un número",
    message: "La contraseña debe contener al menos un número",
    test: (p: string) => /[0-9]/.test(p),
  },
  {
    id: "special",
    label: "Al menos un carácter especial",
    message: "La contraseña debe contener al menos un carácter especial",
    test: (p: string) => /[^a-zA-Z0-9]/.test(p),
  },
] as const;

export const passwordSchema = PASSWORD_REQUIREMENTS.reduce(
  (schema, req) => schema.refine(req.test, req.message),
  z.string(),
);

export const confirmPasswordSchema = z
  .string()
  .min(1, "La confirmación de contraseña es requerida");

export const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  params: {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  },
};
