import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen, within, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import {
  MEASUREMENTS_ENDPOINT,
  MEASUREMENTS_EXPORT_ENDPOINT,
} from "@/constants/api";
import userEvent from "@testing-library/user-event";
import Page from "./page";
import { mockBlobDownload, renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import {
  makeListMeasurementsHandler,
  makeSubjectEvolutionHandler,
} from "@/mocks/handlers/measurement";
import {
  MOCK_ASSESSED_MEASUREMENTS,
  MOCK_ASSESSMENT_FILTERS,
  MOCK_MEASUREMENTS,
  MOCK_SUBJECT_EVOLUTION,
} from "@/mocks/fixtures/measurement";
import { MEASUREMENTS_PAGE as COPY } from "@/constants/measurements";
import { EXPORT } from "@/constants/exports";
import { NOT_AVAILABLE } from "@/constants/common";

// Chart geometry is covered by browser checks; these tests exercise the page's data and interactions.
vi.mock("@/components/MeasurementEvolutionChart", () => ({
  default: () => null,
}));

const observation = MOCK_MEASUREMENTS[0].observation!;
const hasObservation = (_: string, element: Element | null) =>
  element?.tagName === "P" && element.textContent === observation;

describe("AnthropometricMeasurementsPage observations", () => {
  it("shows the observation column and a placeholder for an unrecorded note", async () => {
    await renderWithProviders(<Page />);
    const table = await screen.findByRole("table");
    expect(
      within(table).getByRole("columnheader", {
        name: COPY.columns.observation,
      }),
    ).toBeInTheDocument();
    const rows = within(table).getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText(hasObservation)).toBeInTheDocument();
    expect(within(rows[1]).getByText(NOT_AVAILABLE)).toBeInTheDocument();
  });

  it("shows the note and its label in mobile cards", async () => {
    await renderWithProviders(<Page />);
    const cards = within(
      await screen.findByRole("list", { name: COPY.listLabel }),
    ).getAllByRole("listitem");
    expect(
      within(cards[0]).getByText(COPY.columns.observation),
    ).toBeInTheDocument();
    expect(within(cards[0]).getByText(hasObservation)).toBeInTheDocument();
    expect(within(cards[1]).getByText(NOT_AVAILABLE)).toBeInTheDocument();
  });

  it("opens the full observation in the subject's evolution panel", async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Page />);
    const table = await screen.findByRole("table");
    await user.click(within(table).getAllByRole("row")[1]);
    const detail = await screen.findByRole("region", {
      name: COPY.detail.observationsTitle,
    });
    expect(within(detail).getByText(hasObservation)).toBeInTheDocument();
    expect(within(detail).getByText("19/10/2026")).toBeInTheDocument();
  });

  it("shows the empty state without rendering an incomplete table", async () => {
    server.use(makeListMeasurementsHandler({ data: { items: [], total: 0 } }));
    await renderWithProviders(<Page />);
    expect(await screen.findByText(COPY.noMeasurements)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: COPY.listLabel }),
    ).not.toBeInTheDocument();
  });

  it("downloads a CSV containing observations through the existing export action", async () => {
    const { createObjectURL, click } = mockBlobDownload();
    const user = userEvent.setup();
    await renderWithProviders(<Page />);
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: EXPORT.label }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce());
    const csv = await (
      createObjectURL.mock.calls[0] as unknown as [Blob]
    )[0].text();
    expect(csv).toContain("Observación");
    expect(csv).toContain(
      observation.replace(/\s+/g, " ").replaceAll('"', '""'),
    );
    expect(click).toHaveBeenCalledOnce();
  });

  it("keeps older API responses without observations readable", async () => {
    const { observation: omitted, ...legacy } = MOCK_MEASUREMENTS[0];
    void omitted;
    server.use(
      makeListMeasurementsHandler({
        data: {
          items: [legacy as (typeof MOCK_MEASUREMENTS)[number]],
          total: 1,
        },
      }),
    );
    await renderWithProviders(<Page />);
    expect(
      within(await screen.findByRole("table")).getByText(NOT_AVAILABLE),
    ).toBeInTheDocument();
  });
});

describe("AnthropometricMeasurementsPage current age", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows current age beside birth date and refreshes the open dialog on focus", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-28T02:59:00Z"));
    server.use(
      makeSubjectEvolutionHandler({
        data: {
          subject: {
            ...MOCK_SUBJECT_EVOLUTION.subject,
            birth_date: "2008-04-28",
          },
        },
      }),
    );
    const user = userEvent.setup();
    await renderWithProviders(<Page />);
    await user.click(
      within(await screen.findByRole("table")).getAllByRole("row")[1],
    );
    const dialog = await screen.findByRole("dialog");
    const age = await within(dialog).findByText(COPY.detail.age);
    expect(age.parentElement).toHaveTextContent("18 a 5 m");
    expect(within(dialog).getByText("28/04/2008")).toBeInTheDocument();
    vi.setSystemTime(new Date("2026-10-28T03:01:00Z"));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(age.parentElement).toHaveTextContent("18 a 6 m");
  });
});

