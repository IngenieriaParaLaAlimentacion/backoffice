import { z } from "zod";
import { PASSWORD_COPY } from "@/constants/auth";

const COPY = PASSWORD_COPY;

/**
 * The one list of password rules: the schemas validate against it and
 * `PasswordRequirements` renders it as a checklist.
 */
export const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    ...COPY.requirements.length,
    test: (p: string) => p.length >= 8,
  },
  {
    id: "lowercase",
    ...COPY.requirements.lowercase,
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "uppercase",
    ...COPY.requirements.uppercase,
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "number",
    ...COPY.requirements.number,
    test: (p: string) => /[0-9]/.test(p),
  },
  {
    id: "special",
    ...COPY.requirements.special,
    test: (p: string) => /[^a-zA-Z0-9]/.test(p),
  },
] as const;

export const passwordSchema = PASSWORD_REQUIREMENTS.reduce(
  (schema, req) => schema.refine(req.test, req.message),
  z.string(),
);

export const confirmPasswordSchema = z.string().min(1, COPY.confirmRequired);

export const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  params: {
    message: COPY.mismatch,
    path: ["confirmPassword"],
  },
};
