import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ageInMonths,
  argentineToday,
  formatTimeSinceMeasurement,
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

describe("ageInMonths", () => {
  it.each([
    ["2008-04-28", "2026-10-27", 221],
    ["2008-04-28", "2026-10-28", 222],
    ["2026-10-28", "2026-10-28", 0],
    ["2026-10-29", "2026-10-28", 0],
    ["2026-01-31", "2026-02-28", 0],
    ["2026-01-31", "2026-03-01", 1],
    ["2024-02-29", "2025-02-28", 11],
    ["2024-02-29", "2025-03-01", 12],
    ["2026-02-30", "2026-10-28", null],
    ["2025-02-29", "2026-10-28", null],
    ["0000-01-01", "2026-10-28", null],
    ["garbage", "2026-10-28", null],
    ["", "2026-10-28", null],
    ["2026-1-01", "2026-10-28", null],
    ["2008-04-28", "garbage", null],
  ])("counts completed months from %s to %s", (birth, reference, expected) => {
    expect(ageInMonths(birth, reference)).toBe(expected);
  });
});

describe("argentineToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses Argentina today across the UTC date boundary", () => {
    const now = new Date("2026-10-29T01:30:00Z");
    expect(argentineToday(now)).toBe("2026-10-28");
    expect(
      formatAgeMonths(ageInMonths("2008-04-28", argentineToday(now))),
    ).toBe("18 a 6 m");
  });

  it("samples the current clock when no reference is given", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-28T02:59:59Z"));
    expect(argentineToday()).toBe("2026-10-27");
    expect(ageInMonths("2008-04-28")).toBe(221);
    vi.setSystemTime(new Date("2026-10-28T03:00:00Z"));
    expect(argentineToday()).toBe("2026-10-28");
    expect(ageInMonths("2008-04-28")).toBe(222);
  });
});

describe("formatTimeSinceMeasurement", () => {
  const now = new Date("2026-10-28T13:00:00Z");
  it.each([
    [null, "—"],
    [undefined, "—"],
    ["bad-date", "—"],
    ["2026-10-28T13:00:01Z", "hoy"],
    ["2026-10-29T02:59:59Z", "hoy"],
    ["2026-10-28T23:59:59-03:00", "hoy"],
    ["2026-10-29T03:00:00Z", "—"],
    ["2026-10-28T13:00:00Z", "hoy"],
    ["2026-10-28T12:00:00Z", "hoy"],
    ["2026-10-28T01:30:00Z", "hace 1 día"],
    ["2026-10-27T13:00:00Z", "hace 1 día"],
    ["2026-10-26T13:00:00Z", "hace 2 días"],
    ["2026-09-29T13:00:00Z", "hace 29 días"],
    ["2026-09-28T13:00:00Z", "hace 1 mes"],
    ["2026-07-28T13:00:00Z", "hace 3 meses"],
    ["2025-10-28T13:00:00Z", "hace 1 año"],
    ["2024-10-28T13:00:00Z", "hace 2 años"],
  ])("formats %s", (value, expected) => {
    expect(formatTimeSinceMeasurement(value, now)).toBe(expected);
  });

  it.each([
    ["2026-01-31T15:00:00Z", "2026-02-28T15:00:00Z", "hace 28 días"],
    ["2026-01-31T15:00:00Z", "2026-03-01T15:00:00Z", "hace 1 mes"],
    ["2024-02-29T15:00:00Z", "2025-02-28T15:00:00Z", "hace 11 meses"],
    ["2024-02-29T15:00:00Z", "2025-03-01T15:00:00Z", "hace 1 año"],
  ])("counts calendar months for %s to %s", (value, reference, expected) => {
    expect(formatTimeSinceMeasurement(value, new Date(reference))).toBe(
      expected,
    );
  });

  it("returns a placeholder for an invalid reference clock", () => {
    expect(
      formatTimeSinceMeasurement("2026-10-28T12:00:00Z", new Date(NaN)),
    ).toBe("—");
    expect(argentineToday(new Date(NaN))).toBe("");
  });
});
