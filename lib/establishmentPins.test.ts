import { describe, expect, it } from "vitest";
import {
  buildMapPins,
  countPinsByStatus,
  hasLocation,
  PIN_STATUSES,
  toPinStatus,
} from "@/lib/establishmentPins";
import { EstablishmentMapItem } from "@/types/establishment";

const item = (
  overrides: Partial<EstablishmentMapItem> = {},
): EstablishmentMapItem => ({
  id: "e1",
  name: "Comedor Central",
  latitude: -34.6,
  longitude: -58.4,
  has_data: true,
  severity: null,
  dominant_status: null,
  ...overrides,
});

describe("toPinStatus", () => {
  it("passes each severity through", () => {
    expect(toPinStatus({ has_data: true, severity: "critical" })).toBe(
      "critical",
    );
    expect(toPinStatus({ has_data: true, severity: "high" })).toBe("high");
    expect(toPinStatus({ has_data: true, severity: "medium" })).toBe("medium");
  });

  it("reads measured-and-healthy as normal", () => {
    expect(toPinStatus({ has_data: true, severity: null })).toBe("normal");
  });

  // A null severity is what a healthy establishment and an unmeasured one
  // both send, so it must never decide on its own.
  it("never reads an establishment without data as normal", () => {
    expect(toPinStatus({ has_data: false, severity: null })).toBe("no_data");
  });

  it("lets has_data win over a stray severity", () => {
    expect(toPinStatus({ has_data: false, severity: "critical" })).toBe(
      "no_data",
    );
  });
});

describe("hasLocation", () => {
  it("rejects the (0, 0) backfill", () => {
    expect(hasLocation({ latitude: 0, longitude: 0 })).toBe(false);
  });

  it("accepts a coordinate that is zero on only one axis", () => {
    expect(hasLocation({ latitude: 0, longitude: -58.4 })).toBe(true);
    expect(hasLocation({ latitude: -34.6, longitude: 0 })).toBe(true);
  });

  it("accepts a real location", () => {
    expect(hasLocation({ latitude: -34.6, longitude: -58.4 })).toBe(true);
  });
});

describe("buildMapPins", () => {
  it("maps an item to a pin", () => {
    const { pins, withoutLocation } = buildMapPins([
      item({ id: "a", name: "A", severity: "high" }),
    ]);

    expect(pins).toEqual([
      { id: "a", name: "A", lat: -34.6, lng: -58.4, status: "high" },
    ]);
    expect(withoutLocation).toBe(0);
  });

  it("keeps establishments without data as pins", () => {
    const { pins } = buildMapPins([item({ has_data: false })]);

    expect(pins).toHaveLength(1);
    expect(pins[0].status).toBe("no_data");
  });

  it("counts establishments without a location instead of dropping them silently", () => {
    const { pins, withoutLocation } = buildMapPins([
      item({ id: "ok" }),
      item({ id: "unlocated", latitude: 0, longitude: 0 }),
    ]);

    expect(pins.map((p) => p.id)).toEqual(["ok"]);
    expect(withoutLocation).toBe(1);
  });

  it("handles an empty payload", () => {
    expect(buildMapPins([])).toEqual({ pins: [], withoutLocation: 0 });
  });
});

describe("countPinsByStatus", () => {
  it("reports every status, zero included", () => {
    const { pins } = buildMapPins([
      item({ id: "1", severity: "critical" }),
      item({ id: "2", severity: "critical" }),
      item({ id: "3", has_data: false }),
    ]);

    expect(countPinsByStatus(pins)).toEqual({
      critical: 2,
      high: 0,
      medium: 0,
      normal: 0,
      no_data: 1,
    });
  });

  it("covers exactly the statuses the legend lists", () => {
    expect(Object.keys(countPinsByStatus([])).sort()).toEqual(
      [...PIN_STATUSES].sort(),
    );
  });
});
