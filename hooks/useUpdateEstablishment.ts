import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateEstablishmentAction } from "@/services/establishment.service";
import { invalidateEstablishmentsMap } from "@/hooks/useEstablishmentsMap";
import { ERROR_TYPES } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { EDIT_ESTABLISHMENT_DIALOG as COPY } from "@/constants/establishments";
import {
  EstablishmentResponse,
  UpdateEstablishmentRequest,
} from "@/types/establishment";

/**
 * Saves a name/address edit. On success the map's cache is dropped too, so a
 * moved pin shows up there without a reload; the caller patches the ficha.
 */
export function useUpdateEstablishment(establishmentId: string) {
  const { makeAuthorizedRequest } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (
      body: UpdateEstablishmentRequest,
    ): Promise<EstablishmentResponse | null> => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await updateEstablishmentAction(
          makeAuthorizedRequest,
          establishmentId,
          body,
        );
        invalidateEstablishmentsMap();
        return updated;
      } catch (err) {
        setError(
          getErrorMessage(err, {
            overrides: {
              [ERROR_TYPES.ESTABLISHMENT_ALREADY_EXISTS]: COPY.addressTaken,
            },
            fallback: COPY.saveError,
          }),
        );
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [makeAuthorizedRequest, establishmentId],
  );

  const reset = useCallback(() => setError(null), []);

  return { save, isSaving, error, reset };
}
