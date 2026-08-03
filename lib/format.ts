/** "YYYY-MM-DD" -> "DD/MM/YYYY" without timezone shifts. */
export function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** "2026-03-01T10:00:00Z" -> "01/03/2026" */
export function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

/** Em dash placeholder for absent data. Never render `null` as 0. */
export const EMPTY_VALUE = "—";

/**
 * Formats a metric that the API returns as `null` when there is nothing to
 * average. Deliberately does NOT coerce `null` to 0 — "0 kg" for an unmeasured
 * establishment is the bug the nullable contract exists to prevent.
 */
export function formatMetric(value: number | null | undefined, unit?: string) {
  if (value === null || value === undefined) return EMPTY_VALUE;
  const formatted = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

/** Whole months -> "7 a 3 m". Returns "—" for null. */
export function formatAgeMonths(months: number | null | undefined) {
  if (months === null || months === undefined) return EMPTY_VALUE;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} m`;
  return rest === 0 ? `${years} a` : `${years} a ${rest} m`;
}

/** Percentages come from the API already rounded to 2 decimals. */
export function formatPercentage(value: number | null | undefined) {
  if (value === null || value === undefined) return EMPTY_VALUE;
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value)}%`;
}
