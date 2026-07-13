import { PaginatedSurveysResponse } from "@/types/survey";

const CREATED_BY = "b1c2d3e4-0000-0000-0000-000000000001";

export const DEFAULT_SURVEYS_RESPONSE: PaginatedSurveysResponse = {
  items: [
    {
      id: "5f000000-0000-0000-0000-000000000001",
      name: "FIES 2026 - Línea de base",
      scope: "generic",
      is_active: true,
      created_by_id: CREATED_BY,
      question_count: 8,
      created_at: "2026-03-10T14:00:00Z",
    },
    {
      id: "5f000000-0000-0000-0000-000000000002",
      name: "Encuesta de satisfacción comedor norte",
      scope: "targeted",
      is_active: true,
      created_by_id: CREATED_BY,
      question_count: 12,
      created_at: "2026-04-22T09:30:00Z",
    },
    {
      id: "5f000000-0000-0000-0000-000000000003",
      name: "Relevamiento nutricional (borrador)",
      scope: "generic",
      is_active: false,
      created_by_id: CREATED_BY,
      question_count: 5,
      created_at: "2026-05-05T18:45:00Z",
    },
  ],
  total: 3,
  page: 1,
  page_size: 20,
  total_pages: 1,
};
