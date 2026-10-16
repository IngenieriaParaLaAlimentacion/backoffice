import { describe, expect, it } from "vitest";
import { createEstablishmentRequestSchema } from "@/schemas/establishment.schema";

const MAX_LEN = 100;

function base() {
  return {
    name: "Comedor Central",
    formatted_address: "Av. Corrientes 1234, CABA",
    city: "",
    province: "",
  };
}

describe("createEstablishmentRequestSchema", () => {
  it("accepts name and address with city/province left blank", () => {
    expect(createEstablishmentRequestSchema.safeParse(base()).success).toBe(
      true,
    );
  });

  it("accepts name and address with city/province entirely omitted", () => {
    const { name, formatted_address } = base();
    expect(
      createEstablishmentRequestSchema.safeParse({
        name,
        formatted_address,
      }).success,
    ).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = createEstablishmentRequestSchema.safeParse({
      ...base(),
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing address", () => {
    const result = createEstablishmentRequestSchema.safeParse({
      ...base(),
      formatted_address: "",
    });
    expect(result.success).toBe(false);
  });

  // The backend's ValidStr caps every one of these fields at 100 chars —
  // this must match exactly, or a valid form gets a 422 the user can't see.
  it.each(["name", "formatted_address", "city", "province"])(
    "rejects %s over the 100-character limit",
    (field) => {
      const result = createEstablishmentRequestSchema.safeParse({
        ...base(),
        [field]: "a".repeat(MAX_LEN + 1),
      });
      expect(result.success).toBe(false);
    },
  );

  it("accepts city/province at exactly the 100-character limit", () => {
    const result = createEstablishmentRequestSchema.safeParse({
      ...base(),
      city: "a".repeat(MAX_LEN),
      province: "a".repeat(MAX_LEN),
    });
    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const result = createEstablishmentRequestSchema.safeParse({
      ...base(),
      name: "  Comedor Central  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Comedor Central");
  });
});
