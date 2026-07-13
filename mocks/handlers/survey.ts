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
  return baseHandler(SURVEYS_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_SURVEYS_RESPONSE, ...options?.data },
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
    scope: body.scope,
    is_active: base.is_active ?? true,
    created_by_id:
      base.created_by_id ?? "b1c2d3e4-0000-0000-0000-000000000001",
    response_count: base.response_count ?? 0,
    establishment_ids: body.establishment_ids ?? [],
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
  return http.get<PathParams>(SURVEY_ENDPOINT(":surveyId"), ({ params }) =>
    HttpResponse.json({
      ...DEFAULT_SURVEY_DETAIL,
      id: (params.surveyId as string) ?? DEFAULT_SURVEY_DETAIL.id,
      ...override,
    }),
  );
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
  return http.post<PathParams>(DUPLICATE_SURVEY_ENDPOINT(":surveyId"), () =>
    HttpResponse.json(
      {
        ...DEFAULT_SURVEY_DETAIL,
        id: crypto.randomUUID(),
        name: `${DEFAULT_SURVEY_DETAIL.name} (copy)`,
      },
      { status: 201 },
    ),
  );
}
