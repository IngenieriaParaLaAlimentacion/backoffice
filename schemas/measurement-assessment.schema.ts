import { z } from "zod";

export const assessmentIndicatorSchema = z.enum([
  "length_for_age",
  "weight_for_age",
  "bmi_for_age",
  "height_for_age",
  "adult_bmi",
]);

const assessmentAlertSchema = z.object({
  severity: z.enum(["critical", "high", "medium"]),
  detail: z.string(),
});

const assessmentSchema = z
  .discriminatedUnion("status", [
    z.object({
      indicator: assessmentIndicatorSchema,
      status: z.literal("evaluated"),
      classification: z.string().min(1),
      z_score: z.number().finite().nullable(),
      reference_version: z.string().min(1),
      alert: assessmentAlertSchema.nullable(),
    }),
    z.object({
      indicator: assessmentIndicatorSchema,
      status: z.enum(["insufficient_data", "not_applicable"]),
      classification: z.null(),
      z_score: z.null(),
      reference_version: z.string().min(1).nullable(),
      alert: z.null(),
    }),
  ])
  .refine(
    (row) =>
      row.status !== "evaluated" ||
      (row.indicator === "adult_bmi"
        ? row.z_score === null
        : row.z_score !== null),
    "Only evaluated pediatric assessments have a Z-score.",
  );

export const assessmentFieldsSchema = z.object({
  assessments: z.array(assessmentSchema).nullish(),
  stature_method: z.enum(["recumbent", "standing"]).nullish(),
});

export const assessmentFiltersSchema = z
  .object({
    indicators: z.array(
      z.object({
        indicator: assessmentIndicatorSchema,
        classifications: z.array(z.string().min(1)),
      }),
    ),
  })
  .nullish();

export const assessmentSummarySchema = z
  .object({
    at_risk_count: z.number().int().nonnegative(),
    at_risk_percentage: z.number().min(0).max(100).nullable(),
    indicators: z.array(
      z.object({
        indicator: assessmentIndicatorSchema,
        evaluated_count: z.number().int().nonnegative(),
        distribution: z.array(
          z.object({
            classification: z.string().min(1),
            count: z.number().int().nonnegative(),
            percentage: z.number().min(0).max(100),
          }),
        ),
      }),
    ),
  })
  .nullish();