describe("AnthropometricMeasurementsPage assessments", () => {
  it("shows two indicator alerts and historical assessments even without an observation", async () => {
    server.use(
      makeListMeasurementsHandler({
        data: { items: MOCK_ASSESSED_MEASUREMENTS },
      }),
      makeSubjectEvolutionHandler({
        data: {
          points: [
            { ...MOCK_ASSESSED_MEASUREMENTS[1], observation: null },
            MOCK_ASSESSED_MEASUREMENTS[0],
          ],
        },
      }),
    );

    const user = userEvent.setup();
    await renderWithProviders(<Page />);
    const rows = within(await screen.findByRole("table")).getAllByRole("row");
    expect(within(rows[1]).getByText("Alerta media")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Alerta alta")).toBeInTheDocument();
    expect(
      within(rows[2]).getByText("Sin datos suficientes"),
    ).toBeInTheDocument();
    expect(within(rows[2]).getByText("Z 0,00")).toBeInTheDocument();
    expect(within(rows[2]).getByText("No aplica")).toBeInTheDocument();
    await user.click(rows[1]);
    const dialog = await screen.findByRole("dialog");
    expect(
      await within(dialog).findByText(COPY.detail.assessmentsTitle),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Sin datos suficientes"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Z 0,00")).toBeInTheDocument();
  });

  it("keeps filter choices on empty results and sends the displayed criteria to CSV", async () => {
    const { createObjectURL } = mockBlobDownload();
    const queries: URLSearchParams[] = [];
    const exports: URLSearchParams[] = [];
    server.use(
      http.get(MEASUREMENTS_ENDPOINT, ({ request }) => {
        const params = new URL(request.url).searchParams;
        queries.push(params);
        const items =
          params.get("indicator") === "length_for_age"
            ? []
            : MOCK_ASSESSED_MEASUREMENTS;
        return HttpResponse.json({
          items,
          total: items.length,
          page: 1,
          page_size: 20,
          total_pages: 1,
          assessment_filters: MOCK_ASSESSMENT_FILTERS,
        });
      }),
      http.get(MEASUREMENTS_EXPORT_ENDPOINT, ({ request }) => {
        exports.push(new URL(request.url).searchParams);
        return new HttpResponse(
          "Indicador;Clasificación\r\nPeso;Bajo peso\r\nPeso;Bajo peso\r\n",
          {
            headers: {
              "Content-Type": "text/csv",
              "Content-Disposition": 'attachment; filename="resultados.csv"',
              "X-Export-Row-Count": "2",
            },
          },
        );
      }),
    );
    const user = userEvent.setup();
    await renderWithProviders(<Page />);
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const indicator = screen.getByLabelText("Indicador");
    const classification = screen.getByLabelText("Clasificación");
    await user.selectOptions(indicator, "weight_for_age");
    await user.selectOptions(classification, "low_weight");
    const download = screen.getByRole("button", { name: EXPORT.label });
    expect(download).toBeDisabled();
    await waitFor(() => expect(download).toBeEnabled());
    await user.click(download);
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce());
    const list = queries.at(-1);
    const csv = exports[0];
    for (const key of ["indicator", "classification", "sort_order"]) {
      expect(csv.get(key)).toBe(list?.get(key));
    }
    expect(csv.get("classification")).toBe("low_weight");
    expect(csv.get("assessment_fields")).toBe("true");
    await user.selectOptions(indicator, "length_for_age");
    expect(classification).toHaveValue("");
    expect(await screen.findByText(COPY.noMeasurements)).toBeInTheDocument();
    expect(indicator).toBeEnabled();
    expect(queries.at(-1)?.has("classification")).toBe(false);
  });
});

it("restores the legacy listing when the API withdraws assessment filters", async () => {
  const calls: URLSearchParams[] = [];
  let active = true;
  server.use(
    http.get(MEASUREMENTS_ENDPOINT, ({ request }) => {
      const params = new URL(request.url).searchParams;
      calls.push(params);
      if (!active && params.has("indicator")) {
        return HttpResponse.json(
          { type: "/errors/filter-not-applicable" },
          { status: 400 },
        );
      }
      return HttpResponse.json({
        items: active ? MOCK_ASSESSED_MEASUREMENTS : MOCK_MEASUREMENTS,
        total: MOCK_MEASUREMENTS.length,
        page: 1,
        page_size: 20,
        total_pages: 1,
        assessment_filters: active ? MOCK_ASSESSMENT_FILTERS : null,
      });
    }),
  );

  const user = userEvent.setup();
  await renderWithProviders(<Page />);
  await screen.findByRole("table");
  await user.click(screen.getByRole("button", { name: "Filtros" }));
  await user.selectOptions(screen.getByLabelText("Indicador"), "bmi_for_age");
  await waitFor(() =>
    expect(calls.at(-1)?.get("indicator")).toBe("bmi_for_age"),
  );
  await screen.findByRole("table");

  active = false;
  await user.click(screen.getByRole("button", { name: COPY.refresh }));
  await waitFor(() =>
    expect(screen.queryByLabelText("Indicador")).not.toBeInTheDocument(),
  );
  expect(calls.at(-1)?.has("indicator")).toBe(false);
  expect(
    within(await screen.findByRole("table")).getAllByText("Normal"),
  ).toHaveLength(2);
});
