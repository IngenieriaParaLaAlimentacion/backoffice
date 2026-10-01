/**
 * Every timestamp the API returns is a UTC instant ("2026-03-01T10:00:00Z"),
 * and it is rendered in Argentine local time — not the viewer's device zone.
 * Pinning the zone keeps the screen, the backend's CSV export (which formats
 * with the same `America/Argentina/Buenos_Aires` rule) and the surveyor's own
 * phone telling the same story: a response completed at 22:30 in Argentina is
 * dated that day everywhere, instead of jumping to tomorrow in UTC.
 */
const DISPLAY_TIME_ZONE = "America/Argentina/Buenos_Aires";

/** Read via `formatToParts` rather than a locale pattern so the output stays
 *  `DD/MM/YYYY HH:MM` exactly — `es-AR` would splice in a comma. */
const PARTS_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type TimestampParts = Record<
  "day" | "month" | "year" | "hour" | "minute",
  string
>;

function timestampParts(value: string): TimestampParts | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const parts = PARTS_FORMATTER.formatToParts(d);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: read("day"),
    month: read("month"),
    year: read("year"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

/**
 * "YYYY-MM-DD" -> "DD/MM/YYYY" without timezone shifts. For calendar dates
 * (a birth date), which have no instant to convert — do NOT route these
 * through `Date`, it would read them as UTC midnight and shift them a day.
 */
export function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** UTC instant -> "01/03/2026" in Argentine local time. */
export function formatTimestampDate(value: string) {
  const parts = timestampParts(value);
  if (!parts) return value;
  return `${parts.day}/${parts.month}/${parts.year}`;
}

/** UTC instant -> "01/03/2026 07:00" in Argentine local time. */
export function formatTimestamp(value: string) {
  const parts = timestampParts(value);
  if (!parts) return value;
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}

/** UTC instant -> "01/03/26", for axis ticks and other tight spots. */
export function formatTimestampShortDate(value: string) {
  const parts = timestampParts(value);
  if (!parts) return value;
  return `${parts.day}/${parts.month}/${parts.year.slice(-2)}`;
}

const OFFSET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Milliseconds Argentine local time is ahead of UTC at the given instant. */
function zoneOffsetMs(instant: number) {
  const parts = OFFSET_FORMATTER.formatToParts(new Date(instant));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asIfUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour"),
    read("minute"),
    read("second"),
  );
  return asIfUtc - instant;
}

/**
 * "YYYY-MM-DD" (an Argentine calendar day, as typed into a date input) -> the
 * UTC instant that day starts at.
 *
 * The offset is derived from the zone at that date instead of being hardcoded
 * to -03:00: Argentina has adopted and dropped DST before, and a stale constant
 * would quietly shift every range filter by an hour. Resolving twice settles
 * the case where the first guess lands on the other side of a transition.
 */
function argentineDayStartMs(day: string) {
  const asUtcMidnight = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(asUtcMidnight)) return undefined;
  const firstPass = asUtcMidnight - zoneOffsetMs(asUtcMidnight);
  return asUtcMidnight - zoneOffsetMs(firstPass);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The current Argentine calendar day as "YYYY-MM-DD". */
export function argentineToday() {
  const parts = timestampParts(new Date().toISOString());
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
}

/** Inclusive lower bound for "responses on or after this Argentine day". */
export function argentineDayStartUtc(day: string) {
  if (!day) return undefined;
  const start = argentineDayStartMs(day);
  return start === undefined ? undefined : new Date(start).toISOString();
}

/**
 * Inclusive upper bound — the last millisecond of that Argentine day, found by
 * backing off from the *next* day's start rather than adding 24h, so a day
 * shortened or lengthened by a DST transition still ends where it really ends.
 */
export function argentineDayEndUtc(day: string) {
  if (!day) return undefined;
  const start = argentineDayStartMs(day);
  if (start === undefined) return undefined;
  const nextDay = new Date(Date.parse(`${day}T00:00:00Z`) + DAY_MS)
    .toISOString()
    .slice(0, 10);
  const nextStart = argentineDayStartMs(nextDay) ?? start + DAY_MS;
  return new Date(nextStart - 1).toISOString();
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

/**
 * A Decimal quantity as the API sends it ("12.500") -> "12,5". Only for
 * display: parsing through `Number` here is fine, doing arithmetic on the
 * result would not be (that's the whole reason it travels as a string).
 */
export function formatQuantity(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 }).format(
    parsed,
  );
}
