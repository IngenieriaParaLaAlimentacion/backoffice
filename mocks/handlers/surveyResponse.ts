import { http, HttpResponse, PathParams } from "msw";
import { baseHandler, HandlerOptions } from "@/mocks/handlers/base";
import {
  PaginatedSurveyResponses,
  SurveyResponseDetail,
  DashboardIndicators,
} from "@/types/survey";
import {
  SURVEY_RESPONSES_ENDPOINT,
  SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT,
  SURVEY_RESPONSES_EXPORT_ENDPOINT,
  DASHBOARD_INDICATORS_ENDPOINT,
} from "@/constants/api";
import {
  DEFAULT_SURVEY_RESPONSES,
  DEFAULT_RESPONSE_DETAIL,
  DEFAULT_DASHBOARD_INDICATORS,
} from "@/mocks/fixtures/surveyResponse";

export function makeListSurveyResponsesHandler(
  options?: HandlerOptions<PaginatedSurveyResponses>,
) {
  return baseHandler(SURVEY_RESPONSES_ENDPOINT(":surveyId"), {
    ...options,
    method: "get",
    data: { ...DEFAULT_SURVEY_RESPONSES, ...options?.data },
  });
}

const RESPONSE_ID_2 = "r1a2b3c4-0000-0000-0000-000000000002";
const RESPONSE_ID_3 = "r1a2b3c4-0000-0000-0000-000000000003";

const DETAIL_VARIANTS: Record<string, SurveyResponseDetail> = {
  [RESPONSE_ID_2]: {
    id: RESPONSE_ID_2,
    event_at: "2026-06-16T14:00:00Z",
    survey: DEFAULT_SURVEY_RESPONSES.items[0].survey,
    establishment: {
      id: "e1a2b3c4-0000-0000-0000-000000000002",
      name: "Comedor La Esperanza",
      city: "Rosario",
      province: "Santa Fe",
    },
    submitted_by: {
      id: "b1c2d3e4-0000-0000-0000-000000000002",
      name: "María López",
    },
    score_fies: 2,
    answers: [
      {
        question_id: "q1",
        question_text:
          "¿Con qué frecuencia su hogar come carne, pollo o pescado?",
        response_type: "single_choice",
        value: "B",
        value_label: "Algunas veces por semana",
      },
      {
        question_id: "q2",
        question_text: "¿Cuántas veces por semana come verduras o frutas?",
        response_type: "numeric",
        value: 3,
        value_label: null,
      },
      {
        question_id: "q3",
        question_text: "Describa la alimentación habitual de su hogar",
        response_type: "text",
        value: "Legumbres, verduras y fideos",
        value_label: null,
      },
    ],
  },
  [RESPONSE_ID_3]: {
    id: RESPONSE_ID_3,
    event_at: "2026-06-18T09:15:00Z",
    survey: DEFAULT_SURVEY_RESPONSES.items[0].survey,
    establishment: {
      id: "e1a2b3c4-0000-0000-0000-000000000001",
      name: "Comedor Sol Naciente",
      city: "Córdoba",
      province: "Córdoba",
    },
    submitted_by: {
      id: "b1c2d3e4-0000-0000-0000-000000000003",
      name: "Carlos García",
    },
    score_fies: null,
    answers: [
      {
        question_id: "q1",
        question_text:
          "¿Con qué frecuencia su hogar come carne, pollo o pescado?",
        response_type: "single_choice",
        value: "A",
        value_label: "Todos los días",
      },
      {
        question_id: "q2",
        question_text: "¿Cuántas veces por semana come verduras o frutas?",
        response_type: "numeric",
        value: 7,
        value_label: null,
      },
      {
        question_id: "q3",
        question_text: "Describa la alimentación habitual de su hogar",
        response_type: "text",
        value: "Comidas variadas y equilibradas",
        value_label: null,
      },
    ],
  },
};

export function makeSurveyResponseDetailHandler(
  options?: HandlerOptions<SurveyResponseDetail>,
) {
  return http.get<PathParams>(
    SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT(":surveyId", ":responseId"),
    ({ params }) => {
      const responseId = params.responseId as string;
      const variant = DETAIL_VARIANTS[responseId] ?? DEFAULT_RESPONSE_DETAIL;
      return HttpResponse.json({ ...variant, ...options?.data });
    },
  );
}

export function makeExportSurveyResponsesHandler() {
  return http.get<PathParams>(
    SURVEY_RESPONSES_EXPORT_ENDPOINT(":surveyId"),
    () => {
      const buffer = new Uint8Array(0);
      return new HttpResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="export.xlsx"',
        },
      });
    },
  );
}

export function makeDashboardIndicatorsHandler(
  options?: HandlerOptions<DashboardIndicators>,
) {
  return baseHandler(DASHBOARD_INDICATORS_ENDPOINT, {
    ...options,
    method: "get",
    data: { ...DEFAULT_DASHBOARD_INDICATORS, ...options?.data },
  });
}
