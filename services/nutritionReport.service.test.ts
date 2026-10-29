import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { apiRequest, downloadRequest } from "@/lib/http";
import { ApiError, ERROR_TYPES, getRetryAfterSeconds } from "@/lib/apiError";
import {
  ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT,
  ESTABLISHMENT_NUTRITION_REPORT_PDF_ENDPOINT,
  ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT,
} from "@/constants/api";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { buildNutritionReport } from "@/mocks/fixtures/nutritionReport";
import {
  downloadNutritionReportPdfAction,
  generateNutritionReportAction,
  getNutritionReportAction,
  listNutritionReportsAction,
} from "./nutritionReport.service";

const ESTABLISHMENT = MOCK_ESTABLISHMENTS[0].id;

const caught = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("expected the call to fail");
};

const problem = (
  type: string,
  status: number,
  headers: Record<string, string> = {},
) =>
  HttpResponse.json(
    { type, title: type, status, detail: "x", instance: "/" },
    {
      status,
      headers: { "Content-Type": "application/problem+json", ...headers },
    },
  );

describe("nutrition report service", () => {
  describe("listNutritionReportsAction", () => {
    it("sends the page, the page size and the sort order as query parameters", async () => {
      let query: URLSearchParams | undefined;
      server.use(
        http.get(
          ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT(":id"),
          ({ request }) => {
            query = new URL(request.url).searchParams;
            return HttpResponse.json({
              items: [],
              total: 0,
              page: 2,
              page_size: 12,
              total_pages: 1,
            });
          },
        ),
      );

      await listNutritionReportsAction(apiRequest, ESTABLISHMENT, {
        sort_order: "month_asc",
        page: 2,
        page_size: 12,
      });

      expect(Object.fromEntries(query!)).toEqual({
        sort_order: "month_asc",
        page: "2",
        page_size: "12",
      });
    });

    it("sends no query string when it has no parameters", async () => {
      let search: string | undefined;
      server.use(
        http.get(
          ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT(":id"),
          ({ request }) => {
            search = new URL(request.url).search;
            return HttpResponse.json({
              items: [],
              total: 0,
              page: 1,
              page_size: 20,
              total_pages: 1,
            });
          },
        ),
      );

      await listNutritionReportsAction(apiRequest, ESTABLISHMENT);

      expect(search).toBe("");
    });
  });

  describe("getNutritionReportAction", () => {
    it("throws an ApiError that keeps the backend's status and type", async () => {
      server.use(
        http.get(ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"), () =>
          problem(ERROR_TYPES.NUTRITION_REPORT_NOT_FOUND, 404),
        ),
      );

      const error = await caught(
        getNutritionReportAction(apiRequest, ESTABLISHMENT, "2026-06"),
      );

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(404);
      expect(error.type).toBe(ERROR_TYPES.NUTRITION_REPORT_NOT_FOUND);
    });
  });

  describe("generateNutritionReportAction", () => {
    it("asks with PUT and returns the report", async () => {
      const saved = buildNutritionReport({ month: "2026-06" });
      server.use(
        http.put(ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"), () =>
          HttpResponse.json(saved, { status: 201 }),
        ),
      );

      const report = await generateNutritionReportAction(
        apiRequest,
        ESTABLISHMENT,
        "2026-06",
      );

      expect(report.id).toBe(saved.id);
    });

    it("keeps the Retry-After header of a 429 whose body does not say how long", async () => {
      server.use(
        http.put(ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"), () =>
          problem(ERROR_TYPES.RATE_LIMITED, 429, { "Retry-After": "30" }),
        ),
      );

      const error = await caught(
        generateNutritionReportAction(apiRequest, ESTABLISHMENT, "2026-06"),
      );

      expect(error.status).toBe(429);
      expect(getRetryAfterSeconds(error)).toBe(30);
    });
  });

  describe("downloadNutritionReportPdfAction", () => {
    it("asks for the PDF of that month and hands the file back", async () => {
      let pathname: string | undefined;
      server.use(
        http.get(
          ESTABLISHMENT_NUTRITION_REPORT_PDF_ENDPOINT(":id", ":month"),
          ({ request }) => {
            pathname = new URL(request.url).pathname;
            return new HttpResponse("%PDF-1.4 mock", {
              headers: { "Content-Type": "application/pdf" },
            });
          },
        ),
      );

      const file = await downloadNutritionReportPdfAction(
        downloadRequest,
        ESTABLISHMENT,
        "2026-09",
      );

      expect(pathname).toBe(
        ESTABLISHMENT_NUTRITION_REPORT_PDF_ENDPOINT(ESTABLISHMENT, "2026-09"),
      );
      expect(await file.blob.text()).toBe("%PDF-1.4 mock");
    });
  });
});
