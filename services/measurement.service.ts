import { AuthDispatcher } from "@/context/AuthContext";
import {
  MEASUREMENTS_ENDPOINT,
  SUBJECT_EVOLUTION_ENDPOINT,
} from "@/constants/api";
import {
  MeasurementSortOrder,
  PaginatedMeasurementsResponse,
  SubjectEvolutionResponse,
} from "@/types/measurement";
import { ErrorResponse } from "@/lib/types";

type ListMeasurementsParams = {
  page?: number;
  page_size?: number;
  subject_id?: string;
  establishment_id?: string;
  city?: string;
  province?: string;
  responsible_id?: string;
  measured_from?: string;
  measured_to?: string;
  min_age?: number;
  max_age?: number;
  sort_order?: MeasurementSortOrder;
};

export const listMeasurementsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListMeasurementsParams,
) => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.subject_id) query.set("subject_id", params.subject_id);
  if (params?.establishment_id)
    query.set("establishment_id", params.establishment_id);
  if (params?.city) query.set("city", params.city);
  if (params?.province) query.set("province", params.province);
  if (params?.responsible_id)
    query.set("responsible_id", params.responsible_id);
  if (params?.measured_from) query.set("measured_from", params.measured_from);
  if (params?.measured_to) query.set("measured_to", params.measured_to);
  if (params?.min_age !== undefined)
    query.set("min_age", String(params.min_age));
  if (params?.max_age !== undefined)
    query.set("max_age", String(params.max_age));
  if (params?.sort_order) query.set("sort_order", params.sort_order);

  const path = query.size
    ? `${MEASUREMENTS_ENDPOINT}?${query.toString()}`
    : MEASUREMENTS_ENDPOINT;

  const res = await dispatcher<undefined, PaginatedMeasurementsResponse>(path);

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as PaginatedMeasurementsResponse;
};

export const getSubjectEvolutionAction = async (
  dispatcher: AuthDispatcher,
  subjectId: string,
) => {
  const res = await dispatcher<undefined, SubjectEvolutionResponse>(
    SUBJECT_EVOLUTION_ENDPOINT(subjectId),
  );

  if (!res.ok) throw new Error((res.data as ErrorResponse).detail);

  return res.data as SubjectEvolutionResponse;
};
