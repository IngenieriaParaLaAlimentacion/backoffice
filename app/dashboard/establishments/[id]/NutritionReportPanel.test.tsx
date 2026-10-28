import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import NutritionReportPanel from "./NutritionReportPanel";
import RequirePermission from "@/components/RequirePermission";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { makeGenerateNutritionReportFailureHandler } from "@/mocks/handlers/nutritionReport";
import {
  ESTABLISHMENT_NUTRITION_REPORT_ENDPOINT,
  ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT,
} from "@/constants/api";
import {
  NUTRITION_REPORT_DIALOG as DIALOG,
  NUTRITION_REPORT_LIMIT_MESSAGE,
  NUTRITION_REPORT_PAGE as COPY,
  nutritionReportHref,
} from "@/constants/nutritionReport";
import { FORBIDDEN_SCREEN } from "@/constants/permissions";

const push = vi.fn();
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ push }),
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

    expect(
      await within(dialog).findByText(DIALOG.alreadyExists),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: DIALOG.generate }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: DIALOG.viewExisting }),
    ).toHaveAttribute("href", nutritionReportHref(ESTABLISHMENT, "2026-09"));
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

  it("is refused to a role without the permission", async () => {
    const requests = vi.fn();
    server.use(
      http.get(ESTABLISHMENT_NUTRITION_REPORTS_ENDPOINT(":id"), () => {
        requests();
        return HttpResponse.json({});
      }),
    );

    await renderWithProviders(
      <RequirePermission permission="nutrition_reports.view">
        <NutritionReportPanel establishmentId={ESTABLISHMENT} />
      </RequirePermission>,
      { role: "field_worker" },
    );

    expect(await screen.findByText(FORBIDDEN_SCREEN.title)).toBeInTheDocument();
    expect(requests).not.toHaveBeenCalled();
  });
});
