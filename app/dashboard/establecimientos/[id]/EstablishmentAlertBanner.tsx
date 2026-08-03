"use client";

import { EstablishmentAlertStatus } from "@/types/establishment";
import { AlertSeverity } from "@/types/measurement";
import {
  AlertBadge,
  NORMAL_BADGE_CLASS,
  NUTRITIONAL_STATUS_LABELS,
  SEVERITY_BADGE_CLASS,
  SEVERITY_RANK,
} from "@/components/AlertBadge";
import { ESTABLISHMENT_DASHBOARD_PAGE as COPY } from "@/constants/establishments";
import { formatPercentage } from "@/lib/format";
import { CircleCheck, TriangleAlert } from "lucide-react";

const BANNER_CLASS: Record<AlertSeverity, string> = {
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-600",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-600",
};

/**
 * `severity` is the worst severity present among the subjects — not an average
 * and not a prevalence threshold. One critical case sets the banner to critical
 * even if 98% of subjects are normal, so it is never shown on its own: the
 * counts and the distribution qualify it.
 *
 * Any thresholding ("critical only above 10%") is a backend change; do not
 * reimplement the rule here.
 */
export default function EstablishmentAlertBanner({
  alertStatus,
}: {
  alertStatus: EstablishmentAlertStatus;
}) {
  const { severity, total_evaluated, at_risk_count, at_risk_percentage } =
    alertStatus;

  if (total_evaluated === 0) return null;

  // Sort a copy: most severe first, normal last.
  const distribution = [...alertStatus.distribution].sort(
    (a, b) =>
      (b.severity ? SEVERITY_RANK[b.severity] : 0) -
      (a.severity ? SEVERITY_RANK[a.severity] : 0),
  );

  // `severity: null` means every subject is normal -> neutral/OK banner.
  if (severity === null) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-600">
        <CircleCheck size={18} className="mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{COPY.noAlerts}</span>
          <span className="text-xs">{COPY.allNormal(total_evaluated)}</span>
        </div>
      </div>
    );
  }

  // The worst-severity bucket is what the headline names.
  const worst = distribution.find((d) => d.severity === severity);

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${BANNER_CLASS[severity]}`}
    >
      <TriangleAlert size={18} className="mt-0.5 shrink-0" />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          {COPY.severityTitles[severity]}
          {worst &&
            ` — ${worst.count} de ${total_evaluated} ${
              worst.count === 1 ? "sujeto" : "sujetos"
            } en ${NUTRITIONAL_STATUS_LABELS[worst.status].toLowerCase()}`}
        </span>

        <span className="text-xs">
          {COPY.atRisk(at_risk_count, total_evaluated)}
          {at_risk_percentage !== null &&
            ` (${formatPercentage(at_risk_percentage)})`}
        </span>

        <div className="flex flex-wrap gap-1">
          {distribution.map((item) => (
            <AlertBadge
              key={item.status}
              label={`${NUTRITIONAL_STATUS_LABELS[item.status]} ${item.count} · ${formatPercentage(item.percentage)}`}
              className={
                item.severity
                  ? SEVERITY_BADGE_CLASS[item.severity]
                  : NORMAL_BADGE_CLASS
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
