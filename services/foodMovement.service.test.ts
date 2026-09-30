import { describe, expect, it, vi } from "vitest";
import { createFoodMovementAction } from "./foodMovement.service";
import { FOOD_INTAKES_ENDPOINT, FOOD_OUTFLOWS_ENDPOINT } from "@/constants/api";
import { AuthDispatcher } from "@/context/AuthContext";
import { CreateFoodMovementRequest } from "@/types/establishment";

const body: CreateFoodMovementRequest = {
  id: "a1000000-0000-0000-0000-000000000009",
  establishment_id: "e1000000-0000-0000-0000-000000000001",
  occurred_at: "2026-09-30T12:00:00Z",
  comments: null,
  source: "manual",
  items: [
    { food_id: "d1000000-0000-0000-0000-000000000001", quantity: "0.301" },
  ],
};

describe("createFoodMovementAction", () => {
  it.each([
    ["in", FOOD_INTAKES_ENDPOINT, 201, false],
    ["out", FOOD_OUTFLOWS_ENDPOINT, 200, true],
  ] as const)(
    "posts %s to its endpoint and preserves replay status",
    async (direction, endpoint, status, replayed) => {
      const dispatcher = vi.fn().mockResolvedValue({
        ok: true,
        status,
        data: { id: body.id },
      }) as unknown as AuthDispatcher;
      const result = await createFoodMovementAction(
        dispatcher,
        direction,
        body,
      );
      expect(dispatcher).toHaveBeenCalledWith(endpoint, {
        method: "POST",
        body,
      });
      expect(result.replayed).toBe(replayed);
      expect(result.movement.id).toBe(body.id);
    },
  );
});
