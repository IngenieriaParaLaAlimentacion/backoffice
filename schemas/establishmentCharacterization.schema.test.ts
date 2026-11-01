import { describe, expect, it } from "vitest";
import {
  characterizationSchema,
  EMPTY_CHARACTERIZATION,
  isCharacterizationEmpty,
  OTHER_TEXT_MAX_LENGTH,
  toCharacterizationInput,
  toCharacterizationRequest,
} from "@/schemas/establishmentCharacterization.schema";

const emptyInput = () => toCharacterizationInput(EMPTY_CHARACTERIZATION);

describe("characterizationSchema", () => {
  it("accepts a profile with every field blank", () => {
    expect(characterizationSchema.safeParse(emptyInput()).success).toBe(true);
  });

  it("rejects an 'Otro' text over the backend's bound", () => {
    const result = characterizationSchema.safeParse({
      ...emptyInput(),
      care_tasks: ["other"],
      care_tasks_other: "x".repeat(OTHER_TEXT_MAX_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });
});

describe("toCharacterizationRequest", () => {
  it("keeps an 'Otro' text only while 'Otro' is chosen, trimmed", () => {
    const request = toCharacterizationRequest({
      ...emptyInput(),
      premises: "other",
      premises_other: "  Parroquia ",
      service_types: ["on_site"],
      service_types_other: "Delivery",
    });
    expect(request.premises_other).toBe("Parroquia");
    expect(request.service_types_other).toBeNull();
  });

  it("sends a blank 'Otro' text as null", () => {
    const request = toCharacterizationRequest({
      ...emptyInput(),
      cultural_identities: ["other"],
      cultural_identities_other: "   ",
    });
    expect(request.cultural_identities_other).toBeNull();
  });
});

describe("opening hours", () => {
  const withSlots = (
    opening_hours: ReturnType<typeof emptyInput>["opening_hours"],
  ) => characterizationSchema.safeParse({ ...emptyInput(), opening_hours });

  it("skips a blank row instead of flagging it", () => {
    expect(withSlots([{ days: [], opens_at: "", closes_at: "" }]).success).toBe(
      true,
    );
  });

  it("rejects a slot that closes before it opens", () => {
    expect(
      withSlots([{ days: ["monday"], opens_at: "14:00", closes_at: "12:00" }])
        .success,
    ).toBe(false);
  });
});

describe("daily attendance", () => {
  it("is sent as a number, or null when blank", () => {
    expect(
      toCharacterizationRequest({ ...emptyInput(), daily_attendance: "120" })
        .daily_attendance,
    ).toBe(120);
    expect(toCharacterizationRequest(emptyInput()).daily_attendance).toBeNull();
  });

  it("rejects anything but a whole number", () => {
    expect(
      characterizationSchema.safeParse({
        ...emptyInput(),
        daily_attendance: "1.500",
      }).success,
    ).toBe(false);
  });
});

describe("isCharacterizationEmpty", () => {
  it("is true only while no field has data", () => {
    expect(isCharacterizationEmpty(EMPTY_CHARACTERIZATION)).toBe(true);
    expect(
      isCharacterizationEmpty({ ...EMPTY_CHARACTERIZATION, meals: ["lunch"] }),
    ).toBe(false);
  });
});
