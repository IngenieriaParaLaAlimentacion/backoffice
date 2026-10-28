import { describe, expect, it } from "vitest";
import { humanizeReportText } from "@/lib/nutritionReportText";

describe("humanizeReportText", () => {
  it("names a nutrient code that opens a sentence", () => {
    expect(humanizeReportText("Vitamina_b12: ayuda a la sangre.")).toBe(
      "Vitamina B12: ayuda a la sangre.",
    );
  });

  it("drops the technical qualifier and keeps lowercase mid-sentence", () => {
    expect(humanizeReportText("Faltan vitamina_a y vitamina_c.")).toBe(
      "Faltan vitamina A y vitamina C.",
    );
  });

  it("names a food group code", () => {
    expect(humanizeReportText("Falta leche_yogur_y_quesos en el mes.")).toBe(
      "Falta leche, yogur y quesos en el mes.",
    );
  });

  it("leaves ordinary text alone", () => {
    const text = "El calcio y el hierro quedan por debajo del mínimo.";
    expect(humanizeReportText(text)).toBe(text);
  });
});
