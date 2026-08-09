import { AuthDispatcher } from "@/context/AuthContext";
import { DASHBOARD_INDICATORS_ENDPOINT } from "@/constants/api";
import { DashboardIndicators } from "@/types/survey";
import { ErrorResponse } from "@/lib/types";

type DashboardIndicatorsParams = {
  survey_id?: string;
  establishment_id?: string;
  event_at_from?: string;
  event_at_to?: string;
  city?: string;
  province?: string;
};

export const getDashboardIndicatorsAction = async (
  dispatcher: AuthDispatcher,
  params?: DashboardIndicatorsParams,
): Promise<DashboardIndicators> => {
  const query = new URLSearchParams();
  if (params?.survey_id) query.set("survey_id", params.survey_id);
  if (params?.establishment_id)
    query.set("establishment_id", params.establishment_id);
  if (params?.event_at_from) query.set("event_at_from", params.event_at_from);
  if (params?.event_at_to) query.set("event_at_to", params.event_at_to);
  if (params?.city) query.set("city", params.city);
  if (params?.province) query.set("province", params.province);

  const path = query.size
    ? `${DASHBOARD_INDICATORS_ENDPOINT}?${query.toString()}`
    : DASHBOARD_INDICATORS_ENDPOINT;

  const res = await dispatcher<undefined, DashboardIndicators>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as DashboardIndicators;
};
