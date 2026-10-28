import { describe, expect, it } from "vitest";
import { formatReportMonth } from "@/lib/format";
import {
  closedMonthOptions,
  isClosedMonth,
  lastClosedMonth,
} from "@/lib/reportMonth";

describe("lastClosedMonth", () => {
  it("is the month before the current one", () => {
    expect(lastClosedMonth("2026-10-27")).toBe("2026-09");
  });

  it("crosses the year boundary", () => {
    expect(lastClosedMonth("2026-01-01")).toBe("2025-12");
  });
});

describe("isClosedMonth", () => {
  it("rejects the current month, future months and malformed values", () => {
    expect(isClosedMonth("2026-10", "2026-10-27")).toBe(false);
    expect(isClosedMonth("2026-11", "2026-10-27")).toBe(false);
    expect(isClosedMonth("2026-13", "2026-10-27")).toBe(false);
    expect(isClosedMonth("2026-9", "2026-10-27")).toBe(false);
  });

  it("accepts the previous month and anything older", () => {
    expect(isClosedMonth("2026-09", "2026-10-27")).toBe(true);
    expect(isClosedMonth("2025-01", "2026-10-27")).toBe(true);
  });
});

describe("closedMonthOptions", () => {
  it("lists closed months newest first, across years", () => {
    expect(closedMonthOptions(3, "2026-02-10")).toEqual([
      "2026-01",
      "2025-12",
      "2025-11",
    ]);
  });
});

describe("formatReportMonth", () => {
  it("writes the month in Spanish", () => {
    expect(formatReportMonth("2026-08")).toBe("agosto de 2026");
    expect(formatReportMonth("2026-01")).toBe("enero de 2026");
  });
});
