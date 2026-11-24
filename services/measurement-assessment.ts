import { assessmentFieldsSchema } from "@/schemas/measurement-assessment.schema";
import type { AssessmentFields, AssessmentFilter } from "@/types/measurement";

type AssessmentKeys = Exclude<keyof AssessmentFields, "alerts">;

export type AssessmentWire<T> = Omit<T, AssessmentKeys> & {
  [K in AssessmentKeys]?: unknown;
};

export function parseAssessmentFields<T extends AssessmentWire<object>>(
  data: T,
) {
  const { assessments, stature_method, ...rest } = data;
  return {
    ...rest,
    ...assessmentFieldsSchema.parse({ assessments, stature_method }),
  };
}

export function appendAssessmentFilter(
  query: URLSearchParams,
  filter: AssessmentFilter | undefined,
) {
  if (!filter) return;
  query.set("indicator", filter.indicator);
  if (filter.classification) query.set("classification", filter.classification);
}
