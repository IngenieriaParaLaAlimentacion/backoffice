import {
  AlertSeverity,
  AlertType,
  MeasurementAlert,
  NutritionalStatus,
} from "@/types/measurement";

// Risk styling keyed off the highest-priority alert severity in a row.
export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  severely_wasted: "Emaciación severa",
  wasted: "Emaciación",
  overweight: "Sobrepeso",
  obese: "Obesidad",
  severe_underweight: "Bajo peso severo",
  underweight: "Bajo peso",
};

export const NUTRITIONAL_STATUS_LABELS: Record<NutritionalStatus, string> = {
  ...ALERT_TYPE_LABELS,
  normal: "Normal",
};

export const SEVERITY_BADGE_CLASS: Record<AlertSeverity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export const SEVERITY_ROW_CLASS: Record<AlertSeverity, string> = {
  critical: "bg-destructive/5",
  high: "bg-orange-500/5",
  medium: "bg-amber-500/5",
};

/** "Measured and healthy" — never used for a subject without measurements. */
export const NORMAL_BADGE_CLASS =
  "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";

/** "Not measured" — visually distinct from `normal` on purpose. */
export const NO_DATA_BADGE_CLASS =
  "bg-muted text-muted-foreground border-border";

const BADGE_CLASS = "inline-block rounded-full border px-2 py-0.5 text-xs";

export function topSeverity(alerts: MeasurementAlert[]): AlertSeverity | null {
  if (alerts.length === 0) return null;
  return alerts.reduce<AlertSeverity>(
    (max, a) =>
      SEVERITY_RANK[a.severity] > SEVERITY_RANK[max] ? a.severity : max,
    alerts[0].severity,
  );
}

export function AlertBadge({
  label,
  className,
  title,
}: {
  label: string;
  className: string;
  title?: string;
}) {
  return (
    <span className={`${BADGE_CLASS} ${className}`} title={title}>
      {label}
    </span>
  );
}

type AlertBadgeListProps = {
  alerts: MeasurementAlert[];
  /**
   * `false` renders "Sin datos" instead of the green "Normal" pill. A subject
   * with no measurements is not healthy, it is unknown — same distinction the
   * establishment metrics make with `has_data`.
   */
  hasMeasurement?: boolean;
  /**
   * Clarifies which measurement the badge reflects, e.g. "Último relevamiento
   * en este comedor" vs "Último relevamiento". The same subject can be `wasted`
   * at one establishment and `normal` globally; without this the difference
   * gets reported as a bug.
   */
  scopeLabel?: string;
};

export function AlertBadgeList({
  alerts,
  hasMeasurement = true,
  scopeLabel,
}: AlertBadgeListProps) {
  if (!hasMeasurement) {
    return (
      <div className="flex flex-wrap gap-1">
        <AlertBadge
          label="Sin datos"
          className={NO_DATA_BADGE_CLASS}
          title="El sujeto no tiene mediciones registradas"
        />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        <AlertBadge
          label="Normal"
          className={NORMAL_BADGE_CLASS}
          title={scopeLabel}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {alerts.map((alert, index) => (
        <AlertBadge
          key={`${alert.alert_type}-${index}`}
          label={ALERT_TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
          className={SEVERITY_BADGE_CLASS[alert.severity]}
          title={scopeLabel ? `${scopeLabel} — ${alert.detail}` : alert.detail}
        />
      ))}
    </div>
  );
}
