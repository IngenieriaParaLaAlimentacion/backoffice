import { AuthDispatcher } from "@/context/AuthContext";
import { FOOD_INTAKES_ENDPOINT, FOOD_OUTFLOWS_ENDPOINT } from "@/constants/api";
import { toApiError } from "@/lib/apiError";
import {
  CreateFoodMovementRequest,
  CreatedFoodMovement,
  FoodMovementDirection,
  FoodMovementSaveResult,
} from "@/types/establishment";

export async function createFoodMovementAction(
  dispatcher: AuthDispatcher,
  direction: FoodMovementDirection,
  data: CreateFoodMovementRequest,
): Promise<FoodMovementSaveResult> {
  const endpoint =
    direction === "in" ? FOOD_INTAKES_ENDPOINT : FOOD_OUTFLOWS_ENDPOINT;
  const res = await dispatcher<CreateFoodMovementRequest, CreatedFoodMovement>(
    endpoint,
    { method: "POST", body: data },
  );
  if (!res.ok) throw toApiError(res.data, res.status);
  return {
    movement: res.data as CreatedFoodMovement,
    replayed: res.status === 200,
  };
}
