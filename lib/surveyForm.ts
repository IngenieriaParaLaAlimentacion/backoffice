import { SurveyFormInput } from "@/schemas/survey.schema";
import {
  SurveyCreateRequest,
  SurveyResponse,
  SurveyTemplateResponse,
} from "@/types/survey";

/** A create-from-scratch draft: one blank text question. */
export function emptySurveyForm(): SurveyFormInput {
  return {
    name: "",
    description: "",
    scope: "generic",
    establishment_ids: [],
    questions: [
      { text: "", response_type: "text", is_required: false, options: [] },
    ],
  };
}

/** Prefill the editor from the FIES template (no ids yet). */
export function templateToForm(
  template: SurveyTemplateResponse,
): SurveyFormInput {
  return {
    name: template.name,
    description: template.description ?? "",
    scope: template.scope,
    establishment_ids: [],
    questions: template.questions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((q) => ({
        text: q.text,
        response_type: q.response_type,
        is_required: q.is_required,
        options: q.options
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((o) => ({ text: o.text })),
      })),
  };
}

/** Load an existing survey into the editor, keeping ids so PUT can reconcile rows. */
export function surveyToForm(survey: SurveyResponse): SurveyFormInput {
  return {
    name: survey.name,
    description: survey.description ?? "",
    scope: survey.scope,
    establishment_ids: survey.establishment_ids,
    questions: survey.questions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((q) => ({
        id: q.id,
        text: q.text,
        response_type: q.response_type,
        is_required: q.is_required,
        options: q.options
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((o) => ({ id: o.id, text: o.text })),
      })),
  };
}

/** Map form values to a create/update payload; drops options for non-choice types. */
export function formToRequest(values: SurveyFormInput): SurveyCreateRequest {
  const isChoice = (t: string) =>
    t === "single_choice" || t === "multiple_choice";

  return {
    name: values.name,
    description: values.description || null,
    scope: values.scope,
    establishment_ids:
      values.scope === "targeted" ? values.establishment_ids : [],
    questions: values.questions.map((q) => ({
      ...(q.id ? { id: q.id } : {}),
      text: q.text,
      response_type: q.response_type,
      is_required: q.is_required,
      options: isChoice(q.response_type)
        ? q.options.map((o) => ({
            ...(o.id ? { id: o.id } : {}),
            text: o.text,
          }))
        : [],
    })),
  };
}
