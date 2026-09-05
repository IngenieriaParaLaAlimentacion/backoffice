import { ApiError } from "@/lib/apiError";
import {
  GENERIC_ERROR_MESSAGE,
  SHARED_ERROR_MESSAGES,
} from "@/constants/errors";

type GetErrorMessageOptions = {
  /** Screen-specific copy, keyed by `type`. Takes precedence over the shared map. */
  overrides?: Record<string, string>;
  fallback?: string;
};

/**
 * Resolve a thrown error into Spanish copy for the user.
 *
 * An error's `message` is never returned: for an `ApiError` it holds the
 * backend's English `detail`, which the backend documents as prose it may
 * reword at any time. Anything we don't have copy for becomes `fallback`,
 * so an unmapped error degrades to a vague Spanish message rather than a
 * precise English one.
 */
export function getErrorMessage(
  error: unknown,
  { overrides, fallback = GENERIC_ERROR_MESSAGE }: GetErrorMessageOptions = {},
): string {
  if (!(error instanceof ApiError) || !error.type) return fallback;
  return (
    overrides?.[error.type] ?? SHARED_ERROR_MESSAGES[error.type] ?? fallback
  );
}
