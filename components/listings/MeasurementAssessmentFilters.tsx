import { SELECT_CLASS } from "@/constants/common";
import {
  ASSESSMENT_COPY,
  ASSESSMENT_INDICATOR_LABELS,
  assessmentClassificationLabel,
  isKnownAssessmentClassification,
} from "@/constants/measurements";
import type { AssessmentFilter, AssessmentFilters } from "@/types/measurement";

export function assessmentFilterSupported(
  filter: AssessmentFilter,
  options: AssessmentFilters | null | undefined,
) {
  return (
    options?.indicators.some(
      (option) =>
        option.indicator === filter.indicator &&
        (!filter.classification ||
          option.classifications.includes(filter.classification)),
    ) ?? false
  );
}

export default function MeasurementAssessmentFilters({
  options,
  value,
  onChange,
}: {
  options: AssessmentFilters;
  value: AssessmentFilter | null;
  onChange: (value: AssessmentFilter | null) => void;
}) {
  const selected = options.indicators.find(
    ({ indicator }) => indicator === value?.indicator,
  );
  const classifications =
    selected?.classifications.filter(isKnownAssessmentClassification) ?? [];
  return (
    <>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {ASSESSMENT_COPY.indicatorFilter}
        <select
          className={SELECT_CLASS}
          value={selected?.indicator ?? ""}
          onChange={(event) => {
            const next = options.indicators.find(
              ({ indicator }) => indicator === event.target.value,
            );
            onChange(next ? { indicator: next.indicator } : null);
          }}
        >
          <option value="">{ASSESSMENT_COPY.allIndicators}</option>
          {options.indicators.map(({ indicator }) => (
            <option key={indicator} value={indicator}>
              {ASSESSMENT_INDICATOR_LABELS[indicator]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        {ASSESSMENT_COPY.classificationFilter}
        <select
          className={SELECT_CLASS}
          value={value?.classification ?? ""}
          disabled={!selected}
          onChange={(event) => {
            if (!selected) return;
            const classification = classifications.find(
              (code) => code === event.target.value,
            );
            onChange({ indicator: selected.indicator, classification });
          }}
        >
          <option value="">{ASSESSMENT_COPY.allClassifications}</option>
          {classifications.map((classification) => (
            <option key={classification} value={classification}>
              {assessmentClassificationLabel(classification)}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
