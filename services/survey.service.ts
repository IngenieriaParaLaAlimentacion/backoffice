import { AuthDispatcher } from "@/context/AuthContext";
import {
  DUPLICATE_SURVEY_ENDPOINT,
  FIES_TEMPLATE_ENDPOINT,
  SURVEY_ENDPOINT,
  SURVEY_STATUS_ENDPOINT,
  SURVEYS_ENDPOINT,
} from "@/constants/api";
import {
  PaginatedSurveysResponse,
  SurveyCreateRequest,
  SurveyResponse,
  SurveyScope,
  SurveySortOrder,
  SurveyTemplateResponse,
  SurveyUpdateRequest,
} from "@/types/survey";
import { ErrorResponse } from "@/lib/types";
import { ApiError } from "@/lib/apiError";

export { ApiError };

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
