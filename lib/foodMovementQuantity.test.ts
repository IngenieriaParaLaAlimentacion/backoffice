import { describe, expect, it } from "vitest";
import {
  availableMillis,
  quantityDisplay,
  quantityMillis,
} from "./foodMovementQuantity";

describe("food movement quantities", () => {
  it("parses exact thousandths without floating point rounding", () => {
    expect(quantityMillis("0.001")).toBe(BigInt(1));
    expect(quantityMillis("9999999.999")).toBe(BigInt("9999999999"));
    expect(quantityDisplay(BigInt(1250))).toBe("1.25");
    expect(availableMillis("0.000")).toBe(BigInt(0));
  });

  it.each(["0", "0.000", "1.0001", "10000000", "1e2", "-1", "01", "1,5"])(
    "rejects %s",
    (value) => {
      expect(quantityMillis(value)).toBeNull();
    },
  );
});
