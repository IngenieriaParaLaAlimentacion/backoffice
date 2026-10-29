import { REPORT_MONTH_PATTERN } from "@/constants/nutritionReport";
import { argentineToday } from "@/lib/format";
import { ReportMonth } from "@/types/nutritionReport";

/** "YYYY-MM": what is left of a "YYYY-MM-DD" day once the day is dropped. */
const MONTH_KEY_LENGTH = "YYYY-MM".length;

/** How many past months the month picker offers. */
const REPORT_MONTH_OPTIONS_COUNT = 24;

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
  return previousMonth(today.slice(0, MONTH_KEY_LENGTH));
}

/** A month is closed once the Argentine calendar has moved past it. */
export function isClosedMonth(
  month: string,
  today = argentineToday(),
): boolean {
  return REPORT_MONTH_PATTERN.test(month) && month <= lastClosedMonth(today);
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
