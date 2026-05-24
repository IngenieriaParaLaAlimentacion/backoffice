import { z } from "zod";

export const signinSchema = z.strictObject({
  email: z
    .email("Invalid email address")
    .nonempty("Email is required")
    .trim()
    .toLowerCase(),
  password: z.string().nonempty("Password is required"),
});

export type SigninInput = z.infer<typeof signinSchema>;
