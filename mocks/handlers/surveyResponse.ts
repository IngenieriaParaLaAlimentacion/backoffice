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
  DETAILS_BY_RESPONSE_ID,
  RESPONSES_BY_SURVEY,
} from "@/mocks/fixtures/surveyResponse";

/** Serves the fixture matching the survey's response target, so the three
 *  entity-column shapes are reachable by navigating between surveys. */
export function makeListSurveyResponsesHandler(
  options?: HandlerOptions<PaginatedSurveyResponses>,
) {
  return http.get<PathParams>(
    SURVEY_RESPONSES_ENDPOINT(":surveyId"),
    ({ params }) => {
      const surveyId = params.surveyId as string;
      const page = RESPONSES_BY_SURVEY[surveyId] ?? DEFAULT_SURVEY_RESPONSES;
      return HttpResponse.json({ ...page, ...options?.data });
    },
  );
}

export function makeSurveyResponseDetailHandler(
  options?: HandlerOptions<SurveyResponseDetail>,
) {
  return http.get<PathParams>(
    SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT(":surveyId", ":responseId"),
    ({ params }) => {
      const responseId = params.responseId as string;
      const variant =
        DETAILS_BY_RESPONSE_ID[responseId] ?? DEFAULT_RESPONSE_DETAIL;
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
