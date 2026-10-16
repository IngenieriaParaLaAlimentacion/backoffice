import L from "leaflet";
import {
  ESTABLISHMENTS_MAP_PAGE,
  PIN_STATUS_SYMBOL,
} from "@/constants/establishments";
import { MAP_PIN_ICON_SIZE } from "@/constants/map";
import type { MapPin } from "@/lib/establishmentPins";
import { pinClassName } from "../pinStyle";

const HALF = MAP_PIN_ICON_SIZE / 2;

export function buildPinElement(pin: MapPin): HTMLElement {
  const disc = document.createElement("span");
  disc.className = pinClassName(pin.status);
  disc.textContent = PIN_STATUS_SYMBOL[pin.status];
  // The name and status are announced by the marker itself (`aria-label`).
  disc.setAttribute("aria-hidden", "true");
  return disc;
}

/**
 * Everything user-supplied (the establishment's name) reaches Leaflet as a DOM
 * node with `textContent`, never as a string: Leaflet writes string content
 * with `innerHTML`, so a name containing markup would be executed.
 */
export function createPinMarker(
  pin: MapPin,
  onSelect: (id: string) => void,
): L.Marker {
  const marker = L.marker([pin.lat, pin.lng], {
    icon: L.divIcon({
      html: buildPinElement(pin),
      className: "",
      iconSize: [MAP_PIN_ICON_SIZE, MAP_PIN_ICON_SIZE],
    }),
    keyboard: true,
    riseOnHover: true,
  });

  const name = document.createElement("span");
  name.textContent = pin.name;
  marker.bindTooltip(name, {
    direction: "top",
    offset: [0, -HALF],
    className: "establishment-map-tooltip",
  });

  const showTooltip = () => marker.openTooltip();
  const hideTooltip = () => marker.closeTooltip();
  marker.on("add", () => {
    const element = marker.getElement();
    if (!element) return;
    element.setAttribute(
      "aria-label",
      ESTABLISHMENTS_MAP_PAGE.pinAria(pin.name, pin.status),
    );
    // Hover isn't the only way in: focusing the pin by keyboard shows the name.
    // The same function references make re-adding these a no-op.
    element.addEventListener("focus", showTooltip);
    element.addEventListener("blur", hideTooltip);
  });

  marker.on("click", () => onSelect(pin.id));
  return marker;
}
