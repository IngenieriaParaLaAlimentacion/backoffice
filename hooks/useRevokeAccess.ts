import { useCallback, useState } from "react";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import { revokeEstablishmentsAction } from "@/services/admin.service";
import { ApiError } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";

type RevokeAccessCopy = {
  confirmDialog: string;
  conflict: string;
  genericError: string;
};

/**
 * Shared confirm + call flow for revoking a user↔establishment relation,
 * used by both the establishment-detail (fixed establishment, varying
 * worker) and user-detail (fixed worker, varying establishment) views.
 * `rowId` is whichever id identifies the UI row being acted on — it equals
 * `userId` in the former and `establishmentId` in the latter.
 *
 * `refetch` re-syncs the list from the backend after any outcome that
 * changed (or may have changed) server state, so a row reflects its real
 * `revoked` status — or drops out of view if the caller's current filter no
 * longer includes it — instead of being removed from view client-side.
 */
export function useRevokeAccess(copy: RevokeAccessCopy, refetch: () => void) {
  const { makeAuthorizedRequest } = useAuth();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const revoke = async (
    rowId: string,
    userId: string,
    establishmentId: string,
  ) => {
    if (!window.confirm(copy.confirmDialog)) return;

    setRevokingId(rowId);
    setActionError(null);
    try {
      await revokeEstablishmentsAction(
        userId,
        [establishmentId],
        makeAuthorizedRequest,
      );
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.status === StatusCodes.CONFLICT) {
        setActionError(copy.conflict);
        refetch();
      } else {
        setActionError(getErrorMessage(err, { fallback: copy.genericError }));
      }
    } finally {
      setRevokingId(null);
    }
  };

  /** Clears in-flight/error state, e.g. when the open row changes. */
  const reset = useCallback(() => {
    setRevokingId(null);
    setActionError(null);
  }, []);

  return { revokingId, actionError, revoke, reset };
}
