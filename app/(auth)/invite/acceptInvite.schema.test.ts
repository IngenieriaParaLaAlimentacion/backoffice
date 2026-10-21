import { describe, expect, it } from "vitest";
import { acceptInviteSchema } from "@/schemas/acceptInvite.schema";

const VALID_DATA = {
  name: "Juan",
  last_name: "Pérez",
  password: "Password123!",
  confirmPassword: "Password123!",
  locality: "Rosario",
  contact_phone: "+54 9 341 555-1234",
  description: "Licenciado en Nutrición",
};

describe("acceptInviteSchema", () => {
  it("accepts valid full payload", () => {
    const result = acceptInviteSchema.safeParse(VALID_DATA);
    expect(result.success).toBe(true);
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

  it("accepts empty strings for optional fields", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      locality: "",
      contact_phone: "",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null for optional fields", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      locality: null,
      contact_phone: null,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      name: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El nombre es requerido");
    }
  });

  it("rejects name longer than 100 characters", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Máximo 100 caracteres");
    }
  });

  it("rejects empty last_name", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      last_name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El apellido es requerido");
    }
  });

  it("rejects last_name longer than 100 characters", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      last_name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Máximo 100 caracteres");
    }
  });

  it("rejects password shorter than 8 characters", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      password: "Pass1!",
      confirmPassword: "Pass1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("al menos 8 caracteres"),
        ),
      ).toBe(true);
    }
  });

  it("rejects password without lowercase", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      password: "PASSWORD123!",
      confirmPassword: "PASSWORD123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("al menos una minúscula"),
        ),
      ).toBe(true);
    }
  });

  it("rejects password without uppercase", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      password: "password123!",
      confirmPassword: "password123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("al menos una mayúscula"),
        ),
      ).toBe(true);
    }
  });

  it("rejects password without number", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      password: "Password!",
      confirmPassword: "Password!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("al menos un número"),
        ),
      ).toBe(true);
    }
  });

  it("rejects password without special character", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("al menos un carácter especial"),
        ),
      ).toBe(true);
    }
  });

  it("rejects mismatched confirmPassword", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      password: "Password123!",
      confirmPassword: "DifferentPassword123!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("Las contraseñas no coinciden"),
        ),
      ).toBe(true);
    }
  });

  it("rejects locality longer than 100 characters", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      locality: "x".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("Máximo 100 caracteres"),
        ),
      ).toBe(true);
    }
  });

  it("rejects contact_phone with invalid format", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      contact_phone: "invalid-phone-abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("Formato de teléfono inválido"),
        ),
      ).toBe(true);
    }
  });

  it("rejects contact_phone longer than 20 characters", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      contact_phone: "+1 234 567 890 123 456 789",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("Máximo 20 caracteres"),
        ),
      ).toBe(true);
    }
  });

  it("rejects description longer than 500 characters", () => {
    const result = acceptInviteSchema.safeParse({
      ...VALID_DATA,
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("Máximo 500 caracteres"),
        ),
      ).toBe(true);
    }
  });
});
