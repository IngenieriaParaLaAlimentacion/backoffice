import {
  DashboardIndicators,
  PaginatedSurveyResponses,
  SurveyResponseDetail,
} from "@/types/survey";

const SURVEY_ID = "5f000000-0000-0000-0000-000000000001";
const ESTABLISHMENT_ID = "e1a2b3c4-0000-0000-0000-000000000001";
const USER_ID = "b1c2d3e4-0000-0000-0000-000000000001";

export const DEFAULT_SURVEY_RESPONSES: PaginatedSurveyResponses = {
  items: [
    {
      id: "r1a2b3c4-0000-0000-0000-000000000001",
      event_at: "2026-06-15T10:30:00Z",
      survey: { id: SURVEY_ID, name: "FIES 2026 - Línea de base" },
      establishment: {
        id: ESTABLISHMENT_ID,
        name: "Comedor Sol Naciente",
        city: "Córdoba",
        province: "Córdoba",
      },
      submitted_by: { id: USER_ID, name: "Juan Pérez" },
      score_fies: 4,
    },
    {
      id: "r1a2b3c4-0000-0000-0000-000000000002",
      event_at: "2026-06-16T14:00:00Z",
      survey: { id: SURVEY_ID, name: "FIES 2026 - Línea de base" },
      establishment: {
        id: "e1a2b3c4-0000-0000-0000-000000000002",
        name: "Comedor La Esperanza",
        city: "Rosario",
        province: "Santa Fe",
      },
      submitted_by: {
        id: "b1c2d3e4-0000-0000-0000-000000000002",
        name: "María López",
      },
      score_fies: 2,
    },
    {
      id: "r1a2b3c4-0000-0000-0000-000000000003",
      event_at: "2026-06-18T09:15:00Z",
      survey: { id: SURVEY_ID, name: "FIES 2026 - Línea de base" },
      establishment: {
        id: ESTABLISHMENT_ID,
        name: "Comedor Sol Naciente",
        city: "Córdoba",
        province: "Córdoba",
      },
      submitted_by: {
        id: "b1c2d3e4-0000-0000-0000-000000000003",
        name: "Carlos García",
      },
      score_fies: null,
    },
  ],
  total: 3,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

export const DEFAULT_RESPONSE_DETAIL: SurveyResponseDetail = {
  id: "r1a2b3c4-0000-0000-0000-000000000001",
  event_at: "2026-06-15T10:30:00Z",
  survey: { id: SURVEY_ID, name: "FIES 2026 - Línea de base" },
  establishment: {
    id: ESTABLISHMENT_ID,
    name: "Comedor Sol Naciente",
    city: "Córdoba",
    province: "Córdoba",
  },
  submitted_by: { id: USER_ID, name: "Juan Pérez" },
  score_fies: 4,
  answers: [
    {
      question_id: "q1",
      question_text:
        "¿Con qué frecuencia su hogar come carne, pollo o pescado?",
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
  ],
};

export const DEFAULT_DASHBOARD_INDICATORS: DashboardIndicators = {
  response_count: 47,
  participating_establishments_count: 12,
  last_event_at: "2026-06-20T16:00:00Z",
};
