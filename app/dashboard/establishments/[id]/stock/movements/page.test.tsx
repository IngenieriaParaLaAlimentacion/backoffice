import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EstablishmentMovementsHistoryPage from "./page";
import { renderWithProviders } from "@/test-utils";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { ESTABLISHMENT_MOVEMENTS_PAGE as COPY } from "@/constants/establishments";

const WITH_DATA_ID = MOCK_ESTABLISHMENTS[0].id;
const WITHOUT_DATA_ID = MOCK_ESTABLISHMENTS[1].id;

const renderPage = (id: string) =>
  renderWithProviders(
    <EstablishmentMovementsHistoryPage params={Promise.resolve({ id })} />,
  );

describe("EstablishmentMovementsHistoryPage", () => {
  // The desktop table and the mobile card list both render in jsdom (no CSS
  // hides either), so every row's text exists twice — scoping to the table is
  // what makes a single `getByText` valid.
  const findRows = async () =>
    within(await screen.findByRole("table"))
      .getAllByRole("row")
      .slice(1);

  it("lists entradas and salidas in one sequence, newest first", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    expect(rows).toHaveLength(3);

    // 14/09 entrada, 12/09 salida, 08/09 entrada — mixed directions, ordered
    // by the event date descending.
    expect(within(rows[0]).getByText("14/09/2026 07:00")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Entrada")).toBeInTheDocument();
    expect(within(rows[1]).getByText("12/09/2026 10:00")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Salida")).toBeInTheDocument();
    expect(within(rows[2]).getByText("08/09/2026 06:00")).toBeInTheDocument();
  });

  it("summarises each row with its responsible and distinct food count", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    expect(within(rows[0]).getByText("Juan Gomez")).toBeInTheDocument();
    expect(within(rows[0]).getByText("2 alimentos")).toBeInTheDocument();
    // The salida has two lines of the same food but `food_count: 1`; the row
    // must report the food count, not a line count.
    expect(within(rows[1]).getByText("1 alimento")).toBeInTheDocument();
  });

  it("shows an empty state, not an error, for a comedor with no movements", async () => {
    await renderPage(WITHOUT_DATA_ID);

    expect(await screen.findByText(COPY.noMovements)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("opens the detail with every line of the movement", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    await userEvent.click(rows[1]);

    const dialog = await screen.findByRole("dialog");
    // Two lines of Arroz against `food_count: 1` — the detail shows lines.
    const lines = within(dialog).getAllByText("Arroz");
    expect(lines).toHaveLength(2);
    expect(within(dialog).getByText("2,5")).toBeInTheDocument();
    expect(within(dialog).getByText("1,25")).toBeInTheDocument();
    expect(within(dialog).getAllByText("Kilogramos")).toHaveLength(2);
  });

  it("shows origen and comentarios on an entrada only", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    await userEvent.click(rows[0]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(COPY.detail.source)).toBeInTheDocument();
    expect(within(dialog).getByText("Foto")).toBeInTheDocument();
    expect(
      within(dialog).getByText("Donación del municipio"),
    ).toBeInTheDocument();
  });

  it("hides origen and comentarios on a salida", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    await userEvent.click(rows[1]);

    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText(COPY.detail.linesTitle);
    expect(
      within(dialog).queryByText(COPY.detail.source),
    ).not.toBeInTheDocument();
    // "Almuerzo" is on the fixture, but an outflow never renders comments.
    expect(within(dialog).queryByText("Almuerzo")).not.toBeInTheDocument();
  });

  it("filters the listing by direction", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();

    await userEvent.selectOptions(
      screen.getByLabelText(COPY.directionLabel),
      "Solo entradas",
    );

    await waitFor(async () => expect(await findRows()).toHaveLength(2));
    const rows = await findRows();
    rows.forEach((row) =>
      expect(within(row).getByText("Entrada")).toBeInTheDocument(),
    );
  });

  it("filters the listing by date range", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();

    // 12/09 local covers the 12/09 13:00Z salida and nothing else: the day
    // bounds are widened to UTC instants, not compared as raw strings.
    await userEvent.type(screen.getByLabelText(COPY.dateFrom), "2026-09-12");
    await userEvent.type(screen.getByLabelText(COPY.dateTo), "2026-09-12");

    await waitFor(async () => expect(await findRows()).toHaveLength(1));
    const rows = await findRows();
    expect(within(rows[0]).getByText("Salida")).toBeInTheDocument();
  });

  it("rejects an inverted date range without calling the backend", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();

    await userEvent.type(screen.getByLabelText(COPY.dateFrom), "2026-09-20");
    await userEvent.type(screen.getByLabelText(COPY.dateTo), "2026-09-01");

    expect(await screen.findByText(COPY.invalidRange)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
