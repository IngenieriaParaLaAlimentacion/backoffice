import { describe, expect, it, vi } from "vitest";
import { createFoodMovementAction } from "./foodMovement.service";
import { FOOD_INTAKES_ENDPOINT, FOOD_OUTFLOWS_ENDPOINT } from "@/constants/api";
import { AuthDispatcher } from "@/context/AuthContext";
import {
  CreateFoodOutflowRequest,
  MovementRequest,
} from "@/types/establishment";

const body: CreateFoodOutflowRequest = {
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
  const requests: [MovementRequest, string, number, boolean][] = [
    [
      {
        direction: "in",
        body: { ...body, origin_type: "foundation", is_recurring: false },
      },
      FOOD_INTAKES_ENDPOINT,
      201,
      false,
    ],
    [{ direction: "out", body }, FOOD_OUTFLOWS_ENDPOINT, 200, true],
  ];
  it.each(requests)(
    "posts %s to its endpoint and preserves replay status",
    async (request, endpoint, status, replayed) => {
      const dispatcher = vi.fn().mockResolvedValue({
        ok: true,
        status,
        data: { id: body.id },
      }) as unknown as AuthDispatcher;
      const result = await createFoodMovementAction(dispatcher, request);
      expect(dispatcher).toHaveBeenCalledWith(endpoint, {
        method: "POST",
        body: request.body,
      });
      expect("origin_type" in request.body).toBe(request.direction === "in");
      expect(result.replayed).toBe(replayed);
      expect(result.movement.id).toBe(body.id);
    },
  );
});
