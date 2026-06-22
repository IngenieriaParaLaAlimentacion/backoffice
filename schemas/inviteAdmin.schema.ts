import { z } from "zod";

export const inviteAdminSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

export type InviteAdminInput = z.infer<typeof inviteAdminSchema>;
