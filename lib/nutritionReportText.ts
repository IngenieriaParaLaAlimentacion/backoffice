import {
  GAPA_GROUP_LABELS,
  NUTRIENT_LABELS,
} from "@/constants/nutritionReport";

/** The name without its technical qualifier: "Vitamina A (RAE)" -> "Vitamina A". */
const plainName = (name: string) => name.replace(/\s*\(.*\)$/, "");

const NAMES_BY_CODE: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(NUTRIENT_LABELS).map(([code, { name }]) => [
      code,
      plainName(name),
    ]),
  ),
  ...GAPA_GROUP_LABELS,
};

// Only the codes that are not a word on their own: "vitamina_b12", not "calcio".
const CODE_PATTERN = new RegExp(
  `\\b(${Object.keys(NAMES_BY_CODE)
    .filter((code) => code.includes("_"))
    .join("|")})\\b`,
  "gi",
);

/**
 * The AI is given the report's codes and sometimes repeats them in its text
 * ("Vitamina_b12: …"). Reads them back as the names the tables use, keeping the
 * capital letter when the code opened a sentence.
 */
export function humanizeReportText(text: string): string {
  return text.replace(CODE_PATTERN, (match) => {
    const name = NAMES_BY_CODE[match.toLowerCase()];
    return match[0] === match[0].toLowerCase()
      ? name[0].toLowerCase() + name.slice(1)
      : name;
  });
}
