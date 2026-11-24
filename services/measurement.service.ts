import { AuthDispatcher, DownloadDispatcher } from "@/context/AuthContext";
import {
  MEASUREMENTS_ENDPOINT,
  MEASUREMENTS_EXPORT_ENDPOINT,
  SUBJECT_EVOLUTION_ENDPOINT,
} from "@/constants/api";
import {
  AssessmentFilter,
  EvolutionPoint,
  MeasurementListItem,
  MeasurementSortOrder,
  PaginatedMeasurementsResponse,
  SubjectEvolutionResponse,
} from "@/types/measurement";
import { toApiError } from "@/lib/apiError";
import { assessmentFiltersSchema } from "@/schemas/measurement-assessment.schema";
import {
  appendAssessmentFilter,
  parseAssessmentFields,
  type AssessmentWire,
} from "@/services/measurement-assessment";

export type MeasurementFilters = {
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
  assessment?: AssessmentFilter;
};

type ListMeasurementsParams = MeasurementFilters & {
  page?: number;
  page_size?: number;
};

/** The listing and its CSV export must ask for the same rows: one builder. */
const measurementFilterQuery = (filters?: MeasurementFilters) => {
  const query = new URLSearchParams();
  if (filters?.subject_id) query.set("subject_id", filters.subject_id);
  if (filters?.establishment_id)
    query.set("establishment_id", filters.establishment_id);
  if (filters?.city) query.set("city", filters.city);
  if (filters?.province) query.set("province", filters.province);
  if (filters?.responsible_id)
    query.set("responsible_id", filters.responsible_id);
  if (filters?.measured_from) query.set("measured_from", filters.measured_from);
  if (filters?.measured_to) query.set("measured_to", filters.measured_to);
  if (filters?.min_age !== undefined)
    query.set("min_age", String(filters.min_age));
  if (filters?.max_age !== undefined)
    query.set("max_age", String(filters.max_age));
  if (filters?.sort_order) query.set("sort_order", filters.sort_order);
  appendAssessmentFilter(query, filters?.assessment);
  return query;
};

export const listMeasurementsAction = async (
  dispatcher: AuthDispatcher,
  params?: ListMeasurementsParams,
) => {
  const query = measurementFilterQuery(params);
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));

  const path = query.size
    ? `${MEASUREMENTS_ENDPOINT}?${query.toString()}`
    : MEASUREMENTS_ENDPOINT;

  // Normalize older API responses at the boundary; UI items always carry a nullable note.
  type ApiResponse = Omit<
    PaginatedMeasurementsResponse,
    "items" | "assessment_filters"
  > & {
    assessment_filters?: unknown;
    items: (AssessmentWire<Omit<MeasurementListItem, "observation">> & {
      observation?: string | null;
    })[];
  };
  const res = await dispatcher<undefined, ApiResponse>(path);

  if (!res.ok) throw toApiError(res.data, res.status);

  const data = res.data;
  if (!data || "type" in data)
    throw new Error("Missing measurements response.");
  return {
    ...data,
    assessment_filters: assessmentFiltersSchema.parse(data.assessment_filters),
    items: data.items.map((item) => ({
      ...parseAssessmentFields(item),
      observation: item.observation ?? null,
    })),
  } satisfies PaginatedMeasurementsResponse;
};

/** Downloads every measurement matching the filters as a CSV file. */
export const exportMeasurementsAction = async (
  download: DownloadDispatcher,
  filters?: MeasurementFilters,
  includeAssessmentFields = false,
) => {
  const query = measurementFilterQuery(filters);
  if (includeAssessmentFields) query.set("assessment_fields", "true");

  const path = query.size
    ? `${MEASUREMENTS_EXPORT_ENDPOINT}?${query.toString()}`
    : MEASUREMENTS_EXPORT_ENDPOINT;

  return download(path);
};

export const getSubjectEvolutionAction = async (
  dispatcher: AuthDispatcher,
  subjectId: string,
) => {
  type EvolutionWire = Omit<SubjectEvolutionResponse, "points"> & {
    points: AssessmentWire<EvolutionPoint>[];
  };
  const res = await dispatcher<undefined, EvolutionWire>(
    SUBJECT_EVOLUTION_ENDPOINT(subjectId),
  );

  if (!res.ok) throw toApiError(res.data, res.status);

  const data = res.data;
  if (!data || "type" in data) throw new Error("Missing evolution response.");
  return {
    ...data,
    points: data.points.map((point) => parseAssessmentFields(point)),
  } satisfies SubjectEvolutionResponse;
};
