import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAP_CLUSTER_SIZES,
  MAP_PIN_ICON_SIZE,
  MAP_TILE_LAYERS,
} from "@/constants/map";
import { PIN_CLASS } from "@/constants/theme";

const loadTileLayer = async () => {
  vi.resetModules();
  return (await import("@/constants/map")).MAP_TILE_LAYER;
};

afterEach(() => vi.unstubAllEnvs());

describe("MAP_TILE_LAYERS", () => {
  it("gives every provider a tile template, an attribution and a zoom limit", () => {
    for (const layer of Object.values(MAP_TILE_LAYERS)) {
      expect(layer.url).toMatch(/\{z\}.*\{x\}/);
      expect(layer.attribution).not.toBe("");
      expect(layer.maxZoom).toBeGreaterThan(0);
    }
  });

  // The tint is tuned for the grey map; over a coloured one it muddies.
  it("tints only the grey base map", () => {
    expect(MAP_TILE_LAYERS.ign.tinted).toBe(true);
    expect(MAP_TILE_LAYERS.ignColor.tinted).toBe(false);
    expect(MAP_TILE_LAYERS.osm.tinted).toBe(false);
  });
});

// Leaflet needs a marker's size in px while Tailwind sizes it with a class;
// `size-N` is N * 4px, so the two can be checked against each other.
const pxOfSizeClass = (className: string) =>
  Number(/\bsize-(\d+)\b/.exec(className)![1]) * 4;

describe("icon sizes", () => {
  it("keeps MAP_PIN_ICON_SIZE equal to the pin's size class", () => {
    expect(pxOfSizeClass(PIN_CLASS)).toBe(MAP_PIN_ICON_SIZE);
  });

  it("keeps every cluster tier's px equal to its size class", () => {
    for (const tier of MAP_CLUSTER_SIZES) {
      expect(pxOfSizeClass(tier.sizeClass)).toBe(tier.px);
    }
  });
});

describe("MAP_TILE_LAYER", () => {
  it("is IGN's coloured map by default", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAP_TILES", "");

    expect((await loadTileLayer()).url).toBe(MAP_TILE_LAYERS.ignColor.url);
  });

  it("follows NEXT_PUBLIC_MAP_TILES", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAP_TILES", "osm");
    expect((await loadTileLayer()).url).toBe(MAP_TILE_LAYERS.osm.url);

    vi.stubEnv("NEXT_PUBLIC_MAP_TILES", "ign");
    expect((await loadTileLayer()).url).toBe(MAP_TILE_LAYERS.ign.url);
  });

  it("ignores a value it doesn't know instead of breaking the map", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAP_TILES", "nonsense");

    expect((await loadTileLayer()).url).toBe(MAP_TILE_LAYERS.ignColor.url);
  });
});
