import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NutritionReportDetail from "./NutritionReportDetail";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { REPORT_PDF_FILENAME } from "@/mocks/fixtures/nutritionReport";
import { makeGenerateNutritionReportFailureHandler } from "@/mocks/handlers/nutritionReport";
import {
  NUTRITION_REPORT_DETAIL as COPY,
  NUTRITION_REPORT_ERROR_MESSAGES,
} from "@/constants/nutritionReport";
import { ERROR_TYPES } from "@/lib/apiError";

const ESTABLISHMENT = MOCK_ESTABLISHMENTS[0].id;

const renderDetail = (month: string) =>
  renderWithProviders(
    <NutritionReportDetail establishmentId={ESTABLISHMENT} month={month} />,
  );

describe("NutritionReportDetail", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-27T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
    vi.restoreAllMocks();
  });

  it("shows the report with its summary, indicator and scope note", async () => {
    await renderDetail("2026-09");

    expect(
      await screen.findByRole("heading", {
        name: COPY.title("septiembre de 2026"),
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("78,4%")).toBeInTheDocument();
    expect(screen.getByText(/principal punto a mejorar/)).toBeInTheDocument();
    const note = screen.getByText(/No conoce la dieta completa/);
    // A quote, and the last thing on the screen.
    expect(note.tagName).toBe("BLOCKQUOTE");
    expect(note.nextElementSibling).toBeNull();
    expect(
      screen.getByRole("button", { name: COPY.downloadPdf }),
    ).toBeEnabled();
  });

  it("says there is no data for a month without intakes, and still allows the PDF", async () => {
    await renderDetail("2026-07");

    expect(await screen.findByText(COPY.noData)).toBeInTheDocument();
    expect(screen.queryByText(COPY.indicatorLabel)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: COPY.downloadPdf }),
    ).toBeEnabled();
  });

  it("keeps the figures when the AI text is unavailable and lets you regenerate it", async () => {
    await renderDetail("2026-08");

    expect(
      await screen.findByText(COPY.summaryUnavailable),
    ).toBeInTheDocument();
    expect(screen.getByText("78,4%")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: COPY.downloadPdf }),
    ).toBeDisabled();
    expect(screen.getByText(COPY.pdfBlockedHint)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: COPY.regenerateText }),
    );

    await waitFor(() =>
      expect(
        screen.queryByText(COPY.summaryUnavailable),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: COPY.downloadPdf }),
    ).toBeEnabled();
  });

  it("explains a failed regeneration in Spanish and keeps the report", async () => {
    server.use(makeGenerateNutritionReportFailureHandler("timeout"));
    await renderDetail("2026-08");

    await userEvent.click(
      await screen.findByRole("button", { name: COPY.regenerateText }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      NUTRITION_REPORT_ERROR_MESSAGES[
        ERROR_TYPES.NUTRITION_REPORT_GENERATION_TIMEOUT
      ],
    );
    expect(screen.getByText(COPY.summaryUnavailable)).toBeInTheDocument();
  });

  it("downloads the PDF under the name the server chose", async () => {
    Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:mock"),
      revokeObjectURL: vi.fn(),
    });
    const anchors: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      anchors.push(this);
    });
    await renderDetail("2026-09");

    await userEvent.click(
      await screen.findByRole("button", { name: COPY.downloadPdf }),
    );

    await waitFor(() => expect(anchors).toHaveLength(1));
    expect(anchors[0].download).toBe(REPORT_PDF_FILENAME("2026-09"));
  });

  it("says the report was not generated for a month without one", async () => {
    await renderDetail("2026-06");

    expect(await screen.findByText(COPY.notGenerated)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: COPY.downloadPdf }),
    ).not.toBeInTheDocument();
  });

  it("does not ask the backend about a month that cannot have a report", async () => {
    await renderDetail("2026-10");

    expect(await screen.findByText(COPY.notGenerated)).toBeInTheDocument();
  });
});
