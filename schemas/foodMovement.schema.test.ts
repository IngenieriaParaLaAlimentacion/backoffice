import { describe, expect, it } from "vitest";
import { MOCK_FOODS } from "@/mocks/fixtures/foodCatalog";
import { foodMovementSchema, validateMovement } from "./foodMovement.schema";
import { FOOD_MOVEMENT_FORM } from "@/constants/establishments";

describe("food movement form", () => {
  const food = MOCK_FOODS[0];
  it("explains an invalid date in Spanish", () => {
    const result = foodMovementSchema.safeParse({
      direction: "in",
      category: "",
      date: "2026-02-30",
      comments: "",
      lines: [{ food, quantity: "1" }],
    });
    expect(result.error?.issues[0].message).toBe("Ingresá una fecha válida");
  });

  it("rejects future dates and duplicate foods", () => {
    const value = foodMovementSchema.parse({
      direction: "in",
      category: "",
      date: "2026-10-01",
      comments: "",
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
      category: "kitchen",
      date: "2026-09-30",
      comments: "",
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
      category: "",
      date: "2026-09-30",
      comments: "",
      lines: [{ food: unitFood, quantity: "1.5" }],
    });
    expect(
      validateMovement(value, "2026-09-30", new Map())["lines.0.quantity"],
    ).toBe("Las unidades deben ser enteras");
  });

  it("requires an outflow category but leaves intake uncategorized", () => {
    const base = {
      date: "2026-09-30",
      comments: "",
      lines: [{ food, quantity: "1" }],
    };
    const missing = foodMovementSchema.safeParse({
      ...base,
      direction: "out",
      category: "",
    });
    expect(missing.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["category"],
          message: FOOD_MOVEMENT_FORM.categoryRequired,
        }),
      ]),
    );
    expect(
      foodMovementSchema.safeParse({ ...base, direction: "in", category: "" })
        .success,
    ).toBe(true);
    expect(
      foodMovementSchema.safeParse({
        ...base,
        direction: "out",
        category: "other",
      }).success,
    ).toBe(true);
    expect(
      foodMovementSchema.safeParse({
        ...base,
        direction: "out",
        category: "other",
        comments: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});
