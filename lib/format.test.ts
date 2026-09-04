import { describe, expect, it } from "vitest";
import {
  argentineDayEndUtc,
  argentineDayStartUtc,
  formatAgeMonths,
  formatDate,
  formatMetric,
  formatPercentage,
  formatTimestamp,
  formatTimestampDate,
  formatTimestampShortDate,
} from "./format";

describe("formatDate", () => {
  it("renders a calendar date without going through Date", () => {
    // UTC-parsing "1990-05-14" would render 13/05/1990 west of Greenwich.
    expect(formatDate("1990-05-14")).toBe("14/05/1990");
  });

  it("passes through anything that isn't YYYY-MM-DD", () => {
    expect(formatDate("")).toBe("");
  });
});

describe("formatTimestampDate", () => {
  it("converts a UTC instant to the Argentine calendar day", () => {
    // 03/09 22:30 in Argentina — the day the surveyor actually worked.
    expect(formatTimestampDate("2026-09-04T01:30:00Z")).toBe("03/09/2026");
  });

  it("does not shift a daytime instant", () => {
    expect(formatTimestampDate("2026-03-01T10:00:00Z")).toBe("01/03/2026");
  });

  it("passes an unparseable value through untouched", () => {
    expect(formatTimestampDate("not a date")).toBe("not a date");
  });
});

describe("formatTimestamp", () => {
  it("renders DD/MM/YYYY HH:MM in Argentine local time", () => {
    expect(formatTimestamp("2026-09-04T01:30:00Z")).toBe("03/09/2026 22:30");
  });

  it("renders local midnight as 00:00, never 24:00", () => {
    expect(formatTimestamp("2026-09-04T03:00:00Z")).toBe("04/09/2026 00:00");
  });
});

describe("formatTimestampShortDate", () => {
  it("abbreviates the year", () => {
    expect(formatTimestampShortDate("2026-09-04T01:30:00Z")).toBe("03/09/26");
  });
});

describe("argentine day bounds", () => {
  it("starts a day at 03:00Z", () => {
    expect(argentineDayStartUtc("2026-09-03")).toBe("2026-09-03T03:00:00.000Z");
  });

  it("ends a day at the last millisecond before the next one starts", () => {
    expect(argentineDayEndUtc("2026-09-03")).toBe("2026-09-04T02:59:59.999Z");
  });

  it("brackets a response completed late in the Argentine evening", () => {
    const response = Date.parse("2026-09-04T01:30:00Z");
    const from = Date.parse(argentineDayStartUtc("2026-09-03")!);
    const to = Date.parse(argentineDayEndUtc("2026-09-03")!);
    expect(response).toBeGreaterThanOrEqual(from);
    expect(response).toBeLessThanOrEqual(to);
  });

  it("returns undefined for an empty filter so the param is omitted", () => {
    expect(argentineDayStartUtc("")).toBeUndefined();
    expect(argentineDayEndUtc("")).toBeUndefined();
  });
});

describe("formatMetric", () => {
  it("returns the em dash for null instead of coercing to 0", () => {
    expect(formatMetric(null, "kg")).toBe("—");
  });

  it("appends the unit", () => {
    expect(formatMetric(18.5, "kg")).toBe("18,5 kg");
  });
});

describe("formatAgeMonths", () => {
  it("renders years and months", () => {
    expect(formatAgeMonths(87)).toBe("7 a 3 m");
    expect(formatAgeMonths(24)).toBe("2 a");
    expect(formatAgeMonths(3)).toBe("3 m");
    expect(formatAgeMonths(null)).toBe("—");
  });
});

describe("formatPercentage", () => {
  it("uses the Argentine decimal comma", () => {
    expect(formatPercentage(12.34)).toBe("12,34%");
    expect(formatPercentage(null)).toBe("—");
  });
});
