import type {
  MeasurementListItem,
  SubjectEvolutionResponse,
} from "@/types/measurement";

const subject = {
  id: "a1000000-0000-0000-0000-000000000001",
  dni: 42000001,
  sex: "female" as const,
  name: "Ana",
  last_name: "García",
  birth_date: "2015-03-14",
};

export const MOCK_MEASUREMENTS: MeasurementListItem[] = [
  {
    id: "b1000000-0000-0000-0000-000000000001",
    measured_at: "2026-10-19T13:00:00Z",
    weight_kg: 32,
    height_cm: 140,
    bmi: 16.33,
    subject,
    establishment: {
      id: "e1",
      name: "Comedor Esperanza",
      city: "La Plata",
      province: "Buenos Aires",
    },
    responsible: { id: "r1", name: "Juan", last_name: "Gómez" },
    alerts: [],
    observation:
      'Medición sin calzado; se indicó "repetir el control".\nReferencia: ' +
      "CONTROL".repeat(60),
  },
  {
    id: "b1000000-0000-0000-0000-000000000002",
    measured_at: "2026-09-19T13:00:00Z",
    weight_kg: 31,
    height_cm: 139,
    bmi: 16.04,
    subject,
    establishment: {
      id: "e1",
      name: "Comedor Esperanza",
      city: "La Plata",
      province: "Buenos Aires",
    },
    responsible: { id: "r1", name: "Juan", last_name: "Gómez" },
    alerts: [],
    observation: null,
  },
];

export const MOCK_SUBJECT_EVOLUTION: SubjectEvolutionResponse = {
  subject,
  points: [...MOCK_MEASUREMENTS]
    .reverse()
    .map(({ measured_at, weight_kg, height_cm, bmi, alerts, observation }) => ({
      measured_at,
      weight_kg,
      height_cm,
      bmi,
      alerts,
      observation,
    })),
};

export const MOCK_ASSESSMENT_FILTERS = {
  indicators: [
    { indicator: "length_for_age", classifications: ["normal"] },
    { indicator: "weight_for_age", classifications: ["normal", "low_weight"] },
    { indicator: "bmi_for_age", classifications: ["normal", "overweight"] },
  ],
} satisfies import("@/types/measurement").AssessmentFilters;

export const MOCK_ASSESSED_MEASUREMENTS = [
  {
    ...MOCK_MEASUREMENTS[0],
    subject: { ...MOCK_MEASUREMENTS[0].subject, birth_date: "2024-10-19" },
    stature_method: "standing",
    assessments: [
      {
        indicator: "bmi_for_age",
        status: "evaluated",
        classification: "overweight",
        reference_version: "synthetic-test",
        z_score: 1.75,
        alert: { severity: "medium", detail: "Synthetic BMI alert" },
      },
      {
        indicator: "height_for_age",
        status: "evaluated",
        classification: "short_stature",
        reference_version: "synthetic-test",
        z_score: -2.45,
        alert: { severity: "high", detail: "Synthetic height alert" },
      },
    ],
  },
  {
    ...MOCK_MEASUREMENTS[1],
    subject: { ...MOCK_MEASUREMENTS[1].subject, birth_date: "2024-10-19" },
    stature_method: null,
    assessments: [
      {
        indicator: "length_for_age",
        status: "insufficient_data",
        classification: null,
        reference_version: null,
        z_score: null,
        alert: null,
      },
      {
        indicator: "weight_for_age",
        status: "evaluated",
        classification: "normal",
        reference_version: "synthetic-test",
        z_score: 0,
        alert: null,
      },
      {
        indicator: "bmi_for_age",
        status: "not_applicable",
        classification: null,
        reference_version: null,
        z_score: null,
        alert: null,
      },
    ],
  },
] satisfies MeasurementListItem[];
