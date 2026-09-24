import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LeafletEstablishmentsMap from "./LeafletEstablishmentsMap";
import { MapPin } from "@/lib/establishmentPins";

const pins: MapPin[] = [
  { id: "a", name: "Comedor A", lat: -34.6, lng: -58.4, status: "critical" },
  { id: "b", name: "Comedor B", lat: -31.4, lng: -64.2, status: "no_data" },
];

// jsdom has no layout, so an unsized map is 0x0 and the clustering plugin
// draws nothing, having nothing visible to draw into. Give elements a size so
// the tests cover wiring (the plugin loads, pins mount, clicks route) — what a
// real viewport folds into a cluster is for the browser to show.
describe("LeafletEstablishmentsMap", () => {
  const sizes = ["clientWidth", "clientHeight"] as const;
  const original = sizes.map((key) =>
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, key),
  );

  beforeAll(() => {
    for (const key of sizes)
      Object.defineProperty(HTMLElement.prototype, key, {
        configurable: true,
        value: 800,
      });
  });

  afterAll(() => {
    sizes.forEach((key, i) => {
      if (original[i])
        Object.defineProperty(HTMLElement.prototype, key, original[i]);
      else Reflect.deleteProperty(HTMLElement.prototype, key);
    });
  });

  it("loads the clustering plugin and mounts without throwing", () => {
    expect(() =>
      render(<LeafletEstablishmentsMap pins={pins} onPinClick={vi.fn()} />),
    ).not.toThrow();
  });

  it("attributes the tiles to IGN", () => {
    const { container } = render(
      <LeafletEstablishmentsMap pins={pins} onPinClick={vi.fn()} />,
    );

    expect(
      container.querySelector(".leaflet-control-attribution")?.textContent,
    ).toContain("Instituto Geográfico Nacional");
  });

  it("draws one marker per pin, or clusters that hold them all", () => {
    const { container } = render(
      <LeafletEstablishmentsMap pins={pins} onPinClick={vi.fn()} />,
    );

    const drawn = container.querySelectorAll(".leaflet-marker-icon");
    expect(drawn.length).toBeGreaterThan(0);
    const counted = [...drawn].reduce((sum, el) => {
      const cluster = el.querySelector("[aria-label$='agrupados']");
      return sum + (cluster ? Number(cluster.textContent) : 1);
    }, 0);
    expect(counted).toBe(pins.length);
  });

  it("routes a pin's click to onPinClick", () => {
    const onPinClick = vi.fn();
    render(
      <LeafletEstablishmentsMap pins={[pins[0]]} onPinClick={onPinClick} />,
    );

    screen.getByRole("button", { name: "Comedor A: Crítico" }).click();

    expect(onPinClick).toHaveBeenCalledWith("a");
  });
});
