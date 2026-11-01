import { http, HttpResponse } from "msw";
import {
  MEASUREMENTS_ENDPOINT,
  MEASUREMENTS_EXPORT_ENDPOINT,
  SUBJECT_EVOLUTION_ENDPOINT,
} from "@/constants/api";
import type {
  PaginatedMeasurementsResponse,
  SubjectEvolutionResponse,
} from "@/types/measurement";
import {
  MOCK_MEASUREMENTS,
  MOCK_SUBJECT_EVOLUTION,
} from "@/mocks/fixtures/measurement";
import { baseHandler, HandlerOptions } from "./base";

export function makeListMeasurementsHandler(
  options?: HandlerOptions<PaginatedMeasurementsResponse>,
) {
  return baseHandler<PaginatedMeasurementsResponse, never>(
    MEASUREMENTS_ENDPOINT,
    {
      method: "get",
      ...options,
      data: {
        items: MOCK_MEASUREMENTS,
        total: MOCK_MEASUREMENTS.length,
        page: 1,
        page_size: 20,
        total_pages: 1,
        ...options?.data,
      },
    },
  );
}

export function makeSubjectEvolutionHandler(
  options?: HandlerOptions<SubjectEvolutionResponse>,
) {
  return baseHandler<SubjectEvolutionResponse, { subjectId: string }>(
    SUBJECT_EVOLUTION_ENDPOINT(":subjectId"),
    {
      method: "get",
      ...options,
      data: { ...MOCK_SUBJECT_EVOLUTION, ...options?.data },
    },
  );
}

/** Match the backend's semicolon CSV, whitespace normalization and quoted text fields. */
export function makeExportMeasurementsHandler() {
  return http.get(MEASUREMENTS_EXPORT_ENDPOINT, () => {
    const cell = (value: string | number | null) =>
      `"${String(value ?? "")
        .replace(/\s+/g, " ")
        .replaceAll('"', '""')}"`;
    const header = [
      "Peso (kg)",
      "Talla (cm)",
      "IMC",
      "Fecha",
      "Sujeto",
      "Comedor",
      "Responsable",
      "Alertas",
      "Observación",
    ];
    const rows = MOCK_MEASUREMENTS.map((m) =>
      [
        m.weight_kg,
        m.height_cm,
        m.bmi,
        m.measured_at,
        `${m.subject.name} ${m.subject.last_name}`,
        m.establishment.name,
        `${m.responsible.name} ${m.responsible.last_name}`,
        "",
        m.observation,
      ]
        .map(cell)
        .join(";"),
    );
    return new HttpResponse(
      `\uFEFF${[header.join(";"), ...rows].join("\r\n")}\r\n`,
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="mediciones.csv"',
          "X-Export-Row-Count": String(MOCK_MEASUREMENTS.length),
        },
      },
    );
  });
}
