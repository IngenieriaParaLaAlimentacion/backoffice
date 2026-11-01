import { ApiError, getRetryAfterSeconds } from "@/lib/apiError";
import { getErrorMessage } from "@/lib/errorMessages";
import { formatWaitDuration } from "@/lib/format";
import {
  NUTRITION_REPORT_ERROR_MESSAGES,
  NUTRITION_REPORT_FALLBACK_ERROR,
  NUTRITION_REPORT_LIMIT_ERROR_TYPES,
  NUTRITION_REPORT_LIMIT_MESSAGE,
} from "@/constants/nutritionReport";

/**
 * Spanish copy for anything the report endpoints can throw. The limit errors
 * are the one case that is not a plain lookup: they say how long to wait when
 * the backend reports `retry_after`.
 */
export function getNutritionReportErrorMessage(error: unknown): string {
  if (
    error instanceof ApiError &&
    error.type &&
    NUTRITION_REPORT_LIMIT_ERROR_TYPES.includes(error.type)
  ) {
    const seconds = getRetryAfterSeconds(error);
    return NUTRITION_REPORT_LIMIT_MESSAGE(
      seconds === null ? undefined : formatWaitDuration(seconds),
    );
  }
  return getErrorMessage(error, {
    overrides: NUTRITION_REPORT_ERROR_MESSAGES,
    fallback: NUTRITION_REPORT_FALLBACK_ERROR,
  });
}
