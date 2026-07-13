import { SurveyResponse, SurveyTemplateResponse } from "@/types/survey";

const SI_NO = [
  { text: "Sí", position: 0 },
  { text: "No", position: 1 },
];

// Canonical FAO FIES 8-item instrument. Each item is a required yes/no question.
const FIES_QUESTIONS = [
  "Durante los últimos 12 meses, ¿le preocupó no tener suficientes alimentos para comer por falta de dinero u otros recursos?",
  "¿No pudo comer alimentos sanos y nutritivos por falta de dinero u otros recursos?",
  "¿Comió poca variedad de alimentos por falta de dinero u otros recursos?",
  "¿Tuvo que saltear una comida porque no había suficiente dinero u otros recursos para obtener alimentos?",
  "¿Comió menos de lo que pensaba que debía comer por falta de dinero u otros recursos?",
  "¿Su hogar se quedó sin alimentos por falta de dinero u otros recursos?",
  "¿Sintió hambre pero no comió porque no había suficiente dinero u otros recursos para obtener alimentos?",
  "¿Dejó de comer durante todo un día porque no había suficiente dinero u otros recursos?",
];

export const FIES_TEMPLATE: SurveyTemplateResponse = {
  name: "",
  description:
    "Escala de Experiencia de Inseguridad Alimentaria (FIES) - metodología FAO.",
  scope: "generic",
  questions: FIES_QUESTIONS.map((text, position) => ({
    text,
    response_type: "single_choice",
    is_required: true,
    position,
    options: SI_NO.map((o) => ({ ...o })),
  })),
};

// A survey detail fixture used by the create/edit/duplicate mock handlers.
export const DEFAULT_SURVEY_DETAIL: SurveyResponse = {
  id: "5f000000-0000-0000-0000-000000000001",
  name: "FIES 2026 - Línea de base",
  description: "Relevamiento de inseguridad alimentaria.",
  scope: "generic",
  is_active: true,
  created_by_id: "b1c2d3e4-0000-0000-0000-000000000001",
  response_count: 0,
  establishment_ids: [],
  created_at: "2026-03-10T14:00:00Z",
  updated_at: "2026-03-10T14:00:00Z",
  questions: FIES_TEMPLATE.questions.map((q, i) => ({
    id: `q0000000-0000-0000-0000-00000000000${i}`,
    text: q.text,
    response_type: q.response_type,
    is_required: q.is_required,
    position: q.position,
    options: q.options.map((o, j) => ({
      id: `o000000${i}-0000-0000-0000-00000000000${j}`,
      text: o.text,
      position: o.position,
    })),
  })),
};
