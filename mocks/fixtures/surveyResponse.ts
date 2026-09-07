import {
  DashboardIndicators,
  PaginatedSurveyResponses,
  SurveyResponseDetail,
} from "@/types/survey";

/**
 * One survey per response target, so the responses screen can be exercised in
 * all three shapes (entity column, location filters, empty entity) without a
 * backend. Ids match the survey list fixture in `./survey.ts`.
 */
export const ANONYMOUS_SURVEY_ID = "5f000000-0000-0000-0000-000000000001";
export const ESTABLISHMENT_SURVEY_ID = "5f000000-0000-0000-0000-000000000002";
export const SUBJECT_SURVEY_ID = "5f000000-0000-0000-0000-000000000003";

const ESTABLISHMENT_ID = "e1a2b3c4-0000-0000-0000-000000000001";
const USER_ID = "b1c2d3e4-0000-0000-0000-000000000001";

const ANONYMOUS_SURVEY_REF = {
  id: ANONYMOUS_SURVEY_ID,
  name: "FIES 2026 - Línea de base",
};
const ESTABLISHMENT_SURVEY_REF = {
  id: ESTABLISHMENT_SURVEY_ID,
  name: "Infraestructura de comedores",
};
const SUBJECT_SURVEY_REF = {
  id: SUBJECT_SURVEY_ID,
  name: "Relevamiento nutricional por sujeto",
};

const ANSWERS: SurveyResponseDetail["answers"] = [
  {
    question_id: "q1",
    question_text: "¿Con qué frecuencia su hogar come carne, pollo o pescado?",
    response_type: "single_choice",
    value: "A",
    value_label: "Todos los días",
  },
  {
    question_id: "q2",
    question_text: "¿Cuántas veces por semana come verduras o frutas?",
    response_type: "numeric",
    value: 5,
    value_label: null,
  },
  {
    question_id: "q3",
    question_text: "Describa la alimentación habitual de su hogar",
    response_type: "text",
    value: "Arroz, pollo, verduras de huerta",
    value_label: null,
  },
];

/** Establishment-targeted: `establishment` set, `subject` null. */
export const ESTABLISHMENT_SURVEY_RESPONSES: PaginatedSurveyResponses = {
  items: [
    {
      id: "r1a2b3c4-0000-0000-0000-000000000001",
      response_number: 12,
      event_at: "2026-06-15T10:30:00Z",
      survey: ESTABLISHMENT_SURVEY_REF,
      establishment: {
        id: ESTABLISHMENT_ID,
        name: "Comedor Sol Naciente",
        city: "Córdoba",
        province: "Córdoba",
      },
      subject: null,
      submitted_by: { id: USER_ID, name: "Juan", last_name: "Pérez" },
      score_fies: 4,
    },
    {
      id: "r1a2b3c4-0000-0000-0000-000000000002",
      response_number: 27,
      event_at: "2026-06-16T14:00:00Z",
      survey: ESTABLISHMENT_SURVEY_REF,
      establishment: {
        id: "e1a2b3c4-0000-0000-0000-000000000002",
        name: "Comedor La Esperanza",
        city: "Rosario",
        province: "Santa Fe",
      },
      subject: null,
      submitted_by: {
        id: "b1c2d3e4-0000-0000-0000-000000000002",
        name: "María",
        last_name: "López",
      },
      score_fies: 2,
    },
  ],
  total: 2,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

/** Subject-targeted: `subject` set, `establishment` null. */
export const SUBJECT_SURVEY_RESPONSES: PaginatedSurveyResponses = {
  items: [
    {
      id: "r1a2b3c4-0000-0000-0000-000000000011",
      response_number: null,
      event_at: "2026-06-20T11:00:00Z",
      survey: SUBJECT_SURVEY_REF,
      establishment: null,
      subject: {
        id: "51a2b3c4-0000-0000-0000-000000000001",
        dni: 30111222,
        sex: "female",
        name: "María",
        last_name: "Gómez",
        birth_date: "1990-05-02",
      },
      submitted_by: { id: USER_ID, name: "Juan", last_name: "Pérez" },
      score_fies: 3,
    },
    {
      id: "r1a2b3c4-0000-0000-0000-000000000012",
      response_number: null,
      event_at: "2026-06-21T09:45:00Z",
      survey: SUBJECT_SURVEY_REF,
      establishment: null,
      subject: {
        id: "51a2b3c4-0000-0000-0000-000000000002",
        dni: 28444555,
        sex: "male",
        name: "Ramón",
        last_name: "Quiroga",
        birth_date: "1985-11-17",
      },
      submitted_by: { id: USER_ID, name: "Juan", last_name: "Pérez" },
      score_fies: null,
    },
  ],
  total: 2,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

/** Anonymous: neither target is set — the entity column has nothing to show. */
export const ANONYMOUS_SURVEY_RESPONSES: PaginatedSurveyResponses = {
  items: [
    {
      id: "r1a2b3c4-0000-0000-0000-000000000021",
      response_number: 13,
      event_at: "2026-06-18T09:15:00Z",
      survey: ANONYMOUS_SURVEY_REF,
      establishment: null,
      subject: null,
      submitted_by: {
        id: "b1c2d3e4-0000-0000-0000-000000000003",
        name: "Carlos",
        last_name: "García",
      },
      score_fies: 6,
    },
  ],
  total: 1,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

export const RESPONSES_BY_SURVEY: Record<string, PaginatedSurveyResponses> = {
  [ANONYMOUS_SURVEY_ID]: ANONYMOUS_SURVEY_RESPONSES,
  [ESTABLISHMENT_SURVEY_ID]: ESTABLISHMENT_SURVEY_RESPONSES,
  [SUBJECT_SURVEY_ID]: SUBJECT_SURVEY_RESPONSES,
};

export const DEFAULT_SURVEY_RESPONSES = ESTABLISHMENT_SURVEY_RESPONSES;

const detailOf = (
  item: PaginatedSurveyResponses["items"][number],
): SurveyResponseDetail => ({ ...item, answers: ANSWERS });

export const DETAILS_BY_RESPONSE_ID: Record<string, SurveyResponseDetail> =
  Object.fromEntries(
    Object.values(RESPONSES_BY_SURVEY)
      .flatMap((page) => page.items)
      .map((item) => [item.id, detailOf(item)]),
  );

export const DEFAULT_RESPONSE_DETAIL = detailOf(
  ESTABLISHMENT_SURVEY_RESPONSES.items[0],
);

export const DEFAULT_DASHBOARD_INDICATORS: DashboardIndicators = {
  response_count: 47,
  participating_establishments_count: 12,
  last_event_at: "2026-06-20T16:00:00Z",
};
