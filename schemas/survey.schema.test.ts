import { describe, expect, it } from "vitest";
import { surveySchema, SurveyFormInput } from "@/schemas/survey.schema";
import { MAX_OPTIONS, MIN_OPTIONS } from "@/constants/surveys";

function surveyWithOptions(count: number): SurveyFormInput {
  return {
    name: "Encuesta",
    description: "",
    response_target: "anonymous",
    questions: [
      {
        text: "¿Cuál preferís?",
        response_type: "single_choice",
        is_required: false,
        options: Array.from({ length: count }, (_, i) => ({
          text: `Opción ${i + 1}`,
        })),
      },
    ],
  };
}

function optionIssues(survey: SurveyFormInput) {
  const result = surveySchema.safeParse(survey);
  if (result.success) return [];
  return result.error.issues.filter((issue) => issue.path.includes("options"));
}

describe("surveySchema choice options", () => {
  // The backend requires 2..20 and rejects anything else with a 400 whose
  // message names no field. These bounds must match it exactly, or the author
  // is told the form is valid and then shown an untranslatable API error.
  it(`rejects a choice question with fewer than ${MIN_OPTIONS} options`, () => {
    expect(optionIssues(surveyWithOptions(0))).toHaveLength(1);
    expect(optionIssues(surveyWithOptions(1))).toHaveLength(1);
  });

  it(`rejects a choice question with more than ${MAX_OPTIONS} options`, () => {
    expect(optionIssues(surveyWithOptions(MAX_OPTIONS + 1))).toHaveLength(1);
  });

  it("accepts a choice question within the bounds", () => {
    expect(surveySchema.safeParse(surveyWithOptions(MIN_OPTIONS)).success).toBe(
      true,
    );
    expect(surveySchema.safeParse(surveyWithOptions(MAX_OPTIONS)).success).toBe(
      true,
    );
  });

  it("rejects duplicate options, ignoring case and surrounding space", () => {
    const survey = surveyWithOptions(2);
    survey.questions[0].options[1].text = "  opción 1 ";

    const issues = optionIssues(survey);

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toBe("Esta opción está repetida");
  });

  it("leaves non-choice questions alone", () => {
    const survey = surveyWithOptions(0);
    survey.questions[0].response_type = "text";

    expect(surveySchema.safeParse(survey).success).toBe(true);
  });
});
