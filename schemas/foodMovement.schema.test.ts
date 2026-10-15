import { describe, expect, it } from "vitest";
import { MOCK_FOODS } from "@/mocks/fixtures/foodCatalog";
import { foodMovementSchema, validateMovement } from "./foodMovement.schema";

describe("food movement form", () => {
  const food = MOCK_FOODS[0];
  it("explains an invalid date in Spanish", () => {
    const result = foodMovementSchema.safeParse({
      direction: "in",
      date: "2026-02-30",
      comments: "",
      origin_type: "foundation",
      is_recurring: "false",
      lines: [{ food, quantity: "1" }],
    });
    expect(result.error?.issues[0].message).toBe("Ingresá una fecha válida");
  });

  it("rejects future dates and duplicate foods", () => {
    const value = foodMovementSchema.parse({
      direction: "in",
      date: "2026-10-01",
      comments: "",
      origin_type: "foundation",
      is_recurring: "true",
      lines: [
        { food, quantity: "1" },
        { food, quantity: "2" },
      ],
    });
    expect(validateMovement(value, "2026-09-30", new Map())).toMatchObject({
      date: "La fecha no puede ser futura",
      "lines.1.food": "Este alimento ya está en otra línea",
    });
  });

  it("compares outflows in thousandths", () => {
    const value = foodMovementSchema.parse({
      direction: "out",
      date: "2026-09-30",
      comments: "",
      origin_type: "",
      is_recurring: "",
      lines: [{ food, quantity: "0.301" }],
    });
    expect(
      validateMovement(value, "2026-09-30", new Map([[food.id, "0.300"]]))[
        "lines.0.quantity"
      ],
    ).toBe("La cantidad supera el stock disponible");
  });

  it("requires whole units", () => {
    const unitFood = { ...food, base_unit: "unidades" as const };
    const value = foodMovementSchema.parse({
      direction: "in",
      date: "2026-09-30",
      comments: "",
      origin_type: "foundation",
      is_recurring: "false",
      lines: [{ food: unitFood, quantity: "1.5" }],
    });
    expect(
      validateMovement(value, "2026-09-30", new Map())["lines.0.quantity"],
    ).toBe("Las unidades deben ser enteras");
  });

  it("requires explicit origin and recurrence for an intake", () => {
    const draft = {
      direction: "in",
      date: "2026-09-30",
      comments: "",
      lines: [{ food, quantity: "1" }],
    };
    const missing = foodMovementSchema.safeParse({
      ...draft,
      origin_type: "",
      is_recurring: "",
    });
    expect(missing.success).toBe(false);
    expect(missing.error?.issues.map((issue) => issue.path[0])).toEqual([
      "origin_type",
      "is_recurring",
    ]);
    expect(
      foodMovementSchema.safeParse({
        ...draft,
        origin_type: "foundation",
        is_recurring: "false",
      }).success,
    ).toBe(true);
    expect(
      foodMovementSchema.safeParse({
        ...draft,
        origin_type: "foundation",
        is_recurring: "true",
      }).success,
    ).toBe(true);
    expect(
      foodMovementSchema.safeParse({
        ...draft,
        origin_type: "invalid",
        is_recurring: "true",
      }).success,
    ).toBe(false);
    expect(
      foodMovementSchema.safeParse({
        ...draft,
        direction: "out",
        origin_type: "",
        is_recurring: "",
      }).success,
    ).toBe(true);
  });
});
