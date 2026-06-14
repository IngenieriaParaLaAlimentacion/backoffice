import { AuthDispatcher } from "@/context/AuthContext";
import { SUBJECTS_ENDPOINT, SUBJECT_ENDPOINT } from "@/constants/api";
import {
  PaginatedSubjectsResponse,
  SortOrder,
  SubjectDetail,
  SubjectSortField,
} from "@/types/subject";
import { ErrorResponse } from "@/lib/types";

type ListSubjectsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  // Future-facing filters/sort: the backend ignores these until it adds support.
  birth_date?: string;
  establishment_id?: string;
  last_survey_date?: string;
  sort_by?: SubjectSortField;
  order?: SortOrder;
};

export const listSubjectsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListSubjectsParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.birth_date) query.set("birth_date", params.birth_date);
  if (params?.establishment_id)
    query.set("establishment_id", params.establishment_id);
  if (params?.last_survey_date)
    query.set("last_survey_date", params.last_survey_date);
  if (params?.sort_by) query.set("sort_by", params.sort_by);
  if (params?.order) query.set("order", params.order);

  const path = query.size
    ? `${SUBJECTS_ENDPOINT}?${query.toString()}`
    : SUBJECTS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedSubjectsResponse>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedSubjectsResponse;
};

export const getSubjectAction = async (
  dispatcher: AuthDispatcher,
  subjectId: string,
) => {
  const res = await dispatcher<undefined, SubjectDetail>(
    SUBJECT_ENDPOINT(subjectId),
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as SubjectDetail;
};
