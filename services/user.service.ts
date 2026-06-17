import { AuthDispatcher } from "@/context/AuthContext";
import { ME_ENDPOINT } from "@/constants/api";
import { ProfileResponse } from "@/types/user";
import { ErrorResponse } from "@/lib/types";

export const getMeAction = async (dispatcher: AuthDispatcher) => {
  const res = await dispatcher<undefined, ProfileResponse>(ME_ENDPOINT);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as ProfileResponse;
};

export const updateMeAction = async (
  dispatcher: AuthDispatcher,
  data: { name: string; last_name: string },
) => {
  const res = await dispatcher<{ name: string; last_name: string }, ProfileResponse>(
    ME_ENDPOINT,
    { method: "PATCH", body: data },
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as ProfileResponse;
};
