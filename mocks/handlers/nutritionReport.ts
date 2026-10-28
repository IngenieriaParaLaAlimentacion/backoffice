import { http, HttpResponse } from "msw";
import {
  ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT,
  ESTABLISHMENT_NUTRITION_REPORT_PDF_ENDPOINT,
  ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT,
} from "@/constants/api";
import { ERROR_TYPES } from "@/lib/apiError";
import { isClosedMonth } from "@/lib/reportMonth";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import {
  buildNutritionReport,
  REPORT_PDF_FILENAME,
  saveNutritionReport,
  savedNutritionReports,
} from "@/mocks/fixtures/nutritionReport";

const WITHOUT_INTAKES_ID = MOCK_ESTABLISHMENTS[1].id;

function problem(
  type: string,
  status: number,
  instance: string,
  extensions: Record<string, unknown> = {},
  headers: Record<string, string> = {},
) {
  return HttpResponse.json(
    {
      type,
      title: type,
      status,
      detail: "English prose the UI must never show",
      instance,
      ...extensions,
    },
    {
      status,
      headers: { "Content-Type": "application/problem+json", ...headers },
    },
  );
}

export function makeListNutritionReportsHandler() {
  return http.get<{ id: string }>(
    ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT(":id"),
    ({ params, request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page") ?? 1);
      const pageSize = Number(url.searchParams.get("page_size") ?? 20);
      const ascending = url.searchParams.get("sort_order") === "month_asc";
      const sorted = [...savedNutritionReports(params.id)].sort((a, b) =>
        ascending
          ? a.month.localeCompare(b.month)
          : b.month.localeCompare(a.month),
      );
      const start = (page - 1) * pageSize;
      return HttpResponse.json({
        items: sorted.slice(start, start + pageSize).map((report) => ({
          id: report.id,
          month: report.month,
          has_data: report.has_data,
          summary_status: report.summary_status,
          created_at: report.created_at,
        })),
        total: sorted.length,
        page,
        page_size: pageSize,
        total_pages: Math.max(1, Math.ceil(sorted.length / pageSize)),
      });
    },
  );
}

/** Reads a saved report. Never generates one. */
export function makeGetNutritionReportHandler() {
  return http.get<{ id: string; month: string }>(
    ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"),
    ({ params, request }) => {
      const report = savedNutritionReports(params.id).find(
        (item) => item.month === params.month,
      );
      return report
        ? HttpResponse.json(report)
        : problem(
            ERROR_TYPES.NUTRITION_REPORT_NOT_FOUND,
            404,
            new URL(request.url).pathname,
          );
    },
  );
}

/**
 * Returns the saved report (200) or generates and saves it (201). A saved
 * report whose text failed gets its text written again, like the backend.
 */
export function makeGenerateNutritionReportHandler() {
  return http.put<{ id: string; month: string }>(
    ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"),
    ({ params, request }) => {
      const path = new URL(request.url).pathname;
      if (!isClosedMonth(params.month))
        return problem(ERROR_TYPES.NUTRITION_REPORT_MONTH_NOT_OVER, 422, path);

      const saved = savedNutritionReports(params.id).find(
        (item) => item.month === params.month,
      );
      if (saved && saved.summary_status !== "unavailable")
        return HttpResponse.json(saved, { status: 200 });

      const report = buildNutritionReport({
        establishmentId: params.id,
        month: params.month,
        noData: params.id === WITHOUT_INTAKES_ID,
      });
      saveNutritionReport(report);
      return HttpResponse.json(report, { status: saved ? 200 : 201 });
    },
  );
}

export type GenerateFailure =
  | "quota"
  | "rate-limited"
  | "timeout"
  | "conversion-unavailable";

/**
 * Makes the generate call fail the way the backend does. `retryAfter` is sent
 * in the body and the header; leave it out for a 429 that does not know.
 */
export function makeGenerateNutritionReportFailureHandler(
  failure: GenerateFailure,
  options?: { retryAfter?: number },
) {
  const retryAfter = options?.retryAfter;
  const limit = {
    ...(retryAfter ? { retry_after: retryAfter } : {}),
  };
  const limitHeaders: Record<string, string> = retryAfter
    ? { "Retry-After": String(retryAfter) }
    : {};

  return http.put<{ id: string; month: string }>(
    ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"),
    ({ request }) => {
      const path = new URL(request.url).pathname;
      switch (failure) {
        case "quota":
          return problem(
            ERROR_TYPES.AI_QUOTA_EXHAUSTED,
            429,
            path,
            limit,
            limitHeaders,
          );
        case "rate-limited":
          return problem(
            ERROR_TYPES.RATE_LIMITED,
            429,
            path,
            limit,
            limitHeaders,
          );
        case "timeout":
          return problem(
            ERROR_TYPES.NUTRITION_REPORT_GENERATION_TIMEOUT,
            504,
            path,
          );
        case "conversion-unavailable":
          return problem(
            ERROR_TYPES.NUTRITION_REPORT_CONVERSION_UNAVAILABLE,
            409,
            path,
          );
      }
    },
  );
}

/** A saved report as a PDF, named by the server. Never generates or spends quota. */
export function makeNutritionReportPdfHandler() {
  return http.get<{ id: string; month: string }>(
    ESTABLISHMENT_NUTRITION_REPORT_PDF_ENDPOINT(":id", ":month"),
    ({ params, request }) => {
      const path = new URL(request.url).pathname;
      const report = savedNutritionReports(params.id).find(
        (item) => item.month === params.month,
      );
      if (!report)
        return problem(ERROR_TYPES.NUTRITION_REPORT_NOT_FOUND, 404, path);
      if (report.summary_status === "unavailable")
        return problem(
          ERROR_TYPES.NUTRITION_REPORT_SUMMARY_UNAVAILABLE,
          409,
          path,
        );
      return new HttpResponse("%PDF-1.4 mock", {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${REPORT_PDF_FILENAME(report.month)}"`,
        },
      });
    },
  );
}
