import { MAX_AGE, MIN_AGE } from "@/constants/measurements";

/**
 * Parse an age filter typed into the measurements listing: `undefined` when
 * blank, `null` when the API would reject it.
 *
 * `<input type="number">` does not stop the user typing `-5`, `.10` or `9999`,
 * and the API answers all three with a 422 whose body names no field — so
 * there is nothing useful to show unless the value is checked before it is sent.
 */
export function parseAgeFilter(raw: string): number | undefined | null {
  if (raw.trim() === "") return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value)) return null;
  if (value < MIN_AGE || value > MAX_AGE) return null;
  return value;
}
