import { AuthDispatcher } from "@/context/AuthContext";
import { ESTABLISHMENTS_ENDPOINT } from "@/constants/api";
import {
  EstablishmentResponse,
  EstablishmentSortOrder,
} from "@/types/admin";
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
  city?: string;
  province?: string;
  sort_order?: EstablishmentSortOrder;
};

type CreateEstablishmentData = {
  name: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  place_id: string;
  city: string;
  province: string;
};

export const listEstablishmentsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListEstablishmentsParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.search) query.set("search", params.search);
  if (params?.city) query.set("city", params.city);
  if (params?.province) query.set("province", params.province);
  if (params?.sort_order) query.set("sort_order", params.sort_order);

  const path = query.size
    ? `${ESTABLISHMENTS_ENDPOINT}?${query.toString()}`
    : ESTABLISHMENTS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedEstablishmentsResponse>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedEstablishmentsResponse;
};

export const createEstablishmentAction = async (
  dispatcher: AuthDispatcher,
  data: CreateEstablishmentData,
) => {
  const res = await dispatcher<CreateEstablishmentData, EstablishmentResponse>(
    ESTABLISHMENTS_ENDPOINT,
    { method: "POST", body: data },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as EstablishmentResponse;
};
