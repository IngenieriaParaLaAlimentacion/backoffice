import { http, HttpResponse } from "msw";
import { FOOD_INTAKES_ENDPOINT, FOOD_OUTFLOWS_ENDPOINT } from "@/constants/api";
import { availableMillis, quantityMillis } from "@/lib/foodMovementQuantity";
import { MOCK_FOODS } from "@/mocks/fixtures/foodCatalog";
import {
  currentMovements,
  currentStock,
  createdMovement,
  MOCK_ESTABLISHMENTS,
  MOCK_FOOD_MOVEMENT_DETAILS,
  RESPONSIBLE,
  storeCreatedMovement,
} from "@/mocks/fixtures/establishment";
import {
  CreateFoodMovementRequest,
  CreatedFoodMovement,
  FoodMovementDirection,
  FoodOutflowCategory,
} from "@/types/establishment";

function quantityDisplay(value: bigint): string {
  const whole = value / BigInt("1000");
  const fraction = (value % BigInt("1000"))
    .toString()
    .padStart(3, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

function problem(
  slug: string,
  title: string,
  status: number,
  instance: string,
  extensions: Record<string, string> = {},
) {
  return HttpResponse.json(
    {
      type: `/errors/${slug}`,
      title,
      status,
      detail: title,
      instance,
      ...extensions,
    },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

function makeHandler(direction: FoodMovementDirection) {
  return http.post(
    direction === "in" ? FOOD_INTAKES_ENDPOINT : FOOD_OUTFLOWS_ENDPOINT,
    async ({ request }) => {
      const body = (await request.json()) as CreateFoodMovementRequest;
      const path = new URL(request.url).pathname;
      const category: FoodOutflowCategory =
        direction === "out" && "category" in body
          ? (body.category as FoodOutflowCategory)
          : "other";
      if (
        direction === "out" &&
        !(
          ["family_delivery", "kitchen", "discard", "other"] as string[]
        ).includes(category)
      )
        return problem("validation-failed", "Validation failed", 422, path);
      const existing = createdMovement(body.id);
      if (existing) return HttpResponse.json(existing, { status: 200 });
      if (
        !MOCK_ESTABLISHMENTS.some((item) => item.id === body.establishment_id)
      )
        return problem(
          "establishment-not-found",
          "Establishment not found",
          404,
          path,
        );

      const stock = currentStock(body.establishment_id);
      for (const line of body.items) {
        const food = MOCK_FOODS.find((item) => item.id === line.food_id);
        if (!food)
          return problem("food-not-found", "Food not found", 404, path);
        const quantity = quantityMillis(line.quantity);
        if (quantity === null)
          return problem("validation-failed", "Validation failed", 422, path);
        const row = stock.find((item) => item.food.id === food.id);
        if (
          direction === "out" &&
          quantity > availableMillis(row?.quantity ?? "0")
        )
          return problem(
            "insufficient-stock",
            "Insufficient stock",
            409,
            path,
            {
              food_id: food.id,
              requested: line.quantity,
              available: row?.quantity ?? "0",
            },
          );
      }

      const now = new Date().toISOString();
      const items = body.items.map((line) => {
        const food = MOCK_FOODS.find((item) => item.id === line.food_id)!;
        const quantity = quantityMillis(line.quantity)!;
        const row = stock.find((item) => item.food.id === food.id);
        const next =
          availableMillis(row?.quantity ?? "0") +
          (direction === "in" ? quantity : -quantity);
        if (row) {
          row.quantity = quantityDisplay(next);
          row.updated_at = now;
        } else
          stock.push({
            food: { id: food.id, name: food.name },
            category: food.category,
            unit: food.base_unit,
            quantity: quantityDisplay(next),
            updated_at: now,
          });
        return {
          food: { id: food.id, name: food.name },
          unit: food.base_unit,
          quantity: line.quantity,
        };
      });
      const movement: CreatedFoodMovement = {
        id: body.id,
        establishment_id: body.establishment_id,
        responsible_id: RESPONSIBLE.id,
        occurred_at: body.occurred_at,
        comments: body.comments ?? null,
        ...(direction === "out" ? { category } : {}),
        source: "manual",
        created_at: now,
        items,
      };
      storeCreatedMovement(movement);
      currentMovements(body.establishment_id).push({
        id: movement.id,
        direction,
        occurred_at: movement.occurred_at,
        responsible: RESPONSIBLE,
        food_count: items.length,
        category: direction === "out" ? category : null,
      });
      MOCK_FOOD_MOVEMENT_DETAILS[movement.id] = {
        id: movement.id,
        direction,
        occurred_at: movement.occurred_at,
        source: "manual",
        comments: movement.comments,
        category: direction === "out" ? category : null,
        responsible: RESPONSIBLE,
        items,
      };
      return HttpResponse.json(movement, { status: 201 });
    },
  );
}

export const makeFoodIntakeHandler = () => makeHandler("in");
export const makeFoodOutflowHandler = () => makeHandler("out");
