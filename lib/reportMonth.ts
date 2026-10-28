import { argentineToday } from "@/lib/format";
import { ReportMonth } from "@/types/nutritionReport";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** How many past months the month picker offers. */
export const REPORT_MONTH_OPTIONS_COUNT = 24;

const previousMonth = (month: ReportMonth): ReportMonth => {
  const [year, number] = month.split("-").map(Number);
  return number === 1
    ? `${year - 1}-12`
    : `${year}-${String(number - 1).padStart(2, "0")}`;
};

/**
 * The newest month a report can be asked for: the one before the Argentine
 * calendar's current month. `today` is "YYYY-MM-DD".
 */
export function lastClosedMonth(today = argentineToday()): ReportMonth {
  return previousMonth(today.slice(0, 7));
}

/** A month is closed once the Argentine calendar has moved past it. */
export function isClosedMonth(
  month: string,
  today = argentineToday(),
): boolean {
  return MONTH_PATTERN.test(month) && month <= lastClosedMonth(today);
}

/** The closed months a report can be asked for, newest first. */
export function closedMonthOptions(
  count = REPORT_MONTH_OPTIONS_COUNT,
  today = argentineToday(),
): ReportMonth[] {
  const months: ReportMonth[] = [];
  let month = lastClosedMonth(today);
  for (let i = 0; i < count; i++) {
    months.push(month);
    month = previousMonth(month);
  }
  return months;
}
