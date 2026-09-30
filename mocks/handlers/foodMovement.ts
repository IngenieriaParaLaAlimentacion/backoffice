import { http, HttpResponse } from "msw";
import { FOOD_INTAKES_ENDPOINT, FOOD_OUTFLOWS_ENDPOINT } from "@/constants/api";
import {
  availableMillis,
  quantityDisplay,
  quantityMillis,
} from "@/lib/foodMovementQuantity";
import { MOCK_FOODS } from "@/mocks/fixtures/foodCatalog";
import {
  currentMovements,
  currentStock,
  createdMovement,
  MOCK_ESTABLISHMENTS,
  MOCK_FOOD_MOVEMENT_DETAILS,
  storeCreatedMovement,
} from "@/mocks/fixtures/establishment";
import {
  CreateFoodMovementRequest,
  CreatedFoodMovement,
  FoodMovementDirection,
} from "@/types/establishment";

function makeHandler(direction: FoodMovementDirection) {
  return http.post(
    direction === "in" ? FOOD_INTAKES_ENDPOINT : FOOD_OUTFLOWS_ENDPOINT,
    async ({ request }) => {
      const body = (await request.json()) as CreateFoodMovementRequest;
      const existing = createdMovement(body.id);
      if (existing) return HttpResponse.json(existing, { status: 200 });
      const path = new URL(request.url).pathname;
      if (
        !MOCK_ESTABLISHMENTS.some((item) => item.id === body.establishment_id)
      )
        return HttpResponse.json(
          {
            type: "/errors/establishment-not-found",
            title: "Establishment not found",
            status: 404,
            detail: "Not found",
            instance: path,
          },
          {
            status: 404,
            headers: { "Content-Type": "application/problem+json" },
          },
        );

      const stock = currentStock(body.establishment_id);
      for (const line of body.items) {
        const food = MOCK_FOODS.find((item) => item.id === line.food_id);
        if (!food)
          return HttpResponse.json(
            {
              type: "/errors/food-not-found",
              title: "Food not found",
              status: 404,
              detail: "Not found",
              instance: path,
            },
            { status: 404 },
          );
        const quantity = quantityMillis(line.quantity);
        if (quantity === null)
          return HttpResponse.json(
            {
              type: "/errors/validation-failed",
              title: "Validation failed",
              status: 422,
              detail: "Invalid quantity",
              instance: path,
            },
            { status: 422 },
          );
        const row = stock.find((item) => item.food.id === food.id);
        if (
          direction === "out" &&
          quantity > availableMillis(row?.quantity ?? "0")
        )
          return HttpResponse.json(
            {
              type: "/errors/insufficient-stock",
              title: "Insufficient stock",
              status: 409,
              detail: "Insufficient stock",
              instance: path,
              food_id: food.id,
              requested: line.quantity,
              available: row?.quantity ?? "0",
            },
            {
              status: 409,
              headers: { "Content-Type": "application/problem+json" },
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
        responsible_id: "f1000000-0000-0000-0000-000000000001",
        occurred_at: body.occurred_at,
        comments: body.comments,
        source: "manual",
        created_at: now,
        items,
      };
      storeCreatedMovement(movement);
      currentMovements(body.establishment_id).push({
        id: movement.id,
        direction,
        occurred_at: movement.occurred_at,
        responsible: {
          id: movement.responsible_id,
          name: "Juan",
          last_name: "Gomez",
        },
        food_count: items.length,
      });
      MOCK_FOOD_MOVEMENT_DETAILS[movement.id] = {
        id: movement.id,
        direction,
        occurred_at: movement.occurred_at,
        source: "manual",
        comments: movement.comments,
        responsible: {
          id: movement.responsible_id,
          name: "Juan",
          last_name: "Gomez",
        },
        items,
      };
      return HttpResponse.json(movement, { status: 201 });
    },
  );
}

export const makeFoodIntakeHandler = () => makeHandler("in");
export const makeFoodOutflowHandler = () => makeHandler("out");
