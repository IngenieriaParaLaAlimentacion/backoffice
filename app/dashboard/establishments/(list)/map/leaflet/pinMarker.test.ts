import L from "leaflet";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPinElement, createPinMarker } from "./pinMarker";
import { PIN_STATUS_SYMBOL } from "@/constants/establishments";
import { MapPin, PIN_STATUSES } from "@/lib/establishmentPins";

const pin = (overrides: Partial<MapPin> = {}): MapPin => ({
  id: "e1",
  name: "Comedor Central",
  lat: -34.6,
  lng: -58.4,
  status: "critical",
  ...overrides,
});

let map: L.Map | undefined;
afterEach(() => {
  map?.remove();
  map = undefined;
  document.body.innerHTML = "";
});

function mountOnMap(marker: L.Marker) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  map = L.map(container).setView([-34.6, -58.4], 10);
  marker.addTo(map);
}

describe("buildPinElement", () => {
  it("shows each status's own symbol", () => {
    for (const status of PIN_STATUSES) {
      expect(buildPinElement(pin({ status })).textContent).toBe(
        PIN_STATUS_SYMBOL[status],
      );
    }
  });

  it("draws 'no data' hollow and dashed, unlike a healthy pin", () => {
    const noData = buildPinElement(pin({ status: "no_data" })).className;
    const normal = buildPinElement(pin({ status: "normal" })).className;

    expect(noData).toContain("border-dashed");
    expect(noData).not.toBe(normal);
    expect(normal).not.toContain("border-dashed");
  });

  it("is hidden from assistive tech; the marker carries the label", () => {
    expect(buildPinElement(pin()).getAttribute("aria-hidden")).toBe("true");
  });
});

describe("createPinMarker", () => {
  it("sits on the establishment's coordinates", () => {
    const marker = createPinMarker(pin(), vi.fn());

    expect(marker.getLatLng().lat).toBe(-34.6);
    expect(marker.getLatLng().lng).toBe(-58.4);
  });

  it("reports the establishment's id when clicked", () => {
    const onSelect = vi.fn();
    const marker = createPinMarker(pin({ id: "abc" }), onSelect);

    marker.fire("click");

    expect(onSelect).toHaveBeenCalledWith("abc");
  });

  it("shows the name on hover", () => {
    const marker = createPinMarker(pin({ name: "Merendero Sur" }), vi.fn());

    const content = marker.getTooltip()?.getContent() as HTMLElement;

    expect(content.textContent).toBe("Merendero Sur");
  });

  // Leaflet would `innerHTML` a string; a DOM node with textContent stays inert.
  it("never turns a name containing markup into elements", () => {
    const name = '<img src=x onerror="alert(1)">';
    const marker = createPinMarker(pin({ name }), vi.fn());

    const content = marker.getTooltip()?.getContent() as HTMLElement;

    expect(content.textContent).toBe(name);
    expect(content.querySelector("img")).toBeNull();
  });

  it("is a labelled, keyboard-reachable button once on the map", () => {
    const marker = createPinMarker(
      pin({ name: "Comedor Central", status: "high" }),
      vi.fn(),
    );

    mountOnMap(marker);
    const element = marker.getElement()!;

    expect(element.getAttribute("role")).toBe("button");
    expect(element.tabIndex).toBe(0);
    expect(element.getAttribute("aria-label")).toBe("Comedor Central: Alto");
  });

  it("shows the name when focused by keyboard", () => {
    const marker = createPinMarker(pin(), vi.fn());
    mountOnMap(marker);
    const element = marker.getElement()!;

    element.dispatchEvent(new FocusEvent("focus"));
    expect(marker.isTooltipOpen()).toBe(true);

    element.dispatchEvent(new FocusEvent("blur"));
    expect(marker.isTooltipOpen()).toBe(false);
  });
});
