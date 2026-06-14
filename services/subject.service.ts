import { AuthDispatcher } from "@/context/AuthContext";
import { SUBJECTS_ENDPOINT } from "@/constants/api";
import { PaginatedSubjectsResponse } from "@/types/subject";
import { ErrorResponse } from "@/lib/types";

type ListSubjectsParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export const listSubjectsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListSubjectsParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);

  const path = query.size
    ? `${SUBJECTS_ENDPOINT}?${query.toString()}`
    : SUBJECTS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedSubjectsResponse>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedSubjectsResponse;
};
