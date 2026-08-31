import { AuthDispatcher, DownloadDispatcher } from "@/context/AuthContext";
import {
  SUBJECTS_ENDPOINT,
  SUBJECTS_EXPORT_ENDPOINT,
  SUBJECT_ENDPOINT,
} from "@/constants/api";
import {
  PaginatedSubjectsResponse,
  Sex,
  SubjectDetail,
  SubjectSortOrder,
} from "@/types/subject";
import { ErrorResponse } from "@/lib/types";

export type SubjectFilters = {
  search?: string;
  birth_date_from?: string;
  birth_date_to?: string;
  establishment_id?: string;
  is_rural?: boolean;
  is_indigenous?: boolean;
  sex?: Sex;
  sort_order?: SubjectSortOrder;
};

type ListSubjectsParams = SubjectFilters & {
  page?: number;
  page_size?: number;
};

/** The listing and its CSV export must ask for the same rows: one builder. */
const subjectFilterQuery = (filters?: SubjectFilters) => {
  const query = new URLSearchParams();
  if (filters?.search) query.set("search", filters.search);
  if (filters?.birth_date_from)
    query.set("birth_date_from", filters.birth_date_from);
  if (filters?.birth_date_to) query.set("birth_date_to", filters.birth_date_to);
  if (filters?.establishment_id)
    query.set("establishment_id", filters.establishment_id);
  if (filters?.is_rural !== undefined)
    query.set("is_rural", String(filters.is_rural));
  if (filters?.is_indigenous !== undefined)
    query.set("is_indigenous", String(filters.is_indigenous));
  if (filters?.sex) query.set("sex", filters.sex);
  if (filters?.sort_order) query.set("sort_order", filters.sort_order);
  return query;
};

export const listSubjectsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListSubjectsParams,
) => {
  const query = subjectFilterQuery(params);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const path = query.size
    ? `${SUBJECTS_ENDPOINT}?${query.toString()}`
    : SUBJECTS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedSubjectsResponse>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedSubjectsResponse;
};

/** Downloads every subject matching the filters as a CSV file. */
export const exportSubjectsAction = async (
  download: DownloadDispatcher,
  filters?: SubjectFilters,
) => {
  const query = subjectFilterQuery(filters);

  const path = query.size
    ? `${SUBJECTS_EXPORT_ENDPOINT}?${query.toString()}`
    : SUBJECTS_EXPORT_ENDPOINT;

  return download(path);
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
