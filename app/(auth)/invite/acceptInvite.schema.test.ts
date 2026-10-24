import { describe, expect, it } from "vitest";
import { acceptInviteSchema } from "@/schemas/acceptInvite.schema";
import { PASSWORD_REQUIREMENTS } from "@/schemas/password.schema";
import { PASSWORD_COPY } from "@/constants/auth";

// Profile fields are covered by editProfile.schema.test.ts; this schema extends it.
const VALID_DATA = {
  name: "Juan",
  last_name: "Pérez",
  password: "Password123!",
  confirmPassword: "Password123!",
  locality: "Rosario",
  contact_phone: "+54 9 341 555-1234",
  description: "Licenciado en Nutrición",
};

// One password per rule that breaks only that rule.
const BREAKS: Record<(typeof PASSWORD_REQUIREMENTS)[number]["id"], string> = {
  length: "Pass1!",
  lowercase: "PASSWORD123!",
  uppercase: "password123!",
  number: "Password!",
  special: "Password123",
};

describe("acceptInviteSchema", () => {
  it("accepts valid full payload", () => {
    expect(acceptInviteSchema.safeParse(VALID_DATA).success).toBe(true);
  });

  it("accepts valid payload with only required fields", () => {
    const result = acceptInviteSchema.safeParse({
      name: "Juan",
      last_name: "Pérez",
      password: "Password123!",
      confirmPassword: "Password123!",
    });
    expect(result.success).toBe(true);
  });

  it.each(PASSWORD_REQUIREMENTS)("rejects a password failing $id", (req) => {
    const password = BREAKS[req.id];
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      password,
      confirmPassword: password,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain(req.message);
    }
  });

  it("rejects mismatched confirmPassword", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      confirmPassword: "DifferentPassword123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        message: PASSWORD_COPY.mismatch,
        path: ["confirmPassword"],
      });
    }
  });
});
