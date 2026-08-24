import { useCallback, useState } from "react";
import { StatusCodes } from "http-status-codes";
import { useAuth } from "@/context/AuthContext";
import { revokeEstablishmentsAction } from "@/services/admin.service";
import { ApiError } from "@/lib/apiError";

type RevokeAccessCopy = {
  confirmDialog: string;
  conflict: string;
  genericError: string;
};

/**
 * Shared confirm + call + optimistic-removal flow for revoking a
 * user↔establishment relation, used by both the establishment-detail (fixed
 * establishment, varying worker) and user-detail (fixed worker, varying
 * establishment) views. `rowId` is whichever id identifies the UI row being
 * acted on — it equals `userId` in the former and `establishmentId` in the
 * latter.
 */
export function useRevokeAccess(
  copy: RevokeAccessCopy,
  onConflict?: () => void,
) {
  const { makeAuthorizedRequest } = useAuth();
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

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
      setRemovedIds((prev) => new Set(prev).add(rowId));
    } catch (err) {
      if (err instanceof ApiError && err.status === StatusCodes.CONFLICT) {
        setActionError(copy.conflict);
        onConflict?.();
      } else {
        setActionError(err instanceof Error ? err.message : copy.genericError);
      }
    } finally {
      setRevokingId(null);
    }
  };

  /** Clears in-flight/error/removed state, e.g. when the open row changes. */
  const reset = useCallback(() => {
    setRevokingId(null);
    setActionError(null);
    setRemovedIds(new Set());
  }, []);

  return { revokingId, actionError, removedIds, revoke, reset };
}
