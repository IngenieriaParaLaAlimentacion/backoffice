import { mutate } from "swr";
import {
  NutritionReportResponse,
  NutritionReportSortOrder,
  ReportMonth,
} from "@/types/nutritionReport";

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

/**
 * What a generated (or recalculated) report leaves behind: the report in the
 * cache of its month, so the screen that opens it already has it, and the
 * lists of its comedor read again.
 */
export async function storeGeneratedReport(report: NutritionReportResponse) {
  await mutate(
    nutritionReportKey(report.establishment_id, report.month),
    report,
    {
      revalidate: false,
    },
  );
  await mutate(nutritionReportsListMatcher(report.establishment_id));
}
