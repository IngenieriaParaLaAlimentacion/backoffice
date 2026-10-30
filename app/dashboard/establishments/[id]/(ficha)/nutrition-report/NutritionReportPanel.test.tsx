import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import NutritionReportPanel from "./NutritionReportPanel";
import RequirePermission from "@/components/RequirePermission";
import { mockBlobDownload, renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import {
  buildNutritionReport,
  saveNutritionReport,
} from "@/mocks/fixtures/nutritionReport";
import { makeGenerateNutritionReportFailureHandler } from "@/mocks/handlers/nutritionReport";
import {
  ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT,
  ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT,
} from "@/constants/api";
import {
  NUTRITION_REPORT_DIALOG as DIALOG,
  NUTRITION_REPORT_LIMIT_MESSAGE,
  NUTRITION_REPORT_NOTICE as NOTICE,
  NUTRITION_REPORT_PAGE as COPY,
  nutritionReportHref,
} from "@/constants/nutritionReport";
import { FORBIDDEN_SCREEN } from "@/constants/permissions";

// The wait is shortened so the test does not sit through the real threshold.
vi.mock("@/constants/nutritionReport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/constants/nutritionReport")>()),
  NUTRITION_REPORT_SLOW_HINT_MS: 50,
}));

const push = vi.fn();
const prefetch = vi.fn();
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push, prefetch }),
}));

const ESTABLISHMENT = MOCK_ESTABLISHMENTS[0].id;

const renderPanel = () =>
  renderWithProviders(<NutritionReportPanel establishmentId={ESTABLISHMENT} />);

const openDialog = async () => {
  await userEvent.click(
    await screen.findByRole("button", { name: COPY.newReport }),
  );
  return screen.findByRole("dialog");
};

