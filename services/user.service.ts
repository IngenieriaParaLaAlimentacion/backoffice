import { AuthDispatcher } from "@/context/AuthContext";
import {
  ESTABLISHMENTS_ENDPOINT,
  ME_ENDPOINT,
  ME_ESTABLISHMENTS_ENDPOINT,
  ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT,
  ME_ESTABLISHMENTS_WITHDRAW_ENDPOINT,
} from "@/constants/api";
import {
  ProfileEstablishment,
  ProfileResponse,
  UpdateProfilePayload,
} from "@/types/user";
import { PaginatedEstablishmentsResponse } from "@/types/establishment";
import { toApiError } from "@/lib/apiError";

export const getMeAction = async (dispatcher: AuthDispatcher) => {
  const res = await dispatcher<undefined, ProfileResponse>(ME_ENDPOINT);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as ProfileResponse;
};

export const updateMeAction = async (
  dispatcher: AuthDispatcher,
  data: UpdateProfilePayload,
) => {
  const res = await dispatcher<UpdateProfilePayload, ProfileResponse>(
    ME_ENDPOINT,
    { method: "PATCH", body: data },
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as ProfileResponse;
};

export const getMyEstablishmentsAction = async (dispatcher: AuthDispatcher) => {
  const res = await dispatcher<undefined, ProfileEstablishment[]>(
    ME_ESTABLISHMENTS_ENDPOINT,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as ProfileEstablishment[];
};

export const requestEstablishmentAccessAction = async (
  dispatcher: AuthDispatcher,
  establishmentIds: string[],
) => {
  const res = await dispatcher<
    { establishment_ids: string[] },
    ProfileEstablishment[]
  >(ME_ESTABLISHMENTS_ENDPOINT, {
    method: "POST",
    body: { establishment_ids: establishmentIds },
  });

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as ProfileEstablishment[];
};

export const withdrawEstablishmentAccessAction = async (
  dispatcher: AuthDispatcher,
  establishmentIds: string[],
) => {
  const res = await dispatcher<
    { establishment_ids: string[] },
    ProfileEstablishment[]
  >(ME_ESTABLISHMENTS_WITHDRAW_ENDPOINT, {
    method: "PATCH",
    body: { establishment_ids: establishmentIds },
  });

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as ProfileEstablishment[];
};

export const subscribeEstablishmentsAction = async (
  dispatcher: AuthDispatcher,
  establishmentIds: string[],
) => {
  const res = await dispatcher<
    { establishment_ids: string[] },
    ProfileEstablishment[]
  >(ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT, {
    method: "POST",
    body: { establishment_ids: establishmentIds },
  });

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as ProfileEstablishment[];
};

export const unsubscribeEstablishmentsAction = async (
  dispatcher: AuthDispatcher,
  establishmentIds: string[],
) => {
  const params = new URLSearchParams();
  for (const id of establishmentIds) {
    params.append("establishment_ids", id);
  }
  const endpoint = `${ME_ESTABLISHMENTS_SUBSCRIPTIONS_ENDPOINT}?${params.toString()}`;

  const res = await dispatcher<undefined, void>(endpoint, {
    method: "DELETE",
  });

  if (!res.ok) throw toApiError(res.data, res.status);
};

export const searchCatalogEstablishmentsAction = async (
  dispatcher: AuthDispatcher,
  query?: string,
) => {
  const params = new URLSearchParams();
  params.set("available", "true");
  if (query && query.trim() !== "") {
    params.set("search", query.trim());
  }
  const endpoint = `${ESTABLISHMENTS_ENDPOINT}?${params.toString()}`;

  const res = await dispatcher<undefined, PaginatedEstablishmentsResponse>(
    endpoint,
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as PaginatedEstablishmentsResponse;
};
