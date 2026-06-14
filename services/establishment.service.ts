import { AuthDispatcher } from "@/context/AuthContext";
import { ESTABLISHMENTS_ENDPOINT } from "@/constants/api";
import { EstablishmentResponse } from "@/types/admin";
import { ErrorResponse } from "@/lib/types";

type PaginatedEstablishmentsResponse = {
  items: EstablishmentResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type ListEstablishmentsParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export const listEstablishmentsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListEstablishmentsParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);

  const path = query.size
    ? `${ESTABLISHMENTS_ENDPOINT}?${query.toString()}`
    : ESTABLISHMENTS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedEstablishmentsResponse>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedEstablishmentsResponse;
};
