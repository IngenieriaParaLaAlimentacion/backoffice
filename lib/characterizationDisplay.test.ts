import { describe, expect, it } from "vitest";
import { formatDays, profileSummary } from "@/lib/characterizationDisplay";
import { EMPTY_CHARACTERIZATION } from "@/schemas/establishmentCharacterization.schema";

describe("formatDays", () => {
  it.each([
    [["monday", "tuesday", "wednesday", "thursday", "friday"], "Lun a Vie"],
    [["monday", "wednesday", "friday"], "Lun, Mié y Vie"],
    [["saturday", "sunday"], "Sáb y Dom"],
    [["monday", "tuesday", "wednesday", "saturday"], "Lun a Mié y Sáb"],
    // Order follows the week, not the order the days were picked in.
    [["friday", "monday"], "Lun y Vie"],
  ] as const)("%j → %s", (days, expected) => {
    expect(formatDays([...days])).toBe(expected);
  });
});

describe("profileSummary", () => {
  it("names the first space type and counts the rest", () => {
    expect(
      profileSummary({
        ...EMPTY_CHARACTERIZATION,
        space_types: ["community_kitchen", "school_support", "fines"],
        daily_attendance: 1200,
        meals: ["lunch"],
      }),
    ).toBe(
      "Olla popular / merendero / comedor / copa de leche +2 · 1.200 personas por día · Almuerzo",
    );
  });

  it("is empty when none of its parts were answered", () => {
    expect(profileSummary(EMPTY_CHARACTERIZATION)).toBe("");
  });
});
