import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import EstablishmentAlertBanner from "./EstablishmentAlertBanner";

const legacy = {
  severity: null,
  dominant_status: "normal",
  total_evaluated: 2,
  at_risk_count: 0,
  at_risk_percentage: 0,
  distribution: [],
} satisfies import("@/types/establishment").EstablishmentAlertStatus;

it("shows the unique risk count and uses the server distribution for each indicator", () => {
  render(
    <EstablishmentAlertBanner
      alertStatus={legacy}
      assessmentSummary={{
        at_risk_count: 1,
        at_risk_percentage: 50,
        indicators: [
          {
            indicator: "weight_for_age",
            evaluated_count: 1,
            distribution: [
              { classification: "low_weight", count: 1, percentage: 100 },
            ],
          },
          { indicator: "length_for_age", evaluated_count: 0, distribution: [] },
          {
            indicator: "height_for_age",
            evaluated_count: 2,
            distribution: [
              { classification: "short_stature", count: 1, percentage: 50 },
              { classification: "normal", count: 1, percentage: 50 },
            ],
          },
        ],
      }}
    />,
  );
  const summary = within(
    screen.getByRole("region", { name: "Evaluación por indicador" }),
  );
  expect(summary.getByText("1 sujeto en riesgo (50%)")).toBeInTheDocument();
  expect(summary.getByText("1 sujeto evaluable")).toBeInTheDocument();
  expect(summary.getByText("2 sujetos evaluables")).toBeInTheDocument();
  expect(summary.getByText("Bajo peso · 1 (100%)")).toBeInTheDocument();
  expect(summary.getByText("Talla baja · 1 (50%)")).toBeInTheDocument();
  expect(summary.getByText("Sin resultados evaluables")).toBeInTheDocument();
});

it("keeps the legacy banner when the assessment summary is absent", () => {
  render(<EstablishmentAlertBanner alertStatus={legacy} />);
  expect(screen.getByText("Sin alertas")).toBeInTheDocument();
});
