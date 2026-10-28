import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NutritionReportDetail from "./NutritionReportDetail";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import {
  buildNutritionReport,
  REPORT_PDF_FILENAME,
  saveNutritionReport,
} from "@/mocks/fixtures/nutritionReport";
import { makeGenerateNutritionReportFailureHandler } from "@/mocks/handlers/nutritionReport";
import {
  NUTRITION_REPORT_DETAIL as COPY,
  NUTRITION_REPORT_ERROR_MESSAGES,
  NUTRITION_REPORT_EXTRAS as EXTRAS,
  NUTRITION_REPORT_NOTICE as NOTICE,
  NUTRITION_REPORT_SECTIONS as SECTIONS,
} from "@/constants/nutritionReport";
import { ERROR_TYPES } from "@/lib/apiError";

const ESTABLISHMENT = MOCK_ESTABLISHMENTS[0].id;

const renderDetail = (month: string, establishmentId = ESTABLISHMENT) =>
  renderWithProviders(
    <NutritionReportDetail establishmentId={establishmentId} month={month} />,
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

  it("marks the nutrients at risk in words, with the reference and the minimum", async () => {
    await renderDetail("2026-09");

    const calcium = (await screen.findByRole("row", {
      name: /Calcio/,
    })) as HTMLElement;
    expect(
      within(calcium).getByText(SECTIONS.nutrients.atRisk),
    ).toBeInTheDocument();
    expect(within(calcium).getByText("500 mg")).toBeInTheDocument();
    expect(within(calcium).getByText("333,33 mg")).toBeInTheDocument();
    expect(within(calcium).getByText("310 mg")).toBeInTheDocument();
    expect(within(calcium).getByText("62%")).toBeInTheDocument();

    const iron = screen.getByRole("row", { name: /Hierro/ });
    expect(
      within(iron).getByText(SECTIONS.nutrients.adequate),
    ).toBeInTheDocument();
  });

  it("says whether each macronutrient is inside its recommended range", async () => {
    await renderDetail("2026-09");

    const proteins = await screen.findByRole("row", { name: /Proteínas/ });
    expect(within(proteins).getByText("10% a 15%")).toBeInTheDocument();
    expect(
      within(proteins).getByText(SECTIONS.macros.inRange),
    ).toBeInTheDocument();
    const lipids = screen.getByRole("row", { name: /Lípidos/ });
    expect(
      within(lipids).getByText(SECTIONS.macros.outOfRange),
    ).toBeInTheDocument();
  });

  it("shows the GAPA groups and names the missing ones", async () => {
    await renderDetail("2026-09");

    const dairy = await screen.findByRole("row", {
      name: /Leche, yogur y quesos/,
    });
    expect(within(dairy).getByText(SECTIONS.gapa.missing)).toBeInTheDocument();
    expect(
      screen.getByText(
        SECTIONS.gapa.missingSummary([
          "Leche, yogur y quesos",
          "Carnes y huevos",
        ]),
      ),
    ).toBeInTheDocument();
  });

  it("suggests foods for each nutrient at risk, with what they give per 100 kcal", async () => {
    await renderDetail("2026-09");

    const calcium = (
      await screen.findByRole("heading", { name: "Calcio", level: 3 })
    ).parentElement as HTMLElement;
    expect(within(calcium).getByText("Leche entera")).toBeInTheDocument();
    expect(
      within(calcium).getByText(EXTRAS.suggested.per100kcal("190 mg")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Vitamina B12", level: 3 }),
    ).toBeInTheDocument();
    // Iron is not at risk: it gets no suggestions.
    expect(
      screen.queryByRole("heading", { name: "Hierro", level: 3 }),
    ).not.toBeInTheDocument();
  });

  it("shows the AI's reading under each table", async () => {
    await renderDetail("2026-09");

    expect(
      await screen.findByText(/clave para el crecimiento de los huesos/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/lípidos superan el rango y los carbohidratos/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No ingresaron lácteos ni carnes/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Conviene incorporar leche/)).toBeInTheDocument();
  });

  it("warns about the foods left out of the calculation", async () => {
    await renderDetail("2026-09");

    const notice = await screen.findByText(EXTRAS.excluded.one("Varios"));
    // Quoted, like the scope note at the end.
    expect(notice.tagName).toBe("BLOCKQUOTE");
  });

  it("shows the figures without the AI's reading when its text is unavailable", async () => {
    await renderDetail("2026-08");

    await screen.findByText(COPY.summaryUnavailable);
    expect(screen.getByRole("row", { name: /Calcio/ })).toBeInTheDocument();
    expect(
      screen.queryByText(/clave para el crecimiento de los huesos/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(COPY.overviewTitle)).not.toBeInTheDocument();
  });

  it("says there is no data for a month without intakes, and still allows the PDF", async () => {
    await renderDetail("2026-07");

    expect(await screen.findByText(COPY.noData)).toBeInTheDocument();
    expect(screen.queryByText(COPY.indicatorLabel)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: COPY.downloadPdf }),
    ).toBeEnabled();
  });

  it("fills in a month saved without data once its intakes were loaded", async () => {
    await renderDetail("2026-07");
    expect(await screen.findByText(COPY.noData)).toBeInTheDocument();
    expect(screen.getByText(COPY.noDataHint)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: COPY.recalculate }),
    );

    expect(await screen.findByText(COPY.indicatorLabel)).toBeInTheDocument();
    expect(screen.queryByText(COPY.noData)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: COPY.recalculate }),
    ).not.toBeInTheDocument();
  });

  it("says nothing changed when the month still has no intakes", async () => {
    const withoutIntakes = MOCK_ESTABLISHMENTS[1].id;
    saveNutritionReport(
      buildNutritionReport({
        establishmentId: withoutIntakes,
        month: "2026-06",
        noData: true,
      }),
    );
    await renderDetail("2026-06", withoutIntakes);

    await userEvent.click(
      await screen.findByRole("button", { name: COPY.recalculate }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(NOTICE.unchanged("junio de 2026"));
    expect(screen.getByText(COPY.noData)).toBeInTheDocument();

    // It stays until it is closed, and then it is gone.
    await userEvent.click(
      within(dialog).getByRole("button", { name: NOTICE.close }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("only offers to recalculate a month without data", async () => {
    await renderDetail("2026-09");

    await screen.findByText(COPY.indicatorLabel);
    expect(
      screen.queryByRole("button", { name: COPY.recalculate }),
    ).not.toBeInTheDocument();
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
