import { describe, expect, it } from "vitest";
import { parseAgeFilter } from "@/lib/ageFilter";
import { MAX_AGE, MIN_AGE } from "@/constants/measurements";

describe("parseAgeFilter", () => {
  it("treats blank input as no bound", () => {
    expect(parseAgeFilter("")).toBeUndefined();
    expect(parseAgeFilter("   ")).toBeUndefined();
  });

  it("accepts whole numbers within the accepted range", () => {
    expect(parseAgeFilter("0")).toBe(0);
    expect(parseAgeFilter("42")).toBe(42);
    expect(parseAgeFilter(String(MAX_AGE))).toBe(MAX_AGE);
  });

  // Each of these used to reach the API and come back as "[object Object]".
  it("rejects negative ages", () => {
    expect(parseAgeFilter("-1")).toBeNull();
    expect(parseAgeFilter(String(MIN_AGE - 10))).toBeNull();
  });

  it("rejects decimals, including the leading-dot form", () => {
    expect(parseAgeFilter(".10")).toBeNull();
    expect(parseAgeFilter("0.10")).toBeNull();
    expect(parseAgeFilter("12.5")).toBeNull();
  });

  it("rejects ages beyond the accepted maximum", () => {
    expect(parseAgeFilter(String(MAX_AGE + 1))).toBeNull();
    expect(parseAgeFilter("999999")).toBeNull();
    expect(parseAgeFilter("1e3")).toBeNull();
  });

  it("rejects text that is not a number", () => {
    expect(parseAgeFilter("abc")).toBeNull();
    expect(parseAgeFilter("Infinity")).toBeNull();
  });
});
