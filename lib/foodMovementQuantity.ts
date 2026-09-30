export const MAX_QUANTITY_MILLIS = BigInt("9999999999");

export function quantityMillis(value: string): bigint | null {
  const text = value.trim();
  if (!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,3})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const result =
    BigInt(whole) * BigInt("1000") + BigInt(fraction.padEnd(3, "0") || "0");
  return result > BigInt("0") && result <= MAX_QUANTITY_MILLIS ? result : null;
}

export function availableMillis(value: string): bigint {
  if (value === "0" || /^0(?:\.0{1,3})?$/.test(value)) return BigInt("0");
  return quantityMillis(value) ?? BigInt("0");
}

export function quantityDisplay(value: bigint): string {
  const whole = value / BigInt("1000");
  const fraction = (value % BigInt("1000"))
    .toString()
    .padStart(3, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}
