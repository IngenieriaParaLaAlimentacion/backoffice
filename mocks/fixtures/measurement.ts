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
