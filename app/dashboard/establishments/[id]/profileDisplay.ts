import {
  ESTABLISHMENT_PROFILE as COPY,
  MEAL_LABELS,
  SPACE_TYPE_LABELS,
  WEEKDAY_OPTIONS,
  WEEKDAY_SHORT_LABELS,
} from "@/constants/establishments";
import { EstablishmentCharacterization, Weekday } from "@/types/establishment";

/** "Otro" reads as "Otro: <texto>" when the free text was filled in. */
export function choiceLabel<T extends string>(
  value: T,
  labels: Record<T, string>,
  otherText: string | null,
) {
  return value === "other" && otherText
    ? COPY.otherWithText(otherText)
    : labels[value];
}

const WEEK_ORDER = WEEKDAY_OPTIONS.map(({ value }) => value);

/**
 * Week order, with runs of three or more consecutive days collapsed:
 * "Lun a Vie", "Lun a Mié y Sáb", "Lun, Mié y Vie". Two in a row stay listed
 * — "Sáb y Dom" reads better than "Sáb a Dom".
 */
export function formatDays(days: Weekday[]): string {
  const sorted = WEEK_ORDER.filter((day) => days.includes(day));
  const groups: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (
      j + 1 < sorted.length &&
      WEEK_ORDER.indexOf(sorted[j + 1]) === WEEK_ORDER.indexOf(sorted[j]) + 1
    )
      j++;
    if (j - i >= 2)
      groups.push(
        `${WEEKDAY_SHORT_LABELS[sorted[i]]} a ${WEEKDAY_SHORT_LABELS[sorted[j]]}`,
      );
    else
      for (let k = i; k <= j; k++) groups.push(WEEKDAY_SHORT_LABELS[sorted[k]]);
    i = j + 1;
  }
  return groups.length > 1
    ? `${groups.slice(0, -1).join(", ")} y ${groups.at(-1)}`
    : (groups[0] ?? "");
}

/** Barrio and entrecalles, the part of the location the address doesn't say. */
export function locationDetail(c: EstablishmentCharacterization): string {
  return [c.neighborhood, c.cross_streets && COPY.crossStreets(c.cross_streets)]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The one line under the establishment's name once its profile has data:
 * space type · people per day · meals. Only answered parts are included. A
 * space can be several types at once, so only the first is named and the
 * rest counted — the full list is one click away in the Perfil tab.
 */
export function profileSummary(c: EstablishmentCharacterization): string {
  const [firstType, ...otherTypes] = c.space_types;
  return [
    firstType &&
      [
        choiceLabel(firstType, SPACE_TYPE_LABELS, c.space_types_other),
        otherTypes.length > 0 && COPY.moreCount(otherTypes.length),
      ]
        .filter(Boolean)
        .join(" "),
    c.daily_attendance !== null && COPY.peoplePerDay(c.daily_attendance),
    c.meals.length > 0 && c.meals.map((meal) => MEAL_LABELS[meal]).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");
}
