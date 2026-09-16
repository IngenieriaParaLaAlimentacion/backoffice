import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EstablishmentStockList from "./EstablishmentStockList";
import { renderWithProviders } from "@/test-utils";
import { MOCK_ESTABLISHMENTS } from "@/mocks/fixtures/establishment";
import { ESTABLISHMENT_STOCK_PAGE as COPY } from "@/constants/establishments";
import { EXPORT } from "@/constants/exports";

const WITH_DATA_ID = MOCK_ESTABLISHMENTS[0].id;
const WITHOUT_DATA_ID = MOCK_ESTABLISHMENTS[1].id;

/** jsdom implements neither; `saveBlob` needs both to trigger a download. */
function stubObjectUrl() {
  const createObjectURL = vi.fn(() => "blob:mock");
  const revokeObjectURL = vi.fn();
  Object.assign(URL, { createObjectURL, revokeObjectURL });
  return { createObjectURL, revokeObjectURL };
}

describe("EstablishmentStockList", () => {
  let click: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stubObjectUrl();
    click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
    vi.restoreAllMocks();
  });

  // The desktop table and the mobile card list render at the same time in
  // jsdom (no CSS to hide either one), so every row's text exists twice —
  // scoping to the table is what makes a single `getByText` valid.
  const findTable = async () => screen.findByRole("table");

  it("lists the establishment's current stock", async () => {
    await renderWithProviders(
      <EstablishmentStockList establishmentId={WITH_DATA_ID} />,
    );

    const table = await findTable();
    expect(within(table).getByText("Arroz")).toBeInTheDocument();
    expect(within(table).getByText("Leche en polvo")).toBeInTheDocument();
    expect(within(table).getByText("Aceite")).toBeInTheDocument();
    // "25.500" (the Decimal the API sends) rendered as "25,5".
    expect(within(table).getByText("25,5")).toBeInTheDocument();
  });

  it("shows an empty state, not an error, for a comedor with no stock", async () => {
    await renderWithProviders(
      <EstablishmentStockList establishmentId={WITHOUT_DATA_ID} />,
    );

    expect(await screen.findByText(COPY.noStock)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("filters the listing by category", async () => {
    await renderWithProviders(
      <EstablishmentStockList establishmentId={WITH_DATA_ID} />,
    );
    await findTable();

    await userEvent.selectOptions(
      screen.getByDisplayValue(COPY.allCategories),
      "Lácteos",
    );

    await waitFor(() =>
      expect(within(screen.getByRole("table")).queryByText("Arroz")).toBeNull(),
    );
    const table = screen.getByRole("table");
    expect(within(table).getByText("Leche en polvo")).toBeInTheDocument();
    expect(within(table).queryByText("Aceite")).toBeNull();
  });

  it("exports the current listing as CSV", async () => {
    await renderWithProviders(
      <EstablishmentStockList establishmentId={WITH_DATA_ID} />,
    );
    await findTable();

    await userEvent.click(screen.getByRole("button", { name: EXPORT.label }));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    const anchor = click.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("stock.csv");
  });
});
