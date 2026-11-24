import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { SUBJECTS_ENDPOINT, SUBJECT_ENDPOINT } from "@/constants/api";
import { EXPORT } from "@/constants/exports";
import { renderWithProviders } from "@/test-utils";
import type { SubjectSummary } from "@/types/subject";
import { MOCK_MEASUREMENTS } from "@/mocks/fixtures/measurement";
import Page from "./page";

const subject: SubjectSummary = {
  ...MOCK_MEASUREMENTS[0].subject,
  birth_date: "2008-04-28",
  latest_measurement: {
    id: MOCK_MEASUREMENTS[0].id,
    measured_at: "2026-07-28T13:00:00Z",
    weight_kg: 32,
    height_cm: 140,
    bmi: 16.33,
    establishment: MOCK_MEASUREMENTS[0].establishment,
    alerts: [],
  },
};

function listHandler(items: SubjectSummary[]) {
  return http.get(SUBJECTS_ENDPOINT, () =>
    HttpResponse.json({
      items,
      total: items.length,
      page: 1,
      page_size: 20,
      total_pages: 1,
    }),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-28T13:00:00Z"));
  server.use(
    listHandler([
      subject,
      { ...subject, id: "unmeasured", name: "Beto", latest_measurement: null },
    ]),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("shows current age and elapsed latest measurement in the table and cards", async () => {
  await renderWithProviders(<Page />);
  const table = await screen.findByRole("table");
  expect(
    within(table).getByRole("columnheader", { name: "Edad" }),
  ).toBeInTheDocument();
  const row = within(table).getAllByRole("row")[1];
  expect(within(row).getByText("18 a 6 m")).toBeInTheDocument();
  expect(within(row).getByText("28/07/2026")).toBeInTheDocument();
  expect(within(row).getByText("hace 3 meses")).toBeInTheDocument();
  const card = screen.getByRole("button", { name: /Ana García/ });
  expect(within(card).getByText("Edad: 18 a 6 m")).toBeInTheDocument();
  expect(within(card).getByText("28/07/2026")).toBeInTheDocument();
  expect(within(card).getByText("hace 3 meses")).toBeInTheDocument();
  expect(
    within(within(table).getAllByRole("row")[2]).getByText("—"),
  ).toBeInTheDocument();
});

it("shows later readings on today's Argentina calendar day as hoy", async () => {
  server.use(
    listHandler([
      {
        ...subject,
        latest_measurement: {
          ...subject.latest_measurement!,
          measured_at: "2026-10-29T02:59:59Z",
        },
      },
    ]),
  );
  await renderWithProviders(<Page />);
  const table = await screen.findByRole("table");
  const row = within(table).getAllByRole("row")[1];
  expect(within(row).getByText("28/10/2026")).toBeInTheDocument();
  expect(within(row).getByText("hoy")).toBeInTheDocument();
});

it("shows placeholders for invalid demographics and readings on future days", async () => {
  server.use(
    listHandler([
      {
        ...subject,
        birth_date: "2026-02-30",
        latest_measurement: {
          ...subject.latest_measurement!,
          measured_at: "bad-date",
        },
      },
      {
        ...subject,
        id: "future",
        name: "Beto",
        birth_date: "2027-01-01",
        latest_measurement: {
          ...subject.latest_measurement!,
          measured_at: "2026-10-29T03:00:00Z",
        },
      },
    ]),
  );
  await renderWithProviders(<Page />);
  const rows = within(await screen.findByRole("table")).getAllByRole("row");
  expect(within(rows[1]).getAllByText("—")).toHaveLength(2);
  expect(within(rows[2]).getByText("0 m")).toBeInTheDocument();
  expect(within(rows[2]).getByText("—")).toBeInTheDocument();
});

it("opens the shared detail panel with current age", async () => {
  server.use(
    http.get(SUBJECT_ENDPOINT(":subjectId"), () =>
      HttpResponse.json({
        ...subject,
        is_rural: false,
        is_indigenous: false,
        nutritional_status: "normal",
      }),
    ),
  );
  const user = userEvent.setup();
  await renderWithProviders(<Page />);
  await user.click(
    within(await screen.findByRole("table")).getAllByRole("row")[1],
  );
  const dialog = await screen.findByRole("dialog");
  const label = await within(dialog).findByText("Edad");
  expect(label.parentElement).toHaveTextContent("18 a 6 m");
});

it("saves the six-column CSV supplied by the server", async () => {
  const createObjectURL = vi.fn(() => "blob:mock");
  Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
  try {
    const user = userEvent.setup();
    await renderWithProviders(<Page />);
    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: EXPORT.label }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce());
    const csv = await (
      createObjectURL.mock.calls[0] as unknown as [Blob]
    )[0].text();
    expect(csv).toContain(
      "Nombre;Documento;Fecha de nacimiento;Edad;Último relevamiento;Tiempo desde el último relevamiento",
    );
    expect(csv).toContain("11a 5m;14/03/2026 07:30;hace 5 meses");
    expect(click).toHaveBeenCalledOnce();
  } finally {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  }
});

it("filters by the latest measurement assessment returned by the API", async () => {
  const olderMatch = {
    ...subject,
    id: "older-match",
    name: "Beto",
    latest_measurement: null,
  };
  const adult = {
    ...subject,
    latest_measurement: {
      id: "latest",
      measured_at: "2026-10-25T18:00:00Z",
      weight_kg: 55,
      height_cm: 168,
      bmi: 19.48,
      establishment: MOCK_MEASUREMENTS[0].establishment,
      alerts: [],
      assessments: [
        {
          indicator: "adult_bmi",
          status: "evaluated",
          classification: "normal",
          z_score: null,
          reference_version: "synthetic-adult-test",
          alert: null,
        },
      ],
    },
  } satisfies SubjectSummary;
  const calls: URLSearchParams[] = [];
  server.use(
    http.get(SUBJECTS_ENDPOINT, ({ request }) => {
      const params = new URL(request.url).searchParams;
      calls.push(params);
      const items = params.has("classification")
        ? [adult]
        : [adult, olderMatch];
      return HttpResponse.json({
        items,
        total: items.length,
        page: 1,
        page_size: 20,
        total_pages: 1,
        assessment_filters: {
          indicators: [{ indicator: "adult_bmi", classifications: ["normal"] }],
        },
      });
    }),
  );
  const user = userEvent.setup();
  await renderWithProviders(<Page />);
  let table = within(await screen.findByRole("table"));
  expect(table.getByText("Beto García")).toBeInTheDocument();
  expect(table.getByText("IMC adulto")).toBeInTheDocument();
  expect(table.queryByText(/^Z /)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Filtros" }));
  await user.selectOptions(screen.getByLabelText("Indicador"), "adult_bmi");
  await user.selectOptions(screen.getByLabelText("Clasificación"), "normal");
  await waitFor(() => {
    expect(calls.at(-1)?.get("indicator")).toBe("adult_bmi");
    expect(calls.at(-1)?.get("classification")).toBe("normal");
  });
  table = within(await screen.findByRole("table"));
  expect(table.getByText("Ana García")).toBeInTheDocument();
  expect(table.queryByText("Beto García")).not.toBeInTheDocument();
});
