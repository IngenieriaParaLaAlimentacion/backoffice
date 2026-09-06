import { AuthDispatcher, DownloadDispatcher } from "@/context/AuthContext";
import {
  DUPLICATE_SURVEY_ENDPOINT,
  FIES_TEMPLATE_ENDPOINT,
  SURVEY_ENDPOINT,
  SURVEY_RESPONSES_ENDPOINT,
  SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT,
  SURVEY_RESPONSES_EXPORT_ENDPOINT,
  SURVEY_STATUS_ENDPOINT,
  SURVEYS_ENDPOINT,
  SURVEYS_EXPORT_ENDPOINT,
} from "@/constants/api";
import {
  PaginatedSurveyResponses,
  PaginatedSurveysResponse,
  SurveyCreateRequest,
  SurveyResponse,
  SurveyResponseDetail,
  SurveyResponseSortOrder,
  SurveyResponseTarget,
  SurveySortOrder,
  SurveyTemplateResponse,
  SurveyUpdateRequest,
} from "@/types/survey";
import { toApiError } from "@/lib/apiError";

export type SurveyFilters = {
  search?: string;
  created_by?: string;
  response_target?: SurveyResponseTarget;
  is_active?: boolean;
  sort_order?: SurveySortOrder;
};

type ListSurveysParams = SurveyFilters & {
  page?: number;
  page_size?: number;
};

/** The listing and its CSV export must ask for the same rows: one builder. */
const surveyFilterQuery = (filters?: SurveyFilters) => {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.created_by) query.set("created_by", filters.created_by);
  if (filters?.response_target)
    query.set("response_target", filters.response_target);
  if (filters?.is_active !== undefined)
    query.set("is_active", String(filters.is_active));
  if (filters?.sort_order) query.set("sort_order", filters.sort_order);
  return query;
};

export const listSurveysAction = async (
  dispatcher: AuthDispatcher,
  params?: ListSurveysParams,
) => {
  const query = surveyFilterQuery(params);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const path = query.size
    ? `${SURVEYS_ENDPOINT}?${query.toString()}`
    : SURVEYS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedSurveysResponse>(path);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedSurveysResponse;
};

/** Downloads every survey matching the filters as a CSV file. */
export const exportSurveysAction = async (
  download: DownloadDispatcher,
  filters?: SurveyFilters,
) => {
  const query = surveyFilterQuery(filters);

  const path = query.size
    ? `${SURVEYS_EXPORT_ENDPOINT}?${query.toString()}`
    : SURVEYS_EXPORT_ENDPOINT;

  return download(path);
};

export const getSurveyAction = async (
  dispatcher: AuthDispatcher,
  surveyId: string,
): Promise<SurveyResponse> => {
  const res = await dispatcher<undefined, SurveyResponse>(
    SURVEY_ENDPOINT(surveyId),
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as SurveyResponse;
};

export const createSurveyAction = async (
  dispatcher: AuthDispatcher,
  body: SurveyCreateRequest,
): Promise<SurveyResponse> => {
  const res = await dispatcher<SurveyCreateRequest, SurveyResponse>(
    SURVEYS_ENDPOINT,
    { method: "POST", body },
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as SurveyResponse;
};

export const updateSurveyAction = async (
  dispatcher: AuthDispatcher,
  surveyId: string,
  body: SurveyUpdateRequest,
): Promise<SurveyResponse> => {
  const res = await dispatcher<SurveyUpdateRequest, SurveyResponse>(
    SURVEY_ENDPOINT(surveyId),
    { method: "PUT", body },
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as SurveyResponse;
};

export const deleteSurveyAction = async (
  dispatcher: AuthDispatcher,
  surveyId: string,
): Promise<void> => {
  const res = await dispatcher<undefined, undefined>(
    SURVEY_ENDPOINT(surveyId),
    {
      method: "DELETE",
    },
  );

  if (!res.ok) throw toApiError(res.data, res.status);
};

export const duplicateSurveyAction = async (
  dispatcher: AuthDispatcher,
  surveyId: string,
): Promise<SurveyResponse> => {
  const res = await dispatcher<undefined, SurveyResponse>(
    DUPLICATE_SURVEY_ENDPOINT(surveyId),
    { method: "POST" },
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as SurveyResponse;
};

export const setSurveyStatusAction = async (
  dispatcher: AuthDispatcher,
  surveyId: string,
  isActive: boolean,
): Promise<SurveyResponse> => {
  const res = await dispatcher<{ is_active: boolean }, SurveyResponse>(
    SURVEY_STATUS_ENDPOINT(surveyId),
    { method: "PATCH", body: { is_active: isActive } },
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as SurveyResponse;
};

export const getFiesTemplateAction = async (
  dispatcher: AuthDispatcher,
): Promise<SurveyTemplateResponse> => {
  const res = await dispatcher<undefined, SurveyTemplateResponse>(
    FIES_TEMPLATE_ENDPOINT,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as SurveyTemplateResponse;
};

/**
 * `subject_id` / `establishment_id` are deliberately absent: a target answers a
 * survey at most once, so on a route already scoped to one survey they are
 * single-row lookups, not filters. `city` / `province` are rejected with a 400
 * unless the survey is establishment-targeted.
 */
type ListSurveyResponsesParams = {
  survey_id: string;
  page?: number;
  page_size?: number;
  event_at_from?: string;
  event_at_to?: string;
  city?: string;
  province?: string;
  sort_order?: SurveyResponseSortOrder;
};

export const listSurveyResponsesAction = async (
  dispatcher: AuthDispatcher,
  params: ListSurveyResponsesParams,
): Promise<PaginatedSurveyResponses> => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.event_at_from) query.set("event_at_from", params.event_at_from);
  if (params.event_at_to) query.set("event_at_to", params.event_at_to);
  if (params.city) query.set("city", params.city);
  if (params.province) query.set("province", params.province);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  const res = await dispatcher<undefined, PaginatedSurveyResponses>(
    `${SURVEY_RESPONSES_ENDPOINT(params.survey_id)}?${query.toString()}`,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedSurveyResponses;
};

export const getSurveyResponseDashboardDetailAction = async (
  dispatcher: AuthDispatcher,
  surveyId: string,
  responseId: string,
): Promise<SurveyResponseDetail> => {
  const res = await dispatcher<undefined, SurveyResponseDetail>(
    SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT(surveyId, responseId),
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as SurveyResponseDetail;
};

/**
 * Exports every response to the survey as xlsx. The endpoint only narrows by
 * `establishment_id`/`subject_id`, not by the date or geographic filters the
 * responses page offers, so the file is NOT the filtered view on screen — the
 * gap remains reported to the backend.
 */
export const exportSurveyResponsesAction = async (
  download: DownloadDispatcher,
  params: { survey_id: string },
) => {
  const query = new URLSearchParams();
  query.set("format", "xlsx");

  return download(
    `${SURVEY_RESPONSES_EXPORT_ENDPOINT(params.survey_id)}?${query.toString()}`,
  );
};
