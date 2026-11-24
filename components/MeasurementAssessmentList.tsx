import {
  AlertBadge,
  AlertBadgeList,
  NO_DATA_BADGE_CLASS,
  NORMAL_BADGE_CLASS,
  SEVERITY_BADGE_CLASS,
} from "@/components/AlertBadge";
import {
  ASSESSMENT_COPY,
  ASSESSMENT_INDICATOR_LABELS,
  assessmentClassificationLabel,
} from "@/constants/measurements";
import { formatZScore } from "@/lib/format";
import type { AssessmentFields } from "@/types/measurement";

export default function MeasurementAssessmentList({
  assessments,
  alerts,
  scopeLabel,
}: AssessmentFields & { scopeLabel?: string }) {
  if (assessments == null) {
    return <AlertBadgeList alerts={alerts} scopeLabel={scopeLabel} />;
  }
  if (assessments.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {ASSESSMENT_COPY.empty}
      </span>
    );
  }
  return (
    <span role="list" className="flex flex-col gap-1">
      {assessments.map((row) => (
        <span
          role="listitem"
          key={row.indicator}
          className="flex flex-wrap items-center gap-1 text-xs"
        >
          <span className="font-medium">
            {ASSESSMENT_INDICATOR_LABELS[row.indicator]}
          </span>
          {row.status === "evaluated" ? (
            <>
              <AlertBadge
                label={assessmentClassificationLabel(row.classification)}
                className={
                  row.alert
                    ? SEVERITY_BADGE_CLASS[row.alert.severity]
                    : row.classification === "normal"
                      ? NORMAL_BADGE_CLASS
                      : NO_DATA_BADGE_CLASS
                }
                title={row.alert?.detail}
              />
              {row.alert && (
                <span>{ASSESSMENT_COPY.severity[row.alert.severity]}</span>
              )}
              {row.z_score !== null && (
                <span className="font-mono">
                  {ASSESSMENT_COPY.score(formatZScore(row.z_score))}
                </span>
              )}
            </>
          ) : (
            <AlertBadge
              label={ASSESSMENT_COPY.status[row.status]}
              className={NO_DATA_BADGE_CLASS}
            />
          )}
        </span>
      ))}
    </span>
  );
}
