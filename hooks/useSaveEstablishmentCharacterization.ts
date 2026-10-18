import { useCallback, useState } from "react";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import { updateEstablishmentCharacterizationAction } from "@/services/establishment.service";
import { ApiError } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { ESTABLISHMENT_PROFILE } from "@/constants/establishments";
import {
  EstablishmentCharacterization,
  EstablishmentCharacterizationResponse,
} from "@/types/establishment";

/**
 * A 422 names the offending field in its `field` extension (backend#196 CA7),
 * so the form can flag that field instead of showing a vague banner. The
 * caller keeps the form values as they are: a failed save never clears them.
 */
export function useSaveEstablishmentCharacterization(
  establishmentId: string,
  onSaved: (result: EstablishmentCharacterizationResponse) => void,
) {
  const { makeAuthorizedRequest } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  const save = useCallback(
    async (body: EstablishmentCharacterization) => {
      setIsSaving(true);
      setError(null);
      setErrorField(null);
      try {
        const result = await updateEstablishmentCharacterizationAction(
          makeAuthorizedRequest,
          establishmentId,
          body,
        );
        onSaved(result);
        return true;
      } catch (err) {
        if (
          err instanceof ApiError &&
          err.status === StatusCodes.UNPROCESSABLE_ENTITY &&
          typeof err.extensions.field === "string"
        )
          setErrorField(err.extensions.field);
        setError(
          getErrorMessage(err, { fallback: ESTABLISHMENT_PROFILE.saveError }),
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [makeAuthorizedRequest, establishmentId, onSaved],
  );

  return { save, isSaving, error, errorField };
}
