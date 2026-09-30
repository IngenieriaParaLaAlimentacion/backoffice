import { describe, expect, it } from "vitest";
import { MOCK_FOODS } from "@/mocks/fixtures/foodCatalog";
import { foodMovementSchema, validateMovement } from "./foodMovement.schema";

describe("food movement form", () => {
  const food = MOCK_FOODS[0];
  it("rejects future dates and duplicate foods", () => {
    const value = foodMovementSchema.parse({
      direction: "in",
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
      date: "2026-09-30",
      comments: "",
      lines: [{ food: unitFood, quantity: "1.5" }],
    });
    expect(
      validateMovement(value, "2026-09-30", new Map())["lines.0.quantity"],
    ).toBe("Las unidades deben ser enteras");
  });
});
