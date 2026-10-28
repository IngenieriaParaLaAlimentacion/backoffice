import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server";
import { apiRequest, downloadRequest } from "@/lib/http";
import { ApiError } from "@/lib/apiError";
import { getNutritionReportErrorMessage } from "@/lib/nutritionReportErrors";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { REPORT_PDF_FILENAME } from "@/mocks/fixtures/nutritionReport";
import { makeGenerateNutritionReportFailureHandler } from "@/mocks/handlers/nutritionReport";
import {
  downloadNutritionReportPdfAction,
  generateNutritionReportAction,
  getNutritionReportAction,
  listNutritionReportsAction,
} from "./nutritionReport.service";

const ESTABLISHMENT = MOCK_ESTABLISHMENTS[0].id;
const WITHOUT_INTAKES = MOCK_ESTABLISHMENTS[1].id;

const caught = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("expected the call to fail");
};

describe("nutrition report mocks", () => {
  it("lists the saved reports, newest month first", async () => {
    const page = await listNutritionReportsAction(apiRequest, ESTABLISHMENT);

    expect(page.items.map((item) => item.month)).toEqual([
      "2026-09",
      "2026-08",
      "2026-07",
    ]);
  });

  it("reads a saved report and answers 404 for a month without one", async () => {
    const report = await getNutritionReportAction(
      apiRequest,
      ESTABLISHMENT,
      "2026-09",
    );
    expect(report.summary_status).toBe("generated");

    const error = await caught(
      getNutritionReportAction(apiRequest, ESTABLISHMENT, "2026-06"),
    );
    expect(error.status).toBe(404);
  });

  it("generates a missing month with 201 and then reads it back", async () => {
    const report = await generateNutritionReportAction(
      apiRequest,
      ESTABLISHMENT,
      "2026-06",
    );
    expect(report.has_data).toBe(true);

    const saved = await getNutritionReportAction(
      apiRequest,
      ESTABLISHMENT,
      "2026-06",
    );
    expect(saved.id).toBe(report.id);
  });

  it("generates a month without intakes as no data, with no AI text", async () => {
    const report = await generateNutritionReportAction(
      apiRequest,
      WITHOUT_INTAKES,
      "2026-06",
    );

    expect(report.has_data).toBe(false);
    expect(report.summary_status).toBe("not_applicable");
    expect(report.summary).toBeNull();
    expect(report.analysis.nutrients).toEqual([]);
  });

  it("rewrites the text of a report whose AI text was unavailable", async () => {
    const report = await generateNutritionReportAction(
      apiRequest,
      ESTABLISHMENT,
      "2026-08",
    );

    expect(report.summary_status).toBe("generated");
    expect(report.summary).not.toBeNull();
  });

  it("refuses a month that has not ended", async () => {
    const error = await caught(
      generateNutritionReportAction(apiRequest, ESTABLISHMENT, "2999-01"),
    );

    expect(error.status).toBe(422);
    expect(getNutritionReportErrorMessage(error)).toMatch(/todavía no terminó/);
  });

  it("downloads the PDF with the name the server gives", async () => {
    const file = await downloadNutritionReportPdfAction(
      downloadRequest,
      ESTABLISHMENT,
      "2026-09",
    );

    expect(file.filename).toBe(REPORT_PDF_FILENAME("2026-09"));
  });

  it("downloads a month without intakes too", async () => {
    await generateNutritionReportAction(apiRequest, WITHOUT_INTAKES, "2026-06");

    const file = await downloadNutritionReportPdfAction(
      downloadRequest,
      WITHOUT_INTAKES,
      "2026-06",
    );

    expect(file.filename).toBe(REPORT_PDF_FILENAME("2026-06"));
  });

  it("refuses the PDF while the AI text is unavailable", async () => {
    const error = await caught(
      downloadNutritionReportPdfAction(
        downloadRequest,
        ESTABLISHMENT,
        "2026-08",
      ),
    );

    expect(error.status).toBe(409);
    expect(getNutritionReportErrorMessage(error)).toMatch(/volvé a generar/i);
  });

  it("surfaces how long to wait from a 429", async () => {
    server.use(
      makeGenerateNutritionReportFailureHandler("quota", { retryAfter: 90 }),
    );

    const error = await caught(
      generateNutritionReportAction(apiRequest, ESTABLISHMENT, "2026-06"),
    );

    expect(error.status).toBe(429);
    expect(getNutritionReportErrorMessage(error)).toMatch(/2 minutos/);
  });

  it("gives a generic notice when the 429 reports no wait", async () => {
    server.use(makeGenerateNutritionReportFailureHandler("rate-limited"));

    const error = await caught(
      generateNutritionReportAction(apiRequest, ESTABLISHMENT, "2026-06"),
    );

    expect(getNutritionReportErrorMessage(error)).toMatch(/más tarde/);
  });
});
