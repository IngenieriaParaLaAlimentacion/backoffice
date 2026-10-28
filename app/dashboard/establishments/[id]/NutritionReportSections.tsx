import { ReactNode } from "react";
import {
  GAPA_GROUP_LABELS,
  MACRO_LABELS,
  NUTRIENT_LABELS,
  NUTRITION_REPORT_SECTIONS as COPY,
} from "@/constants/nutritionReport";
import { PILL_CLASS, TONE_PILL_CLASS, TONE_ROW_CLASS } from "@/constants/theme";
import { formatMetric, formatPercentage } from "@/lib/format";
import {
  ReportGapaGroup,
  ReportMacro,
  ReportNutrient,
} from "@/types/nutritionReport";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        {children}
      </div>
    </section>
  );
}

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
export function NutrientsTable({ nutrients }: { nutrients: ReportNutrient[] }) {
  const { columns } = COPY.nutrients;
  if (nutrients.length === 0) return null;
  return (
    <Section title={COPY.nutrients.title} subtitle={COPY.nutrients.subtitle}>
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
            const { name, unit } = NUTRIENT_LABELS[item.nutrient];
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
                    <Pill tone="danger" label={COPY.nutrients.atRisk} />
                  ) : (
                    <Pill tone="success" label={COPY.nutrients.adequate} />
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

export function MacrosTable({ macros }: { macros: ReportMacro[] }) {
  const { columns } = COPY.macros;
  if (macros.length === 0) return null;
  return (
    <Section title={COPY.macros.title} subtitle={COPY.macros.subtitle}>
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
              <td className={`${TD} font-medium`}>
                {MACRO_LABELS[item.macro]}
              </td>
              <td className={TD}>
                {formatPercentage(item.energy_share_percent)}
              </td>
              <td className={TD}>
                {COPY.macros.range(
                  formatPercentage(item.min_percent),
                  formatPercentage(item.max_percent),
                )}
              </td>
              <td className={TD}>
                {item.in_range ? (
                  <Pill tone="success" label={COPY.macros.inRange} />
                ) : (
                  <Pill tone="warning" label={COPY.macros.outOfRange} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

export function GapaGroupsTable({ groups }: { groups: ReportGapaGroup[] }) {
  const { columns } = COPY.gapa;
  if (groups.length === 0) return null;
  const missing = groups
    .filter((item) => item.missing)
    .map((item) => GAPA_GROUP_LABELS[item.group]);
  return (
    <Section title={COPY.gapa.title} subtitle={COPY.gapa.subtitle}>
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
              <td className={`${TD} font-medium`}>
                {GAPA_GROUP_LABELS[item.group]}
              </td>
              <td className={TD}>
                {formatPercentage(item.energy_share_percent)}
              </td>
              <td className={TD}>
                {item.missing ? (
                  <Pill tone="warning" label={COPY.gapa.missing} />
                ) : (
                  <Pill tone="success" label={COPY.gapa.present} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {missing.length > 0 && (
        <p className="border-t border-border px-4 py-3 text-sm">
          {COPY.gapa.missingSummary(missing)}
        </p>
      )}
    </Section>
  );
}
