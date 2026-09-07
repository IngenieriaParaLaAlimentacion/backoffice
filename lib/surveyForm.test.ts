import { describe, expect, it } from "vitest";
import {
  emptySurveyForm,
  formToRequest,
  surveyToForm,
  templateToForm,
} from "@/lib/surveyForm";
import { SurveyResponse, SurveyTemplateResponse } from "@/types/survey";

const fiesTemplate: SurveyTemplateResponse = {
  name: "",
  description: "Plantilla FIES",
  response_target: "anonymous",
  requires_response_number: true,
  questions: [
    {
      text: "¿Tuvo que saltear una comida?",
      response_type: "single_choice",
      is_required: true,
      position: 0,
      options: [
        { text: "Sí", position: 0 },
        { text: "No", position: 1 },
      ],
    },
  ],
};

function makeSurvey(requiresResponseNumber: boolean | null): SurveyResponse {
  return {
    id: "5f000000-0000-0000-0000-000000000001",
    name: "Encuesta",
    description: null,
    response_target: "anonymous",
    requires_response_number: requiresResponseNumber,
    is_active: true,
    created_by_id: "b1c2d3e4-0000-0000-0000-000000000001",
    response_count: 0,
    questions: [
      {
        id: "q0000000-0000-0000-0000-000000000001",
        text: "Pregunta",
        response_type: "text",
        is_required: false,
        position: 0,
        options: [],
      },
    ],
    created_at: "2026-09-07T12:00:00Z",
    updated_at: "2026-09-07T12:00:00Z",
  };
}

describe("survey response-number form mapping", () => {
  it("defaults custom surveys to optional", () => {
    expect(emptySurveyForm().requires_response_number).toBe(false);
  });

  it("uses the FIES template default", () => {
    expect(templateToForm(fiesTemplate).requires_response_number).toBe(true);
  });

  it.each([
    [true, true],
    [false, false],
    [null, false],
  ] as const)("maps API %s to form %s", (apiValue, formValue) => {
    expect(surveyToForm(makeSurvey(apiValue)).requires_response_number).toBe(
      formValue,
    );
  });

  it("sends explicit author intent", () => {
    const form = surveyToForm(makeSurvey(null));
    form.requires_response_number = true;

    expect(formToRequest(form).requires_response_number).toBe(true);
  });
});
