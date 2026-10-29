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
