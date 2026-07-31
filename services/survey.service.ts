import { AuthDispatcher } from "@/context/AuthContext";
import {
  API_BASE_URL,
  DUPLICATE_SURVEY_ENDPOINT,
  FIES_TEMPLATE_ENDPOINT,
  SURVEY_ENDPOINT,
  SURVEY_RESPONSES_ENDPOINT,
  SURVEY_RESPONSE_DASHBOARD_DETAIL_ENDPOINT,
  SURVEY_RESPONSES_EXPORT_ENDPOINT,
  SURVEY_STATUS_ENDPOINT,
  SURVEYS_ENDPOINT,
} from "@/constants/api";
import { getTokens } from "@/lib/tokenStorage";
import {
  PaginatedSurveyResponses,
  PaginatedSurveysResponse,
  SurveyCreateRequest,
  SurveyResponse,
  SurveyResponseDetail,
  SurveyScope,
  SurveySortOrder,
  SurveyTemplateResponse,
  SurveyUpdateRequest,
} from "@/types/survey";
import { ErrorResponse } from "@/lib/types";

/** Error that preserves the HTTP status so callers can branch (e.g. 409 name clash). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ListSurveysParams = {
  page?: number;
  page_size?: number;
  search?: string;
  scope?: SurveyScope;
  is_active?: boolean;
  sort_order?: SurveySortOrder;
};

export const listSurveysAction = async (
  dispatcher: AuthDispatcher,
  params?: ListSurveysParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.scope) query.set("scope", params.scope);
  if (params?.is_active !== undefined)
    query.set("is_active", String(params.is_active));
  if (params?.sort_order) query.set("sort_order", params.sort_order);

  const path = query.size
    ? `${SURVEYS_ENDPOINT}?${query.toString()}`
    : SURVEYS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedSurveysResponse>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedSurveysResponse;
};

export const getSurveyAction = async (
  dispatcher: AuthDispatcher,
  surveyId: string,
): Promise<SurveyResponse> => {
  const res = await dispatcher<undefined, SurveyResponse>(
    SURVEY_ENDPOINT(surveyId),
  );

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

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

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

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

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

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

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);
};

export const duplicateSurveyAction = async (
  dispatcher: AuthDispatcher,
  surveyId: string,
): Promise<SurveyResponse> => {
  const res = await dispatcher<undefined, SurveyResponse>(
    DUPLICATE_SURVEY_ENDPOINT(surveyId),
    { method: "POST" },
  );

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

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

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

  return res.data as SurveyResponse;
};

export const getFiesTemplateAction = async (
  dispatcher: AuthDispatcher,
): Promise<SurveyTemplateResponse> => {
  const res = await dispatcher<undefined, SurveyTemplateResponse>(
    FIES_TEMPLATE_ENDPOINT,
  );

  if (!res.ok)
    throw new ApiError((res.data as ErrorResponse).detail, res.status);

  return res.data as SurveyTemplateResponse;
};

type ListSurveyResponsesParams = {
  survey_id: string;
  page?: number;
  page_size?: number;
  establishment_id?: string;
  event_at_from?: string;
  event_at_to?: string;
  city?: string;
  province?: string;
};

export const listSurveyResponsesAction = async (
  dispatcher: AuthDispatcher,
  params: ListSurveyResponsesParams,
): Promise<PaginatedSurveyResponses> => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.establishment_id)
    query.set("establishment_id", params.establishment_id);
  if (params.event_at_from) query.set("event_at_from", params.event_at_from);
  if (params.event_at_to) query.set("event_at_to", params.event_at_to);
  if (params.city) query.set("city", params.city);
  if (params.province) query.set("province", params.province);

  const res = await dispatcher<undefined, PaginatedSurveyResponses>(
    `${SURVEY_RESPONSES_ENDPOINT(params.survey_id)}?${query.toString()}`,
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

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

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as SurveyResponseDetail;
};

export const exportSurveyResponsesAction = async (
  dispatcher: AuthDispatcher,
  params: { survey_id: string; establishment_id?: string },
): Promise<Blob> => {
  const query = new URLSearchParams();
  if (params.establishment_id)
    query.set("establishment_id", params.establishment_id);
  query.set("format", "xlsx");

  const tokens = getTokens();
  if (!tokens) throw new Error("Not authenticated");

  const res = await fetch(
    `${API_BASE_URL}${SURVEY_RESPONSES_EXPORT_ENDPOINT(params.survey_id)}?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || "Export failed");
  }

  return res.blob();
};
