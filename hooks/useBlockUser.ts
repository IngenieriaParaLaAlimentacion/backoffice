import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { blockUserAction, unblockUserAction } from "@/services/admin.service";
import { getErrorMessage } from "@/lib/errorMessages";
import { USER_DETAIL_PANEL } from "@/constants/users";
import { AdminUserDetail } from "@/types/admin";

export type BlockMode = "block" | "unblock";

const ACTIONS = { block: blockUserAction, unblock: unblockUserAction } as const;

/**
 * Blocks or unblocks a user, resolving to the updated user or `null` on
 * failure (with `error` set). A ref guards the call so a double click on
 * confirm sends a single request even before `isSubmitting` re-renders.
 */
export function useBlockUser(mode: BlockMode) {
  const { makeAuthorizedRequest } = useAuth();
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = USER_DETAIL_PANEL[mode];

  const submit = async (userId: string): Promise<AdminUserDetail | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      return await ACTIONS[mode](makeAuthorizedRequest, userId);
    } catch (err) {
      setError(
        getErrorMessage(err, {
          overrides: copy.errors,
          fallback: copy.genericError,
        }),
      );
      return null;
    } finally {
      inFlight.current = false;
      setIsSubmitting(false);
    }
  };

  /** Clears the error, e.g. when the dialog closes. */
  const reset = useCallback(() => setError(null), []);

  return { isSubmitting, error, submit, reset };
}
