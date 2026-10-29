import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  mockBlobDownload,
  renderWithProviders,
  screen,
  waitFor,
} from "@/test-utils";
import { useNutritionReport } from "@/hooks/useNutritionReport";
import { useNutritionReportList } from "@/hooks/useNutritionReportList";
import { useNutritionReportPdf } from "@/hooks/useNutritionReportPdf";
import { server } from "@/mocks/server";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { REPORT_PDF_FILENAME } from "@/mocks/fixtures/nutritionReport";
import { makeGenerateNutritionReportFailureHandler } from "@/mocks/handlers/nutritionReport";
import { http, HttpResponse } from "msw";
import { ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT } from "@/constants/api";
import { NUTRITION_REPORT_LIMIT_MESSAGE } from "@/constants/nutritionReport";
import { NUTRITION_REPORT_ERROR_MESSAGES } from "@/constants/nutritionReport";
import { ERROR_TYPES } from "@/lib/apiError";

const ESTABLISHMENT = MOCK_ESTABLISHMENTS[0].id;

const text = (testId: string) => screen.getByTestId(testId).textContent;

function ReportProbe({ month }: { month: string | null }) {
  const {
    report,
    isLoading,
    loadError,
    isGenerating,
    generateError,
    generate,
  } = useNutritionReport(ESTABLISHMENT, month);
  return (
    <>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="report">
        {report === undefined ? "unknown" : report ? report.month : "none"}
      </span>
      <span data-testid="status">{report?.summary_status ?? ""}</span>
      <span data-testid="load-error">{loadError ?? ""}</span>
      <span data-testid="generating">{String(isGenerating)}</span>
      <span data-testid="generate-error">{generateError ?? ""}</span>
      <button onClick={() => void generate()}>generate</button>
    </>
  );
}

describe("useNutritionReport", () => {
  it("shows a saved report without generating anything", async () => {
    const puts = vi.fn();
    server.use(
      http.put(ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"), () => {
        puts();
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await renderWithProviders(<ReportProbe month="2026-09" />);

    await waitFor(() => expect(text("report")).toBe("2026-09"));
    expect(text("status")).toBe("generated");
    expect(text("load-error")).toBe("");
    expect(puts).not.toHaveBeenCalled();
  });

  it("treats a month with no saved report as not generated, not as an error", async () => {
    await renderWithProviders(<ReportProbe month="2026-06" />);

    await waitFor(() => expect(text("report")).toBe("none"));
    expect(text("load-error")).toBe("");
  });

  it("generates the report and then shows it", async () => {
    await renderWithProviders(<ReportProbe month="2026-06" />);
    await waitFor(() => expect(text("report")).toBe("none"));

    await userEvent.click(screen.getByText("generate"));

    await waitFor(() => expect(text("report")).toBe("2026-06"));
    expect(text("generate-error")).toBe("");
    expect(text("generating")).toBe("false");
  });

  it("rewrites the text of a report whose AI text was unavailable", async () => {
    await renderWithProviders(<ReportProbe month="2026-08" />);
    await waitFor(() => expect(text("status")).toBe("unavailable"));

    await userEvent.click(screen.getByText("generate"));

    await waitFor(() => expect(text("status")).toBe("generated"));
  });

  it("reports a 429 with how long to wait and keeps the state", async () => {
    server.use(
      makeGenerateNutritionReportFailureHandler("quota", { retryAfter: 90 }),
    );
    await renderWithProviders(<ReportProbe month="2026-06" />);
    await waitFor(() => expect(text("report")).toBe("none"));

    await userEvent.click(screen.getByText("generate"));

    await waitFor(() =>
      expect(text("generate-error")).toBe(
        NUTRITION_REPORT_LIMIT_MESSAGE("2 minutos"),
      ),
    );
    expect(text("report")).toBe("none");
  });

  it("says nothing was saved when generating times out", async () => {
    server.use(makeGenerateNutritionReportFailureHandler("timeout"));
    await renderWithProviders(<ReportProbe month="2026-06" />);
    await waitFor(() => expect(text("report")).toBe("none"));

    await userEvent.click(screen.getByText("generate"));

    await waitFor(() =>
      expect(text("generate-error")).toBe(
        NUTRITION_REPORT_ERROR_MESSAGES[
          ERROR_TYPES.NUTRITION_REPORT_GENERATION_TIMEOUT
        ],
      ),
    );
  });

  it("does nothing while no month is picked", async () => {
    await renderWithProviders(<ReportProbe month={null} />);

    expect(text("report")).toBe("unknown");
    expect(text("loading")).toBe("false");
  });
});

function ListProbe() {
  const { reports, total, error } = useNutritionReportList(ESTABLISHMENT);
  return (
    <>
      <span data-testid="months">{reports.map((r) => r.month).join(",")}</span>
      <span data-testid="total">{total}</span>
      <span data-testid="error">{error ?? ""}</span>
    </>
  );
}

describe("useNutritionReportList", () => {
  it("lists the generated reports, newest month first", async () => {
    await renderWithProviders(<ListProbe />);

    await waitFor(() => expect(text("months")).toBe("2026-09,2026-08,2026-07"));
    expect(text("total")).toBe("3");
  });

  it("picks up a report generated from the same screen", async () => {
    function Both() {
      const { generate } = useNutritionReport(ESTABLISHMENT, "2026-06");
      return (
        <>
          <ListProbe />
          <button onClick={() => void generate()}>generate</button>
        </>
      );
    }
    await renderWithProviders(<Both />);
    await waitFor(() => expect(text("total")).toBe("3"));

    await userEvent.click(screen.getByText("generate"));

    await waitFor(() => expect(text("total")).toBe("4"));
    expect(text("months")).toBe("2026-09,2026-08,2026-07,2026-06");
  });
});

function PdfProbe({ month }: { month: string }) {
  const { isDownloading, error, download } =
    useNutritionReportPdf(ESTABLISHMENT);
  return (
    <>
      <span data-testid="downloading">{String(isDownloading)}</span>
      <span data-testid="pdf-error">{error ?? ""}</span>
      <button onClick={() => void download(month)}>download</button>
    </>
  );
}

describe("useNutritionReportPdf", () => {
  it("saves the PDF under the name the server chose", async () => {
    const { click, anchors } = mockBlobDownload();
    await renderWithProviders(<PdfProbe month="2026-09" />);

    await userEvent.click(screen.getByText("download"));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(anchors()[0].download).toBe(REPORT_PDF_FILENAME("2026-09"));
    expect(text("pdf-error")).toBe("");
  });

  it("explains that the report must be generated again when its text is unavailable", async () => {
    await renderWithProviders(<PdfProbe month="2026-08" />);

    await userEvent.click(screen.getByText("download"));

    await waitFor(() =>
      expect(text("pdf-error")).toBe(
        NUTRITION_REPORT_ERROR_MESSAGES[
          ERROR_TYPES.NUTRITION_REPORT_SUMMARY_UNAVAILABLE
        ],
      ),
    );
  });
});
