import { SurveyFormInput } from "@/schemas/survey.schema";
import {
  SurveyCreateRequest,
  SurveyResponse,
  SurveyTemplateResponse,
} from "@/types/survey";

/** A create-from-scratch draft: no target chosen yet, one blank text question. */
export function emptySurveyForm(): SurveyFormInput {
  return {
    name: "",
    description: "",
    response_target: "",
    requires_response_number: false,
    questions: [
      { text: "", response_type: "text", is_required: false, options: [] },
    ],
  };
}

/**
 * Prefill the editor from the FIES template (no ids yet). The template carries
 * its own `response_target` (`anonymous` for FIES) — it is a suggestion the
 * author can still change, since a survey without responses is not locked.
 */
export function templateToForm(
  template: SurveyTemplateResponse,
): SurveyFormInput {
  return {
    name: template.name,
    description: template.description ?? "",
    response_target: template.response_target,
    requires_response_number: template.requires_response_number,
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
    response_target: survey.response_target,
    requires_response_number: survey.requires_response_number === true,
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

  if (values.response_target === "") {
    // Unreachable through the form: the zod resolver rejects an unselected
    // target before onSubmit runs. Kept so the payload type stays honest.
    throw new Error("Elegí un destino para la encuesta");
  }

  return {
    name: values.name,
    description: values.description || null,
    response_target: values.response_target,
    requires_response_number: values.requires_response_number,
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
