import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EstablishmentMovementsHistoryPage from "./page";
import { renderWithProviders } from "@/test-utils";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { ESTABLISHMENT_MOVEMENTS_PAGE as COPY } from "@/constants/establishments";

const WITH_DATA_ID = MOCK_ESTABLISHMENTS[0].id;
const WITHOUT_DATA_ID = MOCK_ESTABLISHMENTS[1].id;
const LONG_COMMENT =
  "Donación del municipio, entregada en dos camionetas por la mañana; falta confirmar el remito del segundo envío";

/** No approved access to this one: its movements answer 403. */
const FORBIDDEN_ID = MOCK_ESTABLISHMENTS[3].id;

/** 25 movements against a PAGE_SIZE of 20 — two pages. */
const PAGED_ID = MOCK_ESTABLISHMENTS[2].id;

const renderPage = (id: string) =>
  renderWithProviders(
    <EstablishmentMovementsHistoryPage params={Promise.resolve({ id })} />,
  );

describe("EstablishmentMovementsHistoryPage", () => {
  // The desktop table and the mobile card list both render in jsdom (no CSS
  // hides either), so every row's text exists twice — scoping to the table is
  // what makes a single `getByText` valid.
  /** Every filter now lives behind the toggle, collapsed on arrival. */
  const openFilters = () =>
    userEvent.click(screen.getByRole("button", { name: /Filtros/ }));

  const findRows = async () =>
    within(await screen.findByRole("table"))
      .getAllByRole("row")
      .slice(1);

  it("lists ingresos and egresos in one sequence, newest first", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    expect(rows).toHaveLength(3);

    // 14/09 ingreso, 12/09 egreso, 08/09 ingreso — mixed directions, ordered
    // by the event date descending.
    expect(within(rows[0]).getByText("14/09/2026 07:00")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Ingreso")).toBeInTheDocument();
    expect(within(rows[0]).queryByText("Otro")).not.toBeInTheDocument();
    expect(within(rows[1]).getByText("12/09/2026 10:00")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Egreso")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Otro")).toBeInTheDocument();
    expect(within(rows[2]).getByText("08/09/2026 06:00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Egreso.*Otro/ }),
    ).toBeInTheDocument();
  });

  it("keeps a backdated intake in chronological order and opens its saved detail", async () => {
    const user = userEvent.setup();
    await renderPage(WITH_DATA_ID);
    await findRows();
    await user.click(screen.getByRole("button", { name: COPY.createMovement }));
    await user.clear(screen.getByLabelText("Fecha"));
    await user.type(screen.getByLabelText("Fecha"), "2026-09-10");
    await user.click(screen.getByRole("combobox", { name: "Alimento" }));
    await user.click(await screen.findByRole("option", { name: /Arroz/ }));
    await user.type(screen.getByRole("textbox", { name: "Cantidad 1" }), "2");
    await user.selectOptions(
      screen.getByLabelText("Origen del alimento"),
      "foundation",
    );
    await user.selectOptions(screen.getByLabelText("Tipo de aporte"), "false");
    await user.click(
      screen.getByRole("button", { name: "Guardar movimiento" }),
    );
    expect(
      await screen.findByText(COPY.savedChronological),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        document.querySelectorAll("table")[0]?.querySelectorAll("tbody tr"),
      ).toHaveLength(4),
    );
    const rows = Array.from(
      document.querySelectorAll("table")[0].querySelectorAll("tbody tr"),
    );
    expect(within(rows[2]).getByText("10/09/2026 00:00")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Ingreso — 10/09/2026 00:00",
      }),
    ).toBeInTheDocument();
  });

  it("opens the saved detail by URL id independently of the current list page", async () => {
    const movementId = "a1000000-0000-0000-0000-000000000001";
    window.history.replaceState(null, "", `?movement_id=${movementId}`);
    try {
      await renderPage(WITH_DATA_ID);
      expect(
        await screen.findByRole("heading", { name: /Ingreso — 14\/09\/2026/ }),
      ).toBeInTheDocument();
    } finally {
      window.history.replaceState(null, "", window.location.pathname);
    }
  });

  it("summarises each row with its responsible and distinct food count", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    expect(within(rows[0]).getByText("Juan Gomez")).toBeInTheDocument();
    expect(within(rows[0]).getByText("2 alimentos")).toBeInTheDocument();
    // The egreso has two lines of the same food but `food_count: 1`; the row
    // must report the food count, not a line count.
    expect(within(rows[1]).getByText("1 alimento")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Gobierno municipal")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Recurrente")).toBeInTheDocument();
    expect(within(rows[1]).getAllByText("—")).toHaveLength(2);
    expect(within(rows[2]).getByText("Único")).toBeInTheDocument();
    const cards = screen
      .getAllByRole("button")
      .filter((button) => button.textContent?.includes("Origen del alimento:"));
    expect(
      cards.some(
        (card) =>
          card.textContent?.includes("Gobierno municipal") &&
          card.textContent?.includes("Recurrente"),
      ),
    ).toBe(true);
  });

  it("shows an empty state, not an error, for a comedor with no movements", async () => {
    await renderPage(WITHOUT_DATA_ID);

    expect(await screen.findByText(COPY.noMovements)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows a forbidden screen, not an empty listing, on a 403", async () => {
    await renderPage(FORBIDDEN_ID);

    // "No tenés acceso" and "no hay movimientos" are different answers and a
    // 403 must never degrade into the second one.
    expect(await screen.findByText(COPY.forbiddenTitle)).toBeInTheDocument();
    expect(screen.queryByText(COPY.noMovements)).not.toBeInTheDocument();
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

  it("shows origin, recurrence, capture mode and comments on an ingreso", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    await userEvent.click(rows[0]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(COPY.detail.source)).toBeInTheDocument();
    expect(within(dialog).getByText(COPY.detail.origin)).toBeInTheDocument();
    expect(
      within(dialog).getByText(COPY.detail.recurrence),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Gobierno municipal")).toBeInTheDocument();
    expect(within(dialog).getByText("Recurrente")).toBeInTheDocument();
    expect(within(dialog).getByText("Foto")).toBeInTheDocument();
    expect(within(dialog).getByText(LONG_COMMENT)).toBeInTheDocument();
  });

  it("shows an explicit false recurrence as Único in intake detail", async () => {
    await renderPage(WITH_DATA_ID);
    const rows = await findRows();
    await userEvent.click(rows[2]);
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Único")).toBeInTheDocument();
    expect(within(dialog).getByText("Fundación / ONG")).toBeInTheDocument();
  });

  it("hides intake metadata on an egreso but still shows its comments", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    await userEvent.click(rows[1]);

    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText(COPY.detail.linesTitle);
    // An outflow is always loaded by hand, so naming the source says nothing.
    expect(
      within(dialog).queryByText(COPY.detail.source),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(COPY.detail.origin),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(COPY.detail.recurrence),
    ).not.toBeInTheDocument();
    // Its comment, on the other hand, is the only field explaining why the
    // stock left.
    expect(within(dialog).getByText("Almuerzo")).toBeInTheDocument();
    expect(within(dialog).getByText(COPY.detail.category)).toBeInTheDocument();
    expect(within(dialog).getByText("Otro")).toBeInTheDocument();
  });

  it("shows Cocina in paged outflow rows and cards", async () => {
    await renderPage(PAGED_ID);
    const rows = await findRows();
    expect(rows.some((row) => within(row).queryByText("Cocina"))).toBe(true);
    expect(
      screen.getAllByRole("button", { name: /Egreso.*Cocina/ }).length,
    ).toBeGreaterThan(0);
  });

  it("shows a long comment whole, never clipped", async () => {
    await renderPage(WITH_DATA_ID);

    const rows = await findRows();
    await userEvent.click(rows[0]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(LONG_COMMENT)).toBeInTheDocument();
  });

  it("filters the listing by direction", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();
    await openFilters();

    await userEvent.selectOptions(
      screen.getByLabelText(COPY.directionLabel),
      "Solo ingresos",
    );

    await waitFor(async () => expect(await findRows()).toHaveLength(2));
    const rows = await findRows();
    rows.forEach((row) =>
      expect(within(row).getByText("Ingreso")).toBeInTheDocument(),
    );
  });

  it("filters the listing by date range", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();
    await openFilters();

    // 12/09 local covers the 12/09 13:00Z egreso and nothing else: the day
    // bounds are widened to UTC instants, not compared as raw strings.
    await userEvent.type(screen.getByLabelText(COPY.dateFrom), "2026-09-12");
    await userEvent.type(screen.getByLabelText(COPY.dateTo), "2026-09-12");

    await waitFor(async () => expect(await findRows()).toHaveLength(1));
    const rows = await findRows();
    expect(within(rows[0]).getByText("Egreso")).toBeInTheDocument();
  });

  it("rejects an inverted date range without calling the backend", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();
    await openFilters();

    await userEvent.type(screen.getByLabelText(COPY.dateFrom), "2026-09-20");
    await userEvent.type(screen.getByLabelText(COPY.dateTo), "2026-09-01");

    expect(await screen.findByText(COPY.invalidRange)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("suggests foods from the catalog as you type", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();
    await openFilters();

    await userEvent.type(screen.getByLabelText(COPY.foodLabel), "ar");

    const listbox = await screen.findByRole("listbox");
    // "Arroz" and "Arvejas" both match "ar"; "Leche en polvo" does not.
    expect(await within(listbox).findByText("Arroz")).toBeInTheDocument();
    expect(within(listbox).getByText("Arvejas")).toBeInTheDocument();
    expect(
      within(listbox).queryByText("Leche en polvo"),
    ).not.toBeInTheDocument();
  });

  it("closes the food dropdown on Escape", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();
    await openFilters();

    await userEvent.type(screen.getByLabelText(COPY.foodLabel), "ar");
    await screen.findByRole("listbox");

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("filters the listing to the movements carrying the chosen food", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();
    await openFilters();

    await userEvent.type(screen.getByLabelText(COPY.foodLabel), "arroz");
    const listbox = await screen.findByRole("listbox");
    await userEvent.click(await within(listbox).findByText("Arroz"));

    // The 14/09 ingreso and the 12/09 egreso carry Arroz; the 08/09 ingreso
    // only carries Leche en polvo.
    await waitFor(async () => expect(await findRows()).toHaveLength(2));
    const rows = await findRows();
    expect(within(rows[0]).getByText("14/09/2026 07:00")).toBeInTheDocument();
    expect(within(rows[1]).getByText("12/09/2026 10:00")).toBeInTheDocument();
  });

  it("scopes the food search to the selected category", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();
    await openFilters();

    await userEvent.selectOptions(
      screen.getByLabelText(COPY.foodCategoryLabel),
      "Lácteos",
    );
    await userEvent.type(screen.getByLabelText(COPY.foodLabel), "a");

    const listbox = await screen.findByRole("listbox");
    // "a" matches Arroz, Arvejas, Aceite and Leche fluida across four
    // categories; scoped to Lácteos only the last one may survive.
    expect(
      await within(listbox).findByText("Leche fluida"),
    ).toBeInTheDocument();
    expect(within(listbox).queryByText("Arroz")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Arvejas")).not.toBeInTheDocument();
    expect(within(listbox).queryByText("Aceite")).not.toBeInTheDocument();
  });

  it("leaves the listing untouched until a food is actually chosen", async () => {
    await renderPage(WITH_DATA_ID);
    expect(await findRows()).toHaveLength(3);
    await openFilters();

    // The endpoint takes `food_id` and no `category_id`: a category on its own
    // narrows the search and nothing else. Whoever "fixes" this breaks here.
    await userEvent.selectOptions(
      screen.getByLabelText(COPY.foodCategoryLabel),
      "Lácteos",
    );

    await waitFor(async () => expect(await findRows()).toHaveLength(3));
  });

  it("restores the full listing when the food filter is cleared", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();
    await openFilters();

    await userEvent.type(screen.getByLabelText(COPY.foodLabel), "arroz");
    const listbox = await screen.findByRole("listbox");
    await userEvent.click(await within(listbox).findByText("Arroz"));
    await waitFor(async () => expect(await findRows()).toHaveLength(2));

    await userEvent.click(screen.getByRole("button", { name: COPY.clearFood }));

    await waitFor(async () => expect(await findRows()).toHaveLength(3));
  });

  it("pages a listing that does not fit on one screen", async () => {
    await renderPage(PAGED_ID);

    expect(await findRows()).toHaveLength(20);
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeDisabled();
  });

  it("loads the next page's rows", async () => {
    await renderPage(PAGED_ID);
    const firstPage = await findRows();
    const firstRowText = firstPage[0].textContent;

    await userEvent.click(
      screen.getByRole("button", { name: "Página siguiente" }),
    );

    // 25 movements, 20 per page: the tail is five rows, none of them the ones
    // just shown.
    await waitFor(async () => expect(await findRows()).toHaveLength(5));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect((await findRows())[0].textContent).not.toBe(firstRowText);
    expect(
      screen.getByRole("button", { name: "Página siguiente" }),
    ).toBeDisabled();
  });

  it("returns to the first page when a filter changes", async () => {
    await renderPage(PAGED_ID);
    await findRows();
    await openFilters();
    await userEvent.click(
      screen.getByRole("button", { name: "Página siguiente" }),
    );
    await screen.findByText("Página 2 de 2");

    await userEvent.selectOptions(
      screen.getByLabelText(COPY.directionLabel),
      "Solo ingresos",
    );

    // Staying on page 2 of a narrower result set would strand the user on an
    // empty page — 13 intakes make a single page.
    await waitFor(() =>
      expect(screen.queryByText(/Página \d+ de/)).not.toBeInTheDocument(),
    );
    expect(await findRows()).toHaveLength(13);
  });

  it("does not undo a page clicked while a filter is still settling", async () => {
    await renderPage(PAGED_ID);
    await findRows();
    await openFilters();

    // Excludes the 01/08 movement: 24 left, so still two pages but the second
    // one goes from five rows to four — which is how the test can tell the
    // filter actually landed.
    await userEvent.type(screen.getByLabelText(COPY.dateFrom), "2026-08-02");
    // Editing the filter resets to page 1 right away, not 300ms later.
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    // Clicked while the debounce is still pending: nothing fired later may
    // take this page away.
    await userEvent.click(
      screen.getByRole("button", { name: "Página siguiente" }),
    );

    await waitFor(async () => expect(await findRows()).toHaveLength(4));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("hides the paginator when everything fits on one page", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();

    expect(screen.queryByText(/Página \d+ de/)).not.toBeInTheDocument();
  });
  it("keeps the filters collapsed until asked for", async () => {
    await renderPage(WITH_DATA_ID);
    await findRows();

    // The listing is the screen; five controls sitting open above it were
    // the complaint this collapse answers.
    expect(
      screen.queryByLabelText(COPY.directionLabel),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(COPY.foodLabel)).not.toBeInTheDocument();

    await openFilters();

    expect(screen.getByLabelText(COPY.directionLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(COPY.foodLabel)).toBeInTheDocument();
  });
});
