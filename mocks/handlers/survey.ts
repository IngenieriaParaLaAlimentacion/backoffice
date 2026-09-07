import { http, HttpResponse, PathParams } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import {
  PaginatedSurveysResponse,
  SurveyCreateRequest,
  SurveyResponse,
} from "@/types/survey";
import {
  DUPLICATE_SURVEY_ENDPOINT,
  FIES_TEMPLATE_ENDPOINT,
  SURVEY_ENDPOINT,
  SURVEYS_ENDPOINT,
} from "@/constants/api";
import { DEFAULT_SURVEYS_RESPONSE } from "@/mocks/fixtures/survey";
import {
  DEFAULT_SURVEY_DETAIL,
  FIES_TEMPLATE,
} from "@/mocks/fixtures/surveyTemplate";

export function makeListSurveysHandler(
  options?: HandlerOptions<PaginatedSurveysResponse>,
) {
  return http.get<PathParams>(SURVEYS_ENDPOINT, ({ request }) => {
    const target = new URL(request.url).searchParams.get("response_target");
    // Honour the filter so the listing's select can actually be exercised
    // offline; without it every option would return the same three rows.
    const items = target
      ? DEFAULT_SURVEYS_RESPONSE.items.filter(
          (s) => s.response_target === target,
        )
      : DEFAULT_SURVEYS_RESPONSE.items;

    return HttpResponse.json({
      ...DEFAULT_SURVEYS_RESPONSE,
      items,
      total: items.length,
      total_pages: 1,
      ...options?.data,
    });
  });
}

export function makeFiesTemplateHandler() {
  return baseHandler(FIES_TEMPLATE_ENDPOINT, {
    method: "get",
    data: FIES_TEMPLATE,
  });
}

/** Builds a SurveyResponse by echoing a create/update payload (assigns ids + positions). */
function payloadToResponse(
  body: SurveyCreateRequest,
  base: Partial<SurveyResponse> = {},
): SurveyResponse {
  return {
    id: base.id ?? crypto.randomUUID(),
    name: body.name,
    description: body.description ?? null,
    response_target: body.response_target,
    requires_response_number: body.requires_response_number,
    is_active: base.is_active ?? true,
    created_by_id: base.created_by_id ?? "b1c2d3e4-0000-0000-0000-000000000001",
    response_count: base.response_count ?? 0,
    created_at: base.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: body.questions.map((q, i) => ({
      id: q.id ?? crypto.randomUUID(),
      text: q.text,
      response_type: q.response_type,
      is_required: q.is_required,
      position: i,
      options: (q.options ?? []).map((o, j) => ({
        id: o.id ?? crypto.randomUUID(),
        text: o.text,
        position: j,
      })),
    })),
  };
}

export function makeGetSurveyHandler(override?: Partial<SurveyResponse>) {
  return http.get<PathParams>(SURVEY_ENDPOINT(":surveyId"), ({ params }) => {
    const surveyId = (params.surveyId as string) ?? DEFAULT_SURVEY_DETAIL.id;
    // Keep the detail's target consistent with the list fixture, otherwise the
    // responses screen would pick columns that contradict its own rows.
    const listed = DEFAULT_SURVEYS_RESPONSE.items.find(
      (s) => s.id === surveyId,
    );
    return HttpResponse.json({
      ...DEFAULT_SURVEY_DETAIL,
      id: surveyId,
      ...(listed
        ? {
            name: listed.name,
            response_target: listed.response_target,
            requires_response_number: listed.requires_response_number,
          }
        : {}),
      ...override,
    });
  });
}

export function makeCreateSurveyHandler() {
  return http.post<PathParams, SurveyCreateRequest>(
    SURVEYS_ENDPOINT,
    async ({ request }) => {
      const body = await request.json();
      return HttpResponse.json(payloadToResponse(body), { status: 201 });
    },
  );
}

export function makeUpdateSurveyHandler() {
  return http.put<PathParams, SurveyCreateRequest>(
    SURVEY_ENDPOINT(":surveyId"),
    async ({ request, params }) => {
      const body = await request.json();
      return HttpResponse.json(
        payloadToResponse(body, { id: params.surveyId as string }),
      );
    },
  );
}

export function makeDuplicateSurveyHandler() {
  return http.post<PathParams>(
    DUPLICATE_SURVEY_ENDPOINT(":surveyId"),
    ({ params }) => {
      const source = DEFAULT_SURVEYS_RESPONSE.items.find(
        (survey) => survey.id === params.surveyId,
      );
      return HttpResponse.json(
        {
          ...DEFAULT_SURVEY_DETAIL,
          id: crypto.randomUUID(),
          name: `${source?.name ?? DEFAULT_SURVEY_DETAIL.name} (copy)`,
          response_target:
            source?.response_target ?? DEFAULT_SURVEY_DETAIL.response_target,
          requires_response_number: source
            ? source.requires_response_number
            : DEFAULT_SURVEY_DETAIL.requires_response_number,
        },
        { status: 201 },
      );
    },
  );
}
