import { describe, expect, it } from "vitest";
import { editProfileSchema } from "@/schemas/editProfile.schema";

describe("editProfileSchema", () => {
  const VALID_DATA = {
    name: "Juan",
    last_name: "Pérez",
  };

  it("validates required name and last_name", () => {
    const result = editProfileSchema.safeParse(VALID_DATA);
    expect(result.success).toBe(true);
  });

  it("validates all fields with valid data", () => {
    const result = editProfileSchema.safeParse({
      name: "Juan",
      last_name: "Pérez",
      locality: "Rosario",
      contact_phone: "+54 9 341 555-1234",
      description: "Nutricionista comunitario con 5 años de experiencia.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null, undefined, or empty string for optional fields", () => {
    const resultNull = editProfileSchema.safeParse({
      ...VALID_DATA,
      locality: null,
      contact_phone: null,
      description: null,
    });
    expect(resultNull.success).toBe(true);

    const resultEmpty = editProfileSchema.safeParse({
      ...VALID_DATA,
      locality: "",
      contact_phone: "",
      description: "",
    });
    expect(resultEmpty.success).toBe(true);

    const resultUndefined = editProfileSchema.safeParse({
      ...VALID_DATA,
      locality: undefined,
      contact_phone: undefined,
      description: undefined,
    });
    expect(resultUndefined.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      name: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El nombre es requerido");
    }
  });

  it("rejects name longer than 100 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Máximo 100 caracteres");
    }
  });

  it("rejects empty last_name", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      last_name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("El apellido es requerido");
    }
  });

  it("rejects last_name longer than 100 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      last_name: "b".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Máximo 100 caracteres");
    }
  });

  it("rejects locality longer than 100 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      locality: "c".repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Máximo 100 caracteres");
    }
  });

  it("validates phone formats correctly", () => {
    const validPhones = [
      "+54 9 11 1234-5678",
      "011 4444 5555",
      "+5493415551234",
      "(0341) 456-7890",
      "12345678",
    ];
    for (const phone of validPhones) {
      const result = editProfileSchema.safeParse({
        ...VALID_DATA,
        contact_phone: phone,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid contact_phone format", () => {
    const invalidPhones = ["abc-1234", "phone@invalid", "+54-phone#1"];
    for (const phone of invalidPhones) {
      const result = editProfileSchema.safeParse({
        ...VALID_DATA,
        contact_phone: phone,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((i) =>
            i.message.includes("Formato de teléfono inválido"),
          ),
        ).toBe(true);
      }
    }
  });

  it("rejects contact_phone longer than 20 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      contact_phone: "1".repeat(21),
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
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      description: "d".repeat(501),
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
