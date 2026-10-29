import { AuthDispatcher, DownloadDispatcher } from "@/context/AuthContext";
import {
  ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT,
  ESTABLISHMENT_NUTRITION_REPORT_PDF_ENDPOINT,
  ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT,
} from "@/constants/api";
import {
  NutritionReportResponse,
  NutritionReportSortOrder,
  PaginatedNutritionReportsResponse,
  ReportMonth,
} from "@/types/nutritionReport";
import { toApiError } from "@/lib/apiError";

type ListNutritionReportsParams = {
  sort_order?: NutritionReportSortOrder;
  page?: number;
  page_size?: number;
};

export const listNutritionReportsAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  params?: ListNutritionReportsParams,
) => {
  const query = new URLSearchParams();
  if (params?.sort_order) query.set("sort_order", params.sort_order);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const endpoint = ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT(establishmentId);
  const path = query.size ? `${endpoint}?${query.toString()}` : endpoint;

  const res = await dispatcher<undefined, PaginatedNutritionReportsResponse>(
    path,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedNutritionReportsResponse;
};

/** Reads a saved report. Never generates one and never counts toward the AI usage limit. */
export const getNutritionReportAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  month: ReportMonth,
) => {
  const res = await dispatcher<undefined, NutritionReportResponse>(
    ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(establishmentId, month),
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as NutritionReportResponse;
};

/**
 * Returns the saved report of a month (200) or generates and saves it (201).
 * It counts toward the AI usage limit even when it returns a saved one, so
 * read with `getNutritionReportAction` and use this only to generate, to write
 * the text again when the AI had failed or to calculate a month saved without
 * data again.
 */
export const generateNutritionReportAction = async (
  dispatcher: AuthDispatcher,
  establishmentId: string,
  month: ReportMonth,
) => {
  const res = await dispatcher<undefined, NutritionReportResponse>(
    ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(establishmentId, month),
    { method: "PUT" },
  );

  // Only the 429s carry `Retry-After`, and only this call can produce them.
  if (!res.ok) throw toApiError(res.data, res.status, res.headers);

  return res.data as NutritionReportResponse;
};

/**
 * Downloads a saved report as a PDF, named by the server. It never generates
 * a report or counts toward the AI usage limit: 404 without a saved report,
 * 409 while its text is unavailable.
 */
export const downloadNutritionReportPdfAction = async (
  download: DownloadDispatcher,
  establishmentId: string,
  month: ReportMonth,
) =>
  download(ESTABLISHMENT_NUTRITION_REPORT_PDF_ENDPOINT(establishmentId, month));
