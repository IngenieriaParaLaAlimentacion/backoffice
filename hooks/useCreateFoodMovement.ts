import { useState } from "react";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import { createFoodMovementAction } from "@/services/foodMovement.service";
import {
  CreateFoodMovementRequest,
  FoodMovementDirection,
} from "@/types/establishment";
import { ApiError, ERROR_TYPES } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { FOOD_MOVEMENT_FORM as COPY } from "@/constants/establishments";

type MovementRequest = {
  direction: FoodMovementDirection;
  body: CreateFoodMovementRequest;
};

export function useCreateFoodMovement() {
  const { makeAuthorizedRequest } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frozen, setFrozen] = useState<MovementRequest | null>(null);
  const reset = () => {
    setError(null);
    setFrozen(null);
  };
  const perform = async (request: MovementRequest) => {
    if (saving) return null;
    setSaving(true);
    setError(null);
    try {
      const result = await createFoodMovementAction(
        makeAuthorizedRequest,
        request.direction,
        request.body,
      );
      setFrozen(null);
      return result;
    } catch (reason) {
      // A 5xx may come from a proxy after the backend committed, so only a
      // client error or the lock-timeout slug proves nothing was saved.
      const rejected =
        reason instanceof ApiError &&
        (reason.status < StatusCodes.INTERNAL_SERVER_ERROR ||
          reason.type === ERROR_TYPES.CONCURRENT_UPDATE);
      if (rejected) {
        setFrozen(null);
        setError(
          reason.type === ERROR_TYPES.INSUFFICIENT_STOCK
            ? null
            : getErrorMessage(reason, { fallback: COPY.saveError }),
        );
      } else {
        setFrozen(request);
        setError(COPY.uncertainSave);
      }
      throw reason;
    } finally {
      setSaving(false);
    }
  };
  return {
    saving,
    error,
    ambiguous: frozen !== null,
    reset,
    submit: (
      direction: FoodMovementDirection,
      body: CreateFoodMovementRequest,
    ) => perform({ direction, body }),
    retryFrozen: () => (frozen ? perform(frozen) : Promise.resolve(null)),
  };
}
