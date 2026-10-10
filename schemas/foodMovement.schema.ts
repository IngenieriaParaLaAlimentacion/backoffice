import { z } from "zod";
import { FoodListItem } from "@/types/foodCatalog";
import { FoodStockItem } from "@/types/establishment";
import { availableMillis, quantityMillis } from "@/lib/foodMovementQuantity";
import { FOOD_MOVEMENT_FORM } from "@/constants/establishments";

export type MovementFood = FoodListItem | FoodStockItem;
export const OUTFLOW_EXCEEDS_STOCK = "La cantidad supera el stock disponible";
const foodMovementLineSchema = z.object({
  food: z.custom<MovementFood | null>((value) => typeof value === "object"),
  quantity: z.string(),
});
export const foodMovementSchema = z
  .object({
    direction: z.enum(["in", "out"]),
    date: z.iso.date({ error: FOOD_MOVEMENT_FORM.invalidDate }),
    category: z.union([
      z.literal(""),
      z.enum(["family_delivery", "kitchen", "discard", "other"]),
    ]),
    comments: z.string().max(500, "Máximo 500 caracteres"),
    lines: z.array(foodMovementLineSchema).min(1, "Agregá un alimento"),
  })
  .superRefine((value, ctx) => {
    if (value.direction === "out" && value.category === "") {
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: FOOD_MOVEMENT_FORM.categoryRequired,
      });
    }
  });
export type FoodMovementInput = z.infer<typeof foodMovementSchema>;

export const selectedFoodId = (food: MovementFood) =>
  "food" in food ? food.food.id : food.id;
export const selectedUnit = (food: MovementFood) =>
  "food" in food ? food.unit : food.base_unit;
export const selectedName = (food: MovementFood) =>
  "food" in food ? food.food.name : food.name;

export function validateMovement(
  value: FoodMovementInput,
  today: string,
  availableByFood: Map<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (value.date > today) errors.date = "La fecha no puede ser futura";
  const selectedIds = new Set<string>();
  value.lines.forEach((line, index) => {
    if (!line.food) {
      errors[`lines.${index}.food`] = "Elegí un alimento";
      return;
    }
    const foodId = selectedFoodId(line.food);
    if (selectedIds.has(foodId))
      errors[`lines.${index}.food`] = "Este alimento ya está en otra línea";
    selectedIds.add(foodId);
    const parsed = quantityMillis(line.quantity);
    if (parsed === null) {
      errors[`lines.${index}.quantity`] =
        "Ingresá una cantidad mayor a cero, con hasta tres decimales (coma o punto) y siete enteros";
      return;
    }
    if (
      selectedUnit(line.food) === "unidades" &&
      parsed % BigInt("1000") !== BigInt("0")
    )
      errors[`lines.${index}.quantity`] = "Las unidades deben ser enteras";
    if (value.direction === "out") {
      const available = availableByFood.get(foodId);
      if (available === undefined)
        errors[`lines.${index}.food`] = "Actualizá el stock antes de guardar";
      else if (parsed > availableMillis(available))
        errors[`lines.${index}.quantity`] = OUTFLOW_EXCEEDS_STOCK;
    }
  });
  return errors;
}
