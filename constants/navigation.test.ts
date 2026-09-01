import { describe, expect, it } from "vitest";
import { NAV_ITEMS, visibleNavItems } from "@/constants/navigation";

const labelsFor = (role: Parameters<typeof visibleNavItems>[0]) =>
  visibleNavItems(role).map((item) => item.label);

describe("visibleNavItems", () => {
  it("shows an admin every item", () => {
    expect(visibleNavItems("admin")).toHaveLength(NAV_ITEMS.length);
    expect(labelsFor("admin")).toContain("Solicitudes");
  });

  it("hides Solicitudes from an analyst but keeps every other screen", () => {
    const labels = labelsFor("analyst");

    expect(labels).not.toContain("Solicitudes");
    expect(labels).toEqual([
      "Inicio",
      "Usuarios",
      "Establecimientos",
      "Sujetos",
      "Mediciones",
      "Encuestas",
    ]);
  });

  it("hides permission-gated items while the role is unknown", () => {
    expect(labelsFor(null)).not.toContain("Solicitudes");
  });
});
