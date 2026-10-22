import { describe, expect, it, vi } from "vitest";
import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "./page";
import { renderWithProviders } from "@/test-utils";
import { server } from "@/mocks/server";
import { makeListMeasurementsHandler } from "@/mocks/handlers/measurement";
import { MOCK_MEASUREMENTS } from "@/mocks/fixtures/measurement";
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
      expect(csv).toContain("Observación");
      expect(csv).toContain(
        observation.replace(/\s+/g, " ").replaceAll('"', '""'),
      );
      expect(click).toHaveBeenCalledOnce();
    } finally {
      Reflect.deleteProperty(URL, "createObjectURL");
      Reflect.deleteProperty(URL, "revokeObjectURL");
      click.mockRestore();
    }
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
