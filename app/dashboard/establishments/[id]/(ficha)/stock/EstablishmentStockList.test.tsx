import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EstablishmentStockList from "./EstablishmentStockList";
import { mockBlobDownload, renderWithProviders } from "@/test-utils";
import {
  currentStock,
  MOCK_ESTABLISHMENTS,
} from "@/mocks/fixtures/establishment";
import { ESTABLISHMENT_STOCK_PAGE as COPY } from "@/constants/establishments";
import { EXPORT } from "@/constants/exports";

const WITH_DATA_ID = MOCK_ESTABLISHMENTS[0].id;
const WITHOUT_DATA_ID = MOCK_ESTABLISHMENTS[1].id;

describe("EstablishmentStockList", () => {
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

  it.each(["admin", "analyst"] as const)(
    "registers an intake from empty stock as %s and refreshes",
    async (role) => {
      const user = userEvent.setup();
      await renderWithProviders(
        <EstablishmentStockList establishmentId={WITHOUT_DATA_ID} />,
        { role },
      );
      expect(await screen.findByText(COPY.noStock)).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: COPY.createMovement }),
      );
      await user.click(screen.getByRole("combobox", { name: "Alimento" }));
      await user.click(await screen.findByRole("option", { name: /Arroz/ }));
      await user.type(
        screen.getByRole("textbox", { name: "Cantidad 1" }),
        "1.125",
      );
      await user.selectOptions(
        screen.getByLabelText("Origen del alimento"),
        "foundation",
      );
      await user.selectOptions(
        screen.getByLabelText("Tipo de aporte"),
        "false",
      );
      await user.click(
        screen.getByRole("button", { name: "Guardar movimiento" }),
      );
      await waitFor(() =>
        expect(currentStock(WITHOUT_DATA_ID)[0]?.quantity).toBe("1.125"),
      );
      expect(await screen.findByRole("status")).toHaveTextContent(COPY.saved);
      expect(
        screen.getByRole("link", { name: COPY.viewSaved }),
      ).toHaveAttribute("href", expect.stringContaining("movement_id="));
      expect(within(await findTable()).getByText("Arroz")).toBeInTheDocument();
    },
  );

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
    const { click, anchors } = mockBlobDownload();
    await renderWithProviders(
      <EstablishmentStockList establishmentId={WITH_DATA_ID} />,
    );
    await findTable();

    await userEvent.click(screen.getByRole("button", { name: EXPORT.label }));

    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(anchors()[0].download).toBe("stock.csv");
  });
});
