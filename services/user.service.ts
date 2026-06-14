import { AuthDispatcher } from "@/context/AuthContext";
import { ME_ENDPOINT } from "@/constants/api";
import { ProfileResponse } from "@/types/user";
import { ErrorResponse } from "@/lib/types";

export const getMeAction = async (dispatcher: AuthDispatcher) => {
  const res = await dispatcher<undefined, ProfileResponse>(ME_ENDPOINT);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as ProfileResponse;
};
