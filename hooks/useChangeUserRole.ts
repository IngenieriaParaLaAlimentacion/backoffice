import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { changeUserRoleAction } from "@/services/admin.service";
import { getErrorMessage } from "@/lib/errorMessages";
import { USER_DETAIL_PANEL } from "@/constants/users";
import { AdminUserDetail } from "@/types/admin";
import { UserRole } from "@/types/user";

const COPY = USER_DETAIL_PANEL.changeRole;

/**
 * Submits a role change, resolving to the updated user or `null` on failure
 * (with `error` set). A ref guards the call so a double click on confirm
 * sends a single request even before `isSubmitting` re-renders the button.
 */
export function useChangeUserRole() {
  const { makeAuthorizedRequest } = useAuth();
  const inFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeRole = async (
    userId: string,
    role: UserRole,
  ): Promise<AdminUserDetail | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      return await changeUserRoleAction(makeAuthorizedRequest, userId, role);
    } catch (err) {
      setError(
        getErrorMessage(err, {
          overrides: COPY.errors,
          fallback: COPY.genericError,
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

  return { isSubmitting, error, changeRole, reset };
}
