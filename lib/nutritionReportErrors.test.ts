import { describe, expect, it } from "vitest";
import { ApiError, ERROR_TYPES, toApiError } from "@/lib/apiError";
import { formatWaitDuration } from "@/lib/format";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import {
  NUTRITION_REPORT_ERROR_MESSAGES,
  NUTRITION_REPORT_FALLBACK_ERROR,
  NUTRITION_REPORT_LIMIT_MESSAGE,
} from "@/constants/nutritionReport";

const problem = (type: string, status: number, extra = {}) => ({
  type,
  title: "x",
  status,
  detail: "English prose",
  instance: "/",
  ...extra,
});

describe("getNutritionReportErrorMessage", () => {
  it.each([
    [ERROR_TYPES.NUTRITION_REPORT_MONTH_NOT_OVER, 422],
    [ERROR_TYPES.NUTRITION_REPORT_NOT_FOUND, 404],
    [ERROR_TYPES.NUTRITION_REPORT_SUMMARY_UNAVAILABLE, 409],
    [ERROR_TYPES.NUTRITION_REPORT_CONVERSION_UNAVAILABLE, 409],
    [ERROR_TYPES.NUTRITION_REPORT_GENERATION_TIMEOUT, 504],
  ])("translates %s", (type, status) => {
    expect(
      getNutritionReportErrorMessage(toApiError(problem(type, status), status)),
    ).toBe(NUTRITION_REPORT_ERROR_MESSAGES[type]);
  });

  it("says how long to wait when the backend reports retry_after", () => {
    const error = toApiError(
      problem(ERROR_TYPES.AI_QUOTA_EXHAUSTED, 429, { retry_after: 120 }),
      429,
    );

    expect(getNutritionReportErrorMessage(error)).toBe(
      NUTRITION_REPORT_LIMIT_MESSAGE("2 minutos"),
    );
  });

  it("falls back to the Retry-After header when the body lacks it", () => {
    const error = toApiError(
      problem(ERROR_TYPES.RATE_LIMITED, 429),
      429,
      new Headers({ "Retry-After": "30" }),
    );

    expect(getNutritionReportErrorMessage(error)).toBe(
      NUTRITION_REPORT_LIMIT_MESSAGE("30 segundos"),
    );
  });

  it("gives a generic retry-later notice when no wait is reported", () => {
    const error = toApiError(problem(ERROR_TYPES.AI_QUOTA_EXHAUSTED, 429), 429);

    expect(getNutritionReportErrorMessage(error)).toBe(
      NUTRITION_REPORT_LIMIT_MESSAGE(),
    );
    expect(NUTRITION_REPORT_LIMIT_MESSAGE()).toMatch(/más tarde/);
  });

  it("never leaks the backend's English detail", () => {
    expect(
      getNutritionReportErrorMessage(new ApiError("English prose", 500)),
    ).toBe(NUTRITION_REPORT_FALLBACK_ERROR);
  });
});

describe("formatWaitDuration", () => {
  it.each([
    [1, "1 segundo"],
    [45, "45 segundos"],
    [60, "1 minuto"],
    [61, "2 minutos"],
    [3600, "1 hora"],
    [7200, "2 horas"],
    [86400, "1 día"],
    [200000, "3 días"],
  ])("%s s -> %s", (seconds, expected) => {
    expect(formatWaitDuration(seconds)).toBe(expected);
  });
});
