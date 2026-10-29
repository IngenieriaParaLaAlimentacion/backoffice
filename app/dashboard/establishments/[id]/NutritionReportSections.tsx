import { ReactNode } from "react";
import { NUTRITION_REPORT_SECTIONS as SECTIONS } from "@/constants/nutritionReport";
import { PILL_CLASS, TONE_PILL_CLASS, TONE_ROW_CLASS } from "@/constants/theme";
import { formatMetric, formatPercentage } from "@/lib/format";
import {
  ReportFoodWithoutConversion,
  ReportGapaGroup,
  ReportMacro,
  ReportNutrient,
  ReportNutrientSources,
} from "@/types/nutritionReport";

function Section({
  title,
  subtitle,
  children,
  note,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** The AI's reading of what the table shows, when it wrote one. */
  note?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className={SECTION_TITLE_CLASS}>{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        {children}
      </div>
      {note}
    </section>
  );
}

/** The look of a section's heading, shared with the sections of the screen itself. */
export const SECTION_TITLE_CLASS = "text-base font-semibold";
/** A quote: the notes that qualify the report rather than belong to its figures. */
export const QUOTE_CLASS =
  "border-l-4 border-border pl-4 text-sm italic text-muted-foreground";

const TH = "px-4 py-3 font-medium";
/** The last column of every table has the same width, so "Estado" lines up
 * from one table to the next however many columns each has. */
const STATUS_TH = `${TH} w-48`;
const TABLE = "w-full min-w-[40rem] table-fixed text-sm";
const TD = "px-4 py-3";
const HEAD_ROW = "bg-muted/50 text-muted-foreground text-left";

function Pill({
  tone,
  label,
}: {
  tone: "danger" | "warning" | "success";
  label: string;
}) {
  return (
    <span className={`${PILL_CLASS} ${TONE_PILL_CLASS[tone]}`}>{label}</span>
  );
}

/** Below 2/3 of the reference a nutrient is at risk: said in words, not only in tone. */
export function NutrientsTable({
  nutrients,
  commentary = [],
}: {
  nutrients: ReportNutrient[];
  /** One line per nutrient at risk, written by the AI. */
  commentary?: string[];
}) {
  const { columns } = SECTIONS.nutrients;
  if (nutrients.length === 0) return null;
  return (
    <Section
      title={SECTIONS.nutrients.title}
      subtitle={SECTIONS.nutrients.subtitle}
      note={
        commentary.length > 0 && (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {commentary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )
      }
    >
      <table className={TABLE}>
        <thead>
          <tr className={HEAD_ROW}>
            <th className={TH}>{columns.nutrient}</th>
            <th className={TH}>{columns.reference}</th>
            <th className={TH}>{columns.minimum}</th>
            <th className={TH}>{columns.amount}</th>
            <th className={TH}>{columns.adequacy}</th>
            <th className={STATUS_TH}>{columns.status}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {nutrients.map((item) => {
            const { name, unit } = item;
            return (
              <tr
                key={item.nutrient}
                className={item.at_risk ? TONE_ROW_CLASS.danger : "bg-card"}
              >
                <td className={`${TD} font-medium`}>{name}</td>
                <td className={TD}>
                  {formatMetric(item.reference_per_1000_kcal, unit)}
                </td>
                <td className={TD}>
                  {formatMetric(item.minimum_per_1000_kcal, unit)}
                </td>
                <td className={TD}>
                  {formatMetric(item.amount_per_1000_kcal, unit)}
                </td>
                <td className={TD}>
                  {formatPercentage(item.adequacy_percent)}
                </td>
                <td className={TD}>
                  {item.at_risk ? (
                    <Pill tone="danger" label={SECTIONS.nutrients.atRisk} />
                  ) : (
                    <Pill tone="success" label={SECTIONS.nutrients.adequate} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Section>
  );
}

export function MacrosTable({
  macros,
  commentary,
}: {
  macros: ReportMacro[];
  commentary?: string;
}) {
  const { columns } = SECTIONS.macros;
  if (macros.length === 0) return null;
  return (
    <Section
      title={SECTIONS.macros.title}
      subtitle={SECTIONS.macros.subtitle}
      note={commentary && <p className="text-sm">{commentary}</p>}
    >
      <table className={TABLE}>
        <thead>
          <tr className={HEAD_ROW}>
            <th className={TH}>{columns.macro}</th>
            <th className={TH}>{columns.share}</th>
            <th className={TH}>{columns.range}</th>
            <th className={STATUS_TH}>{columns.status}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {macros.map((item) => (
            <tr key={item.macro} className="bg-card">
              <td className={`${TD} font-medium`}>{item.name}</td>
              <td className={TD}>
                {formatPercentage(item.energy_share_percent)}
              </td>
              <td className={TD}>
                {SECTIONS.macros.range(
                  formatPercentage(item.min_percent),
                  formatPercentage(item.max_percent),
                )}
              </td>
              <td className={TD}>
                {item.in_range ? (
                  <Pill tone="success" label={SECTIONS.macros.inRange} />
                ) : (
                  <Pill tone="warning" label={SECTIONS.macros.outOfRange} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

export function GapaGroupsTable({
  groups,
  commentary,
}: {
  groups: ReportGapaGroup[];
  commentary?: string;
}) {
  const { columns } = SECTIONS.gapa;
  if (groups.length === 0) return null;
  const missing = groups
    .filter((item) => item.missing)
    .map((item) => item.name);
  return (
    <Section
      title={SECTIONS.gapa.title}
      subtitle={SECTIONS.gapa.subtitle}
      note={commentary && <p className="text-sm">{commentary}</p>}
    >
      <table className={TABLE}>
        <thead>
          <tr className={HEAD_ROW}>
            <th className={TH}>{columns.group}</th>
            <th className={TH}>{columns.share}</th>
            <th className={STATUS_TH}>{columns.status}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {groups.map((item) => (
            <tr key={item.group} className="bg-card">
              <td className={`${TD} font-medium`}>{item.name}</td>
              <td className={TD}>
                {formatPercentage(item.energy_share_percent)}
              </td>
              <td className={TD}>
                {item.missing ? (
                  <Pill tone="warning" label={SECTIONS.gapa.missing} />
                ) : (
                  <Pill tone="success" label={SECTIONS.gapa.present} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {missing.length > 0 && (
        <p className="border-t border-border px-4 py-3 text-sm">
          {SECTIONS.gapa.missingSummary(missing)}
        </p>
      )}
    </Section>
  );
}

/**
 * The foods that best cover each nutrient the intake falls short of, with the
 * AI's line on what to add. Nothing is shown when no nutrient is at risk.
 */
export function SuggestedFoods({
  sources,
  nutrients,
  commentary,
}: {
  sources: ReportNutrientSources[];
  /** The report's nutrients, which carry the name and unit of each source's. */
  nutrients: ReportNutrient[];
  commentary?: string;
}) {
  const withFoods = sources.filter((item) => item.foods.length > 0);
  if (withFoods.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className={SECTION_TITLE_CLASS}>{SECTIONS.suggested.title}</h2>
        <p className="text-xs text-muted-foreground">
          {SECTIONS.suggested.subtitle}
        </p>
      </div>
      {commentary && <p className="text-sm">{commentary}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {withFoods.map((item) => {
          const nutrient = nutrients.find((n) => n.nutrient === item.nutrient);
          if (!nutrient) return null;
          const { name, unit } = nutrient;
          return (
            <div
              key={item.nutrient}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4"
            >
              <h3 className="text-sm font-medium">{name}</h3>
              <ul className="flex flex-col gap-0.5 text-sm">
                {item.foods.map((food) => (
                  <li key={food.food_id} className="flex justify-between gap-3">
                    <span>{food.name}</span>
                    <span className="text-muted-foreground">
                      {SECTIONS.suggested.per100kcal(
                        formatMetric(food.amount_per_100_kcal, unit),
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Foods the calculation had to leave out, so nobody reads the figures as complete. */
export function ExcludedFoodsNotice({
  foods,
}: {
  foods: ReportFoodWithoutConversion[];
}) {
  if (foods.length === 0) return null;
  const names = foods.map((food) => food.name);
  return (
    <blockquote role="status" className={QUOTE_CLASS}>
      {names.length === 1
        ? SECTIONS.excluded.one(names[0])
        : SECTIONS.excluded.many(names)}
    </blockquote>
  );
}

/** The data gaps to keep in mind when reading the figures, written by the AI. */
export function DataLimitations({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className={SECTION_TITLE_CLASS}>{SECTIONS.limitations.title}</h2>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
