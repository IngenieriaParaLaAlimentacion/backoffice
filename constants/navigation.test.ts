import { describe, expect, it } from "vitest";
import { NAV_ITEMS, visibleNavItems } from "@/constants/navigation";

const labelsFor = (role: Parameters<typeof visibleNavItems>[0]) =>
  visibleNavItems(role).map((item) => item.label);

describe("visibleNavItems", () => {
  it("shows an admin every item", () => {
    expect(visibleNavItems("admin")).toHaveLength(NAV_ITEMS.length);
    expect(labelsFor("admin")).toContain("Solicitudes");
  });

  // Solicitudes grants access, and the backend 403s analysts on the user
  // listing endpoints — neither screen has anything to offer them.
  it("hides Solicitudes and Usuarios from an analyst", () => {
    const labels = labelsFor("analyst");

    expect(labels).not.toContain("Solicitudes");
    expect(labels).not.toContain("Usuarios");
    expect(labels).toEqual([
      "Inicio",
      "Establecimientos",
      "Sujetos",
      "Mediciones",
      "Encuestas",
    ]);
  });

  it("hides permission-gated items while the role is unknown", () => {
    expect(labelsFor(null)).toEqual([
      "Inicio",
      "Establecimientos",
      "Sujetos",
      "Mediciones",
      "Encuestas",
    ]);
  });
});
