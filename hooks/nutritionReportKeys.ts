import { NutritionReportSortOrder, ReportMonth } from "@/types/nutritionReport";

/**
 * SWR keys of the report screen. Array keys, so one comedor's list pages can
 * be invalidated together without touching its saved reports.
 */
export const nutritionReportKey = (
  establishmentId: string,
  month: ReportMonth,
) => ["nutrition-report", establishmentId, month] as const;

export const nutritionReportsListKey = (
  establishmentId: string,
  page: number,
  sortOrder: NutritionReportSortOrder,
) => ["nutrition-reports", establishmentId, page, sortOrder] as const;

export const nutritionReportsListMatcher =
  (establishmentId: string) => (key: unknown) =>
    Array.isArray(key) &&
    key[0] === "nutrition-reports" &&
    key[1] === establishmentId;
