import { PaginatedSurveysResponse } from "@/types/survey";
import {
  ANONYMOUS_SURVEY_ID,
  ESTABLISHMENT_SURVEY_ID,
  SUBJECT_SURVEY_ID,
} from "@/mocks/fixtures/surveyResponse";

const CREATED_BY = "b1c2d3e4-0000-0000-0000-000000000001";

// One survey per response target: navigating between them exercises every
// entity-column and filter combination on the responses screen.
export const DEFAULT_SURVEYS_RESPONSE: PaginatedSurveysResponse = {
  items: [
    {
      id: ANONYMOUS_SURVEY_ID,
      name: "FIES 2026 - Línea de base",
      response_target: "anonymous",
      requires_response_number: true,
      is_active: true,
      created_by_id: CREATED_BY,
      question_count: 8,
      response_count: 47,
      created_at: "2026-03-10T14:00:00Z",
    },
    {
      id: ESTABLISHMENT_SURVEY_ID,
      name: "Infraestructura de comedores",
      response_target: "establishment",
      requires_response_number: false,
      is_active: true,
      created_by_id: CREATED_BY,
      question_count: 12,
      response_count: 2,
      created_at: "2026-04-22T09:30:00Z",
    },
    {
      id: SUBJECT_SURVEY_ID,
      name: "Relevamiento nutricional por sujeto",
      response_target: "subject",
      requires_response_number: null,
      is_active: false,
      created_by_id: CREATED_BY,
      question_count: 5,
      response_count: 0,
      created_at: "2026-05-05T18:45:00Z",
    },
  ],
  total: 3,
  page: 1,
  page_size: 20,
  total_pages: 1,
};
