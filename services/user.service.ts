import { AuthDispatcher } from "@/context/AuthContext";
import { ME_ENDPOINT } from "@/constants/api";
import { ProfileResponse } from "@/types/user";
import { toApiError } from "@/lib/apiError";

export const getMeAction = async (dispatcher: AuthDispatcher) => {
  const res = await dispatcher<undefined, ProfileResponse>(ME_ENDPOINT);

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as ProfileResponse;
};

export const updateMeAction = async (
  dispatcher: AuthDispatcher,
  data: { name: string; last_name: string },
) => {
  const res = await dispatcher<
    { name: string; last_name: string },
    ProfileResponse
  >(ME_ENDPOINT, { method: "PATCH", body: data });

  if (!res.ok) throw toApiError(res.data, res.status);

  return res.data as ProfileResponse;
};