describe("NutritionReportPanel", () => {
  beforeEach(() => {
    push.mockClear();
    prefetch.mockClear();
    // Pins the default month: today is July 2026, so June is the one offered.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-10T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists the saved reports, newest first, each linking to its own screen", async () => {
    await renderPanel();

    const links = await screen.findAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining("septiembre de 2026"),
      expect.stringContaining("agosto de 2026"),
      expect.stringContaining("julio de 2026"),
    ]);
    expect(links[0]).toHaveAttribute(
      "href",
      nutritionReportHref(ESTABLISHMENT, "2026-09"),
    );
    expect(screen.getByText(COPY.subtitle(3))).toBeInTheDocument();
    expect(
      within(links[1]).getByText(COPY.summaryStatus.unavailable),
    ).toBeVisible();
    expect(
      within(links[2]).getByText(COPY.summaryStatus.not_applicable),
    ).toBeVisible();
  });

  it("says so when the comedor has no reports yet", async () => {
    server.use(
      http.get(ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT(":id"), () =>
        HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          page_size: 12,
          total_pages: 1,
        }),
      ),
    );

    await renderPanel();

    expect(await screen.findByText(COPY.empty)).toBeInTheDocument();
  });

  it("says so when another page fails to load, and lets you ask for it again", async () => {
    const item = (id: string, month: string) => ({
      id,
      month,
      has_data: true,
      summary_status: "generated",
      created_at: "2026-10-01T10:00:00Z",
    });
    let secondPageRequests = 0;
    server.use(
      http.get(
        ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT(":id"),
        ({ request }) => {
          const page = Number(new URL(request.url).searchParams.get("page"));
          if (page === 2 && ++secondPageRequests === 1)
            return new HttpResponse(null, { status: 500 });
          return HttpResponse.json({
            items: [page === 2 ? item("b", "2026-01") : item("a", "2026-09")],
            total: 13,
            page,
            page_size: 12,
            total_pages: 2,
          });
        },
      ),
    );
    await renderPanel();
    expect(await screen.findByRole("link")).toHaveTextContent(
      "septiembre de 2026",
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Página siguiente" }),
    );

    // The list on screen is the first page's: the failure must not go unsaid.
    const retry = await screen.findByRole("button", { name: COPY.retry });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await userEvent.click(retry);

    await waitFor(() =>
      expect(screen.getByRole("link")).toHaveTextContent("enero de 2026"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("offers to generate a month without a report, without calling PUT on its own", async () => {
    const puts = vi.fn();
    server.use(
      http.put(ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"), () => {
        puts();
        return new HttpResponse(null, { status: 500 });
      }),
    );
    await renderPanel();

    const dialog = await openDialog();

    expect(within(dialog).getByRole("combobox")).toHaveValue("2026-06");
    expect(
      await within(dialog).findByRole("button", { name: DIALOG.generate }),
    ).toBeEnabled();
    expect(puts).not.toHaveBeenCalled();
  });

  it("lets you look the month up again when the lookup failed, without generating it", async () => {
    const puts = vi.fn();
    server.use(
      http.get(
        ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"),
        () => new HttpResponse(null, { status: 500 }),
        { once: true },
      ),
      http.put(ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"), () => {
        puts();
        return new HttpResponse(null, { status: 500 });
      }),
    );
    await renderPanel();
    const dialog = await openDialog();

    const retry = await within(dialog).findByRole("button", {
      name: COPY.retry,
    });
    // Not knowing whether the report exists, generating stays off.
    expect(
      within(dialog).getByRole("button", { name: DIALOG.generate }),
    ).toBeDisabled();

    await userEvent.click(retry);

    expect(
      await within(dialog).findByRole("button", { name: DIALOG.generate }),
    ).toBeEnabled();
    expect(
      within(dialog).queryByRole("button", { name: COPY.retry }),
    ).not.toBeInTheDocument();
    expect(puts).not.toHaveBeenCalled();
  });

  it("opens an existing report instead of generating it again", async () => {
    // In October the default month is September, which is already saved.
    vi.setSystemTime(new Date("2026-10-27T15:00:00Z"));
    const puts = vi.fn();
    server.use(
      http.put(ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"), () => {
        puts();
        return new HttpResponse(null, { status: 500 });
      }),
    );
    await renderPanel();

    const dialog = await openDialog();

    await userEvent.click(
      await within(dialog).findByRole("button", { name: DIALOG.generate }),
    );

    expect(push).toHaveBeenCalledWith(
      nutritionReportHref(ESTABLISHMENT, "2026-09"),
    );
    expect(puts).not.toHaveBeenCalled();
  });

  it("generates the report and takes you to it", async () => {
    await renderPanel();
    const dialog = await openDialog();

    await userEvent.click(
      await within(dialog).findByRole("button", { name: DIALOG.generate }),
    );

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(
        nutritionReportHref(ESTABLISHMENT, "2026-06"),
      ),
    );
    // The screen is fetched ahead, while the report is being generated.
    expect(prefetch).toHaveBeenCalledWith(
      nutritionReportHref(ESTABLISHMENT, "2026-06"),
    );
    expect(within(dialog).getByText(DIALOG.generated)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: DIALOG.opening }),
    ).toBeDisabled();
  });

  it("explains the wait only when generating takes long", async () => {
    server.use(
      http.put(ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT(":id", ":month"), () =>
        delay("infinite"),
      ),
    );
    await renderPanel();
    const dialog = await openDialog();
    await userEvent.click(
      await within(dialog).findByRole("button", { name: DIALOG.generate }),
    );

    expect(
      await within(dialog).findByRole("button", { name: DIALOG.generating }),
    ).toBeDisabled();
    expect(
      within(dialog).queryByText(DIALOG.generatingHint),
    ).not.toBeInTheDocument();

    expect(
      await within(dialog).findByText(DIALOG.generatingHint),
    ).toBeInTheDocument();
  });

  it("tells how long to wait when the usage limit was hit", async () => {
    server.use(
      makeGenerateNutritionReportFailureHandler("quota", { retryAfter: 90 }),
    );
    await renderPanel();
    const dialog = await openDialog();

    await userEvent.click(
      await within(dialog).findByRole("button", { name: DIALOG.generate }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      NUTRITION_REPORT_LIMIT_MESSAGE("2 minutos"),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("sorts the reports from the oldest or the newest month", async () => {
    await renderPanel();
    await screen.findAllByRole("link");

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: COPY.sortLabel }),
      "month_asc",
    );

    await waitFor(() =>
      expect(
        screen.getAllByRole("link").map((link) => link.textContent),
      ).toEqual([
        expect.stringContaining("julio de 2026"),
        expect.stringContaining("agosto de 2026"),
        expect.stringContaining("septiembre de 2026"),
      ]),
    );

    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: COPY.sortLabel }),
      "month_desc",
    );

    await waitFor(() =>
      expect(screen.getAllByRole("link")[0].textContent).toContain(
        "septiembre de 2026",
      ),
    );
  });

  it("downloads a report's PDF from the row menu, without opening it", async () => {
    const { click } = mockBlobDownload();
    await renderPanel();

    const [menu] = await screen.findAllByRole("button", {
      name: COPY.actionsMenuLabel,
    });
    await userEvent.click(menu);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: COPY.downloadPdf }),
    );

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(push).not.toHaveBeenCalled();
  });

  it("does not offer the PDF of a report whose AI text is unavailable", async () => {
    await renderPanel();

    // Rows are newest first: September, August (no text), July.
    const menus = await screen.findAllByRole("button", {
      name: COPY.actionsMenuLabel,
    });
    await userEvent.click(menus[1]);

    const item = await screen.findByRole("menuitem", {
      name: COPY.downloadPdf,
    });
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveAttribute("title", COPY.pdfBlockedHint);
  });

  it("calculates a month saved without data again from the row menu", async () => {
    // July is seeded without data and the comedor does have intakes.
    vi.setSystemTime(new Date("2026-10-27T15:00:00Z"));
    await renderPanel();

    const menus = await screen.findAllByRole("button", {
      name: COPY.actionsMenuLabel,
    });
    // Rows are newest first: September, August, July (no data).
    await userEvent.click(menus[2]);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: COPY.recalculate }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(COPY.recalculated("julio de 2026"));
    await userEvent.click(
      within(dialog).getByRole("button", { name: NOTICE.close }),
    );
    expect((await screen.findAllByRole("link"))[2]).toHaveTextContent(
      COPY.summaryStatus.generated,
    );
  });

  it("tells in a dialog, until closed, that a month still has no intakes", async () => {
    const withoutIntakes = MOCK_ESTABLISHMENTS[1].id;
    saveNutritionReport(
      buildNutritionReport({
        establishmentId: withoutIntakes,
        month: "2026-06",
        noData: true,
      }),
    );
    await renderWithProviders(
      <NutritionReportPanel establishmentId={withoutIntakes} />,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: COPY.actionsMenuLabel }),
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: COPY.recalculate }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(NOTICE.unchanged("junio de 2026"));

    await userEvent.click(
      within(dialog).getByRole("button", { name: NOTICE.close }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    // Nothing left behind on the screen.
    expect(screen.queryByText(/sigue sin ingresos/)).not.toBeInTheDocument();
  });

  it("does not offer to recalculate a month that has data", async () => {
    await renderPanel();

    const menus = await screen.findAllByRole("button", {
      name: COPY.actionsMenuLabel,
    });
    await userEvent.click(menus[0]);

    await screen.findByRole("menuitem", { name: COPY.downloadPdf });
    expect(
      screen.queryByRole("menuitem", { name: COPY.recalculate }),
    ).not.toBeInTheDocument();
  });

  it("is refused to a role without the permission", async () => {
    const requests = vi.fn();
    server.use(
      http.get(ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT(":id"), () => {
        requests();
        return HttpResponse.json({});
      }),
    );

    await renderWithProviders(
      <RequirePermission permission="nutritionReports.view">
        <NutritionReportPanel establishmentId={ESTABLISHMENT} />
      </RequirePermission>,
      { role: "field_worker" },
    );

    expect(await screen.findByText(FORBIDDEN_SCREEN.title)).toBeInTheDocument();
    expect(requests).not.toHaveBeenCalled();
  });
});
