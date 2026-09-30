import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createFoodMovementAction } from "@/services/foodMovement.service";
import {
  CreateFoodMovementRequest,
  FoodMovementDirection,
} from "@/types/establishment";
import { ApiError, ERROR_TYPES } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { FOOD_MOVEMENT_FORM as COPY } from "@/constants/establishments";

export function useCreateFoodMovement() {
  const { makeAuthorizedRequest } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ambiguous, setAmbiguous] = useState(false);
  const [frozen, setFrozen] = useState<{
    direction: FoodMovementDirection;
    body: CreateFoodMovementRequest;
  } | null>(null);
  const reset = () => {
    setError(null);
    setAmbiguous(false);
    setFrozen(null);
  };
  const perform = async (request: {
    direction: FoodMovementDirection;
    body: CreateFoodMovementRequest;
  }) => {
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
      setAmbiguous(false);
      return result;
    } catch (reason) {
      if (reason instanceof ApiError) {
        setAmbiguous(false);
        setFrozen(null);
        setError(
          reason.type === ERROR_TYPES.INSUFFICIENT_STOCK
            ? null
            : getErrorMessage(reason, { fallback: COPY.saveError }),
        );
      } else {
        setFrozen(request);
        setAmbiguous(true);
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
    ambiguous,
    reset,
    submit: (
      direction: FoodMovementDirection,
      body: CreateFoodMovementRequest,
    ) => perform({ direction, body }),
    retryFrozen: () => (frozen ? perform(frozen) : Promise.resolve(null)),
  };
}
