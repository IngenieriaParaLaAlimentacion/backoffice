import { AuthDispatcher } from "@/context/AuthContext";
import { SUBJECTS_ENDPOINT, SUBJECT_ENDPOINT } from "@/constants/api";
import {
  PaginatedSubjectsResponse,
  Sex,
  SubjectDetail,
  SubjectSortOrder,
} from "@/types/subject";
import { ErrorResponse } from "@/lib/types";

type ListSubjectsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  birth_date_from?: string;
  birth_date_to?: string;
  establishment_id?: string;
  is_rural?: boolean;
  is_indigenous?: boolean;
  sex?: Sex;
  sort_order?: SubjectSortOrder;
};

export const listSubjectsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListSubjectsParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.birth_date_from)
    query.set("birth_date_from", params.birth_date_from);
  if (params?.birth_date_to) query.set("birth_date_to", params.birth_date_to);
  if (params?.establishment_id)
    query.set("establishment_id", params.establishment_id);
  if (params?.is_rural !== undefined)
    query.set("is_rural", String(params.is_rural));
  if (params?.is_indigenous !== undefined)
    query.set("is_indigenous", String(params.is_indigenous));
  if (params?.sex) query.set("sex", params.sex);
  if (params?.sort_order) query.set("sort_order", params.sort_order);

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
