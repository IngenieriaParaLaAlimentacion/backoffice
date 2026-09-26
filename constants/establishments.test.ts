import { describe, expect, it } from "vitest";
import {
  ESTABLISHMENTS_MAP_PAGE,
  PIN_STATUS_LABELS,
  PIN_STATUS_SYMBOL,
  PIN_STATUS_TONE,
} from "@/constants/establishments";
import { MAP_CLUSTER_SIZES, MAP_PIN_ICON_SIZE } from "@/constants/map";
import { PIN_CLASS, TONE_PIN_CLASS } from "@/constants/theme";
import { PIN_STATUSES } from "@/lib/establishmentPins";
import { SEVERITY_TONE } from "@/components/AlertBadge";

describe("pin status tables", () => {
  // The map, the badges and the row tints must agree on what "high" looks like.
  it("reads each severity as the same tone the rest of the app does", () => {
    expect(PIN_STATUS_TONE.critical).toBe(SEVERITY_TONE.critical);
    expect(PIN_STATUS_TONE.high).toBe(SEVERITY_TONE.high);
    expect(PIN_STATUS_TONE.medium).toBe(SEVERITY_TONE.medium);
  });

  it("keeps 'no data' out of the healthy tone", () => {
    expect(PIN_STATUS_TONE.no_data).not.toBe(PIN_STATUS_TONE.normal);
  });

  it("covers every status with a tone, a symbol and a label", () => {
    for (const status of PIN_STATUSES) {
      expect(PIN_STATUS_TONE[status]).toBeDefined();
      expect(TONE_PIN_CLASS[PIN_STATUS_TONE[status]]).toBeTruthy();
      expect(PIN_STATUS_SYMBOL[status]).toBeTruthy();
      expect(PIN_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  // Severity must not rest on color alone.
  it("gives every status its own symbol", () => {
    const symbols = PIN_STATUSES.map((s) => PIN_STATUS_SYMBOL[s]);
    expect(new Set(symbols).size).toBe(PIN_STATUSES.length);
  });

  it("labels a pin with the establishment and its status", () => {
    expect(ESTABLISHMENTS_MAP_PAGE.pinAria("Comedor Central", "critical")).toBe(
      "Comedor Central: Crítico",
    );
  });

  it("pluralises the missing-location notice", () => {
    expect(ESTABLISHMENTS_MAP_PAGE.withoutLocation(1)).toMatch(
      /^1 establecimiento no tiene/,
    );
    expect(ESTABLISHMENTS_MAP_PAGE.withoutLocation(3)).toMatch(
      /^3 establecimientos no tienen/,
    );
  });
});

describe("map sizing", () => {
  // Leaflet needs the pin's size in px while the disc is drawn by a Tailwind
  // class; they have to say the same thing.
  it("declares the pin's px size to match its size class", () => {
    expect(PIN_CLASS).toContain("size-7");
    expect(MAP_PIN_ICON_SIZE).toBe(7 * 4);
  });

  it("declares each cluster's px size to match its size class", () => {
    for (const { sizeClass, px } of MAP_CLUSTER_SIZES) {
      const units = Number(sizeClass.replace("size-", ""));
      expect(px).toBe(units * 4);
    }
  });

  it("orders cluster tiers from smallest to largest", () => {
    const limits = MAP_CLUSTER_SIZES.map((tier) => tier.upTo);
    expect(limits).toEqual([...limits].sort((a, b) => a - b));
    expect(limits.at(-1)).toBe(Infinity);
  });
});
