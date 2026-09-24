import { describe, expect, it } from "vitest";
import { clusterSizeFor, createClusterIcon } from "./clusterIcon";

describe("clusterSizeFor", () => {
  it("grows the disc with the count", () => {
    expect(clusterSizeFor(2).sizeClass).toBe("size-8");
    expect(clusterSizeFor(9).sizeClass).toBe("size-8");
    expect(clusterSizeFor(10).sizeClass).toBe("size-10");
    expect(clusterSizeFor(99).sizeClass).toBe("size-10");
    expect(clusterSizeFor(100).sizeClass).toBe("size-12");
    expect(clusterSizeFor(5000).sizeClass).toBe("size-12");
  });
});

describe("createClusterIcon", () => {
  it("shows the count and nothing about severity", () => {
    const icon = createClusterIcon(7);
    const disc = icon.options.html as HTMLElement;

    expect(disc.textContent).toBe("7");
    expect(disc.getAttribute("aria-label")).toBe(
      "7 establecimientos agrupados",
    );
  });

  it("uses the neutral cluster look, not a status tone", () => {
    const disc = createClusterIcon(3).options.html as HTMLElement;

    expect(disc.className).toContain("bg-chart-5");
    expect(disc.className).not.toMatch(/destructive|warning|success/);
  });

  it("declares the icon's size to match its class", () => {
    expect(createClusterIcon(3).options.iconSize).toEqual([32, 32]);
    expect(createClusterIcon(30).options.iconSize).toEqual([40, 40]);
    expect(createClusterIcon(300).options.iconSize).toEqual([48, 48]);
  });
});
