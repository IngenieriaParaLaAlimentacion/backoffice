import { z } from "zod";
import { editProfileSchema } from "@/schemas/editProfile.schema";
import {
  confirmPasswordSchema,
  passwordSchema,
  passwordsMatch,
} from "@/schemas/password.schema";

export const acceptInviteSchema = editProfileSchema
  .extend({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

export type AcceptInviteInput = z.input<typeof acceptInviteSchema>;
export type AcceptInviteOutput = z.output<typeof acceptInviteSchema>;
