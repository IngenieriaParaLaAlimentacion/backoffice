import { describe, expect, it } from "vitest";
import {
  editProfileSchema,
  PROFILE_DESCRIPTION_MAX_LENGTH,
  PROFILE_PHONE_MAX_LENGTH,
  PROFILE_TEXT_MAX_LENGTH,
} from "@/schemas/editProfile.schema";
import { PROFILE_FORM } from "@/constants/users";

const TEXT_MAX = PROFILE_FORM.textMaxLength(PROFILE_TEXT_MAX_LENGTH);

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

  it("outputs trimmed values and null for blank optional fields", () => {
    const result = editProfileSchema.parse({
      name: "  Juan ",
      last_name: "Pérez",
      locality: "   ",
      contact_phone: "",
      description: undefined,
    });
    expect(result).toEqual({
      name: "Juan",
      last_name: "Pérez",
      locality: null,
      contact_phone: null,
      description: null,
    });
  });

  it("rejects empty name", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      name: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(PROFILE_FORM.nameRequired);
    }
  });

  it("rejects name longer than 100 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      name: "a".repeat(PROFILE_TEXT_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(TEXT_MAX);
    }
  });

  it("rejects empty last_name", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      last_name: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        PROFILE_FORM.lastNameRequired,
      );
    }
  });

  it("rejects last_name longer than 100 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      last_name: "b".repeat(PROFILE_TEXT_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(TEXT_MAX);
    }
  });

  it("rejects locality longer than 100 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      locality: "c".repeat(PROFILE_TEXT_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(TEXT_MAX);
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
          result.error.issues.some(
            (i) => i.message === PROFILE_FORM.invalidPhone,
          ),
        ).toBe(true);
      }
    }
  });

  it("rejects contact_phone longer than 20 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      contact_phone: "1".repeat(PROFILE_PHONE_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (i) =>
            i.message === PROFILE_FORM.textMaxLength(PROFILE_PHONE_MAX_LENGTH),
        ),
      ).toBe(true);
    }
  });

  it("rejects description longer than 500 characters", () => {
    const result = editProfileSchema.safeParse({
      ...VALID_DATA,
      description: "d".repeat(PROFILE_DESCRIPTION_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (i) =>
            i.message ===
            PROFILE_FORM.textMaxLength(PROFILE_DESCRIPTION_MAX_LENGTH),
        ),
      ).toBe(true);
    }
  });
});
