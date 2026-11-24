"use client";

import type { AssessmentSummary } from "@/types/measurement";
import {
  ASSESSMENT_INDICATOR_LABELS,
  assessmentClassificationLabel,
} from "@/constants/measurements";
import { EstablishmentAlertStatus } from "@/types/establishment";
import {
  AlertBadge,
  NORMAL_BADGE_CLASS,
  NUTRITIONAL_STATUS_LABELS,
  SEVERITY_BADGE_CLASS,
  SEVERITY_RANK,
  SEVERITY_TONE,
} from "@/components/AlertBadge";
import { TONE_BANNER_CLASS } from "@/constants/theme";
import { ESTABLISHMENT_DASHBOARD_PAGE as COPY } from "@/constants/establishments";
import { formatPercentage } from "@/lib/format";
import { CircleCheck, TriangleAlert } from "lucide-react";

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
  assessmentSummary,
}: {
  alertStatus: EstablishmentAlertStatus;
  assessmentSummary?: AssessmentSummary | null;
}) {
  if (assessmentSummary != null) {
    return (
      <section
        aria-label={COPY.assessmentsTitle}
        className="space-y-3 rounded-lg border px-4 py-3"
      >
        <h2 className="text-sm font-medium">{COPY.assessmentsTitle}</h2>
        <p className="text-sm">
          {COPY.assessmentRisk(
            assessmentSummary.at_risk_count,
            assessmentSummary.at_risk_percentage === null
              ? undefined
              : formatPercentage(assessmentSummary.at_risk_percentage),
          )}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {assessmentSummary.indicators.map(
            ({ indicator, evaluated_count, distribution }) => (
              <section key={indicator} className="space-y-1 text-sm">
                <h3 className="font-medium">
                  {ASSESSMENT_INDICATOR_LABELS[indicator]}
                </h3>
                {evaluated_count === 0 ? (
                  <p className="text-muted-foreground">
                    {COPY.noEvaluableResults}
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      {COPY.assessmentEvaluated(evaluated_count)}
                    </p>
                    <ul>
                      {distribution.map(
                        ({ classification, count, percentage }) => (
                          <li key={classification}>
                            {COPY.assessmentBucket(
                              assessmentClassificationLabel(classification),
                              count,
                              formatPercentage(percentage),
                            )}
                          </li>
                        ),
                      )}
                    </ul>
                  </>
                )}
              </section>
            ),
          )}
        </div>
      </section>
    );
  }

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
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${TONE_BANNER_CLASS.success}`}
      >
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
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${TONE_BANNER_CLASS[SEVERITY_TONE[severity]]}`}
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
